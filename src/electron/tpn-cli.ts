import { app } from 'electron'
import { exec } from 'node:child_process'
import type { ExecOptions } from 'node:child_process'
import * as fs from 'node:fs/promises'
import { log, alert, wait, confirm } from './helpers.js'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface ConnectionInfo {
  connected: boolean
  originalIP: string
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

interface IPInfo {
  originalIP: string
  currentIP: string
}

export interface CountryData {
  name: string
  code: string
}

interface ApiResponse {
  miner_country_code_to_name: Record<string, string>
}

export interface ConnectionStatus {
  isOnline: boolean
  lastChecked: Date
  latency?: number
}

const { USER } = process.env

const getBundledBinPath = (): string => {
  const isDev = process.env.NODE_ENV === 'development'
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  console.log("my arch", arch)
  const basePath = isDev 
    ? path.join(__dirname, '..', 'resources', 'bin')
    : path.join(process.resourcesPath, 'bin')
  
  return path.join(basePath, `darwin-${arch}`)
}

const getBundledScriptPath = (): string => {
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    return path.join(__dirname, '..', 'resources', 'tpn.sh')
  } else {
    return path.join(process.resourcesPath, 'tpn.sh')
  }
}
const bundledBinPath = getBundledBinPath()

const bundledBash = path.join(bundledBinPath, 'bash')
if (!existsSync(bundledBash)) {
  throw new Error(`Missing bundled bash at ${bundledBash}`)
}

console.log("bundles", bundledBinPath)

const path_fix = `PATH=${bundledBinPath}:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`
const tpn = `${path_fix} tpn`

const brewBash = existsSync('/usr/local/bin/bash')
  ? '/usr/local/bin/bash'         // Intel Mac Homebrew default
  : existsSync('/opt/homebrew/bin/bash')
    ? '/opt/homebrew/bin/bash'     // Apple Silicon Homebrew default
    : '/bin/bash'                  // Fallback (macOS-provided, or Linux, etc.)

const shell_options: ExecOptions = {
  shell: bundledBash,
  env: { ...process.env, SHELL: bundledBash, PATH: `${bundledBinPath}:${process.env.PATH}:/usr/local/bin` },
  
}

//const ASYNC_LOG = '/tmp/tpn-async.log'
const SUDO_ASYNC_LOG = '/tmp/tpn-sudo-async.log'

// Make bundled binaries executable
const setupBundledBinaries = async (): Promise<void> => {
  try {
    const arch = process.arch
    const archPath = getBundledBinPath()
    
    log(`Detected architecture: ${arch}`)
    log(`Using binary path: ${archPath}`)
    
    const wgPath = path.join(archPath, 'wg')
    const wgQuickPath = path.join(archPath, 'wg-quick')
    const wgGoPath = path.join(archPath, 'wireguard-go')
     const bashPath     = path.join(archPath, 'bash')
    //const scriptPath = getBundledScriptPath()
    
    // Make binaries executable
    await fs.chmod(wgPath, 0o755)
    await fs.chmod(wgQuickPath, 0o755)
    await fs.chmod(wgGoPath, 0o755)
    await fs.chmod(bashPath,    0o755)

    
    log(`Made ${arch} binaries executable:`)
    log(`- wg: ${wgPath}`)
    log(`- wg-quick: ${wgQuickPath}`)
    log(`- wireguard-go: ${wgGoPath}`)
  } catch (error) {
    log('Error setting up bundled binaries:', error)
    throw new Error(`Failed to setup bundled binaries: ${error}`)
  }
}
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

const callApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API call failed: ${error.message}`)
    }
    throw new Error('Unknown API error')
  } finally {
    clearTimeout(timeoutId)
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
        exec('which wg-quick', shell_options, (_error, stdout) => {
          resolve(stdout.trim())
        })
      }),
      new Promise<string>((resolve) => {
        exec('which wg', shell_options, (_error, stdout) => {
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
}> => {
   const scriptPath = getBundledScriptPath()
  const wgPath = path.join(bundledBinPath, 'wg')

  const [tpn_installed] = await Promise.all([
    exec_async(`${path_fix} which tpn`).catch(() => false),
  ])
  return { tpn_installed }
}

const verifyBundledWireGuard = async (): Promise<void> => {
  log('Verifying bundled WireGuard installation...')
  
  const wgPath = path.join(bundledBinPath, 'wg')
  const wgQuickPath = path.join(bundledBinPath, 'wg-quick')
  
  try {
    await fs.access(wgPath)
    await fs.access(wgQuickPath)
    log('Bundled WireGuard binaries found and accessible')
    
    // Test if they work
    const wgVersion = await exec_async(`${wgPath} --version`, 5000)
    log(`WireGuard version: ${wgVersion}`)
    
  } catch (error) {
    throw new Error(`Bundled WireGuard verification failed: ${error}`)
  }
}

// Setup sudoers for bundled binaries
const setupBundledVisudo = async (): Promise<void> => {
  const user = USER || 'unknown'
  const wgPath = path.join(bundledBinPath, 'wg')
  const wgQuickPath = path.join(bundledBinPath, 'wg-quick')
  const sudoersFile = '/etc/sudoers.d/tpn'
  const sudoersContent = `${user} ALL=(ALL) NOPASSWD: ${wgQuickPath}, ${wgPath}`

  try {
    // Check if the sudoers file already exists
    await exec_async_no_timeout(`test -f ${sudoersFile}`)
    log(`Sudoers entry already exists at ${sudoersFile}, skipping setup`)
    return
  } catch {
    // File does not exist, proceed to create it
  }

  try {
    // Write the sudoers entry with correct permissions
    const command = `echo '${sudoersContent}' | sudo tee ${sudoersFile} >/dev/null && sudo chmod 440 ${sudoersFile}`
    await exec_sudo_async(command)
    log(`Created sudoers entry for bundled WireGuard binaries at ${sudoersFile}`)
  } catch (error) {
    throw new Error(`Failed to setup sudoers: ${error}`)
  }
}

export const initialize_tpn = async (): Promise<void> => {
  try {
    // Check if dev mode
    const { development, skipupdate } = process.env
    if (development) log(`Dev mode on, skip updates: ${skipupdate}`)

      await setupBundledBinaries();

       await verifyBundledWireGuard();

       //await setupBundledVisudo()

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
    const is_installed = Boolean(
      systemComponents.tpn_installed
    )

    console.log("System components", systemComponents)

    // If installed, update
    if (is_installed) {
      if (!online) return log(`Skipping TPN update because we are offline`)
      if (skipupdate) return log(`Skipping update due to environment variable`)
      log(`Updating TPN...`)
      const result = await exec_async(`${tpn} update --silent`).catch((e) => e)
      log(`Update result: `, result)
    }

    // If not installed, run install script
    if (!is_installed) {
      log(`Installing TPN for ${USER}...`)
      if (!online)
        await alert(
          `TPN needs an internet connection to download the latest version, please connect to the internet and open the app again.`,
        )
      if (!is_installed)
        await alert(
          `Welcome to TPN. The app needs to install/update some components, so it will ask for your password. This should only be needed once.`,
        )
      // if (!visudo_complete)
      //   await alert(
      //     `TPN needs to apply a backwards incompatible update, to do this it will ask for your password. This should not happen frequently.`,
      //   )

      await exec_sudo_async(
        `curl -s https://raw.githubusercontent.com/taofu-labs/tpn-cli/main/setup.sh | bash -s -- $USER`,
      )

      await setupBundledVisudo()
      //Check Sytem component for the last time

      const finalCheck = await checkSystemComponents()

      const finalInstalled = Boolean(
        finalCheck.tpn_installed
      )

      console.log('finalInstalled', finalInstalled)

      if (!finalInstalled) {
        console.log('throw error')
        throw new Error(
          'Installation verification failed: TPN system was not properly configured',
        )
      }

      await alert(`TPN background components installed successfully.`)
    }

    await setupBundledVisudo()

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

