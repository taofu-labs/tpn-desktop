import { app } from 'electron'
import { exec, ExecOptions, spawn } from 'node:child_process'
import { log, alert, wait, confirm } from './helpers.js'

const { USER } = process.env

const path_fix =
  'PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
const tpn = `${path_fix} tpn`

const shell_options: ExecOptions = {
  shell: '/bin/bash',
  env: { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin` },
}

const ASYNC_LOG = '/tmp/tpn-async.log'
const SUDO_ASYNC_LOG = '/tmp/tpn-sudo-async.log'

// Execute without sudo
const exec_async_no_timeout = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const commandWithTee = `${command} 2>&1 | tee -a ${ASYNC_LOG}`
    log(`Executing ${commandWithTee}`)

    exec(commandWithTee, shell_options, (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`)
      if (error) return reject(error)
      if (stderr) return reject(new Error(stderr))
      if (stdout) return resolve(stdout)
      resolve('')
    })
  })

const exec_async = (
  command: string,
  timeout_in_ms: number = 2000,
  throw_on_timeout: boolean = false,
): Promise<string | void> =>
  Promise.race([
    exec_async_no_timeout(command),
    wait(timeout_in_ms).then(() => {
      if (throw_on_timeout) throw new Error(`${command} timed out`)
    }),
  ])

// Execute with sudo
const exec_sudo_async = (command: string) =>
  new Promise((resolve, reject) => {
    const commandWithTee = `${command} 2>&1 | tee -a ${SUDO_ASYNC_LOG}`
    // Properly escape the quotes for osascript
    // const escapedCommand = command.replace(/"/g, '\\"')
    const osascriptCmd = `osascript -e "do shell script \\"${commandWithTee}\\" with administrator privileges"`

    log(`Executing ${commandWithTee}`)

    exec(osascriptCmd, shell_options, (error, stdout, stderr) => {
      console.log('Raw output:', { error, stdout, stderr })

      if (error) {
        console.error('Execution error:', error)
        return reject(error)
      }
      if (stderr && stderr.trim()) {
        console.error('Stderr:', stderr)
        return reject(new Error(stderr))
      }
      return resolve(stdout)
    })
  })

export const initialize_tpn = async (): Promise<void> => {
  try {
    // Check if dev mode
    const { development, skipupdate } = process.env
    if (development) log(`Dev mode on, skip updates: ${skipupdate}`)

    // Check for network
    const online = await Promise.race([
      exec_async(`${path_fix} curl -I https://icanhazip.com &> /dev/null`)
        .then(() => true)
        .catch(() => false),
      exec_async(`${path_fix} curl -I https://github.com &> /dev/null`)
        .then(() => true)
        .catch(() => false),
    ])
    log(`Internet online: ${online}`)

    // Check if tpn is installed and visudo entries are complete.
    const [tpn_installed, wg_installed, tpn_in_visudo] = await Promise.all([
      exec_async(`${path_fix} which tpn`).catch(() => false),
      exec_async(`${path_fix} which wg-quick`).catch(() => false),
      exec_async(`${path_fix} sudo -n wg-quick`).catch(() => false),
    ])

    const visudo_complete = Boolean(tpn_in_visudo)
    const is_installed = Boolean(tpn_installed && wg_installed)

    // If installed, update
    if (is_installed && visudo_complete) {
      if (!online) return log(`Skipping battery update because we are offline`)
      if (skipupdate) return log(`Skipping update due to environment variable`)
      log(`Updating TPN...`)
      const result = await exec_async(`${tpn} update --silent`).catch((e) => e)
      log(`Update result: `, result)
    }

    // If not installed, run install script
    if (!is_installed || !visudo_complete) {
      log(`Installing TPN for ${USER}...`)
      if (!online)
        await alert(
          `TPN needs an internet connection to download the latest version, please connect to the internet and open the app again.`,
        )
      if (!is_installed)
        await alert(
          `Welcome to TPN. The app needs to install/update some components, so it will ask for your password. This should only be needed once.`,
        )
      if (!visudo_complete)
        await alert(
          `TPN needs to apply a backwards incompatible update, to do this it will ask for your password. This should not happen frequently.`,
        )

      if (!wg_installed) {
        log('Installing WireGuard tools as regular user...')

        // Check if Homebrew exists
        const brewExists = await exec_async('which brew').catch(() => false)
        if (!brewExists) {
          await alert(
            'Homebrew is required but not installed. Please install Homebrew first from https://brew.sh',
          )
          app.quit()
          app.exit()
          return
        }

        // Install WireGuard as regular user (not sudo)
        try {
          const wgResult = await exec_async(
            'HOMEBREW_NO_AUTO_UPDATE=1 brew install wireguard-tools',
          )
          log("WireGuard installed")
        } catch (e) {
          const error = e as Error
          log('Error installing WireGuard:', error)
          await alert(`Error installing WireGuard: ${error.message}`)
          return
        }
      }
      const result = await exec_sudo_async(
        `curl -s https://raw.githubusercontent.com/taofu-labs/tpn-cli/main/setup.sh | bash -s -- $USER`,
      )
      await alert(
        `TPN background components installed successfully. You can find the battery limiter icon in the top right of your menu bar.`,
      )
    }

    // Basic user tracking on app open, run it in the background so it does not cause any delay for the user
    if (online)
      exec_async(
        `nohup curl "https://unidentifiedanalytics.web.app/touch/?namespace=tpngui" > /dev/null 2>&1`,
      )
  } catch (e) {
    const error = e as Error
    log(`Update/install error: `, error)
    await alert(`Error installing TPN: ${error.message}`)
    app.quit()
    app.exit()
  }
}

export const connect = async (country: string = "any") => {
  let command = `${tpn} connect ${country}`

  command += ' -f'
  command += ' -v'

  log(`Executing command: ${command}`)

  const result = await exec_async(command)
  log(`Update result: `, result)
}

export const listCountries = async () => {
  let command = `${tpn} countries`

  log(`Executing command: ${command}`)

  const result = await exec_async(command)
  log(`Update result: `, result)
}

export const checkStatus = async () => {
  let command = `${tpn} status`

  log(`Executing command: ${command}`)

  const result = await exec_async(command)
  log(`Update result: `, result)
}

export const disconnect = async () => {
  let command = `${tpn} disconnect`

  log(`Executing command: ${command}`)

  const result = await exec_async(command)
  log(`Update result: `, result)
}


export const uninstall_tpn_cli = async (): Promise<boolean> => {
  try {
    const confirmed = await confirm(`Are you sure you want to uninstall TPN?`)
    if (!confirmed) return false
    await exec_sudo_async(`${path_fix} sudo tpn uninstall`)
    await alert(`TPN is now uninstalled!`)
    return true
  } catch (e) {
    const error = e as Error
    log('Error uninstalling TPN: ', error)
    alert(`Error uninstalling TPN: ${error.message}`)
    return false
  }
}
