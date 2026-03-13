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

// 像素风格调色板
export const PIXEL_COLORS = {
  // 方块颜色 (8-bit 风格)
  I: '#00f5ff', // 青色
  J: '#0000ff', // 蓝色
  L: '#ffaa00', // 橙色
  O: '#ffff00', // 黄色
  S: '#00ff00', // 绿色
  T: '#aa00ff', // 紫色
  Z: '#ff0000', // 红色
  
  // 背景色
  background: '#0a0a0f',
  gridBg: '#12121a',
  gridLine: '#1a1a25',
  
  // UI 颜色
  text: '#ffffff',
  textDim: '#888899',
  accent: '#ff00ff',
  score: '#00ffaa',
  level: '#ffaa00',
  
  // 粒子颜色
  particleWhite: '#ffffff',
  particleGold: '#ffd700',
  particleRainbow: [
    '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0077ff', '#ff00ff',
  ],
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
  type: 'explosion' | 'trail' | 'glow' | 'sparkle';
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
