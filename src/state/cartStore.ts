import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Where an order is picked up — the café, or a specific pop-up event. */
export type CartLocation = { type: 'store'; storeId: string } | { type: 'event'; eventId: string; eventTitle: string };

/** An option chosen on an item's page: a dip, extra protein. */
export type CartOption = {
  id: string;
  name: string;
  priceCents: number;
};

export type CartItem = {
  /** The item and its options: the same roll with another dip is another line. */
  key: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  options: CartOption[];
  quantity: number;
};

/** A cart line's key: the item, plus its options when it has any. */
export function cartLineKey(menuItemId: string, options: CartOption[] = []): string {
  return options.length
    ? `${menuItemId}|${options
        .map((option) => option.id)
        .sort()
        .join(',')}`
    : menuItemId;
}

type CartState = {
  location: CartLocation | null;
  items: CartItem[];
  /** A redeemed discount reward to spend on this order. */
  userRewardId: string | null;
  setLocation: (location: CartLocation) => void;
  /** Adds `quantity` of an item with these options (one line per item and options). */
  addItem: (
    item: Omit<CartItem, 'quantity' | 'key' | 'options'> & { options?: CartOption[] },
    quantity?: number,
  ) => void;
  removeItem: (key: string) => void;
  /** Puts a removed line back where it was (undo). */
  restoreItem: (line: CartItem, index: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  setUserRewardId: (id: string | null) => void;
  clear: () => void;
};

/**
 * Cart is temporary client state (AGENTS.md) — the authoritative order lives
 * in Supabase once create_order runs, and the cart is cleared right after.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      location: null,
      items: [],
      userRewardId: null,

      setLocation: (location) => {
        // Switching location (café vs. a different event) means the old
        // cart no longer refers to an available menu.
        const current = get().location;
        const sameLocation =
          current?.type === 'store' && location.type === 'store'
            ? current.storeId === location.storeId
            : current?.type === 'event' && location.type === 'event'
              ? current.eventId === location.eventId
              : false;
        set(sameLocation ? { location } : { location, items: [] });
      },

      addItem: ({ options = [], ...item }, quantity = 1) =>
        set((state) => {
          const key = cartLineKey(item.menuItemId, options);
          const existing = state.items.find((row) => row.key === key);
          if (existing) {
            return {
              items: state.items.map((row) => (row.key === key ? { ...row, quantity: row.quantity + quantity } : row)),
            };
          }
          return { items: [...state.items, { ...item, key, options, quantity }] };
        }),

      removeItem: (key) => set((state) => ({ items: state.items.filter((row) => row.key !== key) })),

      restoreItem: (line, index) =>
        set((state) => {
          if (state.items.some((row) => row.key === line.key)) return state;
          const items = [...state.items];
          items.splice(Math.max(0, Math.min(index, items.length)), 0, line);
          return { items };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((row) => row.key !== key)
              : state.items.map((row) => (row.key === key ? { ...row, quantity } : row)),
        })),

      setUserRewardId: (id) => set({ userRewardId: id }),

      clear: () => set({ location: null, items: [], userRewardId: null }),
    }),
    {
      name: 'mongmo-cart',
      storage: createJSONStorage(() => AsyncStorage),
      // v1: lines have options and a key. Older carts get both.
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { items?: Omit<CartItem, 'key' | 'options'>[] } & Record<string, unknown>;
        return {
          ...state,
          items: (state.items ?? []).map((row) => ({ ...row, key: row.menuItemId, options: [] })),
        } as unknown as CartState;
      },
    },
  ),
);

/** One of a line, with its options. */
export function cartUnitCents(item: CartItem): number {
  return item.priceCents + item.options.reduce((sum, option) => sum + option.priceCents, 0);
}

/** Total price of everything currently in the cart, in integer cents. */
export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartUnitCents(item) * item.quantity, 0);
}
