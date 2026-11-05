import { useState, type PropsWithChildren } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';

/**
 * The scrolling page every tab screen uses: page background, side padding,
 * and a bottom inset that clears the native tab bar. `topInset` is for tab
 * roots with no navigation header (the status bar is theirs to avoid).
 * Pull down to refresh everything the screen is showing.
 */
export function ScreenScroll({
  children,
  topInset = false,
  contentStyle,
  keyboardShouldPersistTaps,
}: PropsWithChildren<{
  topInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'handled';
}>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset ? insets.top + Spacing.three : Spacing.three,
          paddingBottom: tabBarInset + Spacing.five,
        },
        contentStyle,
      ]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={
        <RefreshControl
          refreshing={refresh.refreshing}
          onRefresh={refresh.onRefresh}
          tintColor={theme.textSecondary}
          progressViewOffset={topInset ? insets.top : 0}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

/**
 * Pull-to-refresh that refetches every query the visible screen uses, so no
 * screen has to list its own.
 */
export function usePullToRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, onRefresh };
}

/** Section title with an optional text action on the right. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="section" accessibilityRole="header">
        {title}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" themeColor="primaryText">
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});
