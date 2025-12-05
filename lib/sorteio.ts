import { randomUUID } from "crypto";

export interface Participante {
  nome: string;
  telefone: string;
}

export interface ResultadoSorteio {
  nome: string;
  telefone: string;
  token: string;
  amigoSecreto: string;
}

/**
 * Realiza o sorteio garantindo que:
 * 1. Ninguém tire a si mesmo
 * 2. Cada pessoa seja escolhida exatamente uma vez
 * 3. Funcione tanto com número par quanto ímpar de participantes
 * 
 * Usa algoritmo de derangement (permutação sem pontos fixos)
 */
export function realizarSorteio(participantes: Participante[]): ResultadoSorteio[] {
  if (participantes.length < 2) {
    throw new Error("É necessário pelo menos 2 participantes.");
  }

  // Cria uma cópia embaralhada dos participantes
  const embaralhados = [...participantes].sort(() => Math.random() - 0.5);
  const n = embaralhados.length;

  // Gera uma permutação derangement (sem pontos fixos)
  // Isso garante que ninguém tire a si mesmo
  let tentativas = 0;
  const maxTentativas = 1000;

  while (tentativas < maxTentativas) {
    tentativas++;

    // Gera uma permutação aleatória
    const escolhidos = [...embaralhados].sort(() => Math.random() - 0.5);
    const resultado: ResultadoSorteio[] = [];
    const escolhidosMap = new Map<string, boolean>();

    let valido = true;

    // Verifica se ninguém tira a si mesmo
    for (let i = 0; i < n; i++) {
      if (embaralhados[i].nome === escolhidos[i].nome) {
        valido = false;
        break;
      }
    }

    if (!valido) continue;

    // Verifica se cada pessoa é escolhida exatamente uma vez
    for (const escolhido of escolhidos) {
      if (escolhidosMap.has(escolhido.nome)) {
        valido = false;
        break;
      }
      escolhidosMap.set(escolhido.nome, true);
    }

    if (!valido) continue;

    // Cria o resultado final
    for (let i = 0; i < n; i++) {
      resultado.push({
        nome: embaralhados[i].nome,
        telefone: embaralhados[i].telefone,
        token: randomUUID(),
        amigoSecreto: escolhidos[i].nome,
      });
    }

    return resultado;
  }

  // Se não conseguir em 1000 tentativas, usa algoritmo determinístico
  // Algoritmo de permutação cíclica (sempre funciona)
  const resultado: ResultadoSorteio[] = embaralhados.map((participante, index) => {
    const proximoIndex = (index + 1) % embaralhados.length;
    const amigoSecreto = embaralhados[proximoIndex];

    return {
      nome: participante.nome,
      telefone: participante.telefone,
      token: randomUUID(),
      amigoSecreto: amigoSecreto.nome,
    };
  });

  return resultado;
}
