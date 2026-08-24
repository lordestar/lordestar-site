/**
 * NowListeningCard 的数学与材质引擎。
 *
 * 移植自用户提供的 "Holo" 全息卡 engine.ts，核心思路：
 *   - 指针/陀螺仪归一化为同一 {x,y}（-1..1）；
 *   - 两个不同刚度的阻尼跟随器（卡片快、箔片慢）产生"材质滞后"；
 *   - 材质 = 数据（Layer[]），全部经 CSS 变量驱动；
 *   - 打印面（卡片底色）固定，只有箔片随倾斜变化。
 * 改动：移除 mediaUrl 依赖，封面 URL 由 props 传入（applyFoil 的 tileSrc）。
 */

export interface Vec {
  x: number;
  y: number;
}

/** 归一化重映射。 */
export function adjust(
  v: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  return toMin + ((toMax - toMin) * (v - fromMin)) / (fromMax - fromMin);
}

export function clamp(v: number, min = -1, max = 1): number {
  return Math.min(Math.max(v, min), max);
}

/** 指针位置 → 以元素中心为原点的 -1..1。 */
export function fromPointer(rect: DOMRect, cx: number, cy: number): Vec {
  return {
    x: clamp(((cx - rect.left) / rect.width) * 2 - 1),
    y: clamp(((cy - rect.top) / rect.height) * 2 - 1),
  };
}

/**
 * 阻尼跟随器：指数趋近目标，无过冲。velocity/speed 用于速度相关的材质行为。
 */
export class Follow {
  value: Vec = { x: 0, y: 0 };
  target: Vec = { x: 0, y: 0 };
  velocity: Vec = { x: 0, y: 0 };
  speed = 0;

  constructor(private stiffness: number) {}

  step() {
    const px = this.value.x;
    const py = this.value.y;
    this.value.x += (this.target.x - this.value.x) * this.stiffness;
    this.value.y += (this.target.y - this.value.y) * this.stiffness;
    this.velocity.x = this.value.x - px;
    this.velocity.y = this.value.y - py;
    const raw = Math.min(1, Math.hypot(this.velocity.x, this.velocity.y) * 14);
    this.speed += (raw - this.speed) * (raw > this.speed ? 0.45 : 0.06);
  }

  get settled(): boolean {
    return (
      Math.abs(this.target.x - this.value.x) < 0.0006 &&
      Math.abs(this.target.y - this.value.y) < 0.0006 &&
      this.speed < 0.004
    );
  }
}

/** 一次性的离手过冲（扔出去时的惯性）。 */
export class Kick {
  private amount: Vec = { x: 0, y: 0 };
  private life = 0;

  fire(v: Vec, gain = 2.6) {
    const mag = Math.hypot(v.x, v.y);
    if (mag < 0.002) return;
    this.amount = { x: v.x * gain, y: v.y * gain };
    this.life = 1;
  }

  step(): Vec {
    if (this.life <= 0) return { x: 0, y: 0 };
    this.life = Math.max(0, this.life - 0.035);
    const e = Math.sin(this.life * Math.PI) * this.life;
    return { x: this.amount.x * e, y: this.amount.y * e };
  }

  get active(): boolean {
    return this.life > 0;
  }
}

/**
 * 设备方向，首次读数归零：只响应"相对当前握持姿势"的倾斜。
 */
export class Orientation {
  private base: { beta: number; gamma: number } | null = null;
  private range = 22;

  read(e: DeviceOrientationEvent): Vec | null {
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return null;
    if (!this.base) {
      this.base = { beta, gamma };
      return { x: 0, y: 0 };
    }
    return {
      x: clamp((gamma - this.base.gamma) / this.range),
      y: clamp((beta - this.base.beta) / this.range),
    };
  }

  reset() {
    this.base = null;
  }
}

/* ── 材质层与箔片 ────────────────────────────────────────────────────────── */

export interface Layer {
  img: string;
  size: string;
  /** 每单位倾斜时该层的滑动倍率；负值反向。 */
  rate: number;
  bgBlend?: string;
  blend: string;
  filter: string;
  /** 正对时的透明度。 */
  base: number;
  /** 倾斜时额外增加的透明度；负值表示随倾斜淡出。 */
  gain: number;
}

