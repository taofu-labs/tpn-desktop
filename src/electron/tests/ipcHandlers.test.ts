// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// import { ipcMain } from 'electron'
// import type { MockedFunction } from 'vitest'
// import type { WebFrameMain } from 'electron'
// import { initializeIpcHandlers, IpcServices } from '../ipcHandlers.js'
// import { ipcMainHandler, validateEventFrame } from '../util.js'
// import type { ConnectionInfo, StatusInfo, DisconnectInfo } from '../tpn-cli.js'

// // Mock electron module
// vi.mock('electron', () => ({
//   ipcMain: {
//     handle: vi.fn(),
//   },
//   app: {
//     getAppPath: vi.fn(() => '/path/to/app'),
//   },
// }))

// // Mock utility modules
// vi.mock('../pathResolver.js', () => ({
//   getUIPath: vi.fn(() => '/app/dist-react/index.html'),
// }))

// vi.mock('url', () => ({
//   pathToFileURL: vi.fn((path) => ({ toString: () => `file://${path}` })),
// }))

// describe('IPC Handlers', () => {
//   let mockTpnService: {
//     getCountries: MockedFunction<() => Promise<string[]>>
//     connect: MockedFunction<(country?: string) => Promise<ConnectionInfo>>
//     checkStatus: MockedFunction<() => Promise<StatusInfo>>
//     disconnect: MockedFunction<() => Promise<DisconnectInfo>>
//   }
//   let mockServices: IpcServices

//   beforeEach(() => {
//     vi.clearAllMocks()

//     // Create mock TPN service
//     mockTpnService = {
//       getCountries: vi.fn<() => Promise<string[]>>(),
//       connect: vi.fn<(country?: string) => Promise<ConnectionInfo>>(),
//       checkStatus: vi.fn<() => Promise<StatusInfo>>(),
//       disconnect: vi.fn<() => Promise<DisconnectInfo>>(),
//     }

//     mockServices = {
//       tpnService: mockTpnService,
//     }
//   })

//   afterEach(() => {
//     vi.restoreAllMocks()
//   })

//   describe('initializeIpcHandlers', () => {
//     it('should register all IPC handlers', () => {
//       initializeIpcHandlers(mockServices)

//       expect(ipcMain.handle).toHaveBeenCalledTimes(4)
//       expect(ipcMain.handle).toHaveBeenCalledWith(
//         'getCountries',
//         expect.any(Function),
//       )
//       expect(ipcMain.handle).toHaveBeenCalledWith(
//         'connectToCountry',
//         expect.any(Function),
//       )
//       expect(ipcMain.handle).toHaveBeenCalledWith(
//         'checkStatus',
//         expect.any(Function),
//       )
//       expect(ipcMain.handle).toHaveBeenCalledWith(
//         'disconnect',
//         expect.any(Function),
//       )
//     })

//     it('should call tpnService.getCountries when getCountries handler is invoked', async () => {
//       const mockCountries = ['US', 'UK', 'DE']
//       mockTpnService.getCountries.mockResolvedValue(mockCountries)

//       initializeIpcHandlers(mockServices)

//       // Get the handler function that was registered
//       const getCountriesHandler: any = vi
//         .mocked(ipcMain.handle)
//         .mock.calls.find((call) => call[0] === 'getCountries')?.[1]

//       expect(getCountriesHandler).toBeDefined()

//       // Create mock event
//       const mockEvent = { senderFrame: null }
//       const result = await getCountriesHandler(mockEvent)

//       expect(mockTpnService.getCountries).toHaveBeenCalledTimes(1)
//       expect(result).toEqual(mockCountries)
//     })

//     it('should call tpnService.connect when connectToCountry handler is invoked', async () => {
//       const mockConnectionInfo: ConnectionInfo = {
//         connected: true,
//         currentIP: '192.168.1.1',
//         leaseEndTime: new Date(),
//         minutesRemaining: 60,
//       }
//       mockTpnService.connect.mockResolvedValue(mockConnectionInfo)

//       initializeIpcHandlers(mockServices)

//       const connectHandler: any = vi
//         .mocked(ipcMain.handle)
//         .mock.calls.find((call) => call[0] === 'connectToCountry')?.[1]

//       expect(connectHandler).toBeDefined()

//       const mockEvent = { senderFrame: null }
//       const result = await connectHandler(mockEvent, 'US')

//       expect(mockTpnService.connect).toHaveBeenCalledWith('US')
//       expect(result).toEqual(mockConnectionInfo)
//     })

//     it('should call tpnService.checkStatus when checkStatus handler is invoked', async () => {
//       const mockStatusInfo: StatusInfo = {
//         connected: true,
//         currentIP: '192.168.1.1',
//         leaseEndTime: new Date(),
//         minutesRemaining: 30,
//       }
//       mockTpnService.checkStatus.mockResolvedValue(mockStatusInfo)

//       initializeIpcHandlers(mockServices)

