/* ///////////////////////////////
// Notarization
// See https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
// /////////////////////////////*/
// require( 'dotenv' ).config()
import { config } from 'dotenv'
config( { path: '.env' } )
// const { notarize } = require( '@electron/notarize' )
import { notarize } from '@electron/notarize'
const log = ( ...messages ) => console.log( ...messages )

export default async function notarizing( context ) {
    
    log( '\n\n🪝 afterSign hook triggered: ' )
    const { appOutDir } = context 
    const { APPLEID, APPLEIDPASS, TEAMID } = process.env
    const appName = context.packager.appInfo.productFilename
    log( `\n\n🔍 Notarizing ${ appName } with, `, { appOutDir, appName, APPLEID } )

    return await notarize( {
        appBundleId: 'xyz.taofy.tpn',
        tool: "notarytool",
        appPath: `${ appOutDir }/${ appName }.app`,
        appleId: APPLEID,
        appleIdPassword: APPLEIDPASS,
        teamId: TEAMID
    } )
}