import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BodyFont, Radius, Spacing } from '@/constants/theme';
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

/**
 * React Native's names for password autofill, as the HTML ones browsers and
 * password managers understand ("password" alone isn't a valid HTML value).
 */
const WEB_AUTOCOMPLETE: Partial<Record<string, string>> = {
  password: 'current-password',
  'password-new': 'new-password',
};

/** Labelled, outlined text input with an optional hint underneath. */
export function TextField({
  label,
  hint,
  surface = 'card',
  half = false,
  hideLabel = false,
  multiline,
  autoComplete,
  ...input
}: TextFieldProps) {
  const theme = useTheme();
  const webAutoComplete = Platform.OS === 'web' && autoComplete ? WEB_AUTOCOMPLETE[autoComplete] : undefined;
  return (
    <View style={[styles.field, half && styles.half]}>
      {hideLabel ? null : <ThemedText type="captionBold">{label}</ThemedText>}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        accessibilityHint={hint}
        multiline={multiline}
        autoComplete={(webAutoComplete ?? autoComplete) as TextInputProps['autoComplete']}
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
    borderRadius: Radius.medium + 2,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...BodyFont.regular,
    fontSize: 14,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});
