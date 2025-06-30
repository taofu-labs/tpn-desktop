import { app } from 'electron'
import { set_initial_interface } from './modules/interface.js'
import { alert } from './modules/helpers.js'
// import { updateElectronApp } from 'update-electron-app'

// // Enable auto-updates
// updateElectronApp( {
//     logger: {
//         log: ( ...data ) => log.info( '[ update-electron-app ]', ...data )
//     }
// } )

/* ///////////////////////////////
// Event listeners
// /////////////////////////////*/

app.whenReady().then( set_initial_interface )

/* ///////////////////////////////
// Global config
// /////////////////////////////*/

// Hide dock entry
app.dock.hide()

/* ///////////////////////////////
// Debugging
// /////////////////////////////*/
const debug = false
if( debug ) app.whenReady().then( async () => {

    await alert( __dirname )

    await alert( Object.keys( process.env ).join( '\n' ) )

    const { HOME, PATH, USER } = process.env
    await alert( `HOME: ${ HOME }\n\nPATH: ${ PATH }\n\nUSER: ${ USER }` )

} )
