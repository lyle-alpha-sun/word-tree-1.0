export {}
declare global {
  interface Window {
    wordTreeDesktop?: { saveJSON(filename: string, contents: string): void }
  }
}
