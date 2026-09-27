import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { List, Map as MapIcon } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ExploreMode = 'map' | 'list';

export type ModeToggleProps = {
  value: ExploreMode;
  onChange: (mode: ExploreMode) => void;
};

/** Map | List segmented toggle — both show the same upcoming pop-ups. */
function ModeToggleComponent({ value, onChange }: ModeToggleProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.segment, { backgroundColor: theme.backgroundElement }]}
      accessibilityRole="tablist"
      accessibilityLabel="Explore view"
    >
      {(
        [
          { mode: 'map' as const, label: 'Map', Icon: MapIcon },
          { mode: 'list' as const, label: 'List', Icon: List },
        ]
      ).map(({ mode, label, Icon }) => {
        const selected = mode === value;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label} view`}
            style={[styles.item, selected && { backgroundColor: theme.backgroundSelected }]}
          >
            <Icon size={16} color={theme.text} />
            <ThemedText type="smallBold" numberOfLines={1}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default memo(ModeToggleComponent);

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 12,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
