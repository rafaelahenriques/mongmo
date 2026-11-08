import { render, screen } from '@testing-library/react-native';

import MapView from '@/components/map/MapView';

// An Android build without a Google Maps key: opening the real map would
// close the app.
jest.mock('@/lib/liveMap', () => ({ LIVE_MAP: false }));
jest.mock('react-native-maps', () => {
  const Unreachable = () => {
    throw new Error('the native map must not be drawn without a key');
  };
  return { __esModule: true, default: Unreachable, Polyline: Unreachable, Marker: Unreachable };
});

it('shows the drawn map with a note instead of the live one', async () => {
  await render(
    <MapView
      initialRegion={{ latitude: 50.83, longitude: 3.27, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      showsUserLocation={false}
      store={null}
      events={[]}
      onSelectStore={() => {}}
      onSelectEvent={() => {}}
    />,
  );
  expect(screen.getByText("The live map isn't in this version of the app.")).toBeTruthy();
});
