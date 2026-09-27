import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attachMenu, detachMenu, getEventMenuIds, getMenus } from '@/api/owner';

/** Every menu in the catalog, and which of them are attached to this event. */
export function useEventMenus(eventId: string) {
  const queryClient = useQueryClient();

  const menusQuery = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const attachedQuery = useQuery({
    queryKey: ['event-menus', eventId],
    queryFn: () => getEventMenuIds(eventId),
    enabled: eventId.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-menus', eventId] });
    queryClient.invalidateQueries({ queryKey: ['events-with-menu'] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
  };

  const attach = useMutation({
    mutationFn: (menuId: string) => attachMenu(eventId, menuId),
    onSuccess: invalidate,
  });

  const detach = useMutation({
    mutationFn: (menuId: string) => detachMenu(eventId, menuId),
    onSuccess: invalidate,
  });

  return {
    menus: menusQuery.data ?? [],
    attachedMenuIds: new Set(attachedQuery.data ?? []),
    isLoading: menusQuery.isPending || attachedQuery.isPending,
    attach: attach.mutate,
    detach: detach.mutate,
  };
}
