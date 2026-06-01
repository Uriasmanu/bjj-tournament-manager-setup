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
  readFile: (path) => electron.ipcRenderer.invoke("read-file", path),
  loadAthletes: () => electron.ipcRenderer.invoke("load-athletes"),
  saveAthlete: (athlete) => electron.ipcRenderer.invoke("save-athlete", athlete),
  updateAthlete: (athlete) => electron.ipcRenderer.invoke("update-athlete", athlete),
  deleteAthlete: (id) => electron.ipcRenderer.invoke("delete-athlete", id),
  importAthletes: () => electron.ipcRenderer.invoke("import-athletes"),
  exportAthletes: () => electron.ipcRenderer.invoke("export-athletes")
});
electron.contextBridge.exposeInMainWorld("activation", {
  check: () => electron.ipcRenderer.invoke("check-activation"),
  validate: (password) => electron.ipcRenderer.invoke("validate-password", password),
  activate: () => electron.ipcRenderer.invoke("activate-license")
});
