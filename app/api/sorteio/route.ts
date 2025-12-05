import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { realizarSorteio, Participante } from "@/lib/sorteio";
import { salvarSorteio } from "@/lib/db";

interface RequestBody {
  participantes: Participante[];
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { participantes } = body;

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
    const resultado = realizarSorteio(participantes);

    // Salva no banco de dados
    const sorteioId = randomUUID();
    await salvarSorteio({
      id: sorteioId,
      criadoEm: new Date().toISOString(),
      participantes: resultado,
    });

    // Retorna os tokens para o frontend
    const tokens = resultado.map((r) => ({
      participante: r.nome,
      telefone: r.telefone,
      token: r.token,
    }));

    return NextResponse.json({
      sucesso: true,
      sorteioId,
      tokens,
    });
  } catch (error) {
    console.error("Erro ao gerar sorteio:", error);
    
    // Retorna detalhes do erro em desenvolvimento
    const erroMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const erroStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        erro: "Erro interno ao gerar sorteio",
        detalhes: process.env.NODE_ENV === "development" ? erroMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? erroStack : undefined
      },
      { status: 500 }
    );
  }
}
