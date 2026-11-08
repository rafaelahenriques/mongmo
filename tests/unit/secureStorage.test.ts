import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { CHUNK_SIZE, secureSessionStorage } from '@/lib/secureStorage';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});
const secure = (SecureStore as unknown as { __store: Map<string, string> }).__store;

const KEY = 'sb-abcdefghij-auth-token';
const session = (size: number) => JSON.stringify({ access_token: 'x'.repeat(size) });

beforeEach(async () => {
  secure.clear();
  await AsyncStorage.clear();
});

it('keeps a large session in the secure store, in pieces, and reads it back whole', async () => {
  const value = session(CHUNK_SIZE * 2 + 50);
  await secureSessionStorage.setItem(KEY, value);
  expect(secure.get(`${KEY}.count`)).toBe('3');
  expect([...secure.values()].every((piece) => piece.length <= CHUNK_SIZE)).toBe(true);
  await expect(secureSessionStorage.getItem(KEY)).resolves.toBe(value);
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
});

it('drops leftover pieces when a session gets shorter', async () => {
  await secureSessionStorage.setItem(KEY, session(CHUNK_SIZE * 3));
  await secureSessionStorage.setItem(KEY, session(10));
  expect(secure.get(`${KEY}.count`)).toBe('1');
  expect(secure.has(`${KEY}.1`)).toBe(false);
  expect(secure.has(`${KEY}.3`)).toBe(false);
});

it('removes every piece on sign-out', async () => {
  await secureSessionStorage.setItem(KEY, session(CHUNK_SIZE * 2));
  await secureSessionStorage.removeItem(KEY);
  expect(secure.size).toBe(0);
  await expect(secureSessionStorage.getItem(KEY)).resolves.toBeNull();
});

it('moves a session saved in plain storage by an older version, without signing anyone out', async () => {
  const value = session(500);
  await AsyncStorage.setItem(KEY, value);
  await expect(secureSessionStorage.getItem(KEY)).resolves.toBe(value);
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
  expect(secure.get(`${KEY}.0`)).toBe(value);
});

it('treats a half-written session as none', async () => {
  secure.set(`${KEY}.count`, '2');
  secure.set(`${KEY}.0`, 'part');
  await expect(secureSessionStorage.getItem(KEY)).resolves.toBeNull();
});
