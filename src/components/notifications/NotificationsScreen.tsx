import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ScreenScroll } from '@/components/ui/Screen';
import { TaskCard } from '@/components/ui/TaskCard';
import { useNotificationsFeed, type FeedItem } from '@/hooks/useNotificationsFeed';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/state/settingsStore';

/** "now", "8 min", "1 h", then the weekday ("Mon"). */
function ago(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 2) return 'now';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h`;
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/**
 * H-02 Notifications: three kinds only — pop-ups, orders, rewards. Each
 * card opens its screen. Opening the list clears Home's "new" count.
 */
export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { items, isPending } = useNotificationsFeed();
  const markSeen = useSettingsStore((state) => state.markNotificationsSeen);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const open = (item: FeedItem) => {
    const target = item.target;
    if (target.tab === 'orders') router.push({ pathname: '/(orders)/order/status/[id]', params: { id: target.orderId } });
    else if (target.tab === 'event') router.push({ pathname: '/(popups)/event/[id]', params: { id: target.eventId } });
    else router.push('/(profile)/achievements');
  };

  const today = items.filter((item) => isToday(item.at));
  const earlier = items.filter((item) => !isToday(item.at));

  return (
    <ScreenScroll contentStyle={styles.content}>
      {isPending ? <ActivityIndicator color={theme.text} /> : null}
      {!isPending && items.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          Nothing yet. Orders, pop-ups near you and points you earn show up here.
        </ThemedText>
      ) : null}
      {[
        ['Today', today],
        ['Earlier', earlier],
      ].map(([title, group]) =>
        (group as FeedItem[]).length ? (
          <View key={title as string} style={styles.group}>
            <ThemedText type="subtitle" accessibilityRole="header">
              {title as string}
            </ThemedText>
            {(group as FeedItem[]).map((item) => (
              <TaskCard
                key={item.id}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                state="plain"
                value={ago(item.at)}
                onPress={() => open(item)}
              />
            ))}
          </View>
        ) : null,
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
  },
  group: {
    gap: 8,
  },
});
