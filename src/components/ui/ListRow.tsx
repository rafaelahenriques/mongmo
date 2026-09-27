import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconBadge, type IconBadgeProps } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: IconBadgeProps['tone'];
  /** Right side: a value, a switch, a chip… */
  trailing?: ReactNode;
  /** Shows a chevron and makes the row a button. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Icon, title and subtitle, with an optional trailing control or chevron. */
export function ListRow({ title, subtitle, icon, iconTone = 'muted', trailing, onPress, accessibilityLabel }: ListRowProps) {
  const theme = useTheme();
  const content = (
    <>
      {icon ? <IconBadge name={icon} tone={iconTone} size={40} /> : null}
      <View style={styles.texts}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevronRight" size={16} color={theme.textSecondary} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 56,
    paddingVertical: Spacing.two,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
