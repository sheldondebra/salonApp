import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

/** Android emulator: host machine loopback */
const ANDROID_EMULATOR_API = "http://10.0.2.2:8000";

function defaultApiUrl(): string {
  if (Platform.OS === "android") {
    return ANDROID_EMULATOR_API;
  }
  return "http://127.0.0.1:8000";
}

const configured =
  process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? defaultApiUrl();

export const env = {
  apiUrl: configured.replace(/\/$/, ""),
};

export function apiConnectionHint(): string {
  if (Platform.OS === "web") {
    return "Browser blocked the request (CORS) or Laravel is not running. After changing backend CORS, restart php artisan serve.";
  }
  if (Platform.OS === "android") {
    return "On a physical Android device, set EXPO_PUBLIC_API_URL to your Mac LAN IP (e.g. http://192.168.1.10:8000) and run: php artisan serve --host=0.0.0.0";
  }
  return "On a physical iPhone, set EXPO_PUBLIC_API_URL to your Mac LAN IP and run: php artisan serve --host=0.0.0.0";
}
