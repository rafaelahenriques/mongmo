import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';
import { useTabBarInset } from '@/hooks/useTabBarInset';

export default function PrivacyRoute() {
  return <PrivacyPolicy showTitle={false} bottomInset={useTabBarInset() + 32} />;
}
