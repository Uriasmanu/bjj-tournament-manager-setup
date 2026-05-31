"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  createTournament: (data) => electron.ipcRenderer.invoke("create-tournament", data),
  listTournaments: () => electron.ipcRenderer.invoke("list-tournaments"),
  startTournament: (id) => electron.ipcRenderer.invoke("start-tournament", id),
  exportTournament: (id) => electron.ipcRenderer.invoke("export-tournament", id),
  importTournament: (data) => electron.ipcRenderer.invoke("import-tournament", data),
  importTournamentOverwrite: (data) => electron.ipcRenderer.invoke("import-tournament-overwrite", data),
  getActiveTournament: () => electron.ipcRenderer.invoke("get-active-tournament"),
  updateTournament: (data) => electron.ipcRenderer.invoke("update-tournament", data),
  deleteTournament: (id) => electron.ipcRenderer.invoke("delete-tournament", id),
  readFile: (path) => electron.ipcRenderer.invoke("read-file", path)
});
