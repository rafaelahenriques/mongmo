import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';

export type TaskCardProps = {
  icon: IconName;
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
 * The design's task card: a square icon block on the left, an uppercase
 * title and a grey line, and a square on the right edge. Challenges,
 * notifications, rewards, services, history.
 */
export function TaskCard({
  icon,
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
        <Icon name={icon} size={24} color={done ? theme.onBrand : theme.text} />
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
        <View style={[styles.box, { backgroundColor: theme.brandFill }]}>
          <ThemedText type="label" style={{ color: theme.onBrand }}>
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
    minHeight: 76,
  },
  iconBlock: {
    width: 76,
    alignSelf: 'stretch',
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
  },
  box: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBox: {
    width: 44,
    height: 44,
  },
  plain: {
    paddingRight: 14,
  },
});
