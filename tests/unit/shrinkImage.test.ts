import { uploadImage } from '@/api/storage';
import { supabase } from '@/lib/supabase';
import { hasNativeFeature } from '@/services/nativeModules';
import { shrinkImage, sideToShrink, type Resizer } from '@/services/shrinkImage';

/**
 * Photos are shrunk and saved as JPEG before they're uploaded
 * (services/shrinkImage.ts), with a stand-in for the native resizer.
 */
const mockResizer = {
  decoded: { width: 4032, height: 3024 },
  fail: false,
  loads: [] as { source: unknown; options: unknown }[],
  resizes: [] as unknown[],
  saves: [] as unknown[],
  released: 0,
};

/** A stand-in for expo-image-manipulator: records what it's asked and resizes numbers, not pixels. */
function fakeResizer(): Resizer {
  const imageRef = (width: number, height: number) => ({
    width,
    height,
    release: () => {
      mockResizer.released += 1;
    },
    saveAsync: async (options: unknown) => {
      mockResizer.saves.push(options);
      return { uri: 'file:///cache/shrunk.jpg', width, height };
    },
  });
  return {
    SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
    ImageManipulator: {
      manipulate: (source: unknown, options?: unknown) => {
        mockResizer.loads.push({ source, options });
        let size = { ...mockResizer.decoded };
        const context = {
          resize: (to: { width?: number; height?: number }) => {
            mockResizer.resizes.push(to);
            const scale = to.width ? to.width / size.width : (to.height ?? size.height) / size.height;
            size = { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
            return context;
          },
          renderAsync: async () => {
            if (mockResizer.fail) throw new Error('cannot decode');
            return imageRef(size.width, size.height);
          },
        };
        return context;
      },
    },
  } as unknown as Resizer;
}

/** The real shrinkImage, with the stand-in resizer. */
const shrink = (uri: string, maxSide: number) =>
  jest
    .requireActual<typeof import('@/services/shrinkImage')>('@/services/shrinkImage')
    .shrinkImage(uri, maxSide, async () => fakeResizer());

// uploadImage gets the real shrinkImage too, through the stand-in.
jest.mock('@/services/shrinkImage', () => ({
  ...jest.requireActual('@/services/shrinkImage'),
  shrinkImage: jest.fn(),
}));
jest.mock('@/services/nativeModules', () => ({ hasNativeFeature: jest.fn(() => true) }));

const mockUpload = jest.fn(async (_path: string, _bytes: unknown, _options: unknown) => ({ error: null }));
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: jest.fn(() => ({ upload: mockUpload })) } },
}));
jest.mock('expo-file-system', () => ({
  File: function File() {
    return { arrayBuffer: async () => new ArrayBuffer(8) };
  },
}));

const hasFeature = jest.mocked(hasNativeFeature);
const shrinkForUpload = jest.mocked(shrinkImage);

beforeEach(() => {
  jest.clearAllMocks();
  hasFeature.mockReturnValue(true);
  shrinkForUpload.mockImplementation(shrink);
  Object.assign(mockResizer, {
    decoded: { width: 4032, height: 3024 },
    fail: false,
    loads: [],
    resizes: [],
    saves: [],
    released: 0,
  });
});

describe('sideToShrink', () => {
  it('sets the longest side, whichever it is', () => {
    expect(sideToShrink(4032, 3024, 1600)).toEqual({ width: 1600 });
    expect(sideToShrink(3024, 4032, 1600)).toEqual({ height: 1600 });
    expect(sideToShrink(2000, 2000, 1600)).toEqual({ width: 1600 });
  });

  it('leaves an image that already fits', () => {
    expect(sideToShrink(1600, 1200, 1600)).toBeNull();
    expect(sideToShrink(640, 480, 1600)).toBeNull();
  });
});

describe('shrinkImage', () => {
  it('shrinks a camera photo to the size asked for and saves it as a JPEG', async () => {
    await expect(shrink('file:///photo.heic', 1600)).resolves.toEqual({
      uri: 'file:///cache/shrunk.jpg',
      mimeType: 'image/jpeg',
    });
    // Decoded at no more than twice the target, so the full photo never sits in memory.
    expect(mockResizer.loads[0]).toEqual({
      source: 'file:///photo.heic',
      options: { maxWidth: 3200, maxHeight: 3200 },
    });
    expect(mockResizer.resizes).toEqual([{ width: 1600 }]);
    expect(mockResizer.saves).toEqual([{ format: 'jpeg', compress: 0.8 }]);
    // Both the decoded and the resized image are freed.
    expect(mockResizer.released).toBe(2);
  });

  it('only re-saves an image that is already small enough', async () => {
    mockResizer.decoded = { width: 800, height: 600 };
    await shrink('file:///small.png', 1600);
    expect(mockResizer.resizes).toEqual([]);
    expect(mockResizer.saves).toEqual([{ format: 'jpeg', compress: 0.8 }]);
    expect(mockResizer.released).toBe(1);
  });

  it('says so when this install has no resizer', async () => {
    hasFeature.mockReturnValue(false);
    await expect(shrink('file:///photo.jpg', 1600)).resolves.toBeNull();
    expect(mockResizer.loads).toEqual([]);
  });
});

describe('uploading a photo', () => {
  const uploaded = () => {
    const [path, , options] = mockUpload.mock.calls[0];
    return { path, options };
  };

  it('sends the shrunk JPEG, sized for where the photo is shown', async () => {
    await uploadImage({ bucket: 'avatars', folder: 'user-1', uri: 'file:///photo.heic', mimeType: 'image/heic' });
    expect(mockResizer.resizes).toEqual([{ width: 1024 }]);
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
    expect(uploaded().path).toMatch(/^user-1\/.+\.jpg$/);
    expect(uploaded().options).toEqual({ contentType: 'image/jpeg' });

    mockUpload.mockClear();
    mockResizer.resizes = [];
    await uploadImage({ bucket: 'challenge-photos', folder: 'user-1', uri: 'file:///photo.jpg' });
    expect(mockResizer.resizes).toEqual([{ width: 1600 }]);
  });

  it('sends the original when it can’t be shrunk', async () => {
    mockResizer.fail = true;
    await uploadImage({
      bucket: 'challenge-photos',
      folder: 'user-1',
      uri: 'file:///photo.heic',
      mimeType: 'image/heic',
    });
    expect(uploaded().path).toMatch(/\.heic$/);
    expect(uploaded().options).toEqual({ contentType: 'image/heic' });
  });

  it('sends the original from an install without the resizer', async () => {
    hasFeature.mockReturnValue(false);
    await uploadImage({ bucket: 'event-images', folder: 'events', uri: 'file:///photo.png', mimeType: 'image/png' });
    expect(uploaded().path).toMatch(/^events\/.+\.png$/);
    expect(uploaded().options).toEqual({ contentType: 'image/png' });
  });
});
