// 俄罗斯方块游戏类型定义

// 方块类型
export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// 方块形状定义 (4x4 矩阵)
export const TETROMINO_SHAPES: Record<TetrominoType, boolean[][]> = {
  I: [
    [false, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
    [false, false, false, false],
  ],
  J: [
    [true, false, false],
    [true, true, true],
    [false, false, false],
  ],
  L: [
    [false, false, true],
    [true, true, true],
    [false, false, false],
  ],
  O: [
    [true, true],
    [true, true],
  ],
  S: [
    [false, true, true],
    [true, true, false],
    [false, false, false],
  ],
  T: [
    [false, true, false],
    [true, true, true],
    [false, false, false],
  ],
  Z: [
    [true, true, false],
    [false, true, true],
    [false, false, false],
  ],
};

// 方块颜色类型
type BlockColors = {
  main: string;
  dark: string;
  glow: string;
};

// 像素风格调色板 - 精致复古霓虹主题
export const PIXEL_COLORS: Record<TetrominoType, BlockColors> & {
  background: string;
  gridBg: string;
  gridLine: string;
  consoleBg: string;
  consoleBorder: string;
  consoleScreen: string;
  text: string;
  textDim: string;
  accent: string;
  accentGlow: string;
  score: string;
  level: string;
  particleWhite: string;
  particleGold: string;
  particleSilver: string;
  particleRainbow: string[];
  lineClear: string[];
  flash: string;
} = {
  // 方块颜色 - 复古霓虹渐变配色 (主色, 渐变暗色)
  I: { main: '#00FFFF', dark: '#00CCCC', glow: '#00FFFF' },  // 青色霓虹
  J: { main: '#0066FF', dark: '#0044CC', glow: '#3388FF' },  // 蓝色霓虹
  L: { main: '#FF6600', dark: '#CC4400', glow: '#FF8833' },  // 橙色霓虹
  O: { main: '#FFFF00', dark: '#CCCC00', glow: '#FFFF66' },  // 黄色霓虹
  S: { main: '#00FF00', dark: '#00CC00', glow: '#66FF66' },  // 绿色霓虹
  T: { main: '#9900FF', dark: '#6600CC', glow: '#AA44FF' },  // 紫色霓虹
  Z: { main: '#FF0000', dark: '#CC0000', glow: '#FF4444' },  // 红色霓虹

  // 背景色 - 深色复古风
  background: '#090912',
  gridBg: '#0d0d18',
  gridLine: '#1a1a2e',

  // 游戏机外壳颜色
  consoleBg: '#1a1a2e',
  consoleBorder: '#16213e',
  consoleScreen: '#0a0a0a',

  // UI 颜色
  text: '#e8e8f0',
  textDim: '#5c5c7a',
  accent: '#f50057', // 霓虹粉
  accentGlow: 'rgba(245, 0, 87, 0.4)',
  score: '#00e676',
  level: '#ffab00',

  // 粒子颜色
  particleWhite: '#ffffff',
  particleGold: '#ffd700',
  particleSilver: '#c0c0c0',
  particleRainbow: [
    '#ff1744', '#ff6d00', '#ffea00', '#00e676', '#00b0ff', '#d500f9', '#ff4081',
  ],

  // 消除特效颜色
  lineClear: [
    '#00e5ff', '#00e676', '#ffea00', '#ff6d00', '#d500f9', '#ff1744'
  ],

  // 屏幕震动颜色
  flash: '#ffffff',
} as const;

// 游戏状态
export interface GameState {
  board: (TetrominoType | null)[][];
  currentPiece: {
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
  } | null;
  nextPiece: TetrominoType | null;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;
}

// 粒子系统类型
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'explosion' | 'trail' | 'glow' | 'sparkle' | 'debris' | 'spark' | 'halo';
}

// 特殊方块类型
export type SpecialBlockType = 'BOMB' | 'RAINBOW' | 'ROCKET' | 'SHIELD';

// 特殊方块效果
export const SPECIAL_EFFECTS = {
  BOMB: {
    name: '💣 炸弹',
    description: '消除周围 3x3 区域',
    color: '#ff4444',
  },
  RAINBOW: {
    name: '🌈 彩虹',
    description: '消除任意一行',
    color: '#ff00ff',
  },
  ROCKET: {
    name: '🚀 火箭',
    description: '消除一列',
    color: '#00ffaa',
  },
  SHIELD: {
    name: '🛡️ 护盾',
    description: '抵挡一次撞击',
    color: '#4488ff',
  },
} as const;

// 游戏配置
export const GAME_CONFIG = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  BLOCK_SIZE: 30,
  DROP_INTERVAL_BASE: 1000, // 基础下落间隔 (ms)
  DROP_INTERVAL_MIN: 100,  // 最小下落间隔
  LEVEL_UP_LINES: 10,       // 升级所需行数
  SOUND_ENABLED: true,
} as const;

// 按键映射
export const KEY_BINDINGS = {
  MOVE_LEFT: ['ArrowLeft', 'a'],
  MOVE_RIGHT: ['ArrowRight', 'd'],
  SOFT_DROP: ['ArrowDown', 's'],
  HARD_DROP: ['ArrowUp', 'w', ' '],
  ROTATE_CW: ['ArrowRight', 'e'],
  ROTATE_CCW: ['ArrowLeft', 'q'],
  HOLD: ['Shift', 'c'],
  PAUSE: ['Escape', 'p'],
} as const;
