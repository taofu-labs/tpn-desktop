import { describe, expect, test, vi, beforeEach } from 'vitest'  
import { exec } from 'node:child_process'  
import type { ExecOptions } from 'node:child_process'  
import { initialize_tpn } from '../tpn-cli.js'  
import { log, alert, wait, confirm } from '../helpers.js'  
import { app } from 'electron'  
  
// Mock all dependencies  
vi.mock('node:child_process')  
vi.mock('electron', () => ({  
  app: {  
    quit: vi.fn(),  
    exit: vi.fn()  
  }  
}))  
vi.mock('./helpers.js', () => ({  
  log: vi.fn().mockResolvedValue(undefined),  
  alert: vi.fn().mockResolvedValue({ response: 0 }),  
  wait: vi.fn().mockResolvedValue(undefined),  
  confirm: vi.fn().mockResolvedValue(true)  
}))
  
describe('TPN CLI Tests', () => {  
  beforeEach(() => {  
    vi.clearAllMocks()  
    vi.unstubAllEnvs()  
  })  
  
  test('should handle offline scenario', async () => {  
    // Mock exec with proper type handling  
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
        
      if (command.includes('curl')) {  
        cb(new Error('Network error'), '', '')  
      }  
    }) as any)  
  
    await initialize_tpn()  
      
    expect(log).toHaveBeenCalledWith('Internet online: false')  
  })  
  
  test('should skip update when already installed and online but skipupdate is set', async () => {  
    vi.stubEnv('skipupdate', 'true')  
      
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
        
      if (command.includes('curl')) {  
        cb(null, '', '')  // Network success  
      } else if (command.includes('which tpn')) {  
        cb(null, '/usr/local/bin/tpn', '')  // TPN installed  
      } else if (command.includes('which wg-quick')) {  
        cb(null, '/usr/local/bin/wg-quick', '')  // WireGuard installed  
      } else if (command.includes('sudo -n wg-quick')) {  
        cb(null, '', '')  // Visudo complete  
      }  
    }) as any)  
  
    await initialize_tpn()  
      
    expect(log).toHaveBeenCalledWith('Internet online: true')  
    expect(log).toHaveBeenCalledWith('Skipping update due to environment variable')  
  })  
  
  test('should install TPN when not installed', async () => {  
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
        
      if (command.includes('curl')) {  
        cb(null, '', '')  // Network success  
      } else if (command.includes('which tpn')) {  
        cb(new Error('not found'), '', '')  // TPN not installed  
      } else if (command.includes('which wg-quick')) {  
        cb(null, '/usr/local/bin/wg-quick', '')  // WireGuard installed  
      } else if (command.includes('which brew')) {  
        cb(null, '/usr/local/bin/brew', '')  // Homebrew exists  
      }  
    }) as any)  
  
   // vi.mocked(alert).mockResolvedValue({ response: 0 })  
  
    await initialize_tpn()  
      
    expect(log).toHaveBeenCalledWith('Internet online: true')  
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Installing TPN for'))  
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Welcome to TPN'))  
  })  
  
  test('should install WireGuard when not installed', async () => {  
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
        
      if (command.includes('curl')) {  
        cb(null, '', '')  // Network success  
      } else if (command.includes('which tpn')) {  
        cb(new Error('not found'), '', '')  // TPN not installed  
      } else if (command.includes('which wg-quick')) {  
        cb(new Error('not found'), '', '')  // WireGuard not installed  
      } else if (command.includes('which brew')) {  
        cb(null, '/usr/local/bin/brew', '')  // Homebrew exists  
      } else if (command.includes('brew install wireguard-tools')) {  
        cb(null, 'WireGuard installed', '')  // WireGuard installation success  
      }  
    }) as any)  
  
   // vi.mocked(alert).mockResolvedValue(undefined)  
  
    await initialize_tpn()  
      
    expect(log).toHaveBeenCalledWith('Installing WireGuard tools as regular user...')  
    expect(log).toHaveBeenCalledWith('WireGuard installed')  
  })  
  
  test('should quit app when Homebrew is not installed', async () => {  
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
        
      if (command.includes('curl')) {  
        cb(null, '', '')  // Network success  
      } else if (command.includes('which tpn')) {  
        cb(new Error('not found'), '', '')  // TPN not installed  
      } else if (command.includes('which wg-quick')) {  
        cb(new Error('not found'), '', '')  // WireGuard not installed  
      } else if (command.includes('which brew')) {  
        cb(new Error('not found'), '', '')  // Homebrew not installed  
      }  
    }) as any)  
  
   // vi.mocked(alert).mockResolvedValue(undefined)  
  
    await initialize_tpn()  
      
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Homebrew is required'))  
    expect(app.quit).toHaveBeenCalled()  
    expect(app.exit).toHaveBeenCalled()  
  })  
  
  test('should handle development mode', async () => {  
    vi.stubEnv('development', 'true')  
    vi.stubEnv('skipupdate', 'false')  
      
    vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {  
      const cb = typeof options === 'function' ? options : callback  
      cb(null, '', '')  // All commands succeed  
    }) as any)  
  
    await initialize_tpn()  
      
    expect(log).toHaveBeenCalledWith('Dev mode on, skip updates: false')  
  })  
})