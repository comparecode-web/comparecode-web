import { IStorageAdapter } from "./IStorageAdapter";
import { LocalStorageAdapter } from "./LocalStorageAdapter";

export class StorageFactory {
  private static instance: IStorageAdapter;

  public static getAdapter(): IStorageAdapter {
    if (!this.instance) {
      this.instance = new LocalStorageAdapter();
    }

    return this.instance;
  }
}