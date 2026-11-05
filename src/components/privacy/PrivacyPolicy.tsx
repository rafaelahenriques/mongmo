import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { PageInset } from '@/constants/theme';
import policy from '@/constants/privacyPolicy.json';
import { useTheme } from '@/hooks/useTheme';

/**
 * The privacy policy, from src/constants/privacyPolicy.json: the same text
 * as the public page (public/privacy.html, made by
 * scripts/build-privacy-page.mjs) that the app stores link to.
 */
export function PrivacyPolicy({
  onClose,
  bottomInset = 32,
  showTitle = true,
}: {
  onClose?: () => void;
  bottomInset?: number;
  /** Off inside a stack screen, whose header already shows the title. */
  showTitle?: boolean;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
    >
      {showTitle ? (
        <ThemedText type="title" accessibilityRole="header" headingLevel={1}>
          {policy.title}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">{`Last updated ${policy.updated}`}</ThemedText>
      <ThemedText>{policy.intro}</ThemedText>
      {policy.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <ThemedText type="section" accessibilityRole="header">
            {section.heading}
          </ThemedText>
          {section.paragraphs.map((paragraph) => (
            <ThemedText key={paragraph.slice(0, 40)}>{paragraph}</ThemedText>
          ))}
        </View>
      ))}
      {onClose ? <Button label="Close" variant="secondary" onPress={onClose} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
});
