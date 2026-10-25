/**
 * Just enough Lottie to play the launch intro exported from After Effects
 * (assets/animations/mongmo-intro.json) with Reanimated and react-native-svg,
 * without a Lottie runtime: shape layers with static paths and solid fills,
 * parenting, and keyframed anchor, position, scale, rotation and opacity with
 * bezier or hold easing. Anything else an export may hold (masks, trim paths,
 * gradients, precomps, text) is ignored.
 */

type Vector = number[];
/** 2D affine matrix as SVG writes it: x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Matrix = [number, number, number, number, number, number];

type LottieEase = { x: number | Vector; y: number | Vector };
type LottieKeyframe = { t: number; s: Vector; h?: number; o?: LottieEase; i?: LottieEase };
type LottieValue = { a: 0; k: number | Vector } | { a: 1; k: LottieKeyframe[] };
type LottiePosition = LottieValue | { s: true; x: LottieValue; y: LottieValue };
type LottieBezier = { v: Vector[]; i: Vector[]; o: Vector[]; c: boolean };

type LottieShape = {
  ty: string;
  /** Group contents. */
  it?: LottieShape[];
  /** Path. */
  ks?: { k: LottieBezier };
  /** Fill color (0–1 RGBA), opacity (0–100) and rule (1 nonzero, 2 even-odd). */
  c?: { k: Vector };
  o?: { k: number };
  /** The fill rule on a fill, the rotation on a group transform. */
  r?: number | { k: number };
  /** Group transform. */
  a?: { k: Vector };
  p?: { k: Vector };
  s?: { k: Vector };
};

type LottieLayerData = {
  ind: number;
  ty: number;
  nm: string;
  parent?: number;
  ip: number;
  op: number;
  st?: number;
  sr?: number;
  ks: { a?: LottieValue; p?: LottiePosition; s?: LottieValue; r?: LottieValue; rz?: LottieValue; o?: LottieValue };
  shapes?: LottieShape[];
};

type LottieAnimation = { w: number; h: number; fr: number; ip: number; op: number; layers: LottieLayerData[] };

/** One animated property: keyframe times (layer frames) and values. */
export type Track = {
  times: number[];
  values: Vector[];
  /** Per segment, a cubic-bezier [x1, y1, x2, y2] per dimension; `null` holds the value. */
  eases: (Vector[] | null)[];
};

type TransformTracks = {
  startFrame: number;
  stretch: number;
  anchor: Track;
  x: Track;
  y: Track;
  scale: Track;
  rotation: Track;
};

/** Everything about a layer that moves, kept apart from its paths so worklets capture only this. */
export type LayerMotion = {
  /** The layer's own transform last, after its parents' (outermost first). */
  chain: TransformTracks[];
  opacity: Track;
  startFrame: number;
  stretch: number;
  inFrame: number;
  outFrame: number;
};

export type LottiePath = { d: string; fill: string; fillOpacity: number; fillRule: 'nonzero' | 'evenodd' };

export type LottieLayer = {
  index: number;
  name: string;
  motion: LayerMotion;
  /** In layer coordinates, bottom-most first. */
  paths: LottiePath[];
  /** Box around `paths`, in layer coordinates. */
  bounds: { x: number; y: number; width: number; height: number };
};

export type LottieComposition = {
  width: number;
  height: number;
  frameRate: number;
  inFrame: number;
  outFrame: number;
  /** Shape layers in drawing order, bottom-most first. */
  layers: LottieLayer[];
};

const SHAPE_LAYER = 4;
const LINEAR = [0, 0, 1, 1];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function asVector(value: number | Vector): Vector {
  return typeof value === 'number' ? [value] : value;
}

function pick(value: number | Vector, dimension: number): number {
  return typeof value === 'number' ? value : value[Math.min(dimension, value.length - 1)];
}

function toTrack(value: LottieValue | undefined, fallback: Vector): Track {
  if (!value) return { times: [0], values: [fallback], eases: [] };
  if (value.a === 0) return { times: [0], values: [asVector(value.k)], eases: [] };
  const keys = value.k;
  return {
    times: keys.map((key) => key.t),
    values: keys.map((key) => key.s),
    eases: keys.slice(0, -1).map(({ s, h, o, i }) => {
      if (h) return null;
      if (!o || !i) return [LINEAR];
      return s.map((_, d) => [pick(o.x, d), pick(o.y, d), pick(i.x, d), pick(i.y, d)]);
    }),
  };
}

/** One dimension of a multi-dimensional track, e.g. x of an unseparated position. */
function dimension(track: Track, d: number): Track {
  return {
    times: track.times,
    values: track.values.map((value) => [value[d]]),
    eases: track.eases.map((ease) => ease && [ease[Math.min(d, ease.length - 1)]]),
  };
}

