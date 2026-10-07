import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing } from '@/constants/theme';
import { usePlaceSuggestions } from '@/hooks/usePlaceSuggestions';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { DEFAULT_SEARCH_BIAS, PLACE_SEARCH_ATTRIBUTION, type PlaceSuggestion } from '@/services/placeSearch';
import { useLocationStore } from '@/state/locationStore';

export type PlaceSearchFieldProps = {
  onPick: (suggestion: PlaceSuggestion) => void;
  /** Return pressed with no suggestion to pick: look the text up another way. */
  onSubmitText?: (text: string) => void;
  /** That lookup is running. */
  searching?: boolean;
};

/**
 * "Search an address" with suggestions as you type, nearest to the owner
 * first. Picking one hands back its point, venue and city.
 */
export function PlaceSearchField({ onPick, onSubmitText, searching = false }: PlaceSearchFieldProps) {
  const theme = useTheme();
  const near = useLocationStore((state) => state.coordinates) ?? DEFAULT_SEARCH_BIAS;
  const [query, setQuery] = useState('');
  // The text of the last pick, so its own suggestions don't pop back up.
  const [picked, setPicked] = useState<string | null>(null);
  const { suggestions, loading, failed } = usePlaceSuggestions(query === picked ? '' : query, near);

  const pick = (suggestion: PlaceSuggestion) => {
    haptics.select();
    setQuery(suggestion.title);
    setPicked(suggestion.title);
    onPick(suggestion);
  };

  const submit = () => {
    if (suggestions[0]) pick(suggestions[0]);
    else if (query.trim()) onSubmitText?.(query.trim());
  };

  return (
    <View style={styles.container}>
      <View>
        <TextField
          label="Search an address"
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Grote Markt, Kortrijk"
          returnKeyType="search"
          autoCorrect={false}
          onSubmitEditing={submit}
          accessibilityHint="Suggestions appear below as you type."
        />
        {loading || searching ? <ActivityIndicator style={styles.spinner} color={theme.textSecondary} /> : null}
      </View>

      {suggestions.length > 0 ? (
        <View
          style={[styles.list, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          accessibilityLiveRegion="polite"
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion.id}
              onPress={() => pick(suggestion)}
              accessibilityRole="button"
              accessibilityLabel={[suggestion.title, suggestion.subtitle].filter(Boolean).join(', ')}
              style={({ pressed }) => [
                styles.row,
                index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <Icon name="pin" size={16} color={theme.textSecondary} />
              <View style={styles.texts}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {suggestion.title}
                </ThemedText>
                {suggestion.subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {suggestion.subtitle}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          ))}
          <ThemedText type="small" themeColor="textSecondary" style={styles.attribution}>
            {PLACE_SEARCH_ATTRIBUTION}
          </ThemedText>
        </View>
      ) : failed ? (
        <ThemedText type="small" themeColor="textSecondary">
          Suggestions aren’t available right now
          {onSubmitText ? ' — press search on the keyboard to look the address up.' : '.'}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  spinner: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 15,
  },
  list: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  attribution: {
    fontSize: 11,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
});
