'use strict'

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import fs from 'fs';
const https = require('https')

const isDevelopment = process.env.NODE_ENV !== 'production'
    // Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        title: 'Photo Cloner',
        width: 800,
        height: 600,
        icon: 'favicon.ico',
        autoHideMenuBar: true,
        maximizable: false,
        resizable: false,

        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
        }
    })


    ipcMain.on('setTitle', (event, title) => {
        win.setTitle(title)
    })

    ipcMain.on('downloadImages', (event, arg) => {
        let urls = arg[1]

        dialog.showOpenDialog(win, {
            properties: ['openFile', 'openDirectory']
        }).then(result => {
            if (!result.canceled) {
                let path = result.filePaths[0] + '\\' + arg[0]

                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path);
                }

                const downloadFolderPath = path
                let downloadedFiles = 0

                const downloadFile = url => {
                    return new Promise((resolve, reject) => {
                        const splitUrl = url.split('/')
                        const filename = splitUrl[splitUrl.length - 1]
                        const outputPath = `${downloadFolderPath}/${filename}`
                        const file = fs.createWriteStream(outputPath)

                        https.get(url, res => {
                            if (res.statusCode === 200) {
                                res.pipe(file).on('close', resolve)
                                downloadedFiles++

                                win.webContents.send('context-menu-command', { name: 'downloading', now: downloadedFiles, all: urls.length });
                                win.setTitle('Photo Cloner - Downloading ' + downloadedFiles + ' file of ' + urls.length)

                                if (downloadedFiles == urls.length) {
                                    win.setTitle('Photo Cloner')
                                    shell.openPath(downloadFolderPath)
                                }

                            } else {
                                reject(res.statusCode)
                            }
                        })
                    })
                }


                urls.forEach(url => {
                    downloadFile(url)
                });


            }
        }).catch(err => {
            console.log(err)
        })

        // console.log(arg);
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
            // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async() => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

// main
ipcMain.on('show-context-menu', (event) => {
    const template = [{
            label: 'Select All',
            click: () => { event.sender.send('context-menu-command', 'select-all') }
        },
        {
            label: 'Un Select All',
            click: () => { event.sender.send('context-menu-command', 'un-select-all') }
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => { app.exit(0) }
        },
        { type: 'separator' },
        {
            label: 'Developed By: Govar Jabar',
            click: () => { event.sender.send('context-menu-command', 'about') }
        },
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup(BrowserWindow.fromWebContents(event.sender))
})

ipcMain.on('close-app', (event, arg) => {
    app.exit(0)
})