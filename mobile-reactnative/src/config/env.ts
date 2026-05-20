import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? "http://127.0.0.1:8000").replace(/\/$/, ""),
};
