import { ThemedText } from '@/components/ThemedText';
import { ScreenScroll } from '@/components/ui/Screen';

/** S-01 Our story. */
export default function StoryScreen() {
  return (
    <ScreenScroll topInset>
      <ThemedText type="title">All about roots</ThemedText>
    </ScreenScroll>
  );
}
