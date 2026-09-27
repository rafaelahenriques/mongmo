import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** Visible above the field, and its accessibility label. */
  label: string;
  hint?: string;
  /** Fill for a field on a card (`muted`) or on the page (`card`). */
  surface?: 'muted' | 'card';
  /** Share a row with another half-width field. */
  half?: boolean;
};

/** Labelled, filled text input with an optional hint underneath. */
export function TextField({ label, hint, surface = 'muted', half = false, multiline, ...input }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.field, half && styles.half]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
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
            backgroundColor: surface === 'muted' ? theme.backgroundSelected : theme.backgroundElement,
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
    gap: Spacing.one + 2,
  },
  half: {
    flex: 1,
  },
  input: {
    minHeight: 50,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});