export interface Foil {
  key: string;
  label: string;
  layers: Layer[];
  parallax: number;
  bloom: number;
  glare: number;
}

export interface Live {
  parallax: number;
  bloom: number;
}

export interface Motion {
  speed?: number;
  velocity?: Vec;
  time?: number;
}

const S = [
  'hsl(2, 100%, 73%)',
  'hsl(53, 100%, 69%)',
  'hsl(93, 100%, 69%)',
  'hsl(176, 100%, 76%)',
  'hsl(228, 100%, 74%)',
  'hsl(283, 100%, 73%)',
];

function rainbow(angle: string, space: string, hues: string[] = S): string {
  const stops = hues
    .map((c, i) => `${c} calc(${space} * ${i + 1})`)
    .concat(`${hues[0]} calc(${space} * ${hues.length + 1})`)
    .join(', ');
  return `repeating-linear-gradient(${angle}, ${stops})`;
}

const GLITTER = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27100%27%20height%3D%27100%27%20fill%3D%27%23fff%27%3E%3Cpath%20d%3D%27M34%2015.3L35.7%2019L34%2023.3L33.3%2019Z%27%20opacity%3D%270.54%27%20transform%3D%27rotate%2848%2034%2019%29%27%2F%3E%3Cpath%20d%3D%27M38%207.5L39.3%2011L38%2014.7L37.1%2011Z%27%20opacity%3D%270.52%27%20transform%3D%27rotate%2839%2038%2011%29%27%2F%3E%3Cpath%20d%3D%27M12%2010.6L13.2%2014L12%2017.4L11.1%2014Z%27%20opacity%3D%270.91%27%20transform%3D%27rotate%2811%2012%2014%29%27%2F%3E%3Cpath%20d%3D%27M26%2056.4L27.1%2061L26%2066.1L24.2%2061Z%27%20opacity%3D%270.79%27%20transform%3D%27rotate%2836%2026%2061%29%27%2F%3E%3Cpath%20d%3D%27M92%205.5L93.3%2010L92%2014.7L90.5%2010Z%27%20opacity%3D%270.64%27%20transform%3D%27rotate%2813%2092%2010%29%27%2F%3E%3Cpath%20d%3D%27M16%2028.7L17.7%2033L16%2037.6L15.0%2033Z%27%20opacity%3D%270.59%27%20transform%3D%27rotate%2852%2016%2033%29%27%2F%3E%3Cpath%20d%3D%27M62%2035.0L63.3%2039L62%2042.5L61.1%2039Z%27%20opacity%3D%270.53%27%20transform%3D%27rotate%285%2062%2039%29%27%2F%3E%3Cpath%20d%3D%27M24%2062.5L25.1%2066L24%2069.3L23.1%2066Z%27%20opacity%3D%270.66%27%20transform%3D%27rotate%2853%2024%2066%29%27%2F%3E%3Cpath%20d%3D%27M46%2028.0L47.2%2032L46%2036.8L44.6%2032Z%27%20opacity%3D%270.85%27%20transform%3D%27rotate%2822%2046%2032%29%27%2F%3E%3Cpath%20d%3D%27M57%2047.6L57.9%2052L57%2056.9L55.2%2052Z%27%20opacity%3D%270.86%27%20transform%3D%27rotate%2826%2057%2052%29%27%2F%3E%3Cpath%20d%3D%27M92%2013.0L93.3%2016L92%2019.8L91.2%2016Z%27%20opacity%3D%270.88%27%20transform%3D%27rotate%2814%2092%2016%29%27%2F%3E%3Cpath%20d%3D%27M49%205.4L50.3%209L49%2013.5L47.8%209Z%27%20opacity%3D%270.88%27%20transform%3D%27rotate%2852%2049%209%29%27%2F%3E%3Cpath%20d%3D%27M83%2029.5L84.3%2034L83%2037.8L81.8%2034Z%27%20opacity%3D%270.80%27%20transform%3D%27rotate%2852%2083%2034%29%27%2F%3E%3Cpath%20d%3D%27M46%2075.1L47.6%2080L46%2084.8L44.7%2080Z%27%20opacity%3D%270.74%27%20transform%3D%27rotate%2860%2046%2080%29%27%2F%3E%3C%2Fsvg%3E")`;

