import { ipcMain, WebContents, WebFrame, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";

export const isDev = (): boolean => process.env.NODE_ENV === "development";

export function ipcMainHandler<Key extends keyof EventPayloadMapping>(
  key: string,
  handler: () => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, (event:any) => {
    validateEventFrame(event.senderFrame);
    return handler();
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
