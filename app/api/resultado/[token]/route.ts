import { NextResponse } from "next/server";
import { buscarPorToken, marcarTokenComoAberto } from "@/lib/db";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      { erro: "Token não fornecido" },
      { status: 400 }
    );
  }

  const resultado = await buscarPorToken(token);

  if (!resultado) {
    return NextResponse.json(
      { erro: "Token inválido ou expirado" },
      { status: 404 }
    );
  }

  // Marca como aberto (não bloqueia se falhar)
  marcarTokenComoAberto(token).catch(console.error);

  return NextResponse.json({
    sucesso: true,
    participante: resultado.participante,
    amigoSecreto: resultado.amigoSecreto,
  });
}