/**
 * 全息材质。默认用 "holo"（三层光谱箔片），其余保留供调试。
 * 对浅色（灰白）打印面，饱和度保持较高。
 */
export const FOILS: Foil[] = [
  {
    key: 'holo',
    label: 'Holo',
    layers: [
      {
        img: rainbow('10deg', '8%'),
        size: '380% 380%',
        rate: 1,
        blend: 'overlay',
        filter: 'brightness(1.08) contrast(2.3) saturate(1.5)',
        base: 0.26,
        gain: 0.6,
      },
      {
        img: rainbow('104deg', '13%'),
        size: '300% 300%',
        rate: -0.7,
        blend: 'color-dodge',
        filter: 'brightness(0.82) contrast(2) saturate(1.7)',
        base: 0.14,
        gain: 0.34,
      },
      {
        img: 'repeating-linear-gradient(96deg, rgba(255,255,255,.5) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,.16) 3px, rgba(255,255,255,0) 5px)',
        size: 'auto',
        rate: 1.8,
        blend: 'overlay',
        filter: 'contrast(1.3)',
        base: 0.1,
        gain: 0.26,
      },
    ],
    parallax: 0.26,
    bloom: 0.55,
    glare: 0.55,
  },
  {
    key: 'brushed',
    label: 'Brushed',
    layers: [
      {
        img: rainbow('94deg', '4%', [
          'hsl(30,40%,86%)',
          'hsl(200,30%,88%)',
          'hsl(260,25%,87%)',
          'hsl(180,25%,89%)',
          'hsl(40,30%,88%)',
          'hsl(220,25%,87%)',
        ]),
        size: '260% 260%',
        rate: 0.8,
        blend: 'soft-light',
        filter: 'brightness(1.02) contrast(1.7) saturate(0.55)',
        base: 0.34,
        gain: 0.3,
      },
    ],
    parallax: 0.13,
    bloom: 0.32,
    glare: 0.34,
  },
];

/** 卡片边缘最大倾斜角。 */
export const MAX_TILT = 14;

/** CSS 提供的箔片层数。 */
export const LAYER_SLOTS = 3;

/** 灰白打印面（固定的卡片底色，不随材质变化）。 */
const BODY = ['#f6f7f9', '#eef0f4', '#e4e7ed', '#eaecef'];

/** 封面瓦片的双色调 [深, 浅]。 */
const TILE: [string, string] = ['#3a4a5c', '#eef2f6'];

/**
 * 写入材质的静态（非逐帧）变量。
 */
export function applyFoil(card: HTMLElement, foil: Foil, tileSrc: string): void {
  const s = card.style;
  s.setProperty('--tile-src', `url("${tileSrc}")`);
  s.setProperty('--body-grad', `linear-gradient(115deg, ${BODY.join(', ')})`);
  s.setProperty('--tile-dark', TILE[0]);
  s.setProperty('--tile-light', TILE[1]);
  s.setProperty('--glare-o', `${foil.glare}`);

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const n = `--l${i + 1}`;
    const L = foil.layers[i];
    if (!L) {
      s.setProperty(`${n}-img`, 'none');
      s.setProperty(`${n}-o`, '0');
      continue;
    }
    s.setProperty(`${n}-img`, L.img);
    s.setProperty(`${n}-size`, L.size);
    s.setProperty(`${n}-bgblend`, L.bgBlend ?? 'normal');
    s.setProperty(`${n}-blend`, L.blend);
    s.setProperty(`${n}-filter`, L.filter);
  }
}

/**
 * 写入一帧的 CSS 变量：倾斜旋转、箔片位置/透明度、高光、边缘受光等。
 */
