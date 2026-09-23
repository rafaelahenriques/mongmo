import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import PopupCard from '@/components/PopupCard';
import { ThemedText } from '@/components/themed-text';
import { MOCK_POPUPS } from '@/constants/mock-data';
import { Spacing } from '@/constants/theme';
import type { PopUp } from '@/types';

export default function PopupsScreen() {
  const renderItem: ListRenderItem<PopUp> = useCallback(
    ({ item }) => <PopupCard popup={item} />,
    [],
  );

  const keyExtractor = useCallback((item: PopUp) => item.id, []);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <FlatList
      data={MOCK_POPUPS}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={renderSeparator}
      contentContainerStyle={styles.content}
      style={styles.list}
      ListEmptyComponent={
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          No pop-ups scheduled yet.
        </ThemedText>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
