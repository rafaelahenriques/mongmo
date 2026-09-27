import { create } from 'zustand';

import type { Coordinates } from '@/types';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

type LocationState = {
  permission: LocationPermissionStatus;
  /** Last known device position; null until (and unless) location is granted. */
  coordinates: Coordinates | null;
  setPermission: (permission: LocationPermissionStatus) => void;
  setCoordinates: (coordinates: Coordinates) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  permission: 'undetermined',
  coordinates: null,
  setPermission: (permission) => set({ permission }),
  setCoordinates: (coordinates) => set({ coordinates }),
}));