export function applyFrame(
  card: HTMLElement,
  tilt: Vec,
  sheet: Vec,
  foil: Foil,
  live: Live,
  motion: Motion = {},
): void {
  const { x, y } = tilt;
  const s = card.style;

  s.setProperty('--rx', `${(-y * MAX_TILT).toFixed(2)}deg`);
  s.setProperty('--ry', `${(x * MAX_TILT).toFixed(2)}deg`);

  const p = live.parallax;

  // 每层按各自 rate 滑动（负 rate 反向，两层干涉产生油彩感）
  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    const t = p * L.rate;
    const n = `--l${i + 1}`;
    s.setProperty(`${n}-x`, `${adjust(sheet.x, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`);
    s.setProperty(`${n}-y`, `${adjust(sheet.y, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`);
  }

  const off = Math.min(1, Math.hypot(x, y));
  s.setProperty('--off', off.toFixed(3));

  // 高光位置直接跟随指针（无滞后）
  s.setProperty('--gx', `${adjust(x, -1, 1, 12, 88).toFixed(1)}%`);
  s.setProperty('--gy', `${adjust(y, -1, 1, 12, 88).toFixed(1)}%`);

  // 封面瓦片轻微反向漂移，与卡片面分离
  s.setProperty('--tile-x', `${adjust(sheet.x, -1, 1, 58, 42).toFixed(1)}%`);

  // 全息"甜点"：固定偏心高光点，倾斜到该角度时整体提亮
  const SPOT = { x: -0.42, y: -0.36 };
  const dSpot = Math.hypot(sheet.x - SPOT.x, sheet.y - SPOT.y);
  const hit = Math.max(0, 1 - dSpot / 0.34);
  const spotBloom = hit * hit * (3 - 2 * hit);
  s.setProperty('--spot', spotBloom.toFixed(3));

  // 静止时的呼吸动画（两个互质周期，不显式循环）
  const breathNow =
    0.5 + 0.5 * Math.sin((motion.time ?? 0) * 0.5) * Math.cos((motion.time ?? 0) * 0.31);
  s.setProperty('--breath', breathNow.toFixed(3));

  // 每层透明度：base + 倾斜增益，甜点统一提亮，呼吸微动
  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    let o = Math.max(0, L.base + off * L.gain * (live.bloom / 0.5));
    o *= 1 + spotBloom * 0.85;
    o *= 0.94 + breathNow * 0.06;
    s.setProperty(`--l${i + 1}-o`, Math.min(1, o).toFixed(3));
  }

  // 封面翻转：超过阈值后按倾斜方向扫入反向色
  const softOff = Math.min(1, Math.hypot(sheet.x, sheet.y));
  const FLIP_FROM = 0.52;
  const flip = Math.max(0, Math.min(1, (softOff - FLIP_FROM) / (1 - FLIP_FROM)));
  s.setProperty('--tile-invert', flip.toFixed(3));
  s.setProperty('--tile-hue', `${(150 + flip * 120).toFixed(0)}deg`);
  s.setProperty(
    '--tile-sweep-angle',
    `${(Math.atan2(sheet.y, sheet.x) * (180 / Math.PI) + 90).toFixed(0)}deg`,
  );

  // 速度 → 拖影
  const speed = motion.speed ?? 0;
  const vel = motion.velocity ?? { x: 0, y: 0 };
  s.setProperty('--speed', speed.toFixed(3));
  if (Math.hypot(vel.x, vel.y) > 0.0001) {
    s.setProperty('--smear-angle', `${(Math.atan2(vel.y, vel.x) * (180 / Math.PI)).toFixed(0)}deg`);
  }
  s.setProperty('--smear', (Math.min(1, speed) * 0.8).toFixed(3));

  // 文字浮雕：高光/阴影来自倾斜对侧
  s.setProperty('--emboss-x', `${(-x * 0.9).toFixed(2)}px`);
  s.setProperty('--emboss-y', `${(-y * 0.9).toFixed(2)}px`);

  // 四边独立受光（厚度感）
  s.setProperty('--edge-l', Math.max(0, -x).toFixed(3));
  s.setProperty('--edge-r', Math.max(0, x).toFixed(3));
  s.setProperty('--edge-t', Math.max(0, -y).toFixed(3));
  s.setProperty('--edge-b', Math.max(0, y).toFixed(3));
}
