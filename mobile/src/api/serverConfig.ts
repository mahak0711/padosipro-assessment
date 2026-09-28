import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'padosipro_api_url';

// Baked in at build time from mobile/.env — only useful when whoever runs the
// app happens to match this exact setup (e.g. our own emulator + localhost).
// Anyone else installing the built APK needs to be able to repoint this
// without a rebuild, which is what getApiUrl/setApiUrl below are for.
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000';

let cachedUrl: string | null = null;

export async function getApiUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  let resolved: string;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    resolved = stored && stored.trim().length > 0 ? stored.trim() : DEFAULT_API_URL;
  } catch {
    resolved = DEFAULT_API_URL;
  }

  cachedUrl = resolved;
  return resolved;
}

export async function setApiUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedUrl = trimmed;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // Best-effort persistence; the in-memory cache still takes effect for this session.
  }
}
