import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { realizarSorteio, Participante } from "@/lib/sorteio";
import { salvarSorteio } from "@/lib/db";

interface RequestBody {
  participantes: Participante[];
}

export async function POST(req: Request) {
  try {
    console.log("[SORTEIO] Iniciando requisição");
    const body: RequestBody = await req.json();
    const { participantes } = body;
    console.log("[SORTEIO] Participantes recebidos:", participantes?.length || 0);

    // Validações
    if (!participantes || !Array.isArray(participantes)) {
      return NextResponse.json(
        { erro: "Lista de participantes inválida" },
        { status: 400 }
      );
    }

    if (participantes.length < 2) {
      return NextResponse.json(
        { erro: "Mínimo de 2 participantes" },
        { status: 400 }
      );
    }

    // Verifica se todos têm nome e telefone
    for (const p of participantes) {
      if (!p.nome || !p.telefone) {
        return NextResponse.json(
          { erro: "Todos os participantes precisam ter nome e telefone" },
          { status: 400 }
        );
      }
    }

    // Realiza o sorteio
    console.log("[SORTEIO] Realizando sorteio...");
    const resultado = realizarSorteio(participantes);
    console.log("[SORTEIO] Sorteio realizado com sucesso:", resultado.length, "participantes");

    // Retorna os tokens para o frontend
    const tokens = resultado.map((r) => ({
      participante: r.nome,
      telefone: r.telefone,
      token: r.token,
    }));

    // Salva no banco de dados (não-crítico - se falhar, ainda retorna os tokens)
    const sorteioId = randomUUID();
    console.log("[SORTEIO] Tentando salvar sorteio:", sorteioId);
    try {
      await salvarSorteio({
        id: sorteioId,
        criadoEm: new Date().toISOString(),
        participantes: resultado,
      });
      console.log("[SORTEIO] Sorteio salvo com sucesso");
    } catch (saveError) {
      // Loga o erro mas não falha a requisição
      console.warn("[SORTEIO] Não foi possível salvar o sorteio (continuando mesmo assim):", saveError);
    }

    console.log("[SORTEIO] Retornando resposta com sucesso");
    return NextResponse.json({
      sucesso: true,
      sorteioId,
      tokens,
    });
  } catch (error) {
    console.error("[SORTEIO] ERRO CRÍTICO:", error);
    console.error("[SORTEIO] Stack:", error instanceof Error ? error.stack : "N/A");
    
    // Retorna detalhes do erro
    const erroMessage = error instanceof Error ? error.message : String(error);
    const erroStack = error instanceof Error ? error.stack : undefined;
    
    // Sempre retorna detalhes do erro na resposta (ajuda a debugar)
    return NextResponse.json(
      { 
        erro: "Erro interno ao gerar sorteio",
        mensagem: erroMessage,
        stack: erroStack,
        ambiente: process.env.VERCEL ? "vercel" : "local"
      },
      { status: 500 }
    );
  }
}
