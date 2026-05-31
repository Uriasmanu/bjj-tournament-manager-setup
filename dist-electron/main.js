import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
const DATA_DIR = path.join(app.getPath("userData"), "data");
const TORNEIOS_DIR = path.join(DATA_DIR, "torneios");
const ATIVO_FILE = path.join(DATA_DIR, "torneio-ativo.json");
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
  ipcMain.handle("read-file", async (_event, filePath) => {
    return fs.readFileSync(filePath, "utf-8");
  });
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
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
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
app.whenReady().then(() => {
  registerTournamentHandlers();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
