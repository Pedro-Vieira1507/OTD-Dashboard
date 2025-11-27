// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "Index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ===============================
// 🔄 Sistema de Atualização Automática
// ===============================

// Mostrar erros no diálogo
autoUpdater.on("error", (err) => {
  dialog.showErrorBox("Erro ao procurar atualizações", err == null ? "Erro desconhecido" : err.toString());
});

// Aviso quando houver update disponível
autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    type: "info",
    buttons: ["Ok"],
    title: "Atualização disponível",
    message: "Uma nova versão do Dashboard está disponível. O download começará automaticamente.",
  });
});

// Aviso quando o update estiver baixado
autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    type: "question",
    buttons: ["Instalar agora", "Depois"],
    defaultId: 0,
    title: "Atualização pronta",
    message: "A nova versão foi baixada. Deseja instalar agora?",
  }).then((res) => {
    if (res.response === 0) autoUpdater.quitAndInstall();
  });
});

// Apenas iniciar update quando o app estiver pronto
app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

// ===============================
// 📁 Armazenamento local
// ===============================
const userDataDir = app.getPath("userData");
const dataFile = path.join(userDataDir, "dashboard_data.json");

ipcMain.handle("save-data", async (_, payload) => {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(payload, null, 2), "utf-8");
    return { ok: true, path: dataFile };
  } catch (err) {
    console.error("Erro ao salvar dados:", err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("load-data", async () => {
  try {
    if (!fs.existsSync(dataFile)) return { ok: true, data: null };
    const raw = fs.readFileSync(dataFile, "utf-8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    return { ok: false, error: err.message };
  }
});

// Fechar no Windows quando todas as janelas se fecharem
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