const extractIP = (output: string): IPInfo => {
  const ipMatch = output.match(/IP address changed from ([\d.]+) to ([\d.]+)/)

  if (ipMatch) {
    return {
      originalIP: ipMatch[1],
      currentIP: ipMatch[2],
    }
  }

  return {
    originalIP: '',
    currentIP: '',
  }
}
export const connect = async (
  country: string = 'any',
  lease?: number,
): Promise<ConnectionInfo> => {
  try {
    let command = `echo "y" | ${tpn} connect ${country}`

    if (lease) {
      command += ` --lease_minutes ${lease}`
    }
    command += ' -f'

    log(`Executing command: ${command}`)

    const result = await exec_async(command, 60000)
    log(`Connect operation result: `, result)

    if (!result) {
      throw new Error('No output received from TPN connect. Try again')
    }

    checkForErrors(result)
    const leaseMatch: RegExpMatchArray | null = result.match(
      /lease ends in (\d+) minutes \(([^)]+)\)/,
    )

    const ipInfo: IPInfo = extractIP(result)

    if (leaseMatch) {
      const minutes = parseInt(leaseMatch[1])
      const endTimeStr = leaseMatch[2]
      const endTime: Date = new Date(endTimeStr)
      return {
        connected: true,
        originalIP: ipInfo.originalIP,
        currentIP: ipInfo.currentIP,
        leaseEndTime: endTime,
        minutesRemaining: minutes,
      }
    } else {
      log('Failed to get lease info after connect')

      // Verify we got IP information indicating success
      if (!ipInfo.currentIP && !ipInfo.originalIP) {
        throw new Error('Connection terminated')
      }

      // Connection appears successful but no lease info
      // Use fallback values based on requested lease or defaults
      const fallbackMinutes = lease || 60 // Default to 60 minutes
      const fallbackEndTime = new Date(Date.now() + fallbackMinutes * 60 * 1000)

      log(`Using fallback lease info: ${fallbackMinutes} minutes`)

      return {
        connected: true,
        originalIP: ipInfo.originalIP,
        currentIP: ipInfo.currentIP,
        leaseEndTime: fallbackEndTime,
        minutesRemaining: fallbackMinutes,
      }
    }
  } catch (e) {
    const error = e as Error
    log(`Error during connect operation: `, error.message)
    throw error
  }
  // throw new Error('Failed to parse connection info')
}

export const cancel = async (): Promise<boolean> => {
  const result = await exec_async("pkill -f 'tpn connect'", 15000)
  log(`Cancel operation result: `, result)
  try {
    log('Checking connection status after cancel...')
    const status = await checkStatus()

    if (status.connected) {
      log('Still connected after cancel, attempting disconnect...')
      const disconnectResult = await disconnect()

      if (disconnectResult.success) {
        log('Successfully disconnected after cancel')
        return true
      } else {
        log('Failed to disconnect after cancel')
        return false
      }
    } else {
      log('Not connected after cancel, cancel successful')
      return true
    }
  } catch (statusError) {
    log('Error checking status after cancel:', statusError)
    return false
  }
}

export const listCountries: any = async (): Promise<CountryData[]> => {
  try {
    const apiResponse = await callApi<ApiResponse>(
      'http://34.130.136.222:3000/protocol/sync/stats',
    )

    if (!apiResponse?.miner_country_code_to_name) {
      throw new Error(
        'Invalid API response: missing miner_country_code_to_name',
      )
    }

    const countryEntries = Object.entries(
      apiResponse.miner_country_code_to_name,
    )

    if (countryEntries.length === 0) {
      throw new Error('No countries found')
    }

    const countries: CountryData[] = countryEntries.map(([code, name]) => {
      return {
        name: name,
        code: code,
      }
    })

  log(`Successfully fetched ${countries.length} countries from API`)

    return countries
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    log(`Failed to fetch countries: ${errorMessage}`)
    throw new Error(`Could not retrieve countries list: ${errorMessage}`)
  }
}

