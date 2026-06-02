import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
const DATA_DIR$3 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$3 = path.join(DATA_DIR$3, "torneios");
const ATIVO_FILE = path.join(DATA_DIR$3, "torneio-ativo.json");
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR$3)) fs.mkdirSync(DATA_DIR$3, { recursive: true });
  if (!fs.existsSync(TORNEIOS_DIR$3)) fs.mkdirSync(TORNEIOS_DIR$3, { recursive: true });
}
function getTorneioPath$3(id) {
  return path.join(TORNEIOS_DIR$3, `${id}.json`);
}
function getActiveTournamentId() {
  if (!fs.existsSync(ATIVO_FILE)) return null;
  try {
    const { id } = JSON.parse(fs.readFileSync(ATIVO_FILE, "utf-8"));
    return id;
  } catch {
    return null;
  }
}
function registerTournamentHandlers() {
  ipcMain.handle("create-tournament", (_event, data) => {
    ensureDirs();
    const torneio = {
      id: crypto.randomUUID(),
      nome: data.nome,
      data: data.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      atletas: []
    };
    fs.writeFileSync(getTorneioPath$3(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
    return torneio;
  });
  ipcMain.handle("list-tournaments", () => {
    ensureDirs();
    const files = fs.readdirSync(TORNEIOS_DIR$3).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const content = fs.readFileSync(path.join(TORNEIOS_DIR$3, f), "utf-8");
      return JSON.parse(content);
    });
  });
  ipcMain.handle("start-tournament", (_event, id) => {
    ensureDirs();
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id }), "utf-8");
    const filePath = getTorneioPath$3(id);
    if (fs.existsSync(filePath)) {
      const torneio = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      torneio.startedAt = (/* @__PURE__ */ new Date()).toISOString();
      torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      fs.writeFileSync(filePath, JSON.stringify(torneio, null, 2), "utf-8");
      return torneio;
    }
    throw new Error("Torneio não encontrado");
  });
  ipcMain.handle("get-active-tournament", () => {
    ensureDirs();
    const id = getActiveTournamentId();
    if (!id) return null;
    const filePath = getTorneioPath$3(id);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });
  ipcMain.handle("export-tournament", async (_event, id) => {
    ensureDirs();
    const sourcePath = getTorneioPath$3(id);
    if (!fs.existsSync(sourcePath)) throw new Error("Torneio não encontrado");
    const torneio = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
    const defaultName = torneio.nome || `Torneio ${torneio.data}`;
    const result = await dialog.showSaveDialog({
      title: "Exportar Torneio",
      defaultPath: `${defaultName.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (!result.canceled && result.filePath) {
      fs.copyFileSync(sourcePath, result.filePath);
    }
  });
  ipcMain.handle("import-tournament", (_event, data) => {
    ensureDirs();
    if (!data.data) {
      throw new Error("Estrutura inválida");
    }
    const atletas = data.atletas ?? [];
    const atletasDedup = [];
    for (const a of atletas) {
      const nomeLower = a.nome.trim().toLowerCase();
      const exists = atletasDedup.some(
        (ex) => a.id && ex.id === a.id || ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento
      );
      if (!exists) {
        atletasDedup.push({
          ...a,
          id: a.id || crypto.randomUUID(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          nome: nomeLower,
          equipe: (a.equipe || "").trim().toLowerCase()
        });
      }
    }
    const torneio = {
      ...data,
      id: data.id || crypto.randomUUID(),
      atletas: atletasDedup,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const dest = getTorneioPath$3(torneio.id);
    if (fs.existsSync(dest)) {
      return { success: false, exists: true };
    }
    fs.writeFileSync(dest, JSON.stringify(torneio, null, 2), "utf-8");
    return { success: true };
  });
  ipcMain.handle("import-tournament-overwrite", (_event, data) => {
    ensureDirs();
    if (!data.id || !data.data) {
      throw new Error("Estrutura inválida");
    }
    const atletas = data.atletas ?? [];
    const atletasDedup = [];
    for (const a of atletas) {
      const nomeLower = a.nome.trim().toLowerCase();
      const exists = atletasDedup.some(
        (ex) => a.id && ex.id === a.id || ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento
      );
      if (!exists) {
        atletasDedup.push({
          ...a,
          id: a.id || crypto.randomUUID(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          nome: nomeLower,
          equipe: (a.equipe || "").trim().toLowerCase()
        });
      }
    }
    const torneio = {
      ...data,
      atletas: atletasDedup,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const dest = getTorneioPath$3(torneio.id);
    fs.writeFileSync(dest, JSON.stringify(torneio, null, 2), "utf-8");
  });
  ipcMain.handle("update-tournament", (_event, data) => {
    ensureDirs();
    const filePath = getTorneioPath$3(data.id);
    if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
    const torneio = {
      ...data,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(torneio, null, 2), "utf-8");
    return torneio;
  });
  ipcMain.handle("delete-tournament", (_event, id) => {
    ensureDirs();
    const filePath = getTorneioPath$3(id);
    if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
    fs.unlinkSync(filePath);
    if (fs.existsSync(ATIVO_FILE)) {
      try {
        const { id: activeId } = JSON.parse(fs.readFileSync(ATIVO_FILE, "utf-8"));
        if (activeId === id) {
          fs.unlinkSync(ATIVO_FILE);
        }
      } catch {
      }
    }
  });
  ipcMain.handle("read-file", async (_event, filePath) => {
    return fs.readFileSync(filePath, "utf-8");
  });
}
const CATEGORIAS_PESO = [
  { peso: "galo", nome: "Galo", masculino: 57.5, feminino: 48.5 },
  { peso: "pluma", nome: "Pluma", masculino: 64, feminino: 53.5 },
  { peso: "pena", nome: "Pena", masculino: 70, feminino: 58.5 },
  { peso: "leve", nome: "Leve", masculino: 76, feminino: 64 },
  { peso: "medio", nome: "Médio", masculino: 82.3, feminino: 69 },
  { peso: "meio-pesado", nome: "Meio-Pesado", masculino: 88.3, feminino: 74 },
  { peso: "pesado", nome: "Pesado", masculino: 94.3, feminino: 79.3 },
  { peso: "super-pesado", nome: "Super Pesado", masculino: 97.5, feminino: null },
  { peso: "pesadissimo", nome: "Pesadíssimo", masculino: null, feminino: null }
];
const kidsLabel = {
  "pre-mirim": "Pré-Mirim",
  "mirim": "Mirim",
  "infantil-a": "Infantil A",
  "infantil-b": "Infantil B",
  "infanto-juvenil-a": "Infanto-Juvenil A",
  "infanto-juvenil-b": "Infanto-Juvenil B"
};
const KIDS_PESO_LIMITES = {
  "pre-mirim": { galo: 14.7, pluma: 17.9, pena: 20, leve: 24, medio: 26, "meio-pesado": 29, pesado: 31.2, "super-pesado": 33.2, pesadissimo: null },
  "mirim": { galo: 21, pluma: 24, pena: 27, leve: 30.2, medio: 33.2, "meio-pesado": 36.2, pesado: 39.3, "super-pesado": 42.3, pesadissimo: null },
  "infantil-a": { galo: 27, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, "meio-pesado": 42.3, pesado: 45.3, "super-pesado": 48.3, pesadissimo: null },
  "infantil-b": { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, "meio-pesado": 56.5, pesado: 60.5, "super-pesado": 65, pesadissimo: null },
  "infanto-juvenil-a": { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, "meio-pesado": 60.5, pesado: 65, "super-pesado": 69.5, pesadissimo: null },
  "infanto-juvenil-b": { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65, "meio-pesado": 69.5, pesado: 74, "super-pesado": 78.5, pesadissimo: null }
};
function getPesoLimite(faixaEtaria, genero, cat) {
  const kidsLimites = KIDS_PESO_LIMITES[faixaEtaria];
  if (kidsLimites) {
    return kidsLimites[cat.peso] ?? null;
  }
  const base = genero === "masculino" ? cat.masculino : cat.feminino;
  if (cat.peso === "pesadissimo" && genero === "feminino") return null;
  return base;
}
function gerarCategorias() {
  const faixasEtarias = [
    "pre-mirim",
    "mirim",
    "infantil-a",
    "infantil-b",
    "infanto-juvenil-a",
    "infanto-juvenil-b",
    "juvenil",
    "adulto",
    "master1",
    "master2",
    "master3",
    "master4",
    "master5",
    "master6",
    "master7"
  ];
  const generos = ["masculino", "feminino"];
  const result = [];
  for (const fe of faixasEtarias) {
    const feLabel = kidsLabel[fe] || fe.charAt(0).toUpperCase() + fe.slice(1);
    for (const gen of generos) {
      const genLabel = gen === "masculino" ? "Masculino" : "Feminino";
      for (const cat of CATEGORIAS_PESO) {
        const pesoLimite = getPesoLimite(fe, gen, cat);
        if (pesoLimite === void 0) continue;
        result.push({
          id: `${fe}-${gen}-${cat.peso}`,
          nome: `${feLabel} ${genLabel} ${cat.nome}`,
          faixaEtaria: fe,
          genero: gen,
          peso: cat.peso,
          pesoMaximoKg: pesoLimite
        });
      }
    }
  }
  return result;
}
const CATEGORIAS_IBJJF = gerarCategorias();
const categoriaLabels = {};
for (const c of CATEGORIAS_IBJJF) {
  categoriaLabels[c.id] = c.nome;
}
const DATA_DIR$2 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$2 = path.join(DATA_DIR$2, "torneios");
function getTorneioPath$2(torneioId) {
  return path.join(TORNEIOS_DIR$2, `${torneioId}.json`);
}
function loadTorneio$2(torneioId) {
  const filePath = getTorneioPath$2(torneioId);
  if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function saveTorneio$2(torneio) {
  fs.writeFileSync(getTorneioPath$2(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
}
function loadAthletes(torneioId) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.atletas ?? [];
  let modified = false;
  for (const a of list) {
    if (!a.id) {
      a.id = crypto.randomUUID();
      modified = true;
    }
    if (!a.createdAt) {
      a.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      modified = true;
    }
    if (!a.updatedAt) {
      a.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      modified = true;
    }
  }
  if (modified) {
    torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveTorneio$2(torneio);
  }
  return list;
}
function saveAthlete(torneioId, athlete) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.atletas ?? [];
  const data = {
    ...athlete,
    id: athlete.id || crypto.randomUUID(),
    createdAt: athlete.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  list.push(data);
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
  return list;
}
function updateAthlete(torneioId, updated) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.atletas ?? [];
  const index = list.findIndex((a) => a.id === updated.id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list[index] = updated;
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
  return list;
}
function deleteAthlete(torneioId, id) {
  const torneio = loadTorneio$2(torneioId);
  let list = torneio.atletas ?? [];
  list = list.filter((a) => a.id !== id);
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
  return list;
}
function deleteAthletes(torneioId, ids) {
  const torneio = loadTorneio$2(torneioId);
  const idSet = new Set(ids);
  let list = torneio.atletas ?? [];
  list = list.filter((a) => !idSet.has(a.id));
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
  return list;
}
function importAthletesFromFile(torneioId, filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const incoming = JSON.parse(raw);
  if (!Array.isArray(incoming)) {
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  }
  const categoriasValidas = new Set(CATEGORIAS_IBJJF.map((c) => c.id));
  for (const a of incoming) {
    if (!a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg || !a.genero || !a.categoria) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || "sem nome"}" — campos obrigatórios ausentes (categoria, genero).`);
    }
    if (!categoriasValidas.has(a.categoria)) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome}" — categoria "${a.categoria}" não reconhecida.`);
    }
  }
  const torneio = loadTorneio$2(torneioId);
  const current = torneio.atletas ?? [];
  let imported = 0;
  let skipped = 0;
  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase();
    const equipeLower = a.equipe.trim().toLowerCase();
    const exists = current.some(
      (ex) => a.id && ex.id === a.id || ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento
    );
    if (!exists) {
      a.nome = nomeLower;
      a.equipe = equipeLower;
      current.push({
        ...a,
        id: a.id || crypto.randomUUID(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      imported++;
    } else {
      skipped++;
    }
  }
  torneio.atletas = current;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
  return { imported, skipped };
}
async function openAthleteFileDialog() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
async function exportAthletes(torneioId) {
  const list = loadAthletes(torneioId);
  const result = await dialog.showSaveDialog({
    title: "Exportar Atletas",
    defaultPath: "atletas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), "utf-8");
  }
}
const DATA_DIR$1 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$1 = path.join(DATA_DIR$1, "torneios");
function getTorneioPath$1(torneioId) {
  return path.join(TORNEIOS_DIR$1, `${torneioId}.json`);
}
function loadTorneio$1(torneioId) {
  const filePath = getTorneioPath$1(torneioId);
  if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function saveTorneio$1(torneio) {
  fs.writeFileSync(getTorneioPath$1(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
}
function loadArbitros(torneioId) {
  const torneio = loadTorneio$1(torneioId);
  return torneio.arbitros ?? [];
}
function saveArbitro(torneioId, data) {
  const torneio = loadTorneio$1(torneioId);
  const list = torneio.arbitros ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const arbitro = {
    id: crypto.randomUUID(),
    nome: data.nome.trim().toLowerCase(),
    equipe: (data.equipe ?? "").trim().toLowerCase(),
    faixa: data.faixa,
    chaveIds: data.chaveIds ?? [],
    createdAt: now,
    updatedAt: now
  };
  list.push(arbitro);
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$1(torneio);
  return arbitro;
}
function updateArbitro(torneioId, data) {
  const torneio = loadTorneio$1(torneioId);
  const list = torneio.arbitros ?? [];
  const index = list.findIndex((a) => a.id === data.id);
  if (index === -1) throw new Error("Árbitro não encontrado");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  list[index] = {
    ...data,
    nome: data.nome.trim().toLowerCase(),
    updatedAt: now
  };
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$1(torneio);
  return list[index];
}
function deleteArbitro(torneioId, arbitroId) {
  const torneio = loadTorneio$1(torneioId);
  torneio.arbitros = (torneio.arbitros ?? []).filter((a) => a.id !== arbitroId);
  const t = torneio;
  const chaves = t.chaves;
  if (chaves) {
    for (const chave of chaves) {
      if (chave.arbitroId === arbitroId) {
        chave.arbitroId = null;
      }
    }
  }
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
}
function deleteArbitros(torneioId, arbitroIds) {
  const torneio = loadTorneio$1(torneioId);
  const idSet = new Set(arbitroIds);
  torneio.arbitros = (torneio.arbitros ?? []).filter((a) => !idSet.has(a.id));
  const t = torneio;
  const chaves = t.chaves;
  if (chaves) {
    for (const chave of chaves) {
      if (chave.arbitroId && idSet.has(chave.arbitroId)) {
        chave.arbitroId = null;
      }
    }
  }
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
}
async function openArbitroFileDialog() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
function importArbitrosFromFile(torneioId, filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const incoming = JSON.parse(raw);
  if (!Array.isArray(incoming)) {
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de árbitros.");
  }
  const faixasValidas = /* @__PURE__ */ new Set(["roxa", "marrom", "preta"]);
  for (const item of incoming) {
    const a = item;
    if (!a.nome || typeof a.nome !== "string" || a.nome.trim().length < 2) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome || "sem nome"}" — nome deve ter ao menos 2 caracteres.`);
    }
    if (!a.faixa || typeof a.faixa !== "string" || !faixasValidas.has(a.faixa)) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome}" — faixa inválida.`);
    }
    if (a.equipe !== void 0 && (typeof a.equipe !== "string" || a.equipe.trim().length < 2)) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome}" — equipe deve ter ao menos 2 caracteres se informada.`);
    }
  }
  const torneio = loadTorneio$1(torneioId);
  const current = torneio.arbitros ?? [];
  let imported = 0;
  let skipped = 0;
  for (const item of incoming) {
    const a = item;
    const nomeLower = a.nome.trim().toLowerCase();
    const exists = current.some((ex) => ex.nome.trim().toLowerCase() === nomeLower);
    if (!exists) {
      current.push({
        ...a,
        id: a.id || crypto.randomUUID(),
        nome: nomeLower,
        equipe: a.equipe && typeof a.equipe === "string" ? a.equipe.trim().toLowerCase() : "",
        faixa: a.faixa,
        chaveIds: a.chaveIds ?? [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      imported++;
    } else {
      skipped++;
    }
  }
  torneio.arbitros = current;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
  return { imported, skipped };
}
async function exportArbitros(torneioId) {
  const list = loadArbitros(torneioId);
  const result = await dialog.showSaveDialog({
    title: "Exportar Árbitros",
    defaultPath: "arbitros.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), "utf-8");
  }
}
const DATA_DIR = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR = path.join(DATA_DIR, "torneios");
function getTorneioPath(torneioId) {
  return path.join(TORNEIOS_DIR, `${torneioId}.json`);
}
function loadTorneio(torneioId) {
  const filePath = getTorneioPath(torneioId);
  if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function saveTorneio(torneio) {
  fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
}
function aplicarSeedSorting(atletas) {
  const sorted = [...atletas].sort((a, b) => {
    if (a.pesoKg !== b.pesoKg) return b.pesoKg - a.pesoKg;
    const idadeA = (/* @__PURE__ */ new Date()).getFullYear() - a.anoNascimento;
    const idadeB = (/* @__PURE__ */ new Date()).getFullYear() - b.anoNascimento;
    if (idadeA !== idadeB) return idadeB - idadeA;
    return a.nome.localeCompare(b.nome);
  });
  const n = sorted.length;
  if (n <= 2) return sorted;
  let sideA, sideB;
  if (n === 3) {
    sideA = [0];
    sideB = [1, 2];
  } else if (n === 4) {
    sideA = [0, 3];
    sideB = [1, 2];
  } else {
    sideA = [0, 3, 4];
    sideB = [1, 2];
  }
  for (const side of [sideA, sideB]) {
    const seen = /* @__PURE__ */ new Set();
    for (const idx of side) {
      const team = sorted[idx].equipe;
      if (!team) continue;
      if (seen.has(team)) {
        const otherSide = side === sideA ? sideB : sideA;
        for (const oi of otherSide) {
          const otherTeam = sorted[oi].equipe;
          if (otherTeam !== team && !seen.has(otherTeam)) {
            [sorted[idx], sorted[oi]] = [sorted[oi], sorted[idx]];
            break;
          }
        }
      }
      seen.add(sorted[idx].equipe);
    }
  }
  return sorted;
}
function criarLuta(ordem, atletaAId, atletaBId) {
  return { id: crypto.randomUUID(), ordem, atletaAId, atletaBId };
}
function gerarLutasDois(posicoes) {
  return [criarLuta(1, posicoes[0].id, posicoes[1].id)];
}
function gerarLutasTres(posicoes) {
  return [
    criarLuta(1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, posicoes[2].id, "bye")
  ];
}
function gerarLutasQuatro(posicoes) {
  return [
    criarLuta(1, posicoes[0].id, posicoes[3].id),
    criarLuta(2, posicoes[1].id, posicoes[2].id)
  ];
}
function gerarLutasCinco(posicoes) {
  return [
    criarLuta(1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, posicoes[2].id, posicoes[3].id),
    criarLuta(3, posicoes[4].id, "bye")
  ];
}
function gerarLutas(posicoes) {
  switch (posicoes.length) {
    case 2:
      return gerarLutasDois(posicoes);
    case 3:
      return gerarLutasTres(posicoes);
    case 4:
      return gerarLutasQuatro(posicoes);
    case 5:
      return gerarLutasCinco(posicoes);
    default:
      throw new Error("Número inválido de atletas");
  }
}
const FAIXA_ORDER = {
  "branca": 0,
  "cinza": 1,
  "amarela": 2,
  "laranja": 3,
  "verde": 4,
  "azul": 5,
  "roxa": 6,
  "marrom": 7,
  "preta": 8
};
const MAX_ATLETAS_POR_CHAVE = 5;
function gerarChave(categoriaId, atletas) {
  if (atletas.length < 2 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
    throw new Error("A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.");
  }
  const posicoes = aplicarSeedSorting(atletas);
  const lutas = gerarLutas(posicoes);
  return {
    id: crypto.randomUUID(),
    categoriaId,
    lutas,
    posicoesAtletas: posicoes.map((a) => a.id),
    arbitroId: null,
    totalAtletas: posicoes.length,
    totalLutas: lutas.length,
    status: "gerada"
  };
}
function autoAtribuirArbitros(torneio) {
  const chaves = torneio.chaves ?? [];
  const arbitros = torneio.arbitros ?? [];
  if (chaves.length === 0 || arbitros.length === 0) return;
  const chaveMaxLevel = chaves.map((chave) => {
    const atletas = chave.posicoesAtletas.map((id) => (torneio.atletas ?? []).find((a) => a.id === id)).filter((a) => a !== void 0);
    const maxLevel = Math.max(...atletas.map((a) => FAIXA_ORDER[a.faixa] ?? 0), 0);
    return { chave, maxLevel };
  });
  chaveMaxLevel.sort((a, b) => b.maxLevel - a.maxLevel);
  const usage = /* @__PURE__ */ new Map();
  for (const r of arbitros) usage.set(r.id, 0);
  for (const { chave, maxLevel } of chaveMaxLevel) {
    const best = arbitros.filter((r) => (FAIXA_ORDER[r.faixa] ?? 0) >= maxLevel).sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0))[0];
    if (best) {
      chave.arbitroId = best.id;
      usage.set(best.id, (usage.get(best.id) ?? 0) + 1);
      if (!best.chaveIds.includes(chave.id)) {
        best.chaveIds.push(chave.id);
      }
    }
  }
}
function splitGrupo(grupo) {
  const subgrupos = [];
  for (let i = 0; i < grupo.length; i += MAX_ATLETAS_POR_CHAVE) {
    subgrupos.push(grupo.slice(i, i + MAX_ATLETAS_POR_CHAVE));
  }
  return subgrupos;
}
function gerarTodasChavesHandler(torneioId) {
  const torneio = loadTorneio(torneioId);
  const atletas = torneio.atletas ?? [];
  const atletasIgnorados = [];
  const grupos = /* @__PURE__ */ new Map();
  for (const a of atletas) {
    if (!a.categoria) {
      atletasIgnorados.push(a.nome);
      continue;
    }
    const g = grupos.get(a.categoria) ?? [];
    g.push(a);
    grupos.set(a.categoria, g);
  }
  const novasChaves = [];
  const atletasSemChave = [];
  const metadados = [];
  for (const [categoriaId, grupo] of grupos) {
    if (grupo.length === 0) continue;
    if (grupo.length === 1) {
      atletasSemChave.push(grupo[0]);
      metadados.push({
        categoriaId,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...atletasIgnorados]
      });
      continue;
    }
    const subgrupos = grupo.length > MAX_ATLETAS_POR_CHAVE ? splitGrupo(grupo) : [grupo];
    let chavesGeradas = 0;
    for (const sub of subgrupos) {
      if (sub.length === 1) {
        atletasSemChave.push(sub[0]);
        continue;
      }
      novasChaves.push(gerarChave(categoriaId, sub));
      chavesGeradas++;
    }
    metadados.push({
      categoriaId,
      totalAtletas: grupo.length,
      chavesGeradas,
      atletasIgnorados: [...atletasIgnorados]
    });
  }
  torneio.chaves = novasChaves;
  autoAtribuirArbitros(torneio);
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return { chaves: novasChaves, metadados, atletasSemChave };
}
function separarEquipes(atletas) {
  var _a, _b, _c;
  const n = atletas.length;
  if (n < 4) return;
  const sideA = n === 4 ? [0, 3] : [0, 1];
  const sideB = n === 4 ? [1, 2] : [2, 3, 4];
  for (const side of [sideA, sideB]) {
    const seenTeams = /* @__PURE__ */ new Set();
    for (const idx of side) {
      const team = (_a = atletas[idx]) == null ? void 0 : _a.equipe;
      if (!team) continue;
      if (seenTeams.has(team)) {
        const otherSide = side === sideA ? sideB : sideA;
        for (const oi of otherSide) {
          const otherTeam = (_b = atletas[oi]) == null ? void 0 : _b.equipe;
          if (otherTeam !== team) {
            [atletas[idx], atletas[oi]] = [atletas[oi], atletas[idx]];
            break;
          }
        }
      }
      if ((_c = atletas[idx]) == null ? void 0 : _c.equipe) seenTeams.add(atletas[idx].equipe);
    }
  }
}
function randomizarChaveHandler(torneioId, data) {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const index = chaves.findIndex((c) => c.id === data.chaveId);
  if (index < 0) throw new Error("Chave não encontrada");
  const chave = chaves[index];
  const shuffled = [...chave.posicoesAtletas];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const atletas = shuffled.map((id) => (torneio.atletas ?? []).find((a) => a.id === id)).filter((a) => a !== void 0);
  separarEquipes(atletas);
  chave.posicoesAtletas = atletas.map((a) => a.id);
  chave.lutas = gerarLutas(atletas);
  chaves[index] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return chave;
}
function atribuirArbitroHandler(torneioId, data) {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const chaveIndex = chaves.findIndex((c) => c.id === data.chaveId);
  if (chaveIndex < 0) throw new Error("Chave não encontrada");
  const chave = chaves[chaveIndex];
  const oldArbitroId = chave.arbitroId;
  if (oldArbitroId) {
    const oldArbitro = (torneio.arbitros ?? []).find((r) => r.id === oldArbitroId);
    if (oldArbitro) {
      oldArbitro.chaveIds = oldArbitro.chaveIds.filter((id) => id !== data.chaveId);
    }
  }
  if (data.arbitroId) {
    const newArbitro = (torneio.arbitros ?? []).find((r) => r.id === data.arbitroId);
    if (!newArbitro) throw new Error("Árbitro não encontrado no torneio.");
    if (!newArbitro.chaveIds.includes(data.chaveId)) {
      newArbitro.chaveIds.push(data.chaveId);
    }
  }
  chave.arbitroId = data.arbitroId;
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return chave;
}
async function openBracketFileDialog() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
function importChavesFromFile(torneioId, filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const incoming = JSON.parse(raw);
  if (!Array.isArray(incoming)) {
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de chaves.");
  }
  const torneio = loadTorneio(torneioId);
  const chaves = incoming.map((c) => {
    if (!c.categoriaId || !Array.isArray(c.lutas)) {
      throw new Error("Estrutura de chave inválida no arquivo.");
    }
    return {
      ...c,
      id: c.id || crypto.randomUUID()
    };
  });
  torneio.chaves = chaves;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return { imported: incoming.length };
}
async function exportChavesToFile(torneioId) {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const result = await dialog.showSaveDialog({
    title: "Exportar Chaves",
    defaultPath: `${(torneio.nome || "torneio").replace(/[^a-zA-Z0-9]/g, "_")}_chaves.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(chaves, null, 2), "utf-8");
  }
}
function registerBracketHandlers() {
  ipcMain.handle("gerar-todas-chaves", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return gerarTodasChavesHandler(torneioId);
  });
  ipcMain.handle("gerar-chave", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const torneio = loadTorneio(torneioId);
    const atletas = (torneio.atletas ?? []).filter((a) => a.categoria === data.categoriaId);
    if (atletas.length < 2 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
      throw new Error("A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.");
    }
    const chaves = torneio.chaves ?? [];
    if (chaves.some((c) => c.categoriaId === data.categoriaId)) {
      throw new Error("Chave já existe para esta categoria.");
    }
    const chave = gerarChave(data.categoriaId, atletas);
    torneio.chaves = [...chaves, chave];
    torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveTorneio(torneio);
    return chave;
  });
  ipcMain.handle("load-chaves", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadTorneio(torneioId).chaves ?? [];
  });
  ipcMain.handle("load-chave-por-categoria", (_event, categoriaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const chaves = loadTorneio(torneioId).chaves ?? [];
    return chaves.find((c) => c.categoriaId === categoriaId) ?? null;
  });
  ipcMain.handle("randomizar-chave", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return randomizarChaveHandler(torneioId, data);
  });
  ipcMain.handle("atribuir-arbitro-chave", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return atribuirArbitroHandler(torneioId, data);
  });
  ipcMain.handle("import-chaves", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const filePath = await openBracketFileDialog();
    if (!filePath) return { imported: 0 };
    return importChavesFromFile(torneioId, filePath);
  });
  ipcMain.handle("export-chaves", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return exportChavesToFile(torneioId);
  });
}
const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || "57a8d2d84be94e9bdae407ad8352065346269c6997b0be31ff32101fc51e7c3e";
const ACTIVATION_FILE = "activation.json";
function getActivationPath() {
  return path.join(app.getPath("userData"), ACTIVATION_FILE);
}
function getMachineId() {
  try {
    const uuid = execSync("wmic csproduct get uuid", { encoding: "utf-8" });
    const lines = uuid.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines[1] || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
}
function checkActivation() {
  try {
    const filePath = getActivationPath();
    if (!fs.existsSync(filePath)) return false;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const machineId = getMachineId();
    const expectedToken = crypto.createHmac("sha256", MASTER_PASSWORD_HASH).update(machineId).digest("hex");
    return data.token === expectedToken;
  } catch {
    return false;
  }
}
function validatePassword(password) {
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash === MASTER_PASSWORD_HASH;
}
function activateLicense() {
  try {
    const machineId = getMachineId();
    const token = crypto.createHmac("sha256", MASTER_PASSWORD_HASH).update(machineId).digest("hex");
    const filePath = getActivationPath();
    fs.writeFileSync(filePath, JSON.stringify({ token, activatedAt: (/* @__PURE__ */ new Date()).toISOString() }), "utf-8");
    return true;
  } catch {
    return false;
  }
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "favicon.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.maximize();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
function registerAthleteHandlers() {
  ipcMain.handle("load-athletes", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadAthletes(torneioId);
  });
  ipcMain.handle("save-athlete", (_event, athlete) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return saveAthlete(torneioId, athlete);
  });
  ipcMain.handle("update-athlete", (_event, athlete) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return updateAthlete(torneioId, athlete);
  });
  ipcMain.handle("delete-athlete", (_event, id) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteAthlete(torneioId, id);
  });
  ipcMain.handle("delete-athletes", (_event, ids) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteAthletes(torneioId, ids);
  });
  ipcMain.handle("import-athletes", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const filePath = await openAthleteFileDialog();
    if (!filePath) return { imported: 0, skipped: 0 };
    return importAthletesFromFile(torneioId, filePath);
  });
  ipcMain.handle("export-athletes", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return exportAthletes(torneioId);
  });
}
function registerRefereeHandlers() {
  ipcMain.handle("save-arbitro", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return saveArbitro(torneioId, data);
  });
  ipcMain.handle("update-arbitro", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return updateArbitro(torneioId, data);
  });
  ipcMain.handle("delete-arbitro", (_event, arbitroId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteArbitro(torneioId, arbitroId);
  });
  ipcMain.handle("delete-arbitros", (_event, arbitroIds) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteArbitros(torneioId, arbitroIds);
  });
  ipcMain.handle("load-arbitros", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadArbitros(torneioId);
  });
  ipcMain.handle("import-arbitros", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const filePath = await openArbitroFileDialog();
    if (!filePath) return { imported: 0, skipped: 0 };
    return importArbitrosFromFile(torneioId, filePath);
  });
  ipcMain.handle("export-arbitros", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return exportArbitros(torneioId);
  });
}
function registerActivationHandlers() {
  ipcMain.handle("check-activation", () => {
    return checkActivation();
  });
  ipcMain.handle("validate-password", (_event, password) => {
    return validatePassword(password);
  });
  ipcMain.handle("activate-license", () => {
    return activateLicense();
  });
}
app.whenReady().then(() => {
  registerTournamentHandlers();
  registerAthleteHandlers();
  registerRefereeHandlers();
  registerBracketHandlers();
  registerActivationHandlers();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
