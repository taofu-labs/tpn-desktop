import { dialog } from 'electron'

export const alert = message => dialog.showMessageBox( { message } )

export const confirm = message => 
    dialog.showMessageBox( { message, buttons: [ "Confirm", "Cancel" ] } )
        .then( ( { response } ) => response === 0 )
