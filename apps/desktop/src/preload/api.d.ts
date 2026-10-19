// The only surface the renderer gets from Electron. Keep it small.
export interface DrillBridge {
  apiUrl(): Promise<string>;
  getToken(): Promise<string | null>;
  /** Opens Riot Sign On in the system browser. */
  login(optIn: boolean): Promise<void>;
  /** Development only; the server must run with DEV_LOGIN=true. */
  devLogin(): Promise<boolean>;
  logout(): Promise<void>;
  onAuthChanged(callback: () => void): () => void;
}

declare global {
  interface Window {
    drill: DrillBridge;
  }
}
