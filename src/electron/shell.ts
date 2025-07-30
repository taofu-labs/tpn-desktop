import { shell } from 'electron';

/**
 * Opens a URL in the user's default browser
 * @param url - The URL to open
 * @returns Promise that resolves when the URL is opened
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    console.log(`Opening URL in browser: ${url}`);
    await shell.openExternal(url);
    console.log('URL opened successfully');
  } catch (error) {
    console.error('Failed to open URL in browser:', error);
    throw error;
  }
}

/**
 * Opens a URL in the user's default browser (non-async version)
 * @param url - The URL to open
 */
export function openInBrowserSync(url: string): void {
  try {
    console.log(`Opening URL in browser: ${url}`);
    shell.openExternal(url);
    console.log('URL opened successfully');
  } catch (error) {
    console.error('Failed to open URL in browser:', error);
    throw error;
  }
}
