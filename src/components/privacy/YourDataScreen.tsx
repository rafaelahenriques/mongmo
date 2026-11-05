import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { exportMyData } from '@/api/privacy';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { PageInset } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { confirmDeleteAccount } from '@/services/auth';
import { errorMessage } from '@/services/confirm';
import { downloadMyData } from '@/services/dataExport';
import { haptics } from '@/services/haptics';

/** How many of each kind of record there are, for the summary. */
function count(data: Record<string, unknown> | undefined, key: string): string {
  const value = data?.[key];
  return Array.isArray(value) ? String(value.length) : '0';
}

/**
 * Your data: what Mongmo holds about you, and the four things you can do
 * with it (GDPR): see it here, download a copy, correct it, delete it.
 */
export default function YourDataScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const data = useQuery({ queryKey: ['my-data'], queryFn: exportMyData, staleTime: 0, gcTime: 0 });
  const [downloading, setDownloading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const account = data.data?.account as { email?: string | null; guest?: boolean } | undefined;
  const profile = data.data?.profile as { name?: string } | undefined;

  const download = async () => {
    setDownloading(true);
    setProblem(null);
    try {
      await downloadMyData();
      haptics.success();
    } catch (error) {
      haptics.error();
      setProblem(errorMessage(error, 'Couldn’t make the file. Try again.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <ThemedText>
        Everything Mongmo keeps about you. Your location, notifications and cart stay on your phone and aren’t listed
        here.
      </ThemedText>

      {data.isPending ? <ActivityIndicator color={theme.text} /> : null}
      {data.isError ? (
        <ThemedText themeColor="textSecondary" accessibilityRole="alert">
          Couldn’t load your data. Check your connection.
        </ThemedText>
      ) : null}
      {data.data ? (
        <View>
          <ListRow title="Email" subtitle={account?.email ?? (account?.guest ? 'Guest, none' : '–')} chevron={false} />
          <ListRow title="Name" value={profile?.name ?? '–'} chevron={false} />
          <ListRow title="Orders" value={count(data.data, 'orders')} chevron={false} />
          <ListRow title="Points entries" value={count(data.data, 'points')} chevron={false} />
          <ListRow title="Badges" value={count(data.data, 'badges')} chevron={false} />
          <ListRow title="Rewards" value={count(data.data, 'rewards')} chevron={false} />
          <ListRow title="Check-ins" value={count(data.data, 'check_ins')} chevron={false} />
          <ListRow title="Challenge results" value={count(data.data, 'challenge_results')} chevron={false} />
          <ListRow title="Photos" value={count(data.data, 'photos')} chevron={false} last />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label="Download a copy" variant="primary" onPress={download} loading={downloading} />
        <ThemedText type="small" themeColor="textSecondary">
          A file with all of the above, to keep or take elsewhere.
        </ThemedText>
        {problem ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {problem}
          </ThemedText>
        ) : null}
        <Button label="Correct my profile" variant="secondary" onPress={() => router.push('/(profile)/edit')} />
        <Button label="Read the privacy policy" variant="ghost" onPress={() => router.push('/(profile)/privacy')} />
        <Button label="Delete my account and data" variant="danger" onPress={() => void confirmDeleteAccount()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 12,
    gap: 20,
  },
  actions: {
    gap: 12,
  },
});
