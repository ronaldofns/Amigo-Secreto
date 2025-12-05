import { NextResponse } from "next/server";
import { marcarTokenComoEnviado } from "@/lib/db";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      { erro: "Token não fornecido" },
      { status: 400 }
    );
  }

  const sucesso = await marcarTokenComoEnviado(token);

  if (!sucesso) {
    return NextResponse.json(
      { erro: "Token não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sucesso: true,
    mensagem: "Token marcado como enviado",
  });
}

