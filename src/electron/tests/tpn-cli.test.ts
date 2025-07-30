import { describe, expect, test, vi, beforeEach } from 'vitest'
import { exec } from 'node:child_process'
import { initialize_tpn, connect, checkStatus, disconnect, listCountries } from '../tpn-cli.js'
import { log, alert} from '../helpers.js'
import { app } from 'electron'

// Mock all dependencies
vi.mock('node:child_process')
vi.mock('electron', () => ({
  app: {
    quit: vi.fn(),
    exit: vi.fn()
  }
}))
vi.mock('../helpers.js', () => ({
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

  describe('initialize_tpn', () => {
    test('should handle offline scenario', async () => {
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
      vi.stubEnv('skipupdate', false as any)
      
      vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        
        if (command.includes('curl')) {
          cb(null, '', '')
        } else if (command.includes('which tpn')) {
          cb(null, '/usr/local/bin/tpn', '')
        } else if (command.includes('which wg-quick')) {
          cb(null, '/usr/local/bin/wg-quick', '')
        } else if (command.includes('sudo -n wg-quick')) {
          cb(null, 'wg-quick', '')
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
          cb(null, '', '')
        } else if (command.includes('which tpn')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('which wg-quick')) {
          cb(null, '/usr/local/bin/wg-quick', '')
        } else if (command.includes('which brew')) {
          cb(null, '/usr/local/bin/brew', '')
        } else if (command.includes('sudo -n wg-quick')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('setup.sh')) {
          cb(null, 'Installation complete', '')
        }
      }) as any)

      await initialize_tpn()
      
      expect(log).toHaveBeenCalledWith('Internet online: true')
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Installing TPN for'))
      expect(alert).toHaveBeenCalledWith(expect.stringContaining('Welcome to TPN'))
    })

    test('should install WireGuard when not installed', async () => {
      vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        
        if (command.includes('curl')) {
          cb(null, '', '')
        } else if (command.includes('which tpn')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('which wg-quick')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('which brew')) {
          cb(null, '/usr/local/bin/brew', '')
        } else if (command.includes('brew install wireguard-tools')) {
          cb(null, 'WireGuard installed', '')
        } else if (command.includes('sudo -n wg-quick')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('setup.sh')) {
          cb(null, 'Installation complete', '')
        }
      }) as any)

      await initialize_tpn()
      
      expect(log).toHaveBeenCalledWith('Installing WireGuard tools as regular user...')
      expect(log).toHaveBeenCalledWith('WireGuard installed')
    })

    test('should quit app when Homebrew is not installed', async () => {
      vi.mocked(exec).mockImplementation(((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        
        if (command.includes('curl')) {
          cb(null, '', '')
        } else if (command.includes('which tpn')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('which wg-quick')) {
          cb(new Error('not found'), '', '')
        } else if (command.includes('which brew')) {
          cb(new Error('not found'), '', '')
        }
      }) as any)

      await initialize_tpn()
      
      expect(alert).toHaveBeenCalledWith(expect.stringContaining('Homebrew is required'))
      expect(app.quit).toHaveBeenCalled()
      expect(app.exit).toHaveBeenCalled()
    })

    test('should handle development mode', async () => {
      vi.stubEnv('development', 'true')
      vi.stubEnv('skipupdate', 'false')
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, '', '')
      }) as any)

      await initialize_tpn()
      
      expect(log).toHaveBeenCalledWith('Dev mode on, skip updates: false')
    })

  })

  describe('connect', () => {
    test('should connect successfully and parse connection info', async () => {
      const mockOutput = 'IP address changed from 192.168.1.1 to 38.54.29.240\nlease ends in 60 minutes (2024-01-01T12:00:00Z)'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      const result = await connect('us')
      
      expect(result).toEqual({
        connected: true,
        currentIP: '38.54.29.240',
        leaseEndTime: new Date('2024-01-01T12:00:00Z'),
        minutesRemaining: 60
      })
    })

    test('should handle connection errors', async () => {
      const mockOutput = 'Error: Connection failed'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      await expect(connect('us')).rejects.toThrow('Connection failed')
    })

    test('should handle invalid response format', async () => {
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, 'Invalid response', '')
      }) as any)

      await expect(connect('us')).rejects.toThrow('Failed to parse connection info')
    })
  })

  describe('checkStatus', () => {
    test('should parse connected status with lease info', async () => {
      const mockOutput = 'TPN status: Connected (38.54.29.240)\nLease ends in 45 minutes (2024-01-01T12:00:00Z)'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      const result = await checkStatus()
      
      expect(result).toEqual({
        connected: true,
        currentIP: '38.54.29.240',
        leaseEndTime: new Date('2024-01-01T12:00:00Z'),
        minutesRemaining: 45
      })
    })

    test('should parse disconnected status', async () => {
      const mockOutput = 'TPN status: Disconnected (192.168.1.1)'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      const result = await checkStatus()
      
      expect(result).toEqual({
        connected: false,
        currentIP: '192.168.1.1'
      })
    })

    test('should handle status parsing errors', async () => {
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, 'Invalid status', '')
      }) as any)

      await expect(checkStatus()).rejects.toThrow('Failed to parse status info')
    })
  })

  describe('disconnect', () => {
    test('should disconnect successfully and parse IP change', async () => {
      const mockOutput = 'Disconnecting TPN\nIP changed back from 38.54.29.240 to 192.168.1.1'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      const result = await disconnect()
      
      expect(result).toEqual({
        success: true,
        previousIP: '38.54.29.240',
        newIP: '192.168.1.1',
        message: 'Successfully disconnected from VPN'
      })
    })

    test('should handle disconnect without IP change info', async () => {
      const mockOutput = 'Disconnecting TPN'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      const result = await disconnect()
      
      expect(result).toEqual({
        success: true,
        message: 'Disconnected from TPN'
      })
    })

    test('should handle disconnect errors', async () => {
      const mockOutput = 'Error: Failed to disconnect'
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, mockOutput, '')
      }) as any)

      await expect(disconnect()).rejects.toThrow('Failed to disconnect')
    })
  })

  describe('listCountries', () => {
    test('should parse countries JSON successfully', async () => {
      const mockCountries = ['us', 'uk', 'ca', 'de']
      
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, JSON.stringify(mockCountries), '')
      }) as any)

      const result = await listCountries()
      
      expect(result).toEqual(mockCountries)
    })

    test('should handle invalid JSON response', async () => {
      vi.mocked(exec).mockImplementation(((_command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback
        cb(null, 'Invalid JSON', '')
      }) as any)

      const result = await listCountries()
      
      expect(result).toEqual([])
    })

    test('should handle timeout', async () => {
      vi.mocked(exec).mockImplementation(((_command: string, _options: any, _callback: any) => {
        // Simulate timeout by not calling callback
      }) as any)

      await expect(listCountries()).rejects.toThrow('timed out')
    })
  })
})