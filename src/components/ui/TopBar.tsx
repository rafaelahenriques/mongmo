import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type TopBarProps = {
  title: string;
  /** Small grey value on the right: "1/5", "+20", "25 points". */
  value?: string;
  /** A control on the right instead of a value. */
  trailing?: ReactNode;
  /** Back (chevron) or close (×); none on a tab's first screen. */
  onBack?: () => void;
  backIcon?: Extract<IconName, 'chevronLeft' | 'close'>;
  /** Pad for the status bar (when nothing above it does). */
  topInset?: boolean;
  /** Light text, for bars over a dark screen. */
  inverse?: boolean;
};

/**
 * The design's top bar: a chevron, the screen's name in uppercase Outfit
 * Black, and an optional value on the right. Used as every stack header.
 */
export function TopBar({
  title,
  value,
  trailing,
  onBack,
  backIcon = 'chevronLeft',
  topInset = true,
  inverse = false,
}: TopBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const color = inverse ? theme.onSurfaceDark : theme.text;

  return (
    <View style={[styles.bar, { paddingTop: (topInset ? insets.top : 0) + 14 }]}>
      {onBack ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            onBack();
          }}
          accessibilityRole="button"
          accessibilityLabel={backIcon === 'close' ? 'Close' : 'Back'}
          hitSlop={12}
          style={styles.back}
        >
          <Icon name={backIcon} size={22} color={color} weight="semibold" />
        </Pressable>
      ) : null}
      <ThemedText type="card" numberOfLines={1} style={[styles.title, { color }]} accessibilityRole="header">
        {title}
      </ThemedText>
      {value ? (
        <ThemedText type="captionBold" style={{ color: inverse ? theme.onSurfaceDark : theme.textSecondary }}>
          {value}
        </ThemedText>
      ) : null}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: PageInset,
    paddingBottom: 16,
  },
  // 44 × 44 to tap; pulled left so the chevron stays on the margin.
  back: {
    minWidth: 44,
    minHeight: 44,
    marginLeft: -11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
