import { ScrollView, StyleSheet } from 'react-native';

import OwnerDishLimits from '@/components/owner/OwnerDishLimits';
import { ErrorState, LoadingState, useRefreshControl } from '@/components/ui/LoadState';
import { PageInset } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';

/** Owner: the most of each dish the café sells in a day (pop-ups have theirs on their own page). */
export default function OwnerCafeLimitsScreen() {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const refreshControl = useRefreshControl();
  const store = useStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {store.isPending ? (
        <LoadingState />
      ) : !store.data ? (
        <ErrorState message="Couldn’t load the café." onRetry={() => void store.refetch()} />
      ) : (
        <OwnerDishLimits
          place={{ storeId: store.data.id }}
          menuLocation={{ type: 'store', storeId: store.data.id }}
          perDay
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    gap: 16,
  },
});
