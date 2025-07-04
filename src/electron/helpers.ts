import { promises as fs } from 'fs'
import { dialog } from 'electron'

const { HOME } = process.env
let has_alerted_user_no_home = false

const alert = (message: string): Promise<Electron.MessageBoxReturnValue> => 
    dialog.showMessageBox({ message })

const confirm = (message: string): Promise<boolean> => 
    dialog.showMessageBox({ 
        message, 
        buttons: ["Confirm", "Cancel"] 
    }).then(({ response }) => {
        if (response === 0) return true
        return false
    })

const wait = (time_in_ms: number): Promise<void> => 
    new Promise(resolve => {
        setTimeout(resolve, time_in_ms)
    })

const log = async (...messages: any[]): Promise<void> => {
    // Log to console
    console.log(...messages)
    
    // Log to file if possible
    try {
        if (HOME) {
            await fs.mkdir(`${HOME}/.battery/`, { recursive: true })
            await fs.appendFile(`${HOME}/.battery/gui.log`, `${messages.join('\n')}\n`, 'utf8')
        } else if (!has_alerted_user_no_home) {
            alert(`No HOME variable set, this should never happen`)
            has_alerted_user_no_home = true
        }
    } catch (e) {
        console.log(`Unable to write logs to file: `, e)
    }
}

export {
    log,
    alert,
    wait,
    confirm
}
