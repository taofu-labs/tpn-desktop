import { log } from "mentie"
import { BrowserWindow } from "electron"

export async function set_initial_interface() {
    log.info( "[ interface ] Setting initial interface..." )

    // Create browser window
    const window = new BrowserWindow( {
        width: 800,
        height: 600
    } )
    window.loadFile( "index.html" )
}
