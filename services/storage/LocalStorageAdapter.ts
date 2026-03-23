import { IStorageAdapter } from "./IStorageAdapter";

export class LocalStorageAdapter implements IStorageAdapter {
  public getItem(key: string): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  public setItem(key: string, value: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }

  public removeItem(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
    }
  }
}