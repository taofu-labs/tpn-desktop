import { dialog } from "electron";

export const alert = (message: string) => dialog.showMessageBox({ message });

export const confirm = (message: string) =>
  dialog
    .showMessageBox({ message, buttons: ["Confirm", "Cancel"] })
    .then(({ response }) => response === 0);
