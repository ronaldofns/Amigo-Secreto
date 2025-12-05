"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";

interface Participante {
  id: string;
  nome: string;
  telefone: string;
}

interface TokenInfo {
  participante: string;
  telefone: string;
  token: string;
  enviado?: boolean;
  enviadoEm?: string;
  aberto?: boolean;
  abertoEm?: string;
}

interface SorteioLocalStorage {
  sorteioId: string;
  criadoEm: string;
  tokens: TokenInfo[];
}

const STORAGE_KEY = "amigo-secreto-sorteio-atual";

export default function FormParticipantes() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [sorteioId, setSorteioId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>("");
  const [carregando, setCarregando] = useState(false);
  const [sorteioRealizado, setSorteioRealizado] = useState(false);
  const nomeInputRef = useRef<HTMLInputElement>(null);

  // Carrega sorteio do localStorage ao montar
  useEffect(() => {
    const salvado = localStorage.getItem(STORAGE_KEY);
    if (salvado) {
      try {
        const sorteio: SorteioLocalStorage = JSON.parse(salvado);
        setTokens(sorteio.tokens);
        setSorteioId(sorteio.sorteioId);
        setSorteioRealizado(true);
        
        // Atualiza status do servidor
        atualizarStatus();
      } catch (err) {
        console.error("Erro ao carregar sorteio:", err);
      }
    }
  }, []);

  // Atualiza status periodicamente quando há sorteio realizado
  useEffect(() => {
    if (sorteioRealizado && sorteioId) {
      const interval = setInterval(() => {
        atualizarStatus();
      }, 5000); // Atualiza a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [sorteioRealizado, sorteioId]);

  // Foca no campo de nome quando não há sorteio realizado
  useEffect(() => {
    if (!sorteioRealizado && nomeInputRef.current) {
      nomeInputRef.current.focus();
    }
  }, [sorteioRealizado]);

  async function atualizarStatus() {
    if (!sorteioId) return;

    try {
      const response = await fetch(`/api/sorteio/${sorteioId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.tokens) {
          setTokens(data.tokens);
          
          // Atualiza localStorage
          const atualizado: SorteioLocalStorage = {
            sorteioId: data.sorteioId,
            criadoEm: data.criadoEm,
            tokens: data.tokens,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  function limparErro() {
    setErro(null);
  }

  function formatarTelefone(valor: string): string {
    const numeros = valor.replace(/\D/g, "");
    
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }

  function handleTelefoneChange(valor: string) {
    setTelefone(formatarTelefone(valor));
  }

  function adicionar() {
    limparErro();

    const nomeFormatado = nome.trim();
    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (!nomeFormatado) {
      setErro("Informe o nome do participante.");
      return;
    }

    if (!telefoneNumeros) {
      setErro("Informe o número de WhatsApp.");
      return;
    }

    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      setErro("Número inválido. Use DDD + número (10 ou 11 dígitos).");
      return;
    }

    // Verifica se já existe participante com mesmo nome
    if (participantes.some((p) => p.nome.toLowerCase() === nomeFormatado.toLowerCase())) {
      setErro("Já existe um participante com esse nome.");
      return;
    }

    setParticipantes((prev) => [
      ...prev,
      { id: uuid(), nome: nomeFormatado, telefone: telefoneNumeros },
    ]);
    setNome("");
    setTelefone("");
    
    // Foca no campo de nome após adicionar
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 0);
  }

  function remover(id: string) {
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  }

  function getBaseUrl(): string {
    if (typeof window !== "undefined") {
      // Garante que a URL tenha protocolo para o WhatsApp detectar como link
      const origin = window.location.origin;
      // Se não tiver protocolo, adiciona http:// (para localhost)
      if (origin && !origin.startsWith("http")) {
        return `http://${origin}`;
      }
      return origin;
    }
    return "";
  }

  async function gerarSorteio() {
    limparErro();

    if (participantes.length < 2) {
      setErro("Adicione pelo menos 2 participantes para realizar o sorteio.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/sorteio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantes: participantes.map((p) => ({
            nome: p.nome,
            telefone: p.telefone,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Erro ao gerar sorteio.");
        return;
      }

      // Inicializa tokens com status
      const tokensComStatus: TokenInfo[] = data.tokens.map((t: any) => ({
        ...t,
        enviado: false,
        aberto: false,
      }));

      setTokens(tokensComStatus);
      setSorteioId(data.sorteioId);
      setSorteioRealizado(true);

      // Salva no localStorage
      const sorteio: SorteioLocalStorage = {
        sorteioId: data.sorteioId,
        criadoEm: new Date().toISOString(),
        tokens: tokensComStatus,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorteio));
    } catch (err) {
      console.error("Erro ao gerar sorteio:", err);
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function enviarWhatsApp(nome: string, telefone: string, token: string) {
    const baseUrl = getBaseUrl();
    // Garante protocolo http:// ou https:// para WhatsApp detectar
    let link = `${baseUrl}/resultado/${token}`;
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      link = `https://${link}`;
    }
    
    // Mensagem formatada especificamente para WhatsApp detectar links
    // IMPORTANTE: O link DEVE estar sozinho em uma linha, sem caracteres antes ou depois
    // WhatsApp detecta automaticamente URLs que começam com http:// ou https://
    // NOTA: Em localhost pode não funcionar, mas em produção (URL válida na internet) funcionará perfeitamente
    const mensagem = `🎁 *Amigo Secreto*\n\nOlá ${nome}!\n\nO sorteio foi realizado!\n\n${link}\n\n⚠️ Não compartilhe este link!`;

    // Abre WhatsApp com mensagem pré-formatada
    const urlWhatsApp = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, "_blank");

    // Marca como enviado
    try {
      await fetch(`/api/token/${token}/enviado`, {
        method: "POST",
      });
      
      // Atualiza estado local
      setTokens((prev) =>
        prev.map((t) =>
          t.token === token
            ? { ...t, enviado: true, enviadoEm: new Date().toISOString() }
            : t
        )
      );

      // Atualiza localStorage
      const salvado = localStorage.getItem(STORAGE_KEY);
      if (salvado && sorteioId) {
        const sorteio: SorteioLocalStorage = JSON.parse(salvado);
        sorteio.tokens = sorteio.tokens.map((t) =>
          t.token === token
            ? { ...t, enviado: true, enviadoEm: new Date().toISOString() }
            : t
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorteio));
      }
    } catch (err) {
      console.error("Erro ao marcar como enviado:", err);
    }
  }

  function copiarLink(token: string) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}/resultado/${token}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
  }

  function novoSorteio() {
    setParticipantes([]);
    setTokens([]);
    setSorteioId(null);
    setSorteioRealizado(false);
    setErro(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">🎁</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Amigo Secreto
          </h1>
          <p className="text-gray-500 mt-2">
            Adicione os participantes e realize o sorteio
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          {!sorteioRealizado ? (
            <>
              {/* Formulário de Adição */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>👤</span> Adicionar Participante
                </h2>

                <div className="space-y-3">
                  <input
                    ref={nomeInputRef}
                    type="text"
                    placeholder="Nome do participante"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionar();
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-gray-50 text-gray-800 placeholder-gray-400"
                  />

                  <input
                    type="tel"
                    placeholder="WhatsApp (DDD + número)"
                    value={telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionar();
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-gray-50 text-gray-800 placeholder-gray-400"
                  />

                  <button
                    onClick={adicionar}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {erro && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  ⚠️ {erro}
                </div>
              )}

              {/* Lista de Participantes */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>👥</span> Participantes ({participantes.length})
                </h2>

                {participantes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <span className="text-3xl mb-2 block">📝</span>
                    <p>Nenhum participante adicionado ainda</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {participantes.map((p, index) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{p.nome}</p>
                            <p className="text-sm text-gray-500">
                              {formatarTelefone(p.telefone)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => remover(p.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Remover participante"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Botão de Sorteio */}
              <button
                onClick={gerarSorteio}
                disabled={participantes.length < 2 || carregando}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {carregando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sorteando...
                  </span>
                ) : (
                  "🎲 Realizar Sorteio"
                )}
              </button>

              {participantes.length > 0 && participantes.length < 2 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Adicione mais {2 - participantes.length} participante(s) para realizar o sorteio
                </p>
              )}
            </>
          ) : (
            <>
              {/* Resultado do Sorteio */}
              <div className="text-center mb-6">
                <span className="text-5xl mb-4 block">🎉</span>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Sorteio Realizado!
                </h2>
                <p className="text-gray-500">
                  Envie o link secreto para cada participante
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {tokens.map((t) => (
                  <div
                    key={t.token}
                    className={`p-4 rounded-xl border-2 ${
                      t.enviado && t.aberto
                        ? "bg-green-50 border-green-200"
                        : t.enviado
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        <span className="font-medium text-gray-800">
                          {t.participante}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.enviado && (
                          <span
                            className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700"
                            title={
                              t.enviadoEm
                                ? `Enviado em ${new Date(
                                    t.enviadoEm
                                  ).toLocaleString("pt-BR")}`
                                : "Enviado"
                            }
                          >
                            📤 Enviado
                          </span>
                        )}
                        {t.aberto && (
                          <span
                            className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
                            title={
                              t.abertoEm
                                ? `Aberto em ${new Date(
                                    t.abertoEm
                                  ).toLocaleString("pt-BR")}`
                                : "Aberto"
                            }
                          >
                            👁️ Aberto
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => enviarWhatsApp(t.participante, t.telefone, t.token)}
                        disabled={t.enviado}
                        className={`flex-1 py-2.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          t.enviado
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t.enviado ? "Já Enviado" : "Enviar WhatsApp"}
                      </button>

                      <button
                        onClick={() => copiarLink(t.token)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        title="Copiar link"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={novoSorteio}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                ↻ Novo Sorteio
              </button>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center text-sm text-gray-400">
          <p>🔒 Cada participante só poderá ver seu próprio resultado</p>
        </div>
      </div>
    </div>
  );
}
