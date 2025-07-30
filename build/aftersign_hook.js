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
    const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID, CSC_NAME } = process.env
    const appName = context.packager.appInfo.productFilename
    log( `\n\n🔍 Notarizing ${ appName } with, `, { appOutDir, appName, APPLE_ID, APPLE_TEAM_ID, CSC_NAME } )

    return await notarize( {
        appBundleId: 'xyz.taofy.tpn',
        tool: "notarytool",
        appPath: `${ appOutDir }/${ appName }.app`,
        appleId: APPLE_ID,
        appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
        teamId: APPLE_TEAM_ID,
        cscName: CSC_NAME
    } )
}