import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Where an order is picked up — the café, or a specific pop-up event. */
export type CartLocation =
  | { type: 'store'; storeId: string }
  | { type: 'event'; eventId: string; eventTitle: string };

export type CartItem = {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

type CartState = {
  location: CartLocation | null;
  items: CartItem[];
  /** null = ASAP */
  pickupAt: string | null;
  setLocation: (location: CartLocation) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  setPickupAt: (iso: string | null) => void;
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
      pickupAt: null,

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

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((row) => row.menuItemId === item.menuItemId);
          if (existing) {
            return {
              items: state.items.map((row) =>
                row.menuItemId === item.menuItemId ? { ...row, quantity: row.quantity + 1 } : row,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (menuItemId) =>
        set((state) => ({ items: state.items.filter((row) => row.menuItemId !== menuItemId) })),

      setQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((row) => row.menuItemId !== menuItemId)
              : state.items.map((row) => (row.menuItemId === menuItemId ? { ...row, quantity } : row)),
        })),

      setPickupAt: (iso) => set({ pickupAt: iso }),

      clear: () => set({ location: null, items: [], pickupAt: null }),
    }),
    {
      name: 'mongmo-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Total price of everything currently in the cart, in integer cents. */
export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}
