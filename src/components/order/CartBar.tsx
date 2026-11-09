import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { ripple } from '@/components/ui/ripple';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { formatCents } from '@/utils/orderFormat';

/**
 * "View cart" floating over the menu once something's in it: a sage pill
 * with how many things in an ink circle, the words, the total and an arrow.
 * It reads "View cart · 2 items · 21,00".
 */
export function CartBar({ count, totalCents, onPress }: { count: number; totalCents: number; onPress: () => void }) {
  const theme = useTheme();
  const total = formatCents(totalCents);
  return (
    <Pressable
      android_ripple={ripple(theme.onBrand)}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`View cart · ${count} ${count === 1 ? 'item' : 'items'} · ${total}`}
      style={({ pressed }) => [
        styles.bar,
        { backgroundColor: theme.brandFill, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.count, { backgroundColor: theme.surfaceDark }]}>
        <ThemedText type="card" style={{ color: theme.brand }}>
          {count}
        </ThemedText>
      </View>
      <ThemedText type="button" numberOfLines={1} style={[styles.label, { color: theme.onBrand }]}>
        View cart
      </ThemedText>
      <ThemedText type="button" style={{ color: theme.onBrand }}>
        {total}
      </ThemedText>
      <Icon name="arrowRight" size={18} color={theme.onBrand} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingLeft: 8,
    paddingRight: 20,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  count: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
