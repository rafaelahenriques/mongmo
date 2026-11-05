import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Where the login session is kept on a phone: the iOS Keychain or the
 * Android Keystore (expo-secure-store), encrypted by the system, instead of
 * plain app storage. Supabase reads and writes it through this.
 *
 * A session is a few kilobytes, more than the secure store promises to
 * hold in one value, so it's saved in numbered pieces: `<key>.0`, `<key>.1`…
 * and `<key>.count`. A session saved by an older version in plain storage
 * is moved across the first time it's read, so nobody is signed out.
 */

/** The largest piece saved under one key, well under the store's 2 KB guarantee. */
export const CHUNK_SIZE = 1800;

/** Secure store keys allow letters, digits, `.`, `-` and `_`. */
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function storedCount(key: string): Promise<number> {
  const count = Number(await SecureStore.getItemAsync(`${key}.count`));
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function removePieces(key: string, from: number, to: number): Promise<void> {
  for (let i = from; i < to; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
}

async function readSecure(key: string): Promise<string | null> {
  const count = await storedCount(key);
  if (count === 0) return null;
  const pieces: string[] = [];
  for (let i = 0; i < count; i++) {
    const piece = await SecureStore.getItemAsync(`${key}.${i}`);
    if (piece === null) return null;
    pieces.push(piece);
  }
  return pieces.join('');
}

async function writeSecure(key: string, value: string): Promise<void> {
  const previous = await storedCount(key);
  const pieces: string[] = [];
  for (let at = 0; at < value.length; at += CHUNK_SIZE) pieces.push(value.slice(at, at + CHUNK_SIZE));
  for (const [i, piece] of pieces.entries()) await SecureStore.setItemAsync(`${key}.${i}`, piece);
  await SecureStore.setItemAsync(`${key}.count`, String(pieces.length));
  await removePieces(key, pieces.length, previous);
}

export const secureSessionStorage = {
  async getItem(name: string): Promise<string | null> {
    const key = safeKey(name);
    const value = await readSecure(key);
    if (value !== null) return value;
    // An older version kept the session in plain storage: move it.
    const legacy = await AsyncStorage.getItem(name);
    if (legacy === null) return null;
    await writeSecure(key, legacy);
    await AsyncStorage.removeItem(name);
    return legacy;
  },

  async setItem(name: string, value: string): Promise<void> {
    await writeSecure(safeKey(name), value);
  },

  async removeItem(name: string): Promise<void> {
    const key = safeKey(name);
    await removePieces(key, 0, await storedCount(key));
    await SecureStore.deleteItemAsync(`${key}.count`);
    await AsyncStorage.removeItem(name);
  },
};
