import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMenuItem,
  deleteMenuItem,
  getOwnerMenus,
  setMenuItemAvailable,
  updateMenuItem,
  type MenuItemInput,
} from '@/api/owner';

/** The owner's menus with every item, and what can be done to an item. */
export function useOwnerMenu() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['owner', 'menu'], queryFn: getOwnerMenus });

  // Customers' menus ('menu', …) and pop-up pages read the same items.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['owner', 'menu'] }),
      queryClient.invalidateQueries({ queryKey: ['menu'] }),
      queryClient.invalidateQueries({ queryKey: ['event'] }),
    ]);

  const create = useMutation({
    mutationFn: ({ menuId, input }: { menuId: string; input: MenuItemInput }) => createMenuItem(menuId, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: MenuItemInput }) => updateMenuItem(itemId, input),
    onSuccess: invalidate,
  });
  const setAvailable = useMutation({
    mutationFn: ({ itemId, available }: { itemId: string; available: boolean }) =>
      setMenuItemAvailable(itemId, available),
    onSettled: invalidate,
  });
  const remove = useMutation({ mutationFn: (itemId: string) => deleteMenuItem(itemId), onSuccess: invalidate });

  return { query, menus: query.data ?? [], create, update, setAvailable, remove };
}
