import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

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

// Detecção de ambiente
const isVercel = process.env.VERCEL === "1" || !!process.env.KV_REST_API_URL;
const useFileSystem = !isVercel && typeof process !== "undefined" && process.cwd;

// ==========================================
// Implementação usando FileSystem (local)
// ==========================================
const DATA_FILE = join(process.cwd(), "data", "sorteios.json");

function ensureDataDir() {
  if (!useFileSystem) return;
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(dataDir, { recursive: true });
  }
}

function readDB(): Database {
  if (!useFileSystem) {
    return { sorteios: [] };
  }

  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    return { sorteios: [] };
  }
  try {
    const data = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { sorteios: [] };
  }
}

function writeDB(db: Database) {
  if (!useFileSystem) return;
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
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
  } catch {
    // Se não estiver disponível, retorna null
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
  if (!kv) return;

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
