import { app } from 'electron'
import { exec, spawn } from 'node:child_process'
import type { ExecOptions } from 'node:child_process'
import { log, alert, wait, confirm } from './helpers.js'

export interface ConnectionInfo {
  connected: boolean
  currentIP: string
  leaseEndTime: Date
  minutesRemaining: number
}

export interface StatusInfo {
  connected: boolean
  currentIP: string
  leaseEndTime?: Date
  minutesRemaining?: number
}

export interface DisconnectInfo {
  success: boolean
  previousIP?: string
  newIP?: string
  message?: string
}

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

const checkForErrors = (output: string): void => {
  const errorPatterns = [
    /Error: (.+)/, // Catches any "Error: ..." message
    /Connection failed/, // Connection issues
  ]

  for (const pattern of errorPatterns) {
    const match = output.match(pattern)
    if (match) {
      // For "Error: message" pattern, use the actual error message
      const errorMessage = pattern.source.includes('(.+)') ? match[1] : match[0]
      throw new Error(errorMessage)
    }
  }
}

// Execute without sudo
const exec_async_no_timeout = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    log(`Executing ${command}`)
    exec(command, shell_options, (error, stdout, stderr) => {
      if (stdout) return resolve(stdout)
      if (error) return reject(new Error(stderr))
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

// Verify WireGuard installation with retry logic
const verifyWireGuardInstallation = async (maxRetries = 5): Promise<void> => {
  log('Verifying WireGuard installation...')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`Verification attempt ${attempt}/${maxRetries}...`)

    const [wgQuickCheck, wgCheck] = await Promise.all([
      new Promise<string>((resolve) => {
        exec('which wg-quick', shell_options, (error, stdout) => {
          resolve(stdout.trim())
        })
      }),
      new Promise<string>((resolve) => {
        exec('which wg', shell_options, (error, stdout) => {
          resolve(stdout.trim())
        })
      }),
    ])

    if (wgQuickCheck && wgCheck) {
      log('WireGuard installation verified successfully')
      log(`wg-quick: ${wgQuickCheck}`)
      log(`wg: ${wgCheck}`)
      return
    }

    if (attempt < maxRetries) {
      const delay = Math.min(1000 * attempt, 5000) // 1s, 2s, 3s, 4s, 5s max
      log(
        `Binaries not ready yet (wg-quick: ${!!wgQuickCheck}, wg: ${!!wgCheck}), waiting ${delay}ms...`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error(
    `WireGuard installation verification failed after ${maxRetries} attempts. Binaries may not have been installed correctly.`,
  )
}

export const checkSystemComponents = async (): Promise<{
  tpn_installed: any
  wg_installed: any
  tpn_in_visudo: any
}> => {
  const [tpn_installed, wg_installed, tpn_in_visudo] = await Promise.all([
    exec_async(`${path_fix} which tpn`).catch(() => false),
    exec_async(`${path_fix} which wg-quick`).catch(() => false),
    exec_async(`${path_fix} sudo -n wg show`).catch(() => false),
  ])
  return { tpn_installed, wg_installed, tpn_in_visudo }
}

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

    const systemComponents = await checkSystemComponents()
    const visudo_complete = systemComponents.tpn_in_visudo !== false
    const is_installed = Boolean(
      systemComponents.tpn_installed && systemComponents.wg_installed,
    )
 
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

      if (!systemComponents.wg_installed) {
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
          const result = await new Promise((resolve, reject) => {
            exec(
              'HOMEBREW_NO_AUTO_UPDATE=1 brew install wireguard-tools',
              { ...shell_options, timeout: 60000 },
              (error, stdout, stderr) => {
                if (
                  error ||
                  stderr.includes('Error') ||
                  stdout.includes('Error')
                ) {
                  reject(
                    new Error(
                      `Brew failed: ${error?.message || stderr || stdout}`,
                    ),
                  )
                } else {
                  resolve(stdout)
                }
              },
            )
          })

          await verifyWireGuardInstallation()

          log('WireGuard installed')
        } catch (e) {
          const error = e as Error
          log('Error installing WireGuard:', error)
          await alert(`Error installing WireGuard: ${error.message}`)
          app.quit()
          app.exit()
          return
        }
      }

      await exec_sudo_async(
        `curl -s https://raw.githubusercontent.com/taofu-labs/tpn-cli/main/setup.sh | bash -s -- $USER`,
      )

      //Check Sytem component for the last time

      const finalCheck = await checkSystemComponents()

      const finalVisudoComplete = finalCheck.tpn_in_visudo !== false
      const finalInstalled = Boolean(
        finalCheck.tpn_installed && finalCheck.wg_installed,
      )

       console.log("finalVisudoComplete", finalVisudoComplete)
       console.log("finalInstalled", finalInstalled)


      if (
        !finalVisudoComplete|| 
        !finalInstalled
      ) {
        console.log('throw error')
        throw new Error(
          'Installation verification failed: TPN system was not properly configured',
        )
      }

      await alert(
        `TPN background components installed successfully.`,
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

const extractIP = (output: string): string => {
  const ipMatch = output.match(/IP address changed from [\d.]+ to ([\d.]+)/)
  return ipMatch ? ipMatch[1] : ''
}

export const connect = async (
  country: string = 'any',
): Promise<ConnectionInfo> => {
  let command = `${tpn} connect ${country}`

  command += ' -f'
  command += ' -v'

  log(`Executing command: ${command}`)

  const result = await exec_async(command, 60000)
  log(`Update result: `, result)

  if (result) {
    checkForErrors(result)
    const leaseMatch: RegExpMatchArray | null = result.match(
      /lease ends in (\d+) minutes \(([^)]+)\)/,
    )
    if (leaseMatch) {
      const minutes = parseInt(leaseMatch[1])
      const endTimeStr = leaseMatch[2]
      const endTime: Date = new Date(endTimeStr)
      return {
        connected: true,
        currentIP: extractIP(result),
        leaseEndTime: endTime,
        minutesRemaining: minutes,
      }
    }
  }

  throw new Error('Failed to parse connection info')
}

export const listCountries: any = async (): Promise<string[]> => {
  let command = `${tpn} countries`
  //log(`Executing command: ${command}`)

  const result = await exec_async(command, 60000, true)
  log(`Update result: `, typeof result)
  if (typeof result === 'string') {
    try {
      return JSON.parse(result)
    } catch (e) {
      log('Failed to parse countries JSON:', e)
      return []
    }
  }

  log('Countries command timed out')
  return []
}

export const checkStatus = async (): Promise<StatusInfo> => {
  let command = `${tpn} status`

  log(`Executing command: ${command}`)

  const result = await exec_async(command, 5000)
  log(`Update result: `, result)
  if (result) {
    checkForErrors(result)
    // Parse connection status and IP - try multiple patterns
    let statusMatch = result.match(
      /TPN status: (Connected|Disconnected) \(([\d.]+)\)/,
    )
    if (!statusMatch) {
      // Try alternative pattern without parentheses
      statusMatch = result.match(
        /TPN status: (Connected|Disconnected) ([\d.]+)/,
      )
    }
    if (!statusMatch) {
      // Try pattern with different spacing
      statusMatch = result.match(
        /TPN status:\s*(Connected|Disconnected)\s*\(?([\d.]+)\)?/,
      )
    }
    log(`Status match: `, statusMatch)
    if (statusMatch) {
      const isConnected = statusMatch[1] === 'Connected'
      const currentIP = statusMatch[2]
      log(`Is connected: ${isConnected}, IP: ${currentIP}`)

      // If connected, try to parse lease info
      if (isConnected) {
        const leaseMatch = result.match(
          /[Ll]ease ends in (\d+) minutes \(([^)]+)\)/,
        )
        log(`Lease match: `, leaseMatch)

        if (leaseMatch) {
          const minutes = parseInt(leaseMatch[1])
          const endTimeStr = leaseMatch[2]
          const endTime = new Date(endTimeStr)

          return {
            connected: true,
            currentIP,
            leaseEndTime: endTime,
            minutesRemaining: minutes,
          }
        }

        // Connected but no lease info found
        return {
          connected: true,
          currentIP,
        }
      }

      // Disconnected
      return {
        connected: false,
        currentIP,
      }
    }
  }
  throw new Error('Failed to parse status info')
}

export const disconnect = async (): Promise<DisconnectInfo> => {
  let command = `${tpn} disconnect`

  log(`Executing command: ${command}`)

  const result = await exec_async(command)
  log(`Update result: `, result)

  if (typeof result === 'string') {
    checkForErrors(result)

    // Parse the IP change: "IP changed back from 38.54.29.240 to 80.41.137.152"
    const ipChangeMatch = result.match(
      /IP changed back from ([\d.]+) to ([\d.]+)/,
    )

    if (ipChangeMatch) {
      return {
        success: true,
        previousIP: ipChangeMatch[1], // VPN IP
        newIP: ipChangeMatch[2], // Real IP
        message: 'Successfully disconnected from VPN',
      }
    }

    // If no IP change found but no errors, still consider it successful
    if (result.includes('Disconnecting TPN')) {
      return {
        success: true,
        message: 'Disconnected from TPN',
      }
    }
  }

  throw new Error('Failed to disconnect')
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
