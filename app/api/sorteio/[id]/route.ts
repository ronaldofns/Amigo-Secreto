import { NextResponse } from "next/server";
import { buscarSorteioPorId } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { erro: "ID do sorteio não fornecido" },
      { status: 400 }
    );
  }

  const sorteio = await buscarSorteioPorId(id);

  if (!sorteio) {
    return NextResponse.json(
      { erro: "Sorteio não encontrado" },
      { status: 404 }
    );
  }

  // Retorna os tokens com status de rastreamento
  const tokens = sorteio.participantes.map((p) => ({
    participante: p.nome,
    telefone: p.telefone,
    token: p.token,
    enviado: p.enviado || false,
    enviadoEm: p.enviadoEm || null,
    aberto: p.aberto || false,
    abertoEm: p.abertoEm || null,
  }));

  return NextResponse.json({
    sucesso: true,
    sorteioId: sorteio.id,
    criadoEm: sorteio.criadoEm,
    tokens,
  });
}

