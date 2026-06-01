import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
const DATA_DIR$1 = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR = path.join(DATA_DIR$1, "torneios");
const ATIVO_FILE = path.join(DATA_DIR$1, "torneio-ativo.json");
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR$1)) fs.mkdirSync(DATA_DIR$1, { recursive: true });
  if (!fs.existsSync(TORNEIOS_DIR)) fs.mkdirSync(TORNEIOS_DIR, { recursive: true });
}
function getTorneioPath(id) {
  return path.join(TORNEIOS_DIR, `${id}.json`);
}
function registerTournamentHandlers() {
  ipcMain.handle("create-tournament", (_event, data) => {
    ensureDirs();
    const torneio = {
      id: crypto.randomUUID(),
      nome: data.nome,
      data: data.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), "utf-8");
    return torneio;
  });
  ipcMain.handle("list-tournaments", () => {
    ensureDirs();
    const files = fs.readdirSync(TORNEIOS_DIR).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const content = fs.readFileSync(path.join(TORNEIOS_DIR, f), "utf-8");
      return JSON.parse(content);
    });
  });
  ipcMain.handle("start-tournament", (_event, id) => {
    ensureDirs();
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id }), "utf-8");
    const filePath = getTorneioPath(id);
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
    if (!fs.existsSync(ATIVO_FILE)) return null;
    try {
      const { id } = JSON.parse(fs.readFileSync(ATIVO_FILE, "utf-8"));
      const filePath = getTorneioPath(id);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return null;
    }
  });
  ipcMain.handle("export-tournament", async (_event, id) => {
    ensureDirs();
    const sourcePath = getTorneioPath(id);
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
    const dest = getTorneioPath(data.id);
    if (fs.existsSync(dest)) {
      return { success: false, exists: true };
    }
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  });
  ipcMain.handle("import-tournament-overwrite", (_event, data) => {
    ensureDirs();
    const dest = getTorneioPath(data.id);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf-8");
  });
  ipcMain.handle("update-tournament", (_event, data) => {
    ensureDirs();
    const filePath = getTorneioPath(data.id);
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
    const filePath = getTorneioPath(id);
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
const DATA_DIR = path.join(app.getPath("userData"), "data");
const FILE = path.join(DATA_DIR, "atletas.json");
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function loadAthletes() {
  ensureDataDir();
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}
function saveAthlete(athlete) {
  const list = loadAthletes();
  list.push(athlete);
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
  return list;
}
function updateAthlete(updated) {
  const list = loadAthletes();
  const index = list.findIndex((a) => a.id === updated.id);
  if (index === -1) throw new Error("Atleta não encontrado");
  list[index] = updated;
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
  return list;
}
function deleteAthlete(id) {
  let list = loadAthletes();
  list = list.filter((a) => a.id !== id);
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
  return list;
}
function importAthletesFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const incoming = JSON.parse(raw);
  if (!Array.isArray(incoming)) {
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  }
  for (const a of incoming) {
    if (!a.id || !a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || "sem nome"}" — campos obrigatórios ausentes.`);
    }
  }
  const current = loadAthletes();
  let imported = 0;
  let skipped = 0;
  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase();
    const equipeLower = a.equipe.trim().toLowerCase();
    const exists = current.some(
      (ex) => ex.id === a.id || ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento
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
  fs.writeFileSync(FILE, JSON.stringify(current, null, 2), "utf-8");
  return { imported, skipped };
}
async function openAthleteFileDialog() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
async function exportAthletes() {
  const list = loadAthletes();
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
    return loadAthletes();
  });
  ipcMain.handle("save-athlete", (_event, athlete) => {
    return saveAthlete(athlete);
  });
  ipcMain.handle("update-athlete", (_event, athlete) => {
    return updateAthlete(athlete);
  });
  ipcMain.handle("delete-athlete", (_event, id) => {
    return deleteAthlete(id);
  });
  ipcMain.handle("import-athletes", async () => {
    const filePath = await openAthleteFileDialog();
    if (!filePath) return { imported: 0, skipped: 0 };
    return importAthletesFromFile(filePath);
  });
  ipcMain.handle("export-athletes", async () => {
    return exportAthletes();
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
