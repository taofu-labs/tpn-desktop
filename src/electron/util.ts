import { ipcMain } from "electron";
import type { WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";

export const isDev = (): boolean => process.env.NODE_ENV === "development";

export function ipcMainHandler<Key extends keyof EventPayloadMapping>(
  key: string,
  handler: (payload?: string) => Promise<EventPayloadMapping[Key]> | EventPayloadMapping[Key]
) {
  ipcMain.handle(key, async (event: Electron.IpcMainInvokeEvent, payload?: string) => {
    if (event.senderFrame) {
      validateEventFrame(event.senderFrame);
    }
    return await handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === "localhost:5123") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Malicious Event");
  }
}
