import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
const DATA_DIR$5 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$5 = path.join(DATA_DIR$5, "torneios");
const ATIVO_FILE = path.join(DATA_DIR$5, "torneio-ativo.json");
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR$5)) fs.mkdirSync(DATA_DIR$5, { recursive: true });
  if (!fs.existsSync(TORNEIOS_DIR$5)) fs.mkdirSync(TORNEIOS_DIR$5, { recursive: true });
}
function getTorneioPath$5(id) {
  return path.join(TORNEIOS_DIR$5, `${id}.json`);
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
function mergeById(existing, incoming) {
  const existingMap = /* @__PURE__ */ new Map();
  for (const item of existing) existingMap.set(item.id, item);
  const incomingMap = /* @__PURE__ */ new Map();
  for (const item of incoming) incomingMap.set(item.id, item);
  const result = [];
  let created = 0;
  let updated = 0;
  let removed = 0;
  for (const inc of incomingMap.values()) {
    const ext = existingMap.get(inc.id);
    if (!ext) {
      result.push(inc);
      created += 1;
    } else if (inc.updatedAt > ext.updatedAt) {
      result.push(inc);
      updated += 1;
      if (ext.deletedAt == null && inc.deletedAt != null) {
        removed += 1;
      }
    } else {
      result.push(ext);
    }
  }
  let kept = 0;
  for (const [id, ext] of existingMap) {
    if (!incomingMap.has(id)) {
      result.push(ext);
      kept += 1;
    }
  }
  return { merged: result, counters: { created, updated, kept, removed } };
}
function dedupById(arr) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}
function normalizeAtleta(a) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || "").trim().toLowerCase(),
    equipe: (a.equipe || "").trim().toLowerCase(),
    deletedAt: a.deletedAt ?? null
  };
}
function normalizeArbitro(a) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || "").trim().toLowerCase(),
    equipe: (a.equipe || "").trim().toLowerCase(),
    chaveIds: a.chaveIds ?? [],
    deletedAt: a.deletedAt ?? null
  };
}
function normalizeArea$1(a) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || "").trim(),
    arbitroIds: Array.isArray(a.arbitroIds) ? a.arbitroIds.filter(Boolean) : [],
    deletedAt: a.deletedAt ?? null
  };
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
    fs.writeFileSync(getTorneioPath$5(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
    return torneio;
  });
  ipcMain.handle("list-tournaments", () => {
    ensureDirs();
    const files = fs.readdirSync(TORNEIOS_DIR$5).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const content = fs.readFileSync(path.join(TORNEIOS_DIR$5, f), "utf-8");
      return JSON.parse(content);
    });
  });
  ipcMain.handle("start-tournament", (_event, payload) => {
    ensureDirs();
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id: payload.id, mode: payload.mode }), "utf-8");
    const filePath = getTorneioPath$5(payload.id);
    if (fs.existsSync(filePath)) {
      const torneio = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      torneio.startedAt = (/* @__PURE__ */ new Date()).toISOString();
      torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      fs.writeFileSync(filePath, JSON.stringify(torneio, null, 2), "utf-8");
      return torneio;
    }
    throw new Error("Torneio não encontrado");
  });
  ipcMain.handle("get-tournament-mode", () => {
    ensureDirs();
    if (!fs.existsSync(ATIVO_FILE)) return null;
    try {
      const data = JSON.parse(fs.readFileSync(ATIVO_FILE, "utf-8"));
      return data.mode ?? "admin";
    } catch {
      return null;
    }
  });
  ipcMain.handle("get-active-tournament", () => {
    ensureDirs();
    const id = getActiveTournamentId();
    if (!id) return null;
    const filePath = getTorneioPath$5(id);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });
  ipcMain.handle("export-tournament", async (_event, id) => {
    ensureDirs();
    const sourcePath = getTorneioPath$5(id);
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
  ipcMain.handle(
    "import-tournament",
    (_event, data) => {
      ensureDirs();
      if (!data.id || !data.data) {
        throw new Error("Estrutura inválida");
      }
      const dest = getTorneioPath$5(data.id);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existing = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, "utf-8")) : null;
      if (!existing) {
        const torneio = {
          ...data,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
          atletas: dedupById((data.atletas ?? []).map((a) => normalizeAtleta(a))),
          arbitros: dedupById((data.arbitros ?? []).map((a) => normalizeArbitro(a))),
          areas: dedupById((data.areas ?? []).map((a) => normalizeArea$1(a))),
          chaves: dedupById(data.chaves ?? []),
          lutasCasadas: dedupById(data.lutasCasadas ?? [])
        };
        fs.writeFileSync(dest, JSON.stringify(torneio, null, 2), "utf-8");
        return { success: true, merged: false, created: 0, updated: 0, kept: 0, removed: 0 };
      }
      const incomingAtletas = (data.atletas ?? []).map((a) => normalizeAtleta(a));
      const incomingArbitros = (data.arbitros ?? []).map((a) => normalizeArbitro(a));
      const incomingAreas = (data.areas ?? []).map((a) => normalizeArea$1(a));
      const incomingChaves = data.chaves ?? [];
      const incomingLutasCasadas = data.lutasCasadas ?? [];
      const incomingIsMoreRecent = data.updatedAt > existing.updatedAt;
      const atletasMerge = mergeById(existing.atletas ?? [], incomingAtletas);
      const arbitrosMerge = mergeById(existing.arbitros ?? [], incomingArbitros);
      const areasMerge = mergeById(existing.areas ?? [], incomingAreas);
      const chavesMerge = mergeById(existing.chaves ?? [], incomingChaves);
      const lutasCasadasMerge = mergeById(existing.lutasCasadas ?? [], incomingLutasCasadas);
      const counters = {
        created: atletasMerge.counters.created + arbitrosMerge.counters.created + areasMerge.counters.created + chavesMerge.counters.created + lutasCasadasMerge.counters.created,
        updated: atletasMerge.counters.updated + arbitrosMerge.counters.updated + areasMerge.counters.updated + chavesMerge.counters.updated + lutasCasadasMerge.counters.updated,
        kept: atletasMerge.counters.kept + arbitrosMerge.counters.kept + areasMerge.counters.kept + chavesMerge.counters.kept + lutasCasadasMerge.counters.kept,
        removed: atletasMerge.counters.removed + arbitrosMerge.counters.removed + areasMerge.counters.removed + chavesMerge.counters.removed + lutasCasadasMerge.counters.removed
      };
      const merged = {
        id: existing.id,
        nome: incomingIsMoreRecent ? data.nome : existing.nome,
        data: incomingIsMoreRecent ? data.data : existing.data,
        createdAt: existing.createdAt,
        updatedAt: data.updatedAt > existing.updatedAt ? data.updatedAt : existing.updatedAt,
        startedAt: existing.startedAt ?? data.startedAt,
        atletas: atletasMerge.merged,
        arbitros: arbitrosMerge.merged,
        areas: areasMerge.merged,
        chaves: chavesMerge.merged,
        lutasCasadas: lutasCasadasMerge.merged
      };
      fs.writeFileSync(dest, JSON.stringify(merged, null, 2), "utf-8");
      return { success: true, merged: true, ...counters };
    }
  );
  ipcMain.handle("update-tournament", (_event, data) => {
    ensureDirs();
    const filePath = getTorneioPath$5(data.id);
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
    const filePath = getTorneioPath$5(id);
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
const DATA_DIR$4 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$4 = path.join(DATA_DIR$4, "torneios");
function getTorneioPath$4(torneioId) {
  return path.join(TORNEIOS_DIR$4, `${torneioId}.json`);
}
function loadTorneio$4(torneioId) {
  const filePath = getTorneioPath$4(torneioId);
  if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function saveTorneio$4(torneio) {
  fs.writeFileSync(getTorneioPath$4(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
}
function loadAthletes(torneioId) {
  const torneio = loadTorneio$4(torneioId);
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
    if (a.deletedAt === void 0) {
      a.deletedAt = null;
      modified = true;
    }
  }
  if (modified) {
    torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveTorneio$4(torneio);
  }
  return list.filter((a) => a.deletedAt == null);
}
function saveAthlete(torneioId, athlete) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const data = {
    ...athlete,
    id: athlete.id || crypto.randomUUID(),
    createdAt: athlete.createdAt || now,
    updatedAt: now,
    deletedAt: null
  };
  list.push(data);
  torneio.atletas = list;
  torneio.updatedAt = now;
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function updateAthlete(torneioId, updated) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  const index = list.findIndex((a) => a.id === updated.id);
  if (index === -1) throw new Error("Atleta não encontrado");
  const previous = list[index];
  list[index] = {
    ...updated,
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function deleteAthlete(torneioId, id) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list[index] = {
    ...list[index],
    deletedAt: now,
    updatedAt: now
  };
  torneio.atletas = list;
  torneio.updatedAt = now;
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function deleteAthletes(torneioId, ids) {
  const torneio = loadTorneio$4(torneioId);
  const idSet = new Set(ids);
  const list = torneio.atletas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < list.length; i += 1) {
    if (idSet.has(list[i].id)) {
      list[i] = {
        ...list[i],
        deletedAt: now,
        updatedAt: now
      };
    }
  }
  torneio.atletas = list;
  torneio.updatedAt = now;
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function restoreAthlete(torneioId, id) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list[index] = {
    ...list[index],
    deletedAt: null,
    updatedAt: now
  };
  torneio.atletas = list;
  torneio.updatedAt = now;
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function loadDeletedAthletes(torneioId) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  return list.filter((a) => a.deletedAt != null);
}
function permanentlyDeleteAthlete(torneioId, id) {
  const torneio = loadTorneio$4(torneioId);
  const list = torneio.atletas ?? [];
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list.splice(index, 1);
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$4(torneio);
  return list.filter((a) => a.deletedAt == null);
}
function permanentlyDeleteAthletes(torneioId, ids) {
  const torneio = loadTorneio$4(torneioId);
  const idSet = new Set(ids);
  const list = torneio.atletas ?? [];
  torneio.atletas = list.filter((a) => !idSet.has(a.id));
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$4(torneio);
  return torneio.atletas.filter((a) => a.deletedAt == null);
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
  const torneio = loadTorneio$4(torneioId);
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
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        deletedAt: null
      });
      imported++;
    } else {
      skipped++;
    }
  }
  torneio.atletas = current;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$4(torneio);
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
const DATA_DIR$3 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$3 = path.join(DATA_DIR$3, "torneios");
function getTorneioPath$3(torneioId) {
  return path.join(TORNEIOS_DIR$3, `${torneioId}.json`);
}
function loadTorneio$3(torneioId) {
  const filePath = getTorneioPath$3(torneioId);
  if (!fs.existsSync(filePath)) throw new Error("Torneio não encontrado");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function saveTorneio$3(torneio) {
  fs.writeFileSync(getTorneioPath$3(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
}
function loadArbitros(torneioId) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  let modified = false;
  for (const a of list) {
    if (a.deletedAt === void 0) {
      a.deletedAt = null;
      modified = true;
    }
  }
  if (modified) {
    torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveTorneio$3(torneio);
  }
  return list.filter((a) => a.deletedAt == null);
}
function saveArbitro(torneioId, data) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const arbitro = {
    id: crypto.randomUUID(),
    nome: data.nome.trim().toLowerCase(),
    equipe: (data.equipe ?? "").trim().toLowerCase(),
    faixa: data.faixa,
    chaveIds: data.chaveIds ?? [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
  list.push(arbitro);
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$3(torneio);
  return arbitro;
}
function updateArbitro(torneioId, data) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  const index = list.findIndex((a) => a.id === data.id);
  if (index === -1) throw new Error("Árbitro não encontrado");
  const previous = list[index];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  list[index] = {
    ...data,
    nome: data.nome.trim().toLowerCase(),
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
    updatedAt: now
  };
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$3(torneio);
  return list[index];
}
function deleteArbitro(torneioId, arbitroId) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === arbitroId);
  if (index === -1) throw new Error("Árbitro não encontrado");
  list[index] = {
    ...list[index],
    deletedAt: now,
    updatedAt: now
  };
  const t = torneio;
  const chaves = t.chaves;
  if (chaves) {
    for (const chave of chaves) {
      if (chave.arbitroId === arbitroId) {
        chave.arbitroId = null;
      }
    }
  }
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$3(torneio);
}
function deleteArbitros(torneioId, arbitroIds) {
  const torneio = loadTorneio$3(torneioId);
  const idSet = new Set(arbitroIds);
  const list = torneio.arbitros ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < list.length; i += 1) {
    if (idSet.has(list[i].id)) {
      list[i] = {
        ...list[i],
        deletedAt: now,
        updatedAt: now
      };
    }
  }
  const t = torneio;
  const chaves = t.chaves;
  if (chaves) {
    for (const chave of chaves) {
      if (chave.arbitroId && idSet.has(chave.arbitroId)) {
        chave.arbitroId = null;
      }
    }
  }
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$3(torneio);
}
function restoreArbitro(torneioId, arbitroId) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === arbitroId);
  if (index === -1) throw new Error("Árbitro não encontrado");
  list[index] = {
    ...list[index],
    deletedAt: null,
    updatedAt: now
  };
  torneio.arbitros = list;
  torneio.updatedAt = now;
  saveTorneio$3(torneio);
}
function loadDeletedArbitros(torneioId) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  return list.filter((a) => a.deletedAt != null);
}
function permanentlyDeleteArbitro(torneioId, arbitroId) {
  const torneio = loadTorneio$3(torneioId);
  const list = torneio.arbitros ?? [];
  const index = list.findIndex((a) => a.id === arbitroId);
  if (index === -1) throw new Error("Árbitro não encontrado");
  list.splice(index, 1);
  torneio.arbitros = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$3(torneio);
}
function permanentlyDeleteArbitros(torneioId, arbitroIds) {
  const torneio = loadTorneio$3(torneioId);
  const idSet = new Set(arbitroIds);
  const list = torneio.arbitros ?? [];
  torneio.arbitros = list.filter((a) => !idSet.has(a.id));
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$3(torneio);
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
  const torneio = loadTorneio$3(torneioId);
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
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        deletedAt: null
      });
      imported++;
    } else {
      skipped++;
    }
  }
  torneio.arbitros = current;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$3(torneio);
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
function gerarNomeAreaPadrao(areas) {
  const usados = /* @__PURE__ */ new Set();
  for (const a of areas) {
    const m = a.nome.match(/^Área (\d+)$/i);
    if (m) usados.add(Number(m[1]));
  }
  let n = 1;
  while (usados.has(n)) n += 1;
  return `Área ${n}`;
}
function normalizeArea(area) {
  return {
    id: area.id,
    nome: area.nome ?? "",
    arbitroIds: Array.isArray(area.arbitroIds) ? area.arbitroIds.filter(Boolean) : area.arbitroId ? [area.arbitroId] : [],
    createdAt: area.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: area.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    deletedAt: area.deletedAt ?? null
  };
}
function loadAreas(torneioId) {
  const torneio = loadTorneio$2(torneioId);
  const list = (torneio.areas ?? []).map((a) => normalizeArea(a));
  return list.filter((a) => a.deletedAt == null);
}
function checkRefereeNotInUse(torneioId, arbitroIds, excludeAreaId) {
  const ids = arbitroIds ?? [];
  if (ids.length === 0) return;
  const torneio = loadTorneio$2(torneioId);
  const arbitrosAtivos = (torneio.arbitros ?? []).filter((a) => a.deletedAt == null);
  const idsAtivos = new Set(arbitrosAtivos.map((r) => r.id));
  const invalidos = ids.filter((id) => id && !idsAtivos.has(id));
  if (invalidos.length > 0) {
    throw new Error("Um ou mais árbitros não existem ou estão deletados.");
  }
  const areas = loadAreas(torneioId);
  const assigned = /* @__PURE__ */ new Set();
  for (const area of areas) {
    if (area.id === excludeAreaId) continue;
    for (const rid of area.arbitroIds) {
      assigned.add(rid);
    }
  }
  const conflict = ids.filter((rid) => rid && assigned.has(rid));
  if (conflict.length > 0) {
    throw new Error("Um ou mais árbitros já estão atribuídos a outra área de luta.");
  }
}
function saveArea(torneioId, data) {
  const arbitroIds = data.arbitroIds ?? [];
  checkRefereeNotInUse(torneioId, arbitroIds);
  const torneio = loadTorneio$2(torneioId);
  const allAreas = (torneio.areas ?? []).map((a) => normalizeArea(a));
  const activeAreas = allAreas.filter((a) => a.deletedAt == null);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const nomeFinal = data.nome.trim() === "" ? gerarNomeAreaPadrao(activeAreas) : data.nome.trim();
  const area = {
    id: crypto.randomUUID(),
    nome: nomeFinal,
    arbitroIds: arbitroIds.filter(Boolean),
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
  allAreas.push(area);
  torneio.areas = allAreas;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
  return area;
}
function updateArea(torneioId, data) {
  const arbitroIds = data.arbitroIds ?? [];
  checkRefereeNotInUse(torneioId, arbitroIds, data.id);
  const torneio = loadTorneio$2(torneioId);
  const allAreas = (torneio.areas ?? []).map((a) => normalizeArea(a));
  const index = allAreas.findIndex((a) => a.id === data.id);
  if (index === -1) throw new Error("Área de luta não encontrada");
  const previous = allAreas[index];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const activeOthers = allAreas.filter((a) => a.deletedAt == null && a.id !== data.id);
  const nomeFinal = data.nome.trim() === "" ? gerarNomeAreaPadrao(activeOthers) : data.nome.trim();
  allAreas[index] = {
    ...data,
    nome: nomeFinal,
    arbitroIds: arbitroIds.filter(Boolean),
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
    updatedAt: now
  };
  torneio.areas = allAreas;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
  return allAreas[index];
}
function deleteArea(torneioId, areaId) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.areas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === areaId);
  if (index === -1) throw new Error("Área de luta não encontrada");
  list[index] = {
    ...list[index],
    deletedAt: now,
    updatedAt: now
  };
  torneio.areas = list;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
}
function deleteAreas(torneioId, areaIds) {
  const torneio = loadTorneio$2(torneioId);
  const idSet = new Set(areaIds);
  const list = torneio.areas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < list.length; i += 1) {
    if (idSet.has(list[i].id)) {
      list[i] = {
        ...list[i],
        deletedAt: now,
        updatedAt: now
      };
    }
  }
  torneio.areas = list;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
}
function restoreArea(torneioId, areaId) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.areas ?? [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const index = list.findIndex((a) => a.id === areaId);
  if (index === -1) throw new Error("Área de luta não encontrada");
  list[index] = {
    ...list[index],
    deletedAt: null,
    updatedAt: now
  };
  torneio.areas = list;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
}
function loadDeletedAreas(torneioId) {
  const torneio = loadTorneio$2(torneioId);
  const list = (torneio.areas ?? []).map((a) => normalizeArea(a));
  return list.filter((a) => a.deletedAt != null);
}
function permanentlyDeleteArea(torneioId, areaId) {
  const torneio = loadTorneio$2(torneioId);
  const list = torneio.areas ?? [];
  const index = list.findIndex((a) => a.id === areaId);
  if (index === -1) throw new Error("Área de luta não encontrada");
  list.splice(index, 1);
  torneio.areas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
}
function permanentlyDeleteAreas(torneioId, areaIds) {
  const torneio = loadTorneio$2(torneioId);
  const idSet = new Set(areaIds);
  const list = torneio.areas ?? [];
  torneio.areas = list.filter((a) => !idSet.has(a.id));
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$2(torneio);
}
function importAreasFromFile(torneioId, filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const incoming = JSON.parse(raw);
  if (!Array.isArray(incoming)) {
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de áreas de luta.");
  }
  const torneio = loadTorneio$2(torneioId);
  const allAreas = (torneio.areas ?? []).map((a) => normalizeArea(a));
  const activeAreas = allAreas.filter((a) => a.deletedAt == null);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let imported = 0;
  let skipped = 0;
  for (const item of incoming) {
    if (!item || typeof item !== "object") {
      throw new Error("Área inválida no arquivo: formato incorreto.");
    }
    const itemObj = item;
    if (itemObj.arbitroIds !== void 0 && !Array.isArray(itemObj.arbitroIds)) {
      throw new Error(`Área inválida no arquivo: "${String(itemObj.nome ?? "sem nome")}" — arbitroIds deve ser um array.`);
    }
    const nomeRaw = typeof itemObj.nome === "string" ? itemObj.nome.trim() : "";
    const arbitroIdsIn = Array.isArray(itemObj.arbitroIds) ? itemObj.arbitroIds.filter((x) => typeof x === "string" && x.length > 0) : [];
    const duplicate = activeAreas.some(
      (ex) => ex.nome.trim().toLowerCase() === nomeRaw.toLowerCase() && nomeRaw !== ""
    );
    if (duplicate) {
      skipped += 1;
      continue;
    }
    checkRefereeNotInUse(torneioId, arbitroIdsIn);
    const nomeFinal = nomeRaw === "" ? gerarNomeAreaPadrao(activeAreas) : nomeRaw;
    const area = {
      id: crypto.randomUUID(),
      nome: nomeFinal,
      arbitroIds: arbitroIdsIn,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    allAreas.push(area);
    activeAreas.push(area);
    imported += 1;
  }
  torneio.areas = allAreas;
  torneio.updatedAt = now;
  saveTorneio$2(torneio);
  return { imported, skipped };
}
async function openAreaFileDialog() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
async function exportAreas(torneioId) {
  const list = loadAreas(torneioId);
  const result = await dialog.showSaveDialog({
    title: "Exportar Áreas de Luta",
    defaultPath: "areas.json",
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
function sortAtletas(atletas) {
  return [...atletas].sort((a, b) => {
    if (a.pesoKg !== b.pesoKg) return b.pesoKg - a.pesoKg;
    const idadeA = (/* @__PURE__ */ new Date()).getFullYear() - a.anoNascimento;
    const idadeB = (/* @__PURE__ */ new Date()).getFullYear() - b.anoNascimento;
    if (idadeA !== idadeB) return idadeB - idadeA;
    return a.nome.localeCompare(b.nome);
  });
}
function aplicarSeedSorting(atletas) {
  const sorted = sortAtletas(atletas);
  const n = sorted.length;
  if (n <= 2) return sorted;
  const half = Math.ceil(n / 2);
  const sideA = Array.from({ length: half }, (_, i) => i);
  const sideB = Array.from({ length: n - half }, (_, i) => i + half);
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
function aplicarSeedSorting16(atletas) {
  const sorted = sortAtletas(atletas);
  const sideA = sorted.slice(0, 8);
  const sideB = sorted.slice(8, 16);
  for (const side of [sideA, sideB]) {
    const seen = /* @__PURE__ */ new Map();
    side.forEach((a, idx) => {
      if (a.equipe) {
        const list = seen.get(a.equipe) ?? [];
        list.push(idx);
        seen.set(a.equipe, list);
      }
    });
    for (const [team, indices] of seen) {
      if (indices.length < 2) continue;
      const otherSide = side === sideA ? sideB : sideA;
      for (let i = 1; i < indices.length; i++) {
        const swapIdx = otherSide.findIndex((o) => o.equipe !== team);
        if (swapIdx >= 0) {
          [side[indices[i]], otherSide[swapIdx]] = [otherSide[swapIdx], side[indices[i]]];
        }
      }
    }
  }
  return [...sideA, ...sideB];
}
const TBD = "tbd";
function criarLuta(ordem, rodada, atletaAId, atletaBId) {
  return { id: crypto.randomUUID(), ordem, rodada, atletaAId, atletaBId, status: "pending", vencedorId: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function gerarLutasDois(posicoes) {
  return [criarLuta(1, 1, posicoes[0].id, posicoes[1].id)];
}
function gerarLutasTres(posicoes) {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 2, TBD, posicoes[2].id),
    criarLuta(3, 3, TBD, TBD)
  ];
}
function gerarLutasQuatro(posicoes) {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[3].id),
    criarLuta(2, 1, posicoes[1].id, posicoes[2].id),
    criarLuta(3, 2, TBD, TBD)
  ];
}
function gerarLutasCinco(posicoes) {
  const luta3 = criarLuta(3, 1, posicoes[4].id, TBD);
  luta3.vencedorId = posicoes[4].id;
  luta3.status = "wo";
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 1, posicoes[2].id, posicoes[3].id),
    luta3,
    criarLuta(4, 2, TBD, posicoes[4].id),
    criarLuta(5, 2, TBD, TBD),
    criarLuta(6, 3, TBD, TBD)
  ];
}
function gerarLutasNove(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, TBD);
  l2.vencedorId = posicoes[2].id;
  l2.status = "wo";
  const l3 = criarLuta(ordem++, 1, posicoes[3].id, posicoes[4].id);
  const l4 = criarLuta(ordem++, 1, posicoes[5].id, TBD);
  l4.vencedorId = posicoes[5].id;
  l4.status = "wo";
  const l5 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l6 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l6.vencedorId = posicoes[8].id;
  l6.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6);
  const l7 = criarLuta(ordem++, 2, TBD, posicoes[2].id);
  const l8 = criarLuta(ordem++, 2, TBD, posicoes[5].id);
  const l9 = criarLuta(ordem++, 2, TBD, posicoes[8].id);
  lutas.push(l7, l8, l9);
  const l10 = criarLuta(ordem++, 3, TBD, TBD);
  const l11 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l10, l11);
  const l12 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l12);
  return lutas;
}
function gerarLutasOnze(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, TBD);
  l4.vencedorId = posicoes[6].id;
  l4.status = "wo";
  const l5 = criarLuta(ordem++, 1, posicoes[7].id, TBD);
  l5.vencedorId = posicoes[7].id;
  l5.status = "wo";
  const l6 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l6.vencedorId = posicoes[8].id;
  l6.status = "wo";
  const l7 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l7.vencedorId = posicoes[9].id;
  l7.status = "wo";
  const l8 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l8.vencedorId = posicoes[10].id;
  l8.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, posicoes[6].id);
  const l11 = criarLuta(ordem++, 2, posicoes[7].id, posicoes[8].id);
  const l12 = criarLuta(ordem++, 2, posicoes[9].id, posicoes[10].id);
  lutas.push(l9, l10, l11, l12);
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l13, l14);
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);
  return lutas;
}
function gerarLutasDoze(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l5.vencedorId = posicoes[8].id;
  l5.status = "wo";
  const l6 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l6.vencedorId = posicoes[9].id;
  l6.status = "wo";
  const l7 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l7.vencedorId = posicoes[10].id;
  l7.status = "wo";
  const l8 = criarLuta(ordem++, 1, posicoes[11].id, TBD);
  l8.vencedorId = posicoes[11].id;
  l8.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, posicoes[8].id, posicoes[9].id);
  const l12 = criarLuta(ordem++, 2, posicoes[10].id, posicoes[11].id);
  lutas.push(l9, l10, l11, l12);
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l13, l14);
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);
  return lutas;
}
function gerarLutasTreze(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);
  const l6 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l6.vencedorId = posicoes[10].id;
  l6.status = "wo";
  const l7 = criarLuta(ordem++, 1, posicoes[11].id, TBD);
  l7.vencedorId = posicoes[11].id;
  l7.status = "wo";
  const l8 = criarLuta(ordem++, 1, posicoes[12].id, TBD);
  l8.vencedorId = posicoes[12].id;
  l8.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, TBD, posicoes[10].id);
  const l12 = criarLuta(ordem++, 2, posicoes[11].id, posicoes[12].id);
  lutas.push(l9, l10, l11, l12);
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l13, l14);
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);
  return lutas;
}
function gerarLutasQuatorze(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);
  const l6 = criarLuta(ordem++, 1, posicoes[10].id, posicoes[11].id);
  const l7 = criarLuta(ordem++, 1, posicoes[12].id, TBD);
  l7.vencedorId = posicoes[12].id;
  l7.status = "wo";
  const l8 = criarLuta(ordem++, 1, posicoes[13].id, TBD);
  l8.vencedorId = posicoes[13].id;
  l8.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, TBD, TBD);
  const l12 = criarLuta(ordem++, 2, posicoes[12].id, posicoes[13].id);
  lutas.push(l9, l10, l11, l12);
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l13, l14);
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);
  return lutas;
}
function gerarLutasQuinze(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);
  const l6 = criarLuta(ordem++, 1, posicoes[10].id, posicoes[11].id);
  const l7 = criarLuta(ordem++, 1, posicoes[12].id, posicoes[13].id);
  const l8 = criarLuta(ordem++, 1, posicoes[14].id, TBD);
  l8.vencedorId = posicoes[14].id;
  l8.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, TBD, TBD);
  const l12 = criarLuta(ordem++, 2, TBD, posicoes[14].id);
  lutas.push(l9, l10, l11, l12);
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l13, l14);
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);
  return lutas;
}
function gerarLutasDez(posicoes) {
  const lutas = [];
  let ordem = 1;
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l5.vencedorId = posicoes[8].id;
  l5.status = "wo";
  const l6 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l6.vencedorId = posicoes[9].id;
  l6.status = "wo";
  lutas.push(l1, l2, l3, l4, l5, l6);
  const l7 = criarLuta(ordem++, 2, TBD, TBD);
  const l8 = criarLuta(ordem++, 2, TBD, TBD);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, posicoes[8].id, posicoes[9].id);
  lutas.push(l7, l8, l9, l10);
  const l11 = criarLuta(ordem++, 3, TBD, TBD);
  const l12 = criarLuta(ordem++, 3, TBD, TBD);
  lutas.push(l11, l12);
  const l13 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l13);
  return lutas;
}
function gerarLutasSeis(posicoes) {
  const luta2 = criarLuta(2, 1, posicoes[2].id, TBD);
  luta2.vencedorId = posicoes[2].id;
  luta2.status = "wo";
  const luta4 = criarLuta(4, 1, posicoes[5].id, TBD);
  luta4.vencedorId = posicoes[5].id;
  luta4.status = "wo";
  const luta5 = criarLuta(5, 2, posicoes[2].id, TBD);
  const luta6 = criarLuta(6, 2, posicoes[5].id, TBD);
  const lutas = [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    luta2,
    criarLuta(3, 1, posicoes[3].id, posicoes[4].id),
    luta4,
    luta5,
    luta6,
    criarLuta(7, 3, TBD, TBD)
  ];
  return lutas;
}
function getTotalRodadas(totalAtletas) {
  if (totalAtletas <= 2) return 1;
  if (totalAtletas === 3) return 3;
  if (totalAtletas <= 4) return 2;
  return Math.ceil(Math.log2(totalAtletas));
}
function gerarLutasGeral(posicoes) {
  const n = posicoes.length;
  const numRodadas = Math.ceil(Math.log2(n));
  const lutas = [];
  let ordem = 1;
  const round1Entries = [];
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) {
      const luta = criarLuta(ordem++, 1, posicoes[i].id, posicoes[i + 1].id);
      lutas.push(luta);
      round1Entries.push(luta.id);
    } else {
      const byeLuta = criarLuta(ordem++, 1, posicoes[i].id, TBD);
      byeLuta.vencedorId = posicoes[i].id;
      byeLuta.status = "wo";
      lutas.push(byeLuta);
      round1Entries.push(posicoes[i].id);
    }
  }
  let currentEntries = round1Entries;
  let rodada = 2;
  while (rodada <= numRodadas) {
    const nextEntries = [];
    for (let i = 0; i < currentEntries.length; i += 2) {
      if (i + 1 < currentEntries.length) {
        const luta = criarLuta(ordem++, rodada, TBD, TBD);
        lutas.push(luta);
        nextEntries.push(luta.id);
      } else {
        nextEntries.push(currentEntries[i]);
      }
    }
    currentEntries = nextEntries;
    rodada++;
  }
  for (let r = 1; r < numRodadas; r++) {
    const currentRoundLutas = lutas.filter((l) => l.rodada === r);
    const nextRoundLutas = lutas.filter((l) => l.rodada === r + 1);
    if (nextRoundLutas.length === 0) continue;
    const fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length;
    if (!Number.isInteger(fightsPerNextMatch)) continue;
    for (let i = 0; i < currentRoundLutas.length; i++) {
      const luta = currentRoundLutas[i];
      if (luta.status !== "wo" || !luta.vencedorId) continue;
      const nextMatchIndex = Math.floor(i / fightsPerNextMatch);
      const slotInNextMatch = i % fightsPerNextMatch;
      if (nextMatchIndex >= nextRoundLutas.length) continue;
      const nextLuta = nextRoundLutas[nextMatchIndex];
      if (slotInNextMatch === 0 && (nextLuta.atletaAId === "tbd" || nextLuta.atletaAId === "")) {
        nextLuta.atletaAId = luta.vencedorId;
      } else if (slotInNextMatch === 1 && (nextLuta.atletaBId === "tbd" || nextLuta.atletaBId === "")) {
        nextLuta.atletaBId = luta.vencedorId;
      }
    }
  }
  return lutas;
}
function gerarLutas16(posicoes) {
  const lutas = [];
  let ordem = 1;
  for (let i = 0; i < 8; i++) {
    lutas.push(criarLuta(ordem++, 1, posicoes[i * 2].id, posicoes[i * 2 + 1].id));
  }
  for (let i = 0; i < 4; i++) {
    lutas.push(criarLuta(ordem++, 2, TBD, TBD));
  }
  for (let i = 0; i < 2; i++) {
    lutas.push(criarLuta(ordem++, 3, TBD, TBD));
  }
  lutas.push(criarLuta(ordem++, 4, TBD, TBD));
  return lutas;
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
    case 6:
      return gerarLutasSeis(posicoes);
    case 9:
      return gerarLutasNove(posicoes);
    case 10:
      return gerarLutasDez(posicoes);
    case 11:
      return gerarLutasOnze(posicoes);
    case 12:
      return gerarLutasDoze(posicoes);
    case 13:
      return gerarLutasTreze(posicoes);
    case 14:
      return gerarLutasQuatorze(posicoes);
    case 15:
      return gerarLutasQuinze(posicoes);
    case 16:
      return gerarLutas16(posicoes);
    default:
      if (posicoes.length >= 7 && posicoes.length <= 15) return gerarLutasGeral(posicoes);
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
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gerarChave(categoriaId, atletas) {
  if (atletas.length < 2 || atletas.length > 16) {
    throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
  }
  const embaralhados = shuffleArray(atletas);
  const posicoes = embaralhados.length === 16 ? aplicarSeedSorting16(embaralhados) : aplicarSeedSorting(embaralhados);
  const lutas = gerarLutas(posicoes);
  return {
    id: crypto.randomUUID(),
    categoriaId,
    lutas,
    posicoesAtletas: posicoes.map((a) => a.id),
    arbitroId: null,
    totalAtletas: posicoes.length,
    totalLutas: lutas.length,
    totalRodadas: getTotalRodadas(posicoes.length),
    status: "gerada",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function autoAtribuirArbitros(torneio) {
  const chaves = torneio.chaves ?? [];
  const arbitros = (torneio.arbitros ?? []).filter((r) => r.deletedAt == null);
  if (chaves.length === 0 || arbitros.length === 0) return;
  for (const r of arbitros) {
    r.chaveIds = [];
  }
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
function splitGrupo(grupo, maxPorChave) {
  const n = grupo.length;
  if (n <= maxPorChave && n >= 2) return [grupo];
  const subgrupos = [];
  let idx = 0;
  while (idx < n) {
    const remaining = n - idx;
    if (remaining <= maxPorChave) {
      subgrupos.push(grupo.slice(idx));
      idx = n;
    } else {
      subgrupos.push(grupo.slice(idx, idx + maxPorChave));
      idx += maxPorChave;
    }
  }
  const last = subgrupos[subgrupos.length - 1];
  if (last && last.length === 1 && subgrupos.length > 1) {
    const prev = subgrupos[subgrupos.length - 2];
    const migrated = prev.pop();
    last.unshift(migrated);
  }
  return subgrupos;
}
function gerarTodasChavesHandler(torneioId, maxPorChave = 16) {
  const torneio = loadTorneio$1(torneioId);
  const atletas = (torneio.atletas ?? []).filter((a) => a.deletedAt == null);
  torneio.chaves = [];
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
    const subgrupos = splitGrupo(grupo, maxPorChave);
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
  const atletasEmChaves = /* @__PURE__ */ new Set();
  for (const chave of novasChaves) {
    for (const id of chave.posicoesAtletas) {
      atletasEmChaves.add(id);
    }
  }
  for (const a of torneio.atletas ?? []) {
    a.emChave = atletasEmChaves.has(a.id);
  }
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
  return { chaves: novasChaves, metadados, atletasSemChave };
}
function separarEquipes(atletas) {
  var _a, _b, _c;
  const n = atletas.length;
  if (n < 4) return;
  const sideA = n === 4 ? [0, 3] : n === 5 ? [0, 1, 2] : n === 6 ? [0, 1, 2] : n === 9 ? [0, 1, 2, 3, 4] : n === 10 ? [0, 1, 2, 3, 4] : n === 11 ? [0, 1, 2, 3, 4, 5] : n === 12 ? [0, 1, 2, 3, 4, 5] : n === 13 ? [0, 1, 2, 3, 4, 5] : n === 14 ? [0, 1, 2, 3, 4, 5] : n === 15 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1];
  const sideB = n === 4 ? [1, 2] : n === 5 ? [3, 4] : n === 6 ? [3, 4, 5] : n === 9 ? [5, 6, 7, 8] : n === 10 ? [5, 6, 7, 8, 9] : n === 11 ? [6, 7, 8, 9, 10] : n === 12 ? [6, 7, 8, 9, 10, 11] : n === 13 ? [6, 7, 8, 9, 10, 11, 12] : n === 14 ? [6, 7, 8, 9, 10, 11, 12, 13] : n === 15 ? [7, 8, 9, 10, 11, 12, 13, 14] : [2, 3, 4];
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
  const torneio = loadTorneio$1(torneioId);
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
  if (atletas.length === 16) {
    const sorted = aplicarSeedSorting16(atletas);
    chave.posicoesAtletas = sorted.map((a) => a.id);
  } else {
    separarEquipes(atletas);
    chave.posicoesAtletas = atletas.map((a) => a.id);
  }
  chave.lutas = gerarLutas(atletas);
  chave.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  chaves[index] = chave;
  torneio.chaves = chaves;
  for (const a of torneio.atletas ?? []) {
    if (chave.posicoesAtletas.includes(a.id)) {
      a.emChave = true;
    }
  }
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
  return chave;
}
function atribuirArbitroHandler(torneioId, data) {
  const torneio = loadTorneio$1(torneioId);
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
    if (newArbitro.deletedAt != null) throw new Error("Árbitro deletado não pode ser atribuído a uma chave.");
    if (!newArbitro.chaveIds.includes(data.chaveId)) {
      newArbitro.chaveIds.push(data.chaveId);
    }
  }
  chave.arbitroId = data.arbitroId;
  chave.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
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
  const torneio = loadTorneio$1(torneioId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const chaves = incoming.map((c) => {
    if (!c.categoriaId || !Array.isArray(c.lutas)) {
      throw new Error("Estrutura de chave inválida no arquivo.");
    }
    const lutas = c.lutas.map((l) => ({
      ...l,
      updatedAt: l.updatedAt ?? now
    }));
    return {
      ...c,
      id: c.id || crypto.randomUUID(),
      lutas,
      updatedAt: c.updatedAt ?? now
    };
  });
  torneio.chaves = chaves;
  const atletasEmChaves = /* @__PURE__ */ new Set();
  for (const chave of chaves) {
    for (const id of chave.posicoesAtletas) {
      atletasEmChaves.add(id);
    }
  }
  for (const a of torneio.atletas ?? []) {
    a.emChave = atletasEmChaves.has(a.id);
  }
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio$1(torneio);
  return { imported: incoming.length };
}
async function exportChavesToFile(torneioId) {
  const torneio = loadTorneio$1(torneioId);
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
function normalizeLuta(luta) {
  return {
    id: luta.id,
    ordem: luta.ordem ?? 0,
    rodada: luta.rodada ?? 1,
    atletaAId: luta.atletaAId ?? "",
    atletaBId: luta.atletaBId ?? "",
    status: luta.status ?? "pending",
    vencedorId: luta.vencedorId ?? null,
    placarA: luta.placarA ?? void 0,
    placarB: luta.placarB ?? void 0,
    finalizacao: luta.finalizacao ?? void 0,
    desclassificacao: luta.desclassificacao ?? void 0,
    desclassificadoId: luta.desclassificadoId ?? void 0,
    desempateArbitro: luta.desempateArbitro ?? void 0,
    horarioInicio: luta.horarioInicio ?? void 0,
    horarioTermino: luta.horarioTermino ?? void 0,
    updatedAt: luta.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function normalizeChave(chave) {
  const lutas = (chave.lutas ?? []).map(normalizeLuta);
  return {
    id: chave.id,
    categoriaId: chave.categoriaId ?? "",
    lutas,
    posicoesAtletas: chave.posicoesAtletas ?? [],
    arbitroId: chave.arbitroId ?? null,
    totalAtletas: chave.totalAtletas ?? 0,
    totalLutas: chave.totalLutas ?? 0,
    totalRodadas: chave.totalRodadas ?? (lutas.length > 0 ? Math.max(...lutas.map((l) => l.rodada)) : 1),
    status: chave.status ?? "gerada",
    updatedAt: chave.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function loadChavesPorAreaHandler(torneioId, areaId) {
  const torneio = loadTorneio$1(torneioId);
  const areas = loadAreas(torneioId);
  const area = areas.find((a) => a.id === areaId);
  if (!area) return [];
  const arbitroIds = new Set(area.arbitroIds);
  return (torneio.chaves ?? []).map((c) => normalizeChave(c)).filter((c) => c.arbitroId && arbitroIds.has(c.arbitroId));
}
function clearWinnerFromLaterRounds(chave, rodada, atletaId) {
  for (const l of chave.lutas) {
    if (l.rodada <= rodada) continue;
    if (l.atletaAId === atletaId) {
      l.atletaAId = "tbd";
      l.vencedorId = null;
      if (l.status === "completed" || l.status === "wo") l.status = "pending";
      l.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      clearWinnerFromLaterRounds(chave, l.rodada, atletaId);
    }
    if (l.atletaBId === atletaId) {
      l.atletaBId = "tbd";
      l.vencedorId = null;
      if (l.status === "completed" || l.status === "wo") l.status = "pending";
      l.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      clearWinnerFromLaterRounds(chave, l.rodada, atletaId);
    }
  }
}
function advanceWinnerInChave(chave, luta) {
  const currentRoundLutas = chave.lutas.filter((l) => l.rodada === luta.rodada);
  const matchIndex = currentRoundLutas.indexOf(luta);
  if (matchIndex < 0) return;
  let targetRodada = luta.rodada + 1;
  while (targetRodada <= (chave.totalRodadas || 3)) {
    const nextRoundLutas = chave.lutas.filter((l) => l.rodada === targetRodada);
    if (nextRoundLutas.length === 0) return;
    const fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length;
    const nextMatchIndex = Math.floor(matchIndex / fightsPerNextMatch);
    if (nextMatchIndex >= nextRoundLutas.length) return;
    const nextLuta = nextRoundLutas[nextMatchIndex];
    const slotInNextMatch = Math.floor(matchIndex % fightsPerNextMatch);
    if (slotInNextMatch === 0 && (nextLuta.atletaAId === "tbd" || nextLuta.atletaAId === "")) {
      nextLuta.atletaAId = luta.vencedorId;
      return;
    }
    if (slotInNextMatch === 1 && (nextLuta.atletaBId === "tbd" || nextLuta.atletaBId === "")) {
      nextLuta.atletaBId = luta.vencedorId;
      return;
    }
    targetRodada++;
  }
}
function advanceWinner5(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  if (luta.ordem === 1) {
    const luta5 = chave.lutas.find((l) => l.ordem === 5);
    if (luta5) {
      luta5.atletaAId = winnerId;
      luta5.vencedorId = winnerId;
      luta5.status = "wo";
    }
    const luta6 = chave.lutas.find((l) => l.ordem === 6);
    if (luta6) {
      luta6.atletaBId = winnerId;
    }
  } else if (luta.ordem === 2) {
    const luta4 = chave.lutas.find((l) => l.ordem === 4);
    if (luta4) {
      luta4.atletaAId = winnerId;
    }
  } else if (luta.ordem === 3) {
    const luta4 = chave.lutas.find((l) => l.ordem === 4);
    if (luta4) {
      luta4.atletaBId = winnerId;
    }
  } else if (luta.ordem === 4) {
    const luta6 = chave.lutas.find((l) => l.ordem === 6);
    if (luta6) {
      luta6.atletaAId = winnerId;
    }
  }
}
function advanceWinner6(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const hasLuta4 = chave.lutas.some((l) => l.ordem === 4 && l.rodada === 1);
  if (!hasLuta4) {
    if (luta.ordem === 1) {
      const r2lutas = chave.lutas.filter((l) => l.rodada === 2);
      if (r2lutas[0]) r2lutas[0].atletaAId = winnerId;
    } else if (luta.ordem === 2) {
      const r2lutas = chave.lutas.filter((l) => l.rodada === 2);
      if (r2lutas[0]) r2lutas[0].atletaBId = winnerId;
    } else if (luta.ordem === 3) {
      const r2lutas = chave.lutas.filter((l) => l.rodada === 2);
      if (r2lutas[1]) r2lutas[1].atletaAId = winnerId;
    } else if (luta.rodada === 2) {
      const r3luta = chave.lutas.find((l) => l.rodada === 3);
      const r2lutas = chave.lutas.filter((l) => l.rodada === 2);
      const matchIndex = r2lutas.indexOf(luta);
      if (r3luta && matchIndex === 0) r3luta.atletaAId = winnerId;
      if (r3luta && matchIndex === 1) r3luta.atletaBId = winnerId;
    }
    return;
  }
  if (luta.ordem === 1) {
    const luta5 = chave.lutas.find((l) => l.ordem === 5);
    if (luta5) luta5.atletaBId = winnerId;
  } else if (luta.ordem === 2) ;
  else if (luta.ordem === 3) {
    const luta6 = chave.lutas.find((l) => l.ordem === 6);
    if (luta6) luta6.atletaBId = winnerId;
  } else if (luta.ordem === 4) ;
  else if (luta.ordem === 5) {
    const luta7 = chave.lutas.find((l) => l.ordem === 7);
    if (luta7) luta7.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    const luta7 = chave.lutas.find((l) => l.ordem === 7);
    if (luta7) luta7.atletaBId = winnerId;
  }
}
function advanceWinner9(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l7 = chave.lutas.find((l) => l.ordem === 7);
  const l8 = chave.lutas.find((l) => l.ordem === 8);
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l11 = chave.lutas.find((l) => l.ordem === 11);
  const l12 = chave.lutas.find((l) => l.ordem === 12);
  if (luta.ordem === 1) {
    if (l7) l7.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l7) l7.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l8) l8.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l8) l8.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 8) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 9) {
    if (l11) {
      l11.atletaAId = winnerId;
      l11.vencedorId = winnerId;
      l11.status = "wo";
    }
    if (l12) {
      l12.atletaBId = winnerId;
    }
  } else if (luta.ordem === 10) {
    if (l12) l12.atletaAId = winnerId;
  }
}
function advanceWinner10(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l7 = chave.lutas.find((l) => l.ordem === 7);
  const l8 = chave.lutas.find((l) => l.ordem === 8);
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l11 = chave.lutas.find((l) => l.ordem === 11);
  const l12 = chave.lutas.find((l) => l.ordem === 12);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  if (luta.ordem === 1) {
    if (l7) l7.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l7) l7.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l8) {
      l8.atletaAId = winnerId;
      l8.vencedorId = winnerId;
      l8.status = "wo";
    }
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem === 4) {
    if (l9) {
      l9.atletaAId = winnerId;
      l9.vencedorId = winnerId;
      l9.status = "wo";
    }
    if (l12) l12.atletaAId = winnerId;
  } else if (luta.ordem === 5) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l12) l12.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l13) l13.atletaBId = winnerId;
  }
}
function advanceWinner11(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  const l14 = chave.lutas.find((l) => l.ordem === 14);
  const l15 = chave.lutas.find((l) => l.ordem === 15);
  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem >= 4 && luta.ordem <= 8) ;
  else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}
