import { LegalDocument } from '@/components/privacy/LegalDocument';
import terms from '@/constants/termsOfUse.json';

/** The terms of use (src/constants/termsOfUse.json, also public/terms.html). */
export function TermsOfUse(props: { onClose?: () => void; bottomInset?: number; showTitle?: boolean }) {
  return <LegalDocument text={terms} {...props} />;
}
