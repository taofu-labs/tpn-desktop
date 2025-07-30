import { app, BrowserWindow, dialog, nativeImage } from 'electron'
import path from 'path'
import { isDev } from './util.js'
import { alert, log } from './helpers.js'
import { getPreloadPath, getAssetPath } from './pathResolver.js'
import { initialize_tpn } from './tpn-cli.js'
import { initializeIpcHandlers } from './ipcHandlers.js'
import { tpnService } from './tpnService.js'
import updater from 'electron-updater'
import { getNetworkspeed } from './network.js'
const { autoUpdater } = updater

let connectionInterval: NodeJS.Timeout | null = null
let shiftDTimer: NodeJS.Timeout | null = null
let isShiftDPressed = false

const state = {
  mainWindow: null as BrowserWindow | null,
}

/* ///////////////////////////////
// Event listeners
// /////////////////////////////*/
app.whenReady().then(async () => {
  const window_config = {
    width: 1200,
    height: 900,
    show: false,
    icon: isDev() ? path.join(getAssetPath(), '/app-icon.png') : undefined,
    webPreferences: {
      preload: getPreloadPath(),
    },
  }
  log('Creating main window with config:', window_config)
  state.mainWindow = new BrowserWindow(window_config)

  state.mainWindow.webContents.on('did-finish-load', () => {
    log('Window finished loading')
    // Start connection monitoring
    const checkConnection = async () => {
      try {
        const status = await tpnService.checkConnection()

        // Send status to frontend
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
          state.mainWindow.webContents.send('connection-status', status)
        }
      } catch (error) {
        log('Connection check failed:', error)
      }
    }

    // Initial check immediately when window loads
    checkConnection()

    // Then check every 15 seconds
    connectionInterval = setInterval(checkConnection, 15000)
  })

  // Register keyboard shortcuts for Shift+D held for 10 seconds
  const registerShiftDShortcut = () => {
    if (!state.mainWindow) return
    
    let shiftPressed = false
    let dPressed = false
    
    // Monitor key events within the window
    state.mainWindow.webContents.on('before-input-event', (_event, input) => {
      // Handle Shift key
      if (input.key === 'Shift') {
        if (input.type === 'keyDown') {
          shiftPressed = true
        } else if (input.type === 'keyUp') {
          shiftPressed = false
          resetTimer()
        }
      }
      
      // Handle D key
      if (input.key === 'D' || input.key === 'd') {
        if (input.type === 'keyDown' && shiftPressed && !isShiftDPressed) {
          isShiftDPressed = true
          dPressed = true
          log('Shift+D pressed, starting 5-second timer')

          // Start timer
          shiftDTimer = setTimeout(() => {
            log('Shift+D held for 5 seconds - triggering action')
            if (state.mainWindow && !state.mainWindow.isDestroyed()) {
              if (state.mainWindow.webContents.isDevToolsOpened()) {
                state.mainWindow.webContents.closeDevTools()
                log('DevTools closed via Shift+D hold')
              } else {
                alert(`Opening devtools. Window: ${ JSON.stringify(window_config) }`)
                state.mainWindow.webContents.openDevTools()
                log('DevTools opened via Shift+D hold')
              }
            }
            resetTimer()
          }, 5_000) // 5 seconds
          
        } else if (input.type === 'keyUp') {
          dPressed = false
          if (isShiftDPressed) {
            log('D key released before 10 seconds')
            resetTimer()
          }
        }
      }
      
      // Reset if either key is released
      if (!shiftPressed || !dPressed) {
        if (input.type === 'keyUp' && isShiftDPressed) {
          resetTimer()
        }
      }
    })
    
    const resetTimer = () => {
      if (shiftDTimer) {
        clearTimeout(shiftDTimer)
        shiftDTimer = null
      }
      isShiftDPressed = false
      log('Shift+D timer reset')
    }
  }

  registerShiftDShortcut()

  try {
    await initialize_tpn()

    initializeIpcHandlers({
      tpnService,
      getMainWindow: () => {
        if (!state.mainWindow) {
          throw new Error('Main window is not initialized')
        }
        return state.mainWindow
      },
      getNetworkspeed,
    })

    state.mainWindow.show() // Show after TPN is ready
  } catch (error) {
    console.error('Failed to initialize TPN:', error)
  }
  if (isDev()) {
    state.mainWindow.loadURL('http://localhost:5123')
  } else {
    state.mainWindow.loadFile(
      path.join(app.getAppPath(), '/dist-react/index.html'),
    )
    autoUpdater.checkForUpdatesAndNotify()
  }
})

// Set dock icon in dev mode on macOS
if (isDev() && process.platform === 'darwin' && app.dock) {
  app.dock.setIcon(
    nativeImage.createFromPath(path.join(getAssetPath(), 'app-icon.png')),
  )
}

// Ensure VPN disconnects when app closes
app.on('before-quit', async () => {
  try {
    if (connectionInterval) {
      clearInterval(connectionInterval)
      connectionInterval = null
    }
    
    // Clean up keyboard shortcuts and timers
    if (shiftDTimer) {
      clearTimeout(shiftDTimer)
      shiftDTimer = null
    }
    
    // Optionally, you can check if connected before disconnecting
    await tpnService.disconnect()
  } catch (err) {
    console.error('Error disconnecting VPN on quit:', err)
  }
})

// Auto Updater Events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new update is being downloaded.',
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'An update is ready. Restart now?',
      buttons: ['Restart', 'Later'],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
})

autoUpdater.on('error', (err: Error) => {
  console.error('AutoUpdater error:', err)
})

/* ///////////////////////////////
// Global config
// /////////////////////////////*/

if (isDev()) {
  if (app.dock) app.dock.show()
} else {
  if (app.dock) app.dock.hide()
}

/* ///////////////////////////////
// Debugging
// /////////////////////////////*/
const debug = false
if (debug) {
  app.whenReady().then(async () => {
    await alert(__dirname)

    await alert(Object.keys(process.env).join('\n'))

    const { HOME, PATH, USER } = process.env
    await alert(`HOME: ${HOME}\n\nPATH: ${PATH}\n\nUSER: ${USER}`)
  })
}
