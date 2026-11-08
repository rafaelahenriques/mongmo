import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { ripple } from '@/components/ui/ripple';
import { Sticker } from '@/components/ui/Sticker';

export type TaskCardProps = {
  icon: IconName;
  /** A picture (a sticker) instead of the icon. Decorative: the title says what it is. */
  image?: number;
  title: string;
  subtitle?: string;
  /**
   * What sits on the right edge:
   * - `value`: a sage square with the reward ("+20").
   * - `arrow`: a sage square with a chevron (goes somewhere).
   * - `done`: a light stone square with a tick; the icon block turns sage.
   * - `plain`: just the value in grey ("+20", "now", "−30").
   */
  state?: 'value' | 'arrow' | 'done' | 'plain';
  value?: string;
  /** A second line under the subtitle (a hint, a status). */
  extra?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The task card: a rounded tile with an icon or sticker on the left, a
 * title and a grey line, and a round button or value on the right.
 * Challenges, notifications, rewards, services, history.
 */
export function TaskCard({
  icon,
  image,
  title,
  subtitle,
  state = 'value',
  value,
  extra,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: TaskCardProps) {
  const theme = useTheme();
  const done = state === 'done';

  const content = (
    <>
      <View style={[styles.iconBlock, { backgroundColor: done ? theme.brandFill : theme.backgroundSelected }]}>
        {image ? (
          <Sticker source={image} style={styles.image} />
        ) : (
          <Icon name={icon} size={24} color={done ? theme.onBrand : theme.text} />
        )}
      </View>
      <View style={styles.texts}>
        <ThemedText type="card" numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {subtitle}
          </ThemedText>
        ) : null}
        {extra}
      </View>
      {state === 'value' ? (
        <View style={[styles.box, styles.valueBox, { backgroundColor: theme.brandFill }]}>
          <ThemedText type="label" numberOfLines={1} style={{ color: theme.onBrand }}>
            {value}
          </ThemedText>
        </View>
      ) : state === 'arrow' ? (
        <View style={[styles.box, styles.arrowBox, { backgroundColor: theme.brandFill }]}>
          <Icon name="chevronRight" size={18} color={theme.onBrand} weight="semibold" />
        </View>
      ) : done ? (
        <View style={[styles.box, { backgroundColor: theme.backgroundSelected }]}>
          <Icon name="check" size={18} color={theme.text} weight="semibold" />
        </View>
      ) : value ? (
        <ThemedText type="captionBold" themeColor="textSecondary" style={styles.plain}>
          {value}
        </ThemedText>
      ) : null}
    </>
  );

  const cardStyle = [styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }, style];
  if (!onPress) {
    return (
      <View style={cardStyle} accessible accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      {...nameFromContent(accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', '))}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    borderRadius: Radius.card,
    overflow: 'hidden',
    paddingRight: 12,
  },
  // A rounded tile inside the card, with the icon or sticker on it.
  iconBlock: {
    width: 60,
    height: 60,
    margin: 10,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 56,
    height: 56,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 10,
  },
  box: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A word ("Redeem") widens the circle into a pill instead of breaking.
  valueBox: {
    width: 'auto',
    minWidth: 44,
    paddingHorizontal: 14,
  },
  arrowBox: {
    width: 40,
    height: 40,
  },
  plain: {
    paddingRight: 2,
  },
});
