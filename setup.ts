import { vi } from 'vitest'

// Mock Electron - must be at the top
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  },
  app: {
    quit: vi.fn(),
    exit: vi.fn(),
    getAppPath: vi.fn(() => '/mock/app/path')
  }
}))

// Mock Node.js child_process
vi.mock('node:child_process', () => ({
  exec: vi.fn()
}))

// Mock helper functions
vi.mock('./src/electron/helpers.js', () => ({
  log: vi.fn(),
  alert: vi.fn().mockResolvedValue({ response: 0 }),
  wait: vi.fn().mockResolvedValue(undefined),
  confirm: vi.fn().mockResolvedValue(true)
}))