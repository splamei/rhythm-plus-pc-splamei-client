/*  Copyright 2026 Splamei
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const { app, BrowserWindow, Menu, session, dialog, shell, ipcMain, clipboard } = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("path");
const fs = require("fs");
const log = require('electron-log/main');
const { permission } = require("process");
const { Client } = require('@xhayper/discord-rpc');

// -- Instance lock --

const singleAppLock = app.requestSingleInstanceLock();
if (!singleAppLock)
{
    app.quit();
    return;
}
else
{
    app.on("second-instance", () => {
        if (mainWindow)
        {
            if (mainWindow.isMinimized())
            {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    })
}

// -- Logging --

const logFileLocation = path.join(app.getPath("userData"), "Logs", "App.log");

log.transports.file.resolvePathFn = () => {
  return logFileLocation;
};

Object.assign(console, log.functions);
log.transports.file.level = "debug";
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";

console.log(`Saving logs too '${logFileLocation}'!`)

// -- Exception manager --

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception has occured! -", error);
    dialog.showErrorBox("Something went wrong", "An unhandled rejection has occured. Because of this, the client cannot continue.\n\nPlease contact us for support or report an issue on GitHub!");
    process.exit(2);
});
process.on("unhandledRejection", (reason) => {
    console.error("Uncaught rejection has occured! -", reason);
    dialog.showErrorBox("Something went wrong", "An unhandled rejection has occured. Because of this, the client cannot continue.\n\nPlease contact us for support or report an issue on GitHub!");
    process.exit(2);
});

// -- Arg setup --

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization');

// -- Variable setup --

const userDataPath = app.getPath('userData');
console.log(`Using app data '${userDataPath}'`);

const dataPathLocation = path.join(userDataPath, "Browser", "Data");
const cachePathLocation = path.join(userDataPath, "Browser", "Cache");
const extensionPathLocation = path.join(userDataPath, "Extensions");
const settingsPathLocation = path.join(userDataPath, 'settings.json');

const clientUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RhythmPlus-SplameiClient/1000 (KHTML, like Gecko) Chrome/150.0.0.0";

let wasGamePage = false;
let currentUrl = "";

// -- Settings stuff --

const defaultSettings = {
    v2Mode: false,
    showMenu: "alwaysExceptGame",
    discordRpc: true,
    discordRpcDetails: true
};

let settingsWindow = null;

function loadSettings()
{
    try
    {
        if (fs.existsSync(settingsPathLocation))
        {
            const data = fs.readFileSync(settingsPathLocation, "utf8");
            const storedSettings = JSON.parse(data);
            return { ...defaultSettings, ...storedSettings };
        }
    }
    catch (ex)
    {
        console.error("Failed to read the settings file! - ", ex);
    }

    return defaultSettings;
}

function saveSettings(settings)
{
    try
    {
        fs.writeFileSync(settingsPathLocation, JSON.stringify(settings, null, 4), "utf8");
        return true;
    }
    catch (ex)
    {
        console.error("Error saving the settings file! -", ex);
        return false
    }
}

function showSettings(parentWindow)
{
    if (settingsWindow)
    {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 400,
        height: 600,
        title: 'Settings',
        parent: parentWindow,
        modal: true,
        resizable: false,
        autoHideMenuBar: true,
        fullscreenable: false,
        icon: path.join(__dirname, "assets/icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            backgroundThrottling: false,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            devTools: !app.isPackaged
        }
    });

    settingsWindow.removeMenu();

    settingsWindow.loadFile("settings.html");

    settingsWindow.on("closed", () => {
        settingsWindow = null;
    });
}

ipcMain.handle("get-settings", () => loadSettings());
ipcMain.handle("save-settings", (event, newSettings) => saveSettings(newSettings));

let settings = loadSettings();

// -- Discord RPC setup --

const discord = new Client({
  clientId: "1331684607199936552"
});

let isRpcReadyActive = false;
let startTime = Date.now();

discord.on("ready", () => {
    console.log("Discord RPC is connected and ready for action!");
    isRpcReadyActive = true;
    setRpc("", "");

    if (settings.discordRpcDetails)
    {
        startRpcDetailsLook();
    }
});

function startRpcDetailsLook()
{
    setInterval(async () => {
        if (!mainWindow || mainWindow.isDestroyed() || !currentUrl) { return; }

        if (currentUrl.includes("/game/"))
        {
            await makeRpcDomRequest();
        }
    }, 3000);
}

async function makeRpcDomRequest()
{
    if (!mainWindow || mainWindow.isDestroyed() || !currentUrl) { return; }

    if (!settings.discordRpcDetails) { return; }

    try
    {
        const url = currentUrl;
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        let command = "";
        if (hostname === "rhythm-plus.com")
        {
            command = `
                (() => {
                let selectedSongName = document.querySelector("div.detail.py-5 > div:nth-child(1)")?.innerText
                let selectedSongAuthor = "";
                let selectedSongCharter= "";
                let selectedSongImage= "";

                if (selectedSongName)
                {
                    selectedSongAuthor = document.querySelector("div.detail.py-5 > div:nth-child(2)")?.innerText;
                    selectedSongCharter = document.querySelector("div.pt-2.text-xs.text-white.text-opacity-25 > span:nth-child(3) > span")?.innerText;
                    if (!songCharter)
                    {
                        selectedSongCharter = document.querySelector("div.pt-2.text-xs.text-white.text-opacity-25 > span > span")?.innerText;
                    }
                    selectedSongImage = document.querySelector("div.detail > div > div > div.image > img").src || "";
                }

                let resultRankObj = document.querySelector(".score")?.innerText;
                let resultAccuracyObj = "";
                let resultScoreObj = "";
                let resultMaxComboObj = "";
                let resultFcObj = "";

                if (resultRankObj)
                {
                    resultAccuracyObj = document.querySelector("div:nth-child(3) > span")?.innerText;
                    resultScoreObj = document.querySelector("div.rightScore.flex-grow > div:nth-child(1) > span")?.innerText;
                    resultMaxComboObj = document.querySelector("div.rightScore.flex-grow > div:nth-child(2) > span")?.innerText;
                    resultFcObj = document.querySelector("div.rightScore.flex-grow > div:nth-child(2) > div")?.innerText;
                }

                let currentAccuracyObj = document.querySelector(".score span")?.innerText;
                let currentScoreObj = "";
                let progressElem = "";
                let currentTimeObj = "0%";

                if (currentAccuracyObj)
                {
                    currentScoreObj = document.querySelector(".score > span")?.innerText;
                    progressElem = document.querySelector(".top-progress");

                    if (progressElem)
                    {
                        currentTimeObj = progressElem.style.width || getComputedStyle(progressElem).width;
                    }
                }

                let isAutoPlay = false;

                return {
                    title: document.title,
                    url: window.location.href,

                    selectedSongName: selectedSongName || "",
                    selectedSongAuthor: selectedSongAuthor || "",
                    selectedSongCharter: selectedSongCharter || "",
                    selectedSongImage: selectedSongImage || "",

                    resultRank: resultRankObj || "",
                    resultAccuracy: resultAccuracyObj,
                    resultScore: resultScoreObj || "",
                    resultMaxCombo: resultMaxComboObj || "",
                    resultFC: resultFcObj || "",

                    currentAccuracy: currentAccuracyObj || "",
                    currentScore: currentScoreObj || "",
                    currentTime: currentTimeObj,

                    isAutoPlay: isAutoPlay
                };
                })()
            `;
        }
        else if (hostname === "v2.rhythm-plus.com")
        {
            command = `
                (() => {
                const selectedSongName = document.querySelector("div.flex-1 > div.mt-10 > div")?.innerText
                let selectedSongAuthor = "";
                let selectedSongCharter = "";
                let selectedSongImage = "";

                if (selectedSongName)
                {
                    selectedSongAuthor = document.querySelector("div.flex-1.self-end > div.mt-10 > div.opacity-60")?.innerText;
                    selectedSongCharter = document.querySelector("a > div > div > div.text-sm.leading-5 > div > div")?.innerText;
                    selectedSongImage = document.querySelector("div.absolute.w-full.top-0.flex.z-10.pointer-events-none.rounded-t-lg.overflow-hidden > img").src || "";
                }

                const resultRankObj = document.querySelector(".score")?.innerText;
                let resultAccuracyObj = "";
                let resultScoreObj = "";
                let resultMaxComboObj = "";
                let resultFcObj = "";

                if (resultRankObj)
                {
                    resultAccuracyObj = document.querySelector("div.percentage-display > div")?.innerText;
                    resultScoreObj = document.querySelector("div.score-title > div")?.innerText;
                    resultMaxComboObj = document.querySelector("div.combo-container > div > div")?.innerText;
                    resultFcObj = document.querySelector("div.combo-container > div.mark-chip.achievement-chip.combo-chip")?.innerText;
                }

                const currentAccuracyObj = document.querySelector(".score-values > div:nth-child(1)")?.innerText;
                let currentScoreObj = "";
                let progressElem = "";
                let currentTimeObj = "0%";

                if (currentAccuracyObj)
                {
                    currentScoreObj = document.querySelector(".score-values > div.text-5xl")?.innerText;
                    progressElem = document.querySelector(".top-progress");

                    if (progressElem)
                    {
                        currentTimeObj = progressElem.style.width || getComputedStyle(progressElem).width;
                    }
                }

                const isAutoPlay = !!document.querySelector("div.score > div > span")?.innerText;

                return {
                    title: document.title,
                    url: window.location.href,

                    selectedSongName: selectedSongName || "",
                    selectedSongAuthor: selectedSongAuthor || "",
                    selectedSongCharter: selectedSongCharter || "",
                    selectedSongImage: selectedSongImage || "",

                    resultRank: resultRankObj || "",
                    resultAccuracy: resultAccuracyObj,
                    resultScore: resultScoreObj || "",
                    resultMaxCombo: resultMaxComboObj || "",
                    resultFC: resultFcObj || "",

                    currentAccuracy: currentAccuracyObj || "",
                    currentScore: currentScoreObj || "",
                    currentTime: currentTimeObj,

                    isAutoPlay: isAutoPlay
                };
                })()
            `;
        }

        console.log("Making a DOM rwquest");

        let domResult = await mainWindow.webContents.executeJavaScript(command);
        if (!domResult)
        {
            console.warn("Unable to set RPC details as the DOM is empty!");
        }
        else
        {
            parseRpcDomResult(domResult);
        }
    }
    catch (ex)
    {
        console.error("Failed to set RPC details! -", ex);
    }
}

let selectedSongName = "";
let selectedSongAuthor = "";
let selectedSongCharter = "";
function parseRpcDomResult(result)
{
    console.log("Now parsing the DOM request");

    if (!result) { return; }

    let details = "Playing Rhythm Plus";
    const uri = currentUrl;

    const selectedSongNameDom = result.selectedSongName;
    const selectedSongAuthorDom = result.selectedSongAuthor;
    const selectedSongCharterDom = result.selectedSongCharter;
    const selectedSongTitle = result.selectedSongTitle;
    const selectedSongImage = result.selectedSongImage;
    const resultRank = result.resultRank;
    const resultScore = result.resultScore;
    const resultMaxCombo = result.resultMaxCombo;
    const resultFC = result.resultFC;
    const resultAccuracy = result.resultAccuracy;
    const currentAccuracy = result.currentAccuracy;
    const currentScore = result.currentScore;
    let currentTime = result.currentTime;
    const isAutoPlay = result.isAutoPlay;

    let state = "";
    let rank = "";

    if (selectedSongAuthorDom && selectedSongAuthorDom !== "")
    {
        selectedSongAuthor = selectedSongAuthorDom;
        selectedSongCharter = selectedSongCharterDom;
        selectedSongName = selectedSongNameDom;
    }

    if (uri === "https://rhythm-plus.com/" || uri === "https://v2.rhythm-plus.com/")
    {
        details = "Looking at the menu";
    }
    else if (uri.includes("rhythm-plus.com/menu"))
    {
        details = "Looking at songs";
    }
    else if (uri.includes("rhythm-plus.com/studio") || uri.includes("rhythm-plus.com/editor"))
    {
        details = "Creating a chart";
    }
    else if (uri.includes("rhythm-plus.com/account"))
    {
        details = "Changing settings";
    }
    else if (uri.includes("rhythm-plus.com/tutorial"))
    {
        details = "Playing the tutorial";
    }
    else if (uri.includes("rhythm-plus.com/result"))
    {
        details = "Finished a chart";

        if (resultScore != "" && resultScore)
        {
            if (resultFC === "Full Combo")
            {
                state = ` - [FC] - Score: ${resultScore} - Acc: ${resultAccuracy}% - Rank: ${resultRank} - Max Combo: ${resultMaxCombo}`;
            }
            else
            {
                state = ` - Score: ${resultScore} - Acc: ${resultAccuracy}% - Rank: ${resultRank} - Max Combo: ${resultMaxCombo}`;
            }
        }
    }
    else if (uri.includes("rhythm-plus.com/game-over"))
    {
        details = "Failed a chart";
    }
    else if (uri.includes("rhythm-plus.com/game"))
    {
        let songName = currentTitle.split(" - Rhythm+ Music")[0].split(" - Rhythm Plus Music")[0];
        if (songName === "Game")
        {
            details = "Loading a song";
        }
        else
        {
            details = `Playing '${selectedSongName} -by- ${selectedSongAuthor} [${selectedSongCharter}]'`;
        }

        currentTime = currentTime.split(".")[0];
        console.log(`Current Score: ${currentScore} | Current Acc: ${currentAccuracy}% | Current Time: ${currentTime}%`)

        if (currentScore && currentScore !== "" && !isAutoPlay)
        {
            state = ` - Score: ${currentScore} - Acc: ${currentAccuracy} - Point: ${currentTime}%`;
        }
        else if (isAutoPlay)
        {
            state = ` - [AUTOPLAY] - Score: ${currentScore}`;
        }
    }

    setRpc(details, state);
}

function setRpc(details, state)
{
    if (isRpcReadyActive)
    {
        discord.user?.setActivity({
            details: details,
            state: state,
            startTimestamp: startTime,

            largeImageKey: "logo",
            largeImageText: "Rhythm Plus - Splamei Client",

            smallImageKey: "icon",
            smallImageText: `Version: ${app.getVersion()} - By: Splamei`,

            buttons: [
                { label: "Play Rhythm Plus", url: "https://rhythm-plus.com" },
                { label: "Download the client", url: "https://www.veemo.uk/r-plus-splamei-client/" }
            ]
        }).then(() => {
            console.log(`Updated Discord RPC to details '${details}' and state '${state}'!`)
        }).catch(console.error);
    }
}

if (settings.discordRpc)
{
    discord.login().catch(console.error);
}

// -- Browser setup --

app.setPath("userData", dataPathLocation);
app.setPath("sessionData", cachePathLocation);

let mainWindow;
let navigationHistory;
const loadedExtensions = [];
let currentTitle = "";

app.on("browser-window-created", (event, createWindow) => {
    if (createWindow !== mainWindow)
    {
        createWindow.removeMenu();
    }
})

app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(false);
    });
});

// -- Window setup --

function createWindow()
{
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 720
    });

    console.log("Loaded window state");

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        icon: path.join(__dirname, 'assets/icon.png'),
        title: "Rhythm Plus Splamei Client",
        show: false,
        fullscreenable: true,
        userAgent: clientUserAgent,
        webPreferences: {
            backgroundThrottling: false,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            devTools: !app.isPackaged
        }
    });

    mainWindowState.manage(mainWindow);
    navigationHistory = mainWindow.webContents.navigationHistory;

    mainWindow.on("page-title-updated", (event, title) => {
        event.preventDefault();

        var newTitle = ""
        currentTitle = title;
        if (title.startsWith("Rhythm Plus - Online Rhythm Game"))
        {
            newTitle = "Rhythm Plus - Splamei Client"
        }
        else
        {
            newTitle = title.replace("Rhythm Plus Music Game", "Rhythm Plus Splamei Client").replace("Rhythm+ Music Game", "Rhythm Plus Splamei Client")
        }

        mainWindow.setTitle(newTitle);
    });

    mainWindow.once("ready-to-show", () => {
        console.log("Loaded now loading the real page!")
        mainWindow.show();

        if (settings.v2Mode)
        {
            mainWindow.loadURL("https://v2.rhythm-plus.com");
        }
        else
        {
            mainWindow.loadURL("https://rhythm-plus.com");
        }

        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: "Rhythm Plus Splamei Client",
            detail: "This Electron version of the client is in it's pre-release stage so not all features are added or stable. Using this client currently is at your own risk!\n\nThis version is pre-release 1",
            buttons: ['OK']
        });
    });

    mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
        if (errorCode === -3 || errorCode === -27) { return; }

        mainWindow.loadFile(path.join(__dirname, "error.html"));
        console.error("Failed to load a page! Code:", errorCode)
    });

    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.navigationHistory.clear();
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.includes("about:blank"))
        {
            shell.openExternal(url)
            return { action: "deny" };
        }

        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                width: 900,
                height: 750,
                title: "Rhythm Plus Splamei Client",
                icon: path.join(__dirname, 'assets/icon.png'),
                autoHideMenuBar: true,
                fullscreenable: false,
                webPreferences: {
                    backgroundThrottling: false,
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                    webSecurity: true,
                    allowRunningInsecureContent: false,
                    devTools: !app.isPackaged
                }
            }
        };
    });

    mainWindow.webContents.on('did-create-window', (popupWindow) => {
        popupWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: "deny" };
        });
    });

    mainWindow.webContents.on("did-navigate-in-page", (event, url, isMainFrame) => {
        currentUrl = url;

        if (settings.showMenu == "alwaysExceptGame")
        {
            if (url.includes("/game/") && !wasGamePage)
            {
                wasGamePage = true;
                Menu.setApplicationMenu(null);
                console.log("Now in-game so hiding menu!")
            }
            else if (wasGamePage)
            {
                wasGamePage = false;
                displayAppMenu();
                console.log("Now out of the game so showing menu!")
            }
        }
        else if (settings.showMenu == "always" && wasGamePage)
        {
            wasGamePage = false;
            displayAppMenu();
            console.log("Mode set to always so now showing the menu!")
        }

        if (currentUrl.includes("rhythm-plus.com/result"))
        {
            setTimeout(makeRpcDomRequest, 1200);
        }
        else
        {
            setTimeout(makeRpcDomRequest, 700);
        }
    });

    console.log("Created the browser window and got it managed by the window state!")

    mainWindow.loadFile(path.join(__dirname, "splashLoad.html"));

    console.log("Now loading!")

    displayAppMenu();
}

// -- Extension stuff --

function getPopupPath(manifest)
{
    if (manifest.action && manifest.action.default_popup)
    {
        return manifest.action.default_popup;
    }
    if (manifest.browser_action && manifest.browser_action.default_popup)
    {
        return manifest.browser_action.default_popup;
    }
    if (manifest.page_action && manifest.page_action.default_popup)
    {
        return manifest.page_action.default_popup;
    }

    return null;
}

async function loadExtensions()
{
    console.log("Loading extensions")

    if (!fs.existsSync(extensionPathLocation))
    {
        console.log("Not loading extensions because the directory does not exist!")
        fs.mkdirSync(extensionPathLocation, { recursive: true });
        return;
    }

    const entries = fs.readdirSync(extensionPathLocation, { withFileTypes: true });

    for (const entry of entries)
    {
        if (entry.isDirectory())
        {
            const extFolder = path.join(extensionPathLocation, entry.name);
            const manifestFile = path.join(extFolder, "manifest.json");

            if (fs.existsSync(manifestFile))
            {
                try
                {
                    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
                    const popupRelative = getPopupPath(manifest);

                    const ext = await session.defaultSession.extensions.loadExtension(extFolder, {
                        allowFileAccess: false
                    });

                    loadedExtensions.push({
                        id: ext.id,
                        name: ext.name || manifest.name || entry.name,
                        popupPath: popupRelative
                    });

                    console.log(`Loaded the extension '${ext.name}'! (ID: ${ext.id})`)
                }
                catch (ex)
                {
                    console.error(`Failed to load the extension in dir '${entry.name}'!`, ex.message);
                }
            }
        }
    }
}

// -- Menu strip thingy --

function displayAppMenu()
{
    console.log("Displaying the menu")

    const extensionMenuItems = [
        {
            label: "Open extension folder",
            click: () => {
                shell.openPath(extensionPathLocation);
                console.log("Opening the extention path -", extensionPathLocation);
            }
        },
        { type: "separator" },
        ...(loadedExtensions.length > 0
            ? loadedExtensions.map(ext => ({
                label: ext.name,
                click: () => {
                    if (!ext.popupPath)
                    {
                        dialog.showMessageBox(mainWindow, {
                            type: "warning",
                            title: ext.name,
                            message: "This extension doesn't have a page we can display set for it.\n\nIt may not have a page set or it's configured in a way that stopped us from finding it"
                        });
                        console.log(`Unable to show page for extension '${ext.name}'! (No popup path)`);
                        return;
                    }

                    console.log(`Showing popup for extension '${ext.name}' via URL 'chrome-extension://${ext.id}/${ext.popupPath}'!`)

                    const popup = new BrowserWindow({
                        width: 450,
                        height: 550,
                        title: ext.name,
                        autoHideMenuBar: true,
                        fullscreenable: false,
                        icon: path.join(__dirname, 'assets/icon.png'),
                        title: "Rhythm Plus - Splamei Client",
                        userAgent: clientUserAgent,
                        webPreferences: {
                            backgroundThrottling: false,
                            contextIsolation: true,
                            nodeIntegration: false,
                            sandbox: true,
                            webSecurity: true,
                            allowRunningInsecureContent: false,
                            devTools: !app.isPackaged
                        }
                    });
                    popup.removeMenu();

                    popup.loadURL(`chrome-extension://${ext.id}/${ext.popupPath}`);
                }
            }))
        : [{ label: "No extensions are installed", enabled: false }])
    ]

    const menuTemplate = [
        {
            label: "File",
            submenu: [
                {
                    label: "Reload",
                    submenu: [
                        {
                            label: "Soft Reload",
                            accelerator: "CmdOrCtrl+R",
                            click: () => mainWindow.reload()
                        },
                        {
                            label: "Hard Reload",
                            accelerator: "CmdOrCtrl+Shift+R",
                            click: () => mainWindow.webContents.reloadIgnoringCache()
                        }
                    ]
                },
                { type: "separator" },
                {
                    label: "Settings",
                    accelerator: "CmdOrCtrl+S",
                    click: () => showSettings(mainWindow)
                },
                { type: "separator" },
                { role: "quit" }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Toggle Fullscreen",
                    accelerator: "F11",
                    click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
                },
                { type: "separator" },
                { role: "zoomIn", accelerator: "CmdOrCtrl+Plus" },
                { role: "zoomOut", accelerator: "CmdOrCtrl+-" },
                { role: "resetZoom", accelerator: "CmdOrCtrl+0" },
            ]
        },
        {
            label: "Navigation",
            submenu: [
                {
                    label: "Go forward",
                    click: () => {
                        try
                        {
                            if (navigationHistory.canGoForward())
                            {
                                navigationHistory.goForward();
                            }
                        }
                        catch (ex)
                        {
                            console.error("Failed to move forward! -", ex);
                        }
                    }
                },
                {
                    label: "Go back",
                    click: () => {
                        try
                        {
                            if (navigationHistory.canGoBack())
                            {
                                navigationHistory.goBack();
                            }
                        }
                        catch (ex)
                        {
                            console.error("Failed to move back! -", ex);
                        }
                    }
                },
                { type: "separator" },
                {
                    label: "Copy URL",
                    accelerator: "CmdOrCtrl+Alt+C",
                    click: () => {
                        try
                        {
                            if (currentUrl == null)
                            {
                                showDialogMessage(mainWindow, "error", "Unable to copy", "We can't copy the URL because we don't currently have the URL stored. You may be able to fix this by changing the page then going back");
                            }
                            else
                            {
                                clipboard.writeText(currentUrl);
                                showDialogMessage(mainWindow, "info", "The current URL has been copied!", "");
                            }
                        }
                        catch (ex)
                        {
                            console.error("Failed to copy the current URL to the clipboard! -", ex);
                            showDialogMessage(mainWindow, "error", "Unable to copy", "We can't copy the URL because something went wrong during the copy. You may be able to fix this by changing the page then going back");
                        }
                    }
                },
                {
                    label: "To a URL",
                    accelerator: "CmdOrCtrl+Alt+T",
                    click: () => {
                        try
                        {
                            const clipboardContent = clipboard.readText();

                            if (clipboardContent == null || clipboardContent.length < 1)
                            {
                                showDialogMessage(mainWindow, "error", "Unable to nagivate", "We can't nagivate because your clipboard is empty or it's latest content isn't text. Please copy the URL you want to nagivate and try again.");
                            }
                            else if (!clipboardContent.startsWith("https://"))
                            {
                                showDialogMessage(mainWindow, "error", "Unable to nagivate", "We can't nagivate because that isn't a valid URL or it's not HTTPS. Please copy the URL you want to nagivate and try again.");
                                return
                            }

                            const urlObj = new URL(clipboardContent);
                            const hostname = urlObj.hostname;
                            
                            if (hostname !== "rhythm-plus.com" && hostname !== "v2.rhythm-plus.com")
                            {
                                showDialogMessage(mainWindow, "error", "Unable to nagivate", "We can't nagivate because the latest entry in your clipboard isn't a Rhythm Plus URL! Please make sure you copy a valid Rhythm Plus URL and try again");
                            }
                            else
                            {
                                mainWindow.loadURL(clipboardContent);
                            }
                        }
                        catch (ex)
                        {
                            console.error("Unable to navigate to a URL due to an error! -", ex);
                            showDialogMessage(mainWindow, "error", "Unable to nagivate", "We can't nagivate because and error occured! Please make sure you have a valid URL in your clipboard and try again. If you see this message again, please contact us for support");
                        }
                    }
                }
            ]
        },
        {
            label: "Extentions",
            submenu: extensionMenuItems
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "Star on GitHub",
                    click: () => shell.openExternal("https://github.com/splamei/rhythm-plus-splamei-client")
                },
                { type: "separator" },
                {
                    label: "Get Help",
                    click: () => shell.openExternal("https://www.veemo.uk/help")
                },
                {
                    label: "About",
                    click: (menuItem, focusedWindow) => showAboutDialog(focusedWindow)
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// -- About --

function showAboutDialog(parentWindow) {
    dialog.showMessageBox(parentWindow, {
        type: 'info',
        title: "About - Rhythm Plus Splamei Client",
        message: "About the client",
        detail: `A client to play the Rhythm Plus music game in an app right on your device\n\n----\n\nClient: ${app.getVersion()} - Pre 1\n\nNode: ${process.versions.node}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nV8: ${process.versions.v8}\n\n----\n\nMade with <3 by Splamei`,
        buttons: ['OK']
    });
}

function showDialogMessage(parentWindow, type, message, detail)
{
    dialog.showMessageBox(parentWindow, {
        type: type,
        title: "Rhythm Plus Splamei Client",
        message: message,
        detail: detail,
        buttons: ['OK']
    });
}

// -- Other stuff --

app.whenReady().then(async () => {
    console.log("Ready! Now loading extensions and creating the window")
    await loadExtensions();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") { console.log("Now closing"); app.quit(); }
});