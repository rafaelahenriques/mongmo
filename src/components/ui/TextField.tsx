import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** Visible above the field, and its accessibility label. */
  label: string;
  hint?: string;
  /** Fill for a field on a stone block (`muted`) or on the page (`card`). */
  surface?: 'muted' | 'card';
  /** Share a row with another half-width field. */
  half?: boolean;
  /** The placeholder says what it is (Email, Password): keep the label for screen readers only. */
  hideLabel?: boolean;
};

/** Labelled, outlined text input with an optional hint underneath. */
export function TextField({
  label,
  hint,
  surface = 'card',
  half = false,
  hideLabel = false,
  multiline,
  ...input
}: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.field, half && styles.half]}>
      {hideLabel ? null : <ThemedText type="captionBold">{label}</ThemedText>}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        accessibilityHint={hint}
        multiline={multiline}
        {...input}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: surface === 'muted' ? theme.backgroundElement : theme.outline,
          },
          multiline && styles.multiline,
        ]}
      />
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
  input: {
    minHeight: 46,
    borderRadius: Radius.small,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});
