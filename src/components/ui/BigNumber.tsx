import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';

/**
 * Big number, faded word: "25 POINTS", "M-42 PICKUP CODE". The number is
 * ink, the word stone and uppercase. Read out as one phrase.
 */
export function BigNumber({
  value,
  word,
  size = 30,
  stacked = false,
  inverse = false,
  style,
}: {
  value: string | number;
  word?: string;
  /** Font size of both parts; 30 inline, up to 96 for a screen's hero. */
  size?: number;
  /** The word under the number instead of after it. */
  stacked?: boolean;
  /** For a sage or dark block: ink number, paper word. */
  inverse?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  // Line height never below the size: iOS cuts the top off the glyphs.
  const text = { fontSize: size, lineHeight: size * (size > 40 ? 1.02 : 1.13), letterSpacing: (-2 * size) / 100 };
  return (
    <View
      style={[stacked ? styles.stacked : styles.inline, style]}
      accessible
      accessibilityLabel={[value, word].filter(Boolean).join(' ')}
    >
      <ThemedText type="title" style={[text, { color: theme.text }]}>
        {value}
      </ThemedText>
      {word ? (
        <ThemedText
          type="title"
          style={[text, { color: inverse ? theme.backgroundElement : theme.faded, textTransform: 'uppercase' }]}
        >
          {word}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  stacked: {
    alignItems: 'flex-start',
  },
});
