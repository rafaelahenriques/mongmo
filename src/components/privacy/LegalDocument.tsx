import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** A legal text's shape: src/constants/privacyPolicy.json and termsOfUse.json. */
export type LegalText = {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
};

/**
 * The privacy policy or the terms of use, from their JSON: the same text as
 * the public pages (public/privacy.html and terms.html, made by
 * scripts/build-privacy-page.mjs) that the app stores link to.
 */
export function LegalDocument({
  text,
  onClose,
  bottomInset = 32,
  showTitle = true,
}: {
  text: LegalText;
  onClose?: () => void;
  bottomInset?: number;
  /** Off inside a stack screen, whose header already shows the title. */
  showTitle?: boolean;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      // Reachable with the keyboard, so it can be scrolled without a mouse.
      tabIndex={0}
      aria-label={text.title}
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
    >
      {showTitle ? (
        <ThemedText type="title" accessibilityRole="header" headingLevel={1}>
          {text.title}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">{`Last updated ${text.updated}`}</ThemedText>
      <ThemedText>{text.intro}</ThemedText>
      {text.sections.map((section) => (
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
