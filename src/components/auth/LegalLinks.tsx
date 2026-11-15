import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';
import { TermsOfUse } from '@/components/privacy/TermsOfUse';
import { ThemedText } from '@/components/ThemedText';
import { useMotion } from '@/constants/motion';
import { paperAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * Agreeing to the terms: making an account or looking around as a guest
 * means agreeing to them, so they (and the privacy policy) open from here,
 * before anyone is signed in. One short line, and the two pages as links.
 */
export function LegalLinks({ onDark = false, agreement = 'By continuing, you agree to our terms of use.' }) {
  const theme = useTheme();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null);
  const close = () => setOpen(null);
  const color = onDark ? paperAlpha(0.8) : theme.textSecondary;
  const linkColor = onDark ? paperAlpha(0.95) : theme.text;

  const link = (label: string, page: 'terms' | 'privacy') => (
    <Pressable
      onPress={() => {
        haptics.tap();
        setOpen(page);
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
    >
      <ThemedText type="captionBold" style={[styles.underline, { color: linkColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.legal}>
      <ThemedText type="caption" style={[styles.center, { color }]}>
        {agreement}
      </ThemedText>
      <View style={styles.links}>
        {link('Terms of use', 'terms')}
        {link('Privacy policy', 'privacy')}
      </View>
      <Modal visible={open !== null} animationType={motion.sheet} presentationStyle="pageSheet" onRequestClose={close}>
        <View style={[styles.flex, { paddingTop: insets.top, backgroundColor: theme.background }]}>
          {open === 'terms' ? (
            <TermsOfUse onClose={close} bottomInset={insets.bottom + 32} />
          ) : open === 'privacy' ? (
            <PrivacyPolicy onClose={close} bottomInset={insets.bottom + 32} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  legal: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 20,
  },
  // At least 44 tall to tap, though it reads as a small link.
  link: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  flex: {
    flex: 1,
  },
});
