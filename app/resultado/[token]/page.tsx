"use client";

import { useEffect, useState, use } from "react";

interface ResultadoData {
  participante: string;
  amigoSecreto: string;
}

export default function ResultadoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [dados, setDados] = useState<ResultadoData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [revelado, setRevelado] = useState(false);

  useEffect(() => {
    async function buscarResultado() {
      try {
        const response = await fetch(`/api/resultado/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setErro(data.erro || "Erro ao buscar resultado");
          return;
        }

        setDados(data);
      } catch (err) {
        console.error("Erro ao buscar resultado:", err);
        setErro("Erro de conexão. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    buscarResultado();
  }, [token]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">🎁</div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <span className="text-5xl mb-4 block">😕</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-500 mb-6">{erro}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-amber-600 transition-all"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">🎁</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Amigo Secreto
          </h1>
        </div>

        {/* Saudação */}
        <div className="mb-8">
          <p className="text-gray-500 mb-1">Olá,</p>
          <p className="text-2xl font-bold text-gray-800">{dados?.participante}!</p>
        </div>

        {/* Resultado */}
        {!revelado ? (
          <div className="mb-6">
            <p className="text-gray-600 mb-6">
              Clique no botão abaixo para descobrir quem você tirou no amigo secreto
            </p>

            <button
              onClick={() => setRevelado(true)}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              🎉 Revelar Meu Amigo Secreto
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-gray-500 mb-3">Você tirou:</p>

            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-6">
                <span className="text-5xl mb-3 block">🎊</span>
                <p className="text-3xl font-bold text-white">
                  {dados?.amigoSecreto}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              ⚠️ Lembre-se: mantenha segredo até o dia da troca de presentes!
            </p>
          </div>
        )}

        {/* Aviso */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            🔒 Este link é pessoal e intransferível
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
