import { app } from 'electron'
import { exec } from 'node:child_process'
import { log, alert, wait, confirm } from './helpers.js'

const { USER } = process.env
const path_fix =
    'PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
const tpn = `${ path_fix } tpn`
const shell_options = {
    shell: '/bin/bash',
    env: { ...process.env, PATH: `${ process.env.PATH }:/usr/local/bin` }
}

// Execute without sudo
const exec_async_no_timeout = command =>
    new Promise( ( resolve, reject ) => {
        log.info( `Executing ${ command }` )

        exec( command, shell_options, ( error, stdout, stderr ) => {
            if( error ) return reject( error, stderr, stdout )
            if( stderr ) return reject( stderr )
            if( stdout ) return resolve( stdout )
        } )
    } )

const exec_async = ( command, timeout_in_ms = 2000, throw_on_timeout = false ) =>
    Promise.race( [
        exec_async_no_timeout( command ),
        wait( timeout_in_ms ).then( () => {
            if( throw_on_timeout ) throw new Error( `${ command } timed out` )
        } )
    ] )

// Execute with sudo
const exec_sudo_async = command => new Promise( ( resolve, reject ) => {

    log.info( `Executing ${ command } by running:` )
    log.info(
        `osascript -e "do shell script \\"${ command }\\" with administrator privileges"`
    )

    exec(
        `osascript -e "do shell script \\"${ command }\\" with administrator privileges"`,
        shell_options,
        ( error, stdout, stderr ) => {
            if( error ) return reject( error, stderr, stdout )
            if( stderr ) return reject( stderr )
            if( stdout ) return resolve( stdout )
        }
    )
} )


/* ///////////////////////////////
// TPN cli functions
// /////////////////////////////*/

export const initialize_tpn = async () => {
    try {
        // Check if dev mode
        const { development, skipupdate } = process.env
        if( development ) log.info( `Dev mode on, skip updates: ${ skipupdate }` )

        // Check for network
        const online = await Promise.race( [
            exec_async( `${ path_fix } curl -I https://icanhazip.com &> /dev/null` )
                .then( () => true )
                .catch( () => false ),
            exec_async( `${ path_fix } curl -I https://github.com &> /dev/null` )
                .then( () => true )
                .catch( () => false )
        ] )
        log.info( `Internet online: ${ online }` )

        // Check if battery is installed and visudo entries are complete.
        const [
            tpn_installed,
            wg_installed,
            tpn_in_visudo,
        ] = await Promise.all( [
            exec_async( `${ path_fix } which tpn` ).catch( () => false ),
            exec_async( `${ path_fix } which wg-quick` ).catch( () => false ),
            exec_async( `${ path_fix } sudo -n wg-quick` ).catch( () => false )
        ] )

        const visudo_complete = tpn_in_visudo
        const is_installed = tpn_installed && wg_installed
        log.info( 'Is installed? ', is_installed )

        // If installed, update
        if( is_installed && visudo_complete ) {
            if( !online ) return log.info( `Skipping battery update because we are offline` )
            if( skipupdate ) return log.info( `Skipping update due to environment variable` )
            log.info( `Updating TPN...` )
            const result = await exec_async( `${ tpn } update --silent` ).catch( e => e )
            log.info( `Update result: `, result )
        }

        // If not installed, run install script
        if( !is_installed || !visudo_complete ) {
            log.info( `Installing TPN for ${ USER }...` )
            if( !online )
                return alert(
                    `TPN needs an internet connection to download the latest version, please connect to the internet and open the app again.`
                )
            if( !is_installed )
                await alert(
                    `Welcome to TPN. The app needs to install/update some components, so it will ask for your password. This should only be needed once.`
                )
            if( !visudo_complete )
                await alert(
                    `TPN needs to apply a backwards incompatible update, to do this it will ask for your password. This should not happen frequently.`
                )
            const result = await exec_sudo_async(
                `curl -s https://raw.githubusercontent.com/taofu-labs/tpn-cli/main/setupdate.sh | bash -s -- $USER`
            )
            log.info( `Install result success `, result )
            await alert(
                `TPN background components installed successfully. You can find the battery limiter icon in the top right of your menu bar.`
            )
        }

        // Basic user tracking on app open, run it in the background so it does not cause any delay for the user
        if( online )
            exec_async(
                `nohup curl "https://unidentifiedanalytics.web.app/touch/?namespace=tpngui" > /dev/null 2>&1`
            )
    } catch ( e ) {
        log.info( `Update/install error: `, e )
        await alert( `Error installing TPN: ${ e.message }` )
        app.quit()
        app.exit()
    }
}

export const uninstall_tpn_cli = async () => {
    try {
        const confirmed = await confirm( `Are you sure you want to uninstall TPN?` )
        if( !confirmed ) return false
        await exec_sudo_async( `${ path_fix } sudo tpn uninstall` )
        await alert( `TPN is now uninstalled!` )
        return true
    } catch ( e ) {
        log.info( 'Error uninstalling TPN: ', e )
        alert( `Error uninstalling TPN: ${ e.message }` )
        return false
    }
}
