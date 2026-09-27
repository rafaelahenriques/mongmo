import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Spacing, TopTabInset } from '@/constants/theme';
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
          paddingTop: topInset ? insets.top + TopTabInset + Spacing.three : Spacing.three,
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

/** Big in-page heading for tab roots: optional eyebrow, title, trailing control. */
export function LargeHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTexts}>
        {eyebrow ? (
          <ThemedText type="small" themeColor="textSecondary">
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="title" accessibilityRole="header">
          {title}
        </ThemedText>
      </View>
      {trailing}
    </View>
  );
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});