function transformTracks(layer: LottieLayerData): TransformTracks {
  const { a, p, s, r, rz } = layer.ks;
  let x: Track;
  let y: Track;
  if (p && 's' in p) {
    x = toTrack(p.x, [0]);
    y = toTrack(p.y, [0]);
  } else {
    const position = toTrack(p, [0, 0]);
    x = dimension(position, 0);
    y = dimension(position, 1);
  }
  return {
    startFrame: layer.st ?? 0,
    stretch: layer.sr ?? 1,
    anchor: toTrack(a, [0, 0]),
    x,
    y,
    scale: toTrack(s, [100, 100]),
    rotation: toTrack(r ?? rz, [0]),
  };
}

/** translate(position) · rotate · scale · translate(-anchor), the order After Effects applies them. */
function transformMatrix(anchor: Vector, position: Vector, scale: Vector, rotation: number): Matrix {
  const radians = (rotation * Math.PI) / 180;
  const sx = scale[0] / 100;
  const sy = scale[1] / 100;
  const a = Math.cos(radians) * sx;
  const b = Math.sin(radians) * sx;
  const c = -Math.sin(radians) * sy;
  const d = Math.cos(radians) * sy;
  return [a, b, c, d, position[0] - (a * anchor[0] + c * anchor[1]), position[1] - (b * anchor[0] + d * anchor[1])];
}

