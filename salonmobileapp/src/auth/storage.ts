import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** SecureStore is unreliable on web; use localStorage there. */
function useWebStorage(): boolean {
  return Platform.OS === "web";
}

export async function getStoredItem(key: string): Promise<string | null> {
  if (useWebStorage()) {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (useWebStorage()) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
    return;
  }

  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    throw new Error("Secure storage is not available on this device.");
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeStoredItem(key: string): Promise<void> {
  if (useWebStorage()) {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    /* ignore */
  }
}