//       const statusHandler: any = vi
//         .mocked(ipcMain.handle)
//         .mock.calls.find((call) => call[0] === 'checkStatus')?.[1]

//       expect(statusHandler).toBeDefined()

//       const mockEvent = { senderFrame: null }
//       const result = await statusHandler(mockEvent)

//       expect(mockTpnService.checkStatus).toHaveBeenCalledTimes(1)
//       expect(result).toEqual(mockStatusInfo)
//     })

//     it('should call tpnService.disconnect when disconnect handler is invoked', async () => {
//       const mockDisconnectInfo: DisconnectInfo = {
//         success: true,
//         previousIP: '192.168.1.1',
//         newIP: '10.0.0.1',
//         message: 'Successfully disconnected',
//       }
//       mockTpnService.disconnect.mockResolvedValue(mockDisconnectInfo)

//       initializeIpcHandlers(mockServices)

//       const disconnectHandler: any = vi
//         .mocked(ipcMain.handle)
//         .mock.calls.find((call) => call[0] === 'disconnect')?.[1]

//       expect(disconnectHandler).toBeDefined()

//       const mockEvent = { senderFrame: null }
//       const result = await disconnectHandler(mockEvent)

//       expect(mockTpnService.disconnect).toHaveBeenCalledTimes(1)
//       expect(result).toEqual(mockDisconnectInfo)
//     })
//   })

//   describe('ipcMainHandler', () => {
//     it('should register handler with ipcMain.handle', () => {
//       const mockHandler = vi.fn()

//       ipcMainHandler('testKey', mockHandler)

//       expect(ipcMain.handle).toHaveBeenCalledWith(
//         'testKey',
//         expect.any(Function),
//       )
//     })

//     it('should validate frame with correct URL', async () => {
//       vi.stubEnv('NODE_ENV', 'production')
//       const mockHandler = vi.fn().mockResolvedValue('ok')

//       ipcMainHandler('test', mockHandler)

//       const handler = vi.mocked(ipcMain.handle).mock.calls[0][1]
//       const mockEvent: any = {
//         senderFrame: { url: 'file:///app/dist-react/index.html' },
//       }

//       const result = await handler(mockEvent, 'payload')
//       expect(result).toBe('ok')
//     })

//     it('should throw error for malicious event frame', async () => {
//       const mockHandler = vi.fn()
//       const mockFrame: WebFrameMain = {
//         url: 'https://malicious-site.com',
//       } as WebFrameMain

//       // Mock isDev to return false
//       vi.stubEnv('NODE_ENV', 'production')

//       ipcMainHandler('testKey', mockHandler)

//       const registeredHandler = vi.mocked(ipcMain.handle).mock.calls[0][1]
//       const mockEvent: any = { senderFrame: mockFrame }

//       await expect(
//         registeredHandler(mockEvent, 'test payload'),
//       ).rejects.toThrow('Malicious Event')
//       expect(mockHandler).not.toHaveBeenCalled()
//     })

//     it('should allow localhost in development mode', async () => {
//       const mockHandler = vi.fn().mockResolvedValue('dev result')
//       const mockFrame: WebFrameMain = {
//         url: 'http://localhost:5123/some-path',
//       } as WebFrameMain

//       // Mock isDev to return true
//       vi.stubEnv('NODE_ENV', 'development')

//       ipcMainHandler('testKey', mockHandler)

//       const registeredHandler = vi.mocked(ipcMain.handle).mock.calls[0][1]
//       const mockEvent: any = { senderFrame: mockFrame }

//       const result = await registeredHandler(mockEvent, 'test payload')

//       expect(mockHandler).toHaveBeenCalledWith('test payload')
//       expect(result).toBe('dev result')
//     })
//   })

//   describe('validateEventFrame', () => {
//     it('should pass validation for correct UI path in production', () => {
//       vi.stubEnv('NODE_ENV', 'production')

//       const mockFrame: WebFrameMain = {
//         url: 'file:///app/dist-react/index.html',
//       } as WebFrameMain

//       expect(() => validateEventFrame(mockFrame)).not.toThrow()
//     })

//     it('should pass validation for localhost in development', () => {
//       vi.stubEnv('NODE_ENV', 'development')

//       const mockFrame: WebFrameMain = {
//         url: 'http://localhost:5123/app',
//       } as WebFrameMain

//       expect(() => validateEventFrame(mockFrame)).not.toThrow()
//     })

//     it('should throw error for malicious URL in production', () => {
//       vi.stubEnv('NODE_ENV', 'production')

//       const mockFrame: WebFrameMain = {
//         url: 'https://evil.com',
//       } as WebFrameMain

//       expect(() => validateEventFrame(mockFrame)).toThrow('Malicious Event')
//     })

//     it('should throw error for non-localhost URL in development', () => {
//       vi.stubEnv('NODE_ENV', 'development')

//       const mockFrame: WebFrameMain = {
//         url: 'https://evil.com',
//       } as WebFrameMain

//       expect(() => validateEventFrame(mockFrame)).toThrow('Malicious Event')
//     })
//   })
// })