export const checkStatus = async (): Promise<StatusInfo> => {
  let command = `${tpn} status`

  const result = await exec_async(command, 30000)
  log(`Status result: `, result)
  if (result) {
    checkForErrors(result)
    
    // Updated patterns to handle empty IP case for both connected and disconnected
    let statusMatch = result.match(
      /TPN status: (Connected|Disconnected) \(([^)]*)\)/  // Matches anything including empty
    )
    if (!statusMatch) {
      // Try alternative pattern without parentheses
      statusMatch = result.match(
        /TPN status: (Connected|Disconnected) ([\d.]+)/,
      )
    }
    if (!statusMatch) {
      // Try pattern with different spacing and optional empty parentheses
      statusMatch = result.match(
        /TPN status:\s*(Connected|Disconnected)\s*\(?([^)]*)\)?/,
      )
    }
    
    if (statusMatch) {
      const isConnected = statusMatch[1] === 'Connected'
      let currentIP = statusMatch[2]
      // Handle empty IP case (can happen when connected or disconnected)
      if (!currentIP || currentIP.trim() === '') {
        currentIP = isConnected ? 'connected-offline' : 'offline'
      }

      // If connected, try to parse lease info
      if (isConnected) {
        const leaseMatch = result.match(
          /[Ll]ease ends in (\d+) minutes \(([^)]+)\)/,
        )

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
     
      // Disconnected (online or offline)
      return {
        connected: false,
        currentIP,
      }
    }
  }
  throw new Error('Failed to parse status info')
}

export const disconnect = async (): Promise<DisconnectInfo> => {
  try {
    let command = `${tpn} disconnect`

    log(`Executing command: ${command}`)

    const result = await exec_async(command, 30000)
    log(`Disconnect result: `, result)

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
    }
    throw new Error('Error disconnecting')
  } catch (e) {
    try{
    const status = await checkStatus()
      if (!status.connected) {
        return {
          success: true,
          previousIP: 'unknow',
          newIP: 'unknow',
          message: 'Successfully disconnected from VPN'
        }
      }
    }catch(err) {
      throw new Error("Failed to check status");
    }
    const error = e as Error
    log(`Error during disconnect operation: `, error)
    throw new Error(`Failed to disconnect: ${error.message}`)
  }
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

export const checkInternetConnection = async (): Promise<ConnectionStatus> => {
  const startTime = Date.now()

  try {
    // Simple curl check to a reliable endpoint
    const online = await Promise.race([
      exec_async(`${path_fix} curl -I https://icanhazip.com &> /dev/null`)
        .then(() => true)
        .catch(() => false),
      exec_async(`${path_fix} curl -I https://github.com &> /dev/null`)
        .then(() => true)
        .catch(() => false),
    ])
    return {
      isOnline: online,
      lastChecked: new Date(),
      latency: Date.now() - startTime,
    }
  } catch (error) {
    return {
      isOnline: false,
      lastChecked: new Date(),
    }
  }
}


export const openExternal = async (url: string): Promise<any> => {
  try {
    log(`Opening URL in browser: ${url}`)
    
    // Use the 'open' command which works on macOS
    const command = `open "${url}"`
    
    const result = await exec_async(command, 5000)
    log(`Open external result: ${result}`)
    
    if (result === undefined) {
      log('URL opened successfully')
    }
  } catch (e) {
    const error = e as Error
    log(`Error opening URL in browser: ${error.message}`)
    throw new Error(`Failed to open URL in browser: ${error.message}`)
  }
}