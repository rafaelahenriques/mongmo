import { LegalDocument } from '@/components/privacy/LegalDocument';
import policy from '@/constants/privacyPolicy.json';

/** The privacy policy (src/constants/privacyPolicy.json, also public/privacy.html). */
export function PrivacyPolicy(props: { onClose?: () => void; bottomInset?: number; showTitle?: boolean }) {
  return <LegalDocument text={policy} {...props} />;
}