function advanceWinner12(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  const l14 = chave.lutas.find((l) => l.ordem === 14);
  const l15 = chave.lutas.find((l) => l.ordem === 15);
  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem >= 5 && luta.ordem <= 8) ;
  else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}
function advanceWinner13(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l11 = chave.lutas.find((l) => l.ordem === 11);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  const l14 = chave.lutas.find((l) => l.ordem === 14);
  const l15 = chave.lutas.find((l) => l.ordem === 15);
  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem >= 6 && luta.ordem <= 8) ;
  else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}
function advanceWinner14(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l11 = chave.lutas.find((l) => l.ordem === 11);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  const l14 = chave.lutas.find((l) => l.ordem === 14);
  const l15 = chave.lutas.find((l) => l.ordem === 15);
  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem >= 7 && luta.ordem <= 8) ;
  else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}
function advanceWinner15(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const l9 = chave.lutas.find((l) => l.ordem === 9);
  const l10 = chave.lutas.find((l) => l.ordem === 10);
  const l11 = chave.lutas.find((l) => l.ordem === 11);
  const l12 = chave.lutas.find((l) => l.ordem === 12);
  const l13 = chave.lutas.find((l) => l.ordem === 13);
  const l14 = chave.lutas.find((l) => l.ordem === 14);
  const l15 = chave.lutas.find((l) => l.ordem === 15);
  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    if (l12) l12.atletaAId = winnerId;
  } else if (luta.ordem === 8) ;
  else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}
