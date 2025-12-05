// Imports condicionais para evitar problemas na Vercel
// As funções do fs serão importadas apenas quando necessário (localmente)

export interface ParticipanteComRastreamento {
  nome: string;
  telefone: string;
  token: string;
  amigoSecreto: string;
  enviado?: boolean;
  enviadoEm?: string;
  aberto?: boolean;
  abertoEm?: string;
}

export interface Sorteio {
  id: string;
  criadoEm: string;
  participantes: ParticipanteComRastreamento[];
}

interface Database {
  sorteios: Sorteio[];
}

// Detecção de ambiente - melhorada para funcionar corretamente na Vercel
function isVercelEnvironment(): boolean {
  // Vercel sempre define essa variável
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return true;
  }
  // Se tem variáveis do KV, está na Vercel
  if (process.env.KV_REST_API_URL) {
    return true;
  }
  // Verifica se está em ambiente serverless (Vercel, Netlify, etc)
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_URL) {
    return true;
  }
  return false;
}

const isVercel = isVercelEnvironment();
const useFileSystem = !isVercel && typeof process !== "undefined" && typeof process.cwd === "function";

// ==========================================
// Implementação usando FileSystem (local)
// ==========================================
function getDataFile(): string {
  if (!useFileSystem) return "";
  
  try {
    const { join } = require("path");
    return join(process.cwd(), "data", "sorteios.json");
  } catch {
    // Se process.cwd() falhar, retorna path relativo
    return "data/sorteios.json";
  }
}

function ensureDataDir() {
  if (!useFileSystem) return;
  
  try {
    const { join } = require("path");
    const { existsSync, mkdirSync } = require("fs");
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  } catch (error) {
    // Se falhar, não usa filesystem
    console.error("Erro ao criar diretório de dados:", error);
  }
}

function readDB(): Database {
  if (!useFileSystem) {
    return { sorteios: [] };
  }

  try {
    ensureDataDir();
    const { readFileSync, existsSync } = require("fs");
    const DATA_FILE = getDataFile();
    if (!existsSync(DATA_FILE)) {
      return { sorteios: [] };
    }
    const data = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler do filesystem:", error);
    return { sorteios: [] };
  }
}

function writeDB(db: Database) {
  if (!useFileSystem) return;

  try {
    ensureDataDir();
    const { writeFileSync } = require("fs");
    const DATA_FILE = getDataFile();
    writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Erro ao escrever no filesystem:", error);
  }
}

// ==========================================
// Implementação usando Vercel KV (produção)
// ==========================================
async function getKV() {
  if (!isVercel) return null;

  try {
    // Tenta usar @vercel/kv
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch (error) {
    // Se não estiver disponível, retorna null
    console.error("KV não disponível:", error);
    return null;
  }
}

async function readDBKV(): Promise<Database> {
  const kv = await getKV();
  if (!kv) {
    return { sorteios: [] };
  }

  try {
    const data = await kv.get<Database>("sorteios:database");
    return data || { sorteios: [] };
  } catch (error) {
    console.error("Erro ao ler do KV:", error);
    return { sorteios: [] };
  }
}

async function writeDBKV(db: Database) {
  const kv = await getKV();
  if (!kv) {
    console.warn("KV não disponível - dados não serão persistidos");
    return;
  }

  try {
    await kv.set("sorteios:database", db);
  } catch (error) {
    console.error("Erro ao escrever no KV:", error);
  }
}

// ==========================================
// Funções públicas (abstração)
// ==========================================

export async function salvarSorteio(sorteio: Sorteio) {
  if (isVercel) {
    const db = await readDBKV();
    db.sorteios.push(sorteio);
    await writeDBKV(db);
  } else {
    const db = readDB();
    db.sorteios.push(sorteio);
    writeDB(db);
  }
}

export async function buscarPorToken(token: string): Promise<{
  participante: string;
  amigoSecreto: string;
} | null> {
  let db: Database;

  if (isVercel) {
    db = await readDBKV();
  } else {
    db = readDB();
  }

  for (const sorteio of db.sorteios) {
    const encontrado = sorteio.participantes.find((p) => p.token === token);
    if (encontrado) {
      return {
        participante: encontrado.nome,
        amigoSecreto: encontrado.amigoSecreto,
      };
    }
  }

  return null;
}

export async function marcarTokenComoEnviado(token: string) {
  let db: Database;

  if (isVercel) {
    db = await readDBKV();
  } else {
    db = readDB();
  }

  for (const sorteio of db.sorteios) {
    const participante = sorteio.participantes.find((p) => p.token === token);
    if (participante) {
      participante.enviado = true;
      participante.enviadoEm = new Date().toISOString();

      if (isVercel) {
        await writeDBKV(db);
      } else {
        writeDB(db);
      }
      return true;
    }
  }

  return false;
}

export async function marcarTokenComoAberto(token: string) {
  let db: Database;

  if (isVercel) {
    db = await readDBKV();
  } else {
    db = readDB();
  }

  for (const sorteio of db.sorteios) {
    const participante = sorteio.participantes.find((p) => p.token === token);
    if (participante && !participante.aberto) {
      participante.aberto = true;
      participante.abertoEm = new Date().toISOString();

      if (isVercel) {
        await writeDBKV(db);
      } else {
        writeDB(db);
      }
      return true;
    }
  }

  return false;
}

export async function buscarSorteioPorId(sorteioId: string): Promise<Sorteio | null> {
  let db: Database;

  if (isVercel) {
    db = await readDBKV();
  } else {
    db = readDB();
  }

  return db.sorteios.find((s) => s.id === sorteioId) || null;
}

export async function listarSorteios(): Promise<Sorteio[]> {
  if (isVercel) {
    const db = await readDBKV();
    return db.sorteios;
  } else {
    return readDB().sorteios;
  }
}
