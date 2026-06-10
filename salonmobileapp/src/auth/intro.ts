import { getStoredItem, setStoredItem } from "@/auth/storage";

const INTRO_SEEN_KEY = "salonapp_intro_seen";

export async function getIntroSeen(): Promise<boolean> {
  const value = await getStoredItem(INTRO_SEEN_KEY);
  return value === "1";
}

export async function setIntroSeen(): Promise<void> {
  await setStoredItem(INTRO_SEEN_KEY, "1");
}
