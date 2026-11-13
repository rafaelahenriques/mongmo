import { TermsOfUse } from '@/components/privacy/TermsOfUse';
import { useTabBarInset } from '@/hooks/useTabBarInset';

export default function TermsRoute() {
  return <TermsOfUse showTitle={false} bottomInset={useTabBarInset() + 32} />;
}
