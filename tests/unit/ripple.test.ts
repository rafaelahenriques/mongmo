import { Platform } from 'react-native';

import { ripple } from '@/components/ui/ripple';

describe('ripple', () => {
  it('is Android only: iOS keeps its own press feedback', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(ripple('#1C1D19')).toBeUndefined();
  });

  it('on Android, ripples in the content colour at 12 %, over the control', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    expect(ripple('#1C1D19')).toEqual({ color: '#1C1D191F', foreground: true });
  });
});