function advanceWinner16(chave, luta) {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;
  const lutaIndex = chave.lutas.indexOf(luta);
  if (lutaIndex < 0) return;
  if (luta.rodada === 1) {
    const r2Index = 8 + Math.floor(lutaIndex / 2);
    const isFirst = lutaIndex % 2 === 0;
    const r2Luta = chave.lutas[r2Index];
    if (r2Luta) {
      if (isFirst) r2Luta.atletaAId = winnerId;
      else r2Luta.atletaBId = winnerId;
    }
  } else if (luta.rodada === 2) {
    const adjIdx = lutaIndex - 8;
    const r3Index = 12 + Math.floor(adjIdx / 2);
    const isFirst = adjIdx % 2 === 0;
    const r3Luta = chave.lutas[r3Index];
    if (r3Luta) {
      if (isFirst) r3Luta.atletaAId = winnerId;
      else r3Luta.atletaBId = winnerId;
    }
  } else if (luta.rodada === 3) {
    const r4Luta = chave.lutas[14];
    if (r4Luta) {
      const isFirst = lutaIndex - 12 === 0;
      if (isFirst) r4Luta.atletaAId = winnerId;
      else r4Luta.atletaBId = winnerId;
    }
  }
}
function registrarResultadoHandler(torneioId, data) {
  const torneio = loadTorneio$1(torneioId);
  const chaves = [...torneio.chaves ?? []];
  const chaveIndex = chaves.findIndex((c) => c.id === data.chaveId);
  if (chaveIndex < 0) throw new Error("Chave não encontrada");
  const chave = JSON.parse(JSON.stringify(chaves[chaveIndex]));
  const luta = chave.lutas.find((l) => l.id === data.lutaId);
  if (!luta) throw new Error("Luta não encontrada");
  const oldWinnerId = luta.vencedorId;
  if (oldWinnerId && oldWinnerId !== data.vencedorId) {
    clearWinnerFromLaterRounds(chave, luta.rodada, oldWinnerId);
  }
  luta.vencedorId = data.vencedorId;
  luta.status = data.status === "wo" ? "wo" : "completed";
  luta.placarA = data.placarA;
  luta.placarB = data.placarB;
  luta.finalizacao = data.finalizacao ?? false;
  luta.desclassificacao = data.desclassificacao ?? false;
  luta.desempateArbitro = data.desempateArbitro ?? false;
  luta.horarioInicio = data.horarioInicio ?? luta.horarioInicio;
  luta.horarioTermino = data.horarioTermino ?? luta.horarioTermino;
  luta.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (data.desclassificacao && luta.vencedorId) {
    luta.desclassificadoId = luta.atletaAId === luta.vencedorId ? luta.atletaBId : luta.atletaAId;
  } else {
    luta.desclassificadoId = void 0;
  }
  if (chave.totalAtletas === 3) {
    const r2 = chave.lutas.find((l) => l.rodada === 2);
    const r3 = chave.lutas.find((l) => l.rodada === 3);
    if (luta.rodada === 1) {
      const loserId = luta.vencedorId === luta.atletaAId ? luta.atletaBId : luta.atletaAId;
      if (data.desclassificacao) {
        if (r2 && r3) {
          r2.atletaAId = r2.atletaBId;
          r2.vencedorId = r2.atletaBId;
          r2.status = "wo";
          r3.atletaAId = luta.vencedorId;
          r3.atletaBId = r2.atletaBId;
          r3.vencedorId = null;
          r3.status = "pending";
        }
      } else {
        if (r2) {
          r2.atletaAId = loserId;
          r2.vencedorId = null;
          r2.status = "pending";
        }
        if (r3) {
          r3.atletaAId = luta.vencedorId;
          r3.atletaBId = "tbd";
          r3.vencedorId = null;
          r3.status = "pending";
        }
      }
    } else if (luta.rodada === 2) {
      if (r3 && r3.atletaBId === "tbd") {
        r3.atletaBId = luta.vencedorId;
        r3.status = "pending";
      }
    }
  } else if (chave.totalAtletas === 5) {
    advanceWinner5(chave, luta);
  } else if (chave.totalAtletas === 6) {
    advanceWinner6(chave, luta);
  } else if (chave.totalAtletas === 9) {
    advanceWinner9(chave, luta);
  } else if (chave.totalAtletas === 10) {
    advanceWinner10(chave, luta);
  } else if (chave.totalAtletas === 11) {
    advanceWinner11(chave, luta);
  } else if (chave.totalAtletas === 12) {
    advanceWinner12(chave, luta);
  } else if (chave.totalAtletas === 13) {
    advanceWinner13(chave, luta);
  } else if (chave.totalAtletas === 14) {
    advanceWinner14(chave, luta);
  } else if (chave.totalAtletas === 15) {
    advanceWinner15(chave, luta);
  } else if (chave.totalAtletas === 16) {
    advanceWinner16(chave, luta);
  } else {
    advanceWinnerInChave(chave, luta);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const l of chave.lutas) {
    l.updatedAt = now;
  }
  chave.updatedAt = now;
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = now;
  saveTorneio$1(torneio);
  return chave;
}
function registerBracketHandlers() {
  ipcMain.handle("gerar-todas-chaves", (_event, maxPorChave) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const max = maxPorChave && maxPorChave >= 2 && maxPorChave <= 16 ? maxPorChave : 16;
    return gerarTodasChavesHandler(torneioId, max);
  });
  ipcMain.handle("gerar-chave", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const torneio = loadTorneio$1(torneioId);
    const atletas = (torneio.atletas ?? []).filter((a) => a.deletedAt == null && a.categoria === data.categoriaId);
    if (atletas.length < 2 || atletas.length > 16) {
      throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
    }
    const chaves = torneio.chaves ?? [];
    if (chaves.some((c) => c.categoriaId === data.categoriaId)) {
      throw new Error("Chave já existe para esta categoria.");
    }
    const chave = gerarChave(data.categoriaId, atletas);
    torneio.chaves = [...chaves, chave];
    for (const a of torneio.atletas ?? []) {
      if (chave.posicoesAtletas.includes(a.id)) {
        a.emChave = true;
      }
    }
    torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveTorneio$1(torneio);
    return chave;
  });
  ipcMain.handle("load-chaves", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const chaves = (loadTorneio$1(torneioId).chaves ?? []).map((c) => normalizeChave(c));
    return chaves;
  });
  ipcMain.handle("load-chave-por-categoria", (_event, categoriaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const chaves = (loadTorneio$1(torneioId).chaves ?? []).map((c) => normalizeChave(c));
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
  ipcMain.handle("load-chaves-por-area", (_event, areaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadChavesPorAreaHandler(torneioId, areaId);
  });
  ipcMain.handle("registrar-resultado", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return registrarResultadoHandler(torneioId, data);
  });
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
function normalizeLutaCasada(raw) {
  const status = raw.status ?? "pending";
  return {
    id: raw.id,
    areaId: raw.areaId,
    arbitroId: raw.arbitroId ?? null,
    atletaAId: raw.atletaAId,
    atletaBId: raw.atletaBId,
    atletaASnapshot: raw.atletaASnapshot,
    atletaBSnapshot: raw.atletaBSnapshot,
    tag: "luta-casada",
    status,
    placarA: raw.placarA,
    placarB: raw.placarB,
    vencedorId: raw.vencedorId ?? null,
    finalizacao: raw.finalizacao ?? false,
    desclassificacao: raw.desclassificacao ?? false,
    desempateArbitro: raw.desempateArbitro ?? false,
    dataFinalizacao: raw.dataFinalizacao ?? null,
    horarioInicio: raw.horarioInicio ?? void 0,
    deletedAt: raw.deletedAt ?? null,
    createdAt: raw.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: raw.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function loadAllLutasCasadas(torneioId) {
  const torneio = loadTorneio(torneioId);
  return (torneio.lutasCasadas ?? []).map((l) => normalizeLutaCasada(l));
}
function loadLutasCasadas(torneioId) {
  return loadAllLutasCasadas(torneioId).filter((l) => l.deletedAt == null);
}
function loadDeletedLutasCasadas(torneioId) {
  return loadAllLutasCasadas(torneioId).filter((l) => l.deletedAt != null);
}
function loadLutasCasadasPorArea(torneioId, areaId) {
  return loadLutasCasadas(torneioId).filter((l) => l.areaId === areaId);
}
function saveLutaCasada(torneioId, data) {
  if (data.atletaAId === data.atletaBId) {
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  }
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const luta = {
    id: crypto.randomUUID(),
    areaId: data.areaId,
    arbitroId: data.arbitroId,
    atletaAId: data.atletaAId,
    atletaBId: data.atletaBId,
    atletaASnapshot: data.atletaASnapshot,
    atletaBSnapshot: data.atletaBSnapshot,
    tag: "luta-casada",
    status: data.status ?? "pending",
    placarA: data.placarA,
    placarB: data.placarB,
    vencedorId: data.vencedorId ?? null,
    finalizacao: data.finalizacao ?? false,
    desclassificacao: data.desclassificacao ?? false,
    desempateArbitro: data.desempateArbitro ?? false,
    dataFinalizacao: data.dataFinalizacao ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  };
  list.push(luta);
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
  return luta;
}
function updateLutaCasada(torneioId, data) {
  if (data.atletaAId === data.atletaBId) {
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  }
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const index = list.findIndex((l) => l.id === data.id);
  if (index === -1) throw new Error("Luta casada não encontrada");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updated = {
    ...data,
    tag: "luta-casada",
    updatedAt: now
  };
  list[index] = updated;
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
  return updated;
}
function deleteLutaCasada(torneioId, lutaCasadaId) {
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const index = list.findIndex((l) => l.id === lutaCasadaId);
  if (index === -1) throw new Error("Luta casada não encontrada");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  list[index].deletedAt = now;
  list[index].updatedAt = now;
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
}
function deleteLutasCasadas(torneioId, ids) {
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const item of list) {
    if (ids.includes(item.id)) {
      item.deletedAt = now;
      item.updatedAt = now;
    }
  }
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
}
function permanentlyDeleteLutaCasada(torneioId, lutaCasadaId) {
  const torneio = loadTorneio(torneioId);
  torneio.lutasCasadas = (torneio.lutasCasadas ?? []).filter((l) => l.id !== lutaCasadaId);
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
}
function permanentlyDeleteLutasCasadas(torneioId, ids) {
  const torneio = loadTorneio(torneioId);
  torneio.lutasCasadas = (torneio.lutasCasadas ?? []).filter((l) => !ids.includes(l.id));
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
}
function restoreLutaCasada(torneioId, lutaCasadaId) {
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const index = list.findIndex((l) => l.id === lutaCasadaId);
  if (index === -1) throw new Error("Luta casada não encontrada");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  list[index].deletedAt = null;
  list[index].updatedAt = now;
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
}
function restoreLutasCasadas(torneioId, ids) {
  const torneio = loadTorneio(torneioId);
  const list = loadAllLutasCasadas(torneioId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const item of list) {
    if (ids.includes(item.id)) {
      item.deletedAt = null;
      item.updatedAt = now;
    }
  }
  torneio.lutasCasadas = list;
  torneio.updatedAt = now;
  saveTorneio(torneio);
}
const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || "f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4";
const ACTIVATION_FILE = "activation.json";
const EXPIRATION_YEARS = 1;
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
function isExpired(expiresAt) {
  if (!expiresAt) return true;
  return /* @__PURE__ */ new Date() > new Date(expiresAt);
}
function computeDaysRemaining(expiresAt) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 864e5));
}
function checkActivation() {
  try {
    const filePath = getActivationPath();
    if (!fs.existsSync(filePath)) return false;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (isExpired(data.expiresAt)) return false;
    const machineId = getMachineId();
    const expectedToken = crypto.createHmac("sha256", MASTER_PASSWORD_HASH).update(machineId).digest("hex");
    return data.token === expectedToken;
  } catch {
    return false;
  }
}
function getActivationInfo() {
  try {
    const filePath = getActivationPath();
    if (!fs.existsSync(filePath)) {
      return { activated: false, activatedAt: null, expiresAt: null, daysRemaining: null };
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const expired = isExpired(data.expiresAt);
    if (expired) {
      return {
        activated: false,
        activatedAt: data.activatedAt ?? null,
        expiresAt: data.expiresAt ?? null,
        daysRemaining: 0
      };
    }
    return {
      activated: true,
      activatedAt: data.activatedAt ?? null,
      expiresAt: data.expiresAt,
      daysRemaining: computeDaysRemaining(data.expiresAt)
    };
  } catch {
    return { activated: false, activatedAt: null, expiresAt: null, daysRemaining: null };
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
    const activatedAt = /* @__PURE__ */ new Date();
    const expiresAt = new Date(activatedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + EXPIRATION_YEARS);
    const filePath = getActivationPath();
    fs.writeFileSync(
      filePath,
      JSON.stringify({ token, activatedAt: activatedAt.toISOString(), expiresAt: expiresAt.toISOString() }, null, 2),
      "utf-8"
    );
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
  ipcMain.handle("restore-athlete", (_event, id) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return restoreAthlete(torneioId, id);
  });
  ipcMain.handle("load-deleted-athletes", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadDeletedAthletes(torneioId);
  });
  ipcMain.handle("permanently-delete-athlete", (_event, id) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteAthlete(torneioId, id);
  });
  ipcMain.handle("permanently-delete-athletes", (_event, ids) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteAthletes(torneioId, ids);
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
  ipcMain.handle("restore-arbitro", (_event, arbitroId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return restoreArbitro(torneioId, arbitroId);
  });
  ipcMain.handle("load-deleted-arbitros", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadDeletedArbitros(torneioId);
  });
  ipcMain.handle("permanently-delete-arbitro", (_event, arbitroId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteArbitro(torneioId, arbitroId);
  });
  ipcMain.handle("permanently-delete-arbitros", (_event, arbitroIds) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteArbitros(torneioId, arbitroIds);
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
function registerAreaHandlers() {
  ipcMain.handle("load-areas", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadAreas(torneioId);
  });
  ipcMain.handle("save-area", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return saveArea(torneioId, data);
  });
  ipcMain.handle("update-area", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return updateArea(torneioId, data);
  });
  ipcMain.handle("delete-area", (_event, areaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteArea(torneioId, areaId);
  });
  ipcMain.handle("delete-areas", (_event, areaIds) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteAreas(torneioId, areaIds);
  });
  ipcMain.handle("restore-area", (_event, areaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return restoreArea(torneioId, areaId);
  });
  ipcMain.handle("load-deleted-areas", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadDeletedAreas(torneioId);
  });
  ipcMain.handle("permanently-delete-area", (_event, areaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteArea(torneioId, areaId);
  });
  ipcMain.handle("permanently-delete-areas", (_event, areaIds) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteAreas(torneioId, areaIds);
  });
  ipcMain.handle("import-areas", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    const filePath = await openAreaFileDialog();
    if (!filePath) return { imported: 0, skipped: 0 };
    return importAreasFromFile(torneioId, filePath);
  });
  ipcMain.handle("export-areas", async () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return exportAreas(torneioId);
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
  ipcMain.handle("get-activation-info", () => {
    return getActivationInfo();
  });
}
function registerLutasCasadasHandlers() {
  ipcMain.handle("load-lutas-casadas", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadLutasCasadas(torneioId);
  });
  ipcMain.handle("load-deleted-lutas-casadas", () => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadDeletedLutasCasadas(torneioId);
  });
  ipcMain.handle("load-lutas-casadas-por-area", (_event, areaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return loadLutasCasadasPorArea(torneioId, areaId);
  });
  ipcMain.handle("save-luta-casada", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return saveLutaCasada(torneioId, data);
  });
  ipcMain.handle("update-luta-casada", (_event, data) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return updateLutaCasada(torneioId, data);
  });
  ipcMain.handle("delete-luta-casada", (_event, lutaCasadaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteLutaCasada(torneioId, lutaCasadaId);
  });
  ipcMain.handle("delete-lutas-casadas", (_event, ids) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return deleteLutasCasadas(torneioId, ids);
  });
  ipcMain.handle("permanently-delete-luta-casada", (_event, lutaCasadaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteLutaCasada(torneioId, lutaCasadaId);
  });
  ipcMain.handle("permanently-delete-lutas-casadas", (_event, ids) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return permanentlyDeleteLutasCasadas(torneioId, ids);
  });
  ipcMain.handle("restore-luta-casada", (_event, lutaCasadaId) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return restoreLutaCasada(torneioId, lutaCasadaId);
  });
  ipcMain.handle("restore-lutas-casadas", (_event, ids) => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error("Nenhum torneio ativo");
    return restoreLutasCasadas(torneioId, ids);
  });
}
app.whenReady().then(() => {
  registerTournamentHandlers();
  registerAthleteHandlers();
  registerRefereeHandlers();
  registerBracketHandlers();
  registerAreaHandlers();
  registerLutasCasadasHandlers();
  registerActivationHandlers();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
