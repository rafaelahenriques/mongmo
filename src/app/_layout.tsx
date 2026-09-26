import AppTabs from '@/components/ui/AppTabs';
import { Providers } from '@/components/Providers';

export default function RootLayout() {
  return (
    <Providers>
      <AppTabs />
    </Providers>
  );
}