function multiply([a1, b1, c1, d1, e1, f1]: Matrix, [a2, b2, c2, d2, e2, f2]: Matrix): Matrix {
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function apply([a, b, c, d, e, f]: Matrix, [x, y]: Vector): Vector {
  return [a * x + c * y + e, b * x + d * y + f];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** SVG path data with `matrix` baked into every point, plus those points (the curve stays inside them). */
function pathData({ v, i, o, c }: LottieBezier, matrix: Matrix): { d: string; points: Vector[] } {
  const points: Vector[] = [];
  const at = (point: Vector) => {
    const mapped = apply(matrix, point);
    points.push(mapped);
    return `${round(mapped[0])} ${round(mapped[1])}`;
  };
  let d = `M${at(v[0])}`;
  for (let k = 1; k < (c ? v.length + 1 : v.length); k++) {
    const from = v[k - 1];
    const to = v[k % v.length];
    const control1 = [from[0] + o[k - 1][0], from[1] + o[k - 1][1]];
    const control2 = [to[0] + i[k % v.length][0], to[1] + i[k % v.length][1]];
    d += `C${at(control1)} ${at(control2)} ${at(to)}`;
  }
  return { d: c ? `${d}Z` : d, points };
}

/** Paths of a group (each filled by the fill beside it) and its subgroups, top-most first. */
function collectPaths(items: LottieShape[], parent: Matrix, paths: LottiePath[], points: Vector[]) {
  const transform = items.find((item) => item.ty === 'tr');
  const rotation = typeof transform?.r === 'object' ? transform.r.k : 0;
  const matrix = transform
    ? multiply(parent, transformMatrix(transform.a?.k ?? [0, 0], transform.p?.k ?? [0, 0], transform.s?.k ?? [100, 100], rotation))
    : parent;
  const fill = items.find((item) => item.ty === 'fl');
  const shapes = items.filter((item) => item.ty === 'sh' && item.ks).map((item) => pathData(item.ks!.k, matrix));
  if (fill?.c && shapes.length > 0) {
    const [r, g, b] = fill.c.k.map((channel) => Math.round(channel * 255));
    paths.push({
      d: shapes.map((shape) => shape.d).join(''),
      fill: `rgb(${r}, ${g}, ${b})`,
      fillOpacity: (fill.o?.k ?? 100) / 100,
      fillRule: fill.r === 2 ? 'evenodd' : 'nonzero',
    });
    shapes.forEach((shape) => points.push(...shape.points));
  }
  for (const item of items) {
    if (item.ty === 'gr' && item.it) collectPaths(item.it, matrix, paths, points);
  }
}

function boundsOf(points: Vector[]) {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  // A point of padding so antialiased edges aren't clipped.
  const x = Math.floor(Math.min(...points.map((point) => point[0]))) - 1;
  const y = Math.floor(Math.min(...points.map((point) => point[1]))) - 1;
  const width = Math.ceil(Math.max(...points.map((point) => point[0]))) + 1 - x;
  const height = Math.ceil(Math.max(...points.map((point) => point[1]))) + 1 - y;
  return { x, y, width, height };
}

/** Reads a Bodymovin/LottieFiles export. The JSON is trusted (bundled with the app), not validated. */
export function parseLottie(json: unknown): LottieComposition {
  const animation = json as LottieAnimation;
  const byIndex = new Map(animation.layers.map((layer) => [layer.ind, layer]));

  const chainOf = (layer: LottieLayerData): TransformTracks[] => {
    const parent = layer.parent === undefined ? undefined : byIndex.get(layer.parent);
    return [...(parent ? chainOf(parent) : []), transformTracks(layer)];
  };

  // Null layers only steer their children, through `chainOf`.
  const layers = animation.layers
    .filter((layer) => layer.ty === SHAPE_LAYER)
    .map((layer): LottieLayer => {
      const paths: LottiePath[] = [];
      const points: Vector[] = [];
      collectPaths(layer.shapes ?? [], IDENTITY, paths, points);
      return {
        index: layer.ind,
        name: layer.nm,
        motion: {
          chain: chainOf(layer),
          opacity: toTrack(layer.ks.o, [100]),
          startFrame: layer.st ?? 0,
          stretch: layer.sr ?? 1,
          inFrame: layer.ip,
          outFrame: layer.op,
        },
        paths: paths.reverse(),
        bounds: boundsOf(points),
      };
    })
    // Lottie lists the top-most layer first.
    .reverse();

  return {
    width: animation.w,
    height: animation.h,
    frameRate: animation.fr,
    inFrame: animation.ip,
    outFrame: animation.op,
    layers,
  };
}

/** y of the CSS-style cubic-bezier (0,0)-(x1,y1)-(x2,y2)-(1,1) at `x`. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  'worklet';
  const curve = (p1: number, p2: number, t: number) =>
    3 * p1 * (1 - t) * (1 - t) * t + 3 * p2 * (1 - t) * t * t + t * t * t;
  // x(t) only grows when x1 and x2 are within 0–1, so bisection finds t.
  const cx1 = Math.min(Math.max(x1, 0), 1);
  const cx2 = Math.min(Math.max(x2, 0), 1);
  let low = 0;
  let high = 1;
  let t = x;
  for (let step = 0; step < 24; step++) {
    const error = curve(cx1, cx2, t) - x;
    if (Math.abs(error) < 1e-5) break;
    if (error < 0) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return curve(y1, y2, t);
}

/** Value of `track` at `frame`, one number per dimension. */
export function sampleTrack(track: Track, frame: number): Vector {
  'worklet';
  const { times, values, eases } = track;
  const last = times.length - 1;
  if (frame <= times[0]) return values[0];
  if (frame >= times[last]) return values[last];
  let segment = 0;
  while (frame >= times[segment + 1]) segment++;
  const ease = eases[segment];
  const from = values[segment];
  if (!ease) return from;
  const to = values[segment + 1];
  const progress = (frame - times[segment]) / (times[segment + 1] - times[segment]);
  return from.map((value, d) => {
    const [x1, y1, x2, y2] = ease[Math.min(d, ease.length - 1)];
    return value + (to[d] - value) * cubicBezier(x1, y1, x2, y2, progress);
  });
}

type TransformStep =
  | { translateX: number }
  | { translateY: number }
  | { rotate: string }
  | { scaleX: number }
  | { scaleY: number };

/**
 * React Native transform list placing a layer at comp `frame`, for a
 * zero-size view (so its transform origin is the layer's 0,0).
 */
export function layerTransform(motion: LayerMotion, frame: number): TransformStep[] {
  'worklet';
  const steps: TransformStep[] = [];
  for (const layer of motion.chain) {
    const time = (frame - layer.startFrame) / layer.stretch;
    const [anchorX, anchorY] = sampleTrack(layer.anchor, time);
    const [scaleX, scaleY] = sampleTrack(layer.scale, time);
    steps.push(
      { translateX: sampleTrack(layer.x, time)[0] },
      { translateY: sampleTrack(layer.y, time)[0] },
      { rotate: `${sampleTrack(layer.rotation, time)[0]}deg` },
      { scaleX: scaleX / 100 },
      { scaleY: (scaleY ?? scaleX) / 100 },
      { translateX: -anchorX },
      { translateY: -(anchorY ?? 0) },
    );
  }
  return steps;
}

/** Layer opacity (0–1) at comp `frame`, 0 outside its in/out points. Not inherited from parents, as in After Effects. */
export function layerOpacity(motion: LayerMotion, frame: number): number {
  'worklet';
  if (frame < motion.inFrame || frame >= motion.outFrame) return 0;
  return sampleTrack(motion.opacity, (frame - motion.startFrame) / motion.stretch)[0] / 100;
}
