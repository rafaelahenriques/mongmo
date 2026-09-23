import { StyleSheet, View } from 'react-native';

import MapView from '@/components/MapView';
import { MOCK_CAFE_LOCATION, MOCK_POPUP_LOCATIONS } from '@/constants/mock-data';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView cafeLoc={MOCK_CAFE_LOCATION} popupLocations={MOCK_POPUP_LOCATIONS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
