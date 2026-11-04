import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconBadge, type IconBadgeProps } from '@/components/ui/IconBadge';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: IconBadgeProps['tone'];
  /** A short value before the chevron ("2 of 5", "Always"). */
  value?: string;
  /** Right side: a switch, a chip… */
  trailing?: ReactNode;
  /** Shows a chevron and makes the row a button. */
  onPress?: () => void;
  /** Leaves off the stone rule under the row (the last row of a group). */
  last?: boolean;
  accessibilityLabel?: string;
};

/**
 * The design's info row: title (and sub), an optional value and a chevron,
 * over a stone hairline. Settings, profile links, menus for a pop-up.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = 'muted',
  value,
  trailing,
  onPress,
  last = false,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const rowStyle = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }];
  const content = (
    <>
      {icon ? <IconBadge name={icon} tone={iconTone} size={40} /> : null}
      <View style={styles.texts}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {value ? <ThemedText type="captionBold">{value}</ThemedText> : null}
      {trailing}
      {onPress ? <Icon name="chevronRight" size={16} color={theme.text} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, value].filter(Boolean).join(', ')}
      style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 45,
    paddingVertical: 12,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
