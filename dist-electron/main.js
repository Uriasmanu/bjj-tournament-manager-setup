import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
const DATA_DIR$1 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR$1 = path.join(DATA_DIR$1, "torneios");
const ATIVO_FILE = path.join(DATA_DIR$1, "torneio-ativo.json");
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR$1)) fs.mkdirSync(DATA_DIR$1, { recursive: true });
  if (!fs.existsSync(TORNEIOS_DIR$1)) fs.mkdirSync(TORNEIOS_DIR$1, { recursive: true });
}
function getTorneioPath$1(id) {
  return path.join(TORNEIOS_DIR$1, `${id}.json`);
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
    fs.writeFileSync(getTorneioPath$1(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
    return torneio;
  });
  ipcMain.handle("list-tournaments", () => {
    ensureDirs();
    const files = fs.readdirSync(TORNEIOS_DIR$1).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const content = fs.readFileSync(path.join(TORNEIOS_DIR$1, f), "utf-8");
      return JSON.parse(content);
    });
  });
  ipcMain.handle("start-tournament", (_event, id) => {
    ensureDirs();
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id }), "utf-8");
    const filePath = getTorneioPath$1(id);
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
    const filePath = getTorneioPath$1(id);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });
  ipcMain.handle("export-tournament", async (_event, id) => {
    ensureDirs();
    const sourcePath = getTorneioPath$1(id);
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
    if (!data.id || !data.data) {
      throw new Error("Estrutura inválida");
    }
    const dest = getTorneioPath$1(data.id);
    if (fs.existsSync(dest)) {
      return { success: false, exists: true };
    }
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  });
  ipcMain.handle("import-tournament-overwrite", (_event, data) => {
    ensureDirs();
    const dest = getTorneioPath$1(data.id);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf-8");
  });
  ipcMain.handle("update-tournament", (_event, data) => {
    ensureDirs();
    const filePath = getTorneioPath$1(data.id);
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
    const filePath = getTorneioPath$1(id);
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
const KIDS_WEIGHT_FACTOR = {
  "pre-mirim": 0.3,
  "mirim": 0.4,
  "infantil-a": 0.5,
  "infantil-b": 0.6,
  "infanto-juvenil-a": 0.7,
  "infanto-juvenil-b": 0.85
};
function arredondar(valor) {
  if (valor === null) return null;
  return Math.round(valor * 10) / 10;
}
function getPesoLimite(faixaEtaria, genero, cat) {
  const base = genero === "masculino" ? cat.masculino : cat.feminino;
  const factor = KIDS_WEIGHT_FACTOR[faixaEtaria];
  if (factor !== void 0) {
    if (cat.peso === "pesadissimo") return null;
    if (cat.peso === "super-pesado" && base === null) return null;
    return base !== null ? arredondar(base * factor) : null;
  }
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
function loadAthletes(torneioId) {
  const torneio = loadTorneio(torneioId);
  return torneio.atletas ?? [];
}
function saveAthlete(torneioId, athlete) {
  const torneio = loadTorneio(torneioId);
  const list = torneio.atletas ?? [];
  list.push(athlete);
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return list;
}
function updateAthlete(torneioId, updated) {
  const torneio = loadTorneio(torneioId);
  const list = torneio.atletas ?? [];
  const index = list.findIndex((a) => a.id === updated.id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list[index] = updated;
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
  return list;
}
function deleteAthlete(torneioId, id) {
  const torneio = loadTorneio(torneioId);
  let list = torneio.atletas ?? [];
  list = list.filter((a) => a.id !== id);
  torneio.atletas = list;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
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
  const torneio = loadTorneio(torneioId);
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
        createdAt: a.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: a.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      });
      imported++;
    } else {
      skipped++;
    }
  }
  torneio.atletas = current;
  torneio.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTorneio(torneio);
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
  registerActivationHandlers();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
