/**
 * 俄罗斯方块核心游戏逻辑
 * 包含方块定义、棋盘管理、移动旋转、碰撞检测、消除检测等核心功能
 */

// 方块类型枚举
export enum TetrominoType {
  I = 'I', // 长条
  O = 'O', // 方块
  T = 'T', // T型
  S = 'S', // S型
  Z = 'Z', // Z型
  J = 'J', // J型
  L = 'L', // L型
}

// 方块形状定义（使用 0/1 矩阵表示）
// 每个方块有 4 种旋转状态
export const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  [TetrominoType.I]: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  [TetrominoType.O]: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  [TetrominoType.T]: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  [TetrominoType.S]: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  [TetrominoType.Z]: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  [TetrominoType.J]: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  [TetrominoType.L]: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
};

// 方块颜色映射（复古像素风格）
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  [TetrominoType.I]: '#00f5ff', // 青色
  [TetrominoType.O]: '#ffff00', // 黄色
  [TetrominoType.T]: '#bf00ff', // 紫色
  [TetrominoType.S]: '#00ff00', // 绿色
  [TetrominoType.Z]: '#ff0000', // 红色
  [TetrominoType.J]: '#0000ff', // 蓝色
  [TetrominoType.L]: '#ff8800', // 橙色
};

// 特殊方块类型
export enum SpecialBlockType {
  BOMB = 'BOMB',     // 炸弹：消除周围 3x3 区域
  ROCK = 'ROCK',     // 岩石：不可消除
  GHOST = 'GHOST',   // 幽灵：随机传送
  RAINBOW = 'RAINBOW', // 彩虹：可匹配任何颜色
}

// 特殊方块颜色
export const SPECIAL_BLOCK_COLORS: Record<SpecialBlockType, string> = {
  [SpecialBlockType.BOMB]: '#ff4444',
  [SpecialBlockType.ROCK]: '#888888',
  [SpecialBlockType.GHOST]: '#aaaaaa',
  [SpecialBlockType.RAINBOW]: '#ff00ff',
};

// 游戏状态枚举
export enum GameStatus {
  IDLE = 'IDLE',       // 空闲
  PLAYING = 'PLAYING', // 进行中
  PAUSED = 'PAUSED',   // 暂停
  GAME_OVER = 'GAME_OVER', // 游戏结束
}

// 棋盘尺寸
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// 方块接口
export interface Tetromino {
  type: TetrominoType | SpecialBlockType;
  shape: number[][];
  rotation: number; // 0-3 表示四种旋转状态
  x: number;       // 方块左上角在棋盘上的 x 坐标
  y: number;       // 方块左上角在棋盘上的 y 坐标
  color: string;
}

// 特殊方块接口
export interface SpecialBlock {
  type: SpecialBlockType;
  x: number;
  y: number;
}

// 游戏分数配置
export const SCORE_CONFIG = {
  SINGLE: 100,      // 消除 1 行
  DOUBLE: 300,      // 消除 2 行
  TRIPLE: 500,      // 消除 3 行
  TETRIS: 800,      // 消除 4 行（Tetris）
  SOFT_DROP: 1,    // 软降每格
  HARD_DROP: 2,     // 硬降每格
};

// 等级配置
export const LEVEL_CONFIG = {
  // 每等级需要的行数
  LINES_PER_LEVEL: 10,
  // 等级对应的下落速度（毫秒）
  SPEED_PER_LEVEL: [800, 720, 630, 550, 470, 380, 300, 220, 130, 100],
};

/**
 * 创建方块工厂函数
 * @param type 方块类型
 * @param x 初始 x 坐标
 * @param y 初始 y 坐标
 */
export function createTetromino(
  type?: TetrominoType | SpecialBlockType,
  x: number = 3,
  y: number = 0
): Tetromino {
  // 如果没有指定类型，随机选择一种标准方块
  const types = Object.values(TetrominoType);
  const selectedType = type || types[Math.floor(Math.random() * 7)] as TetrominoType;
  
  const shape = TETROMINO_SHAPES[selectedType as TetrominoType][0];
  const color = TETROMINO_COLORS[selectedType as TetrominoType];
  
  return {
    type: selectedType,
    shape,
    rotation: 0,
    x,
    y,
    color,
  };
}

/**
 * 旋转方块
 * @param tetromino 方块
 * @param direction 旋转方向：1=顺时针，-1=逆时针
 */
export function rotateTetromino(tetromino: Tetromino, direction: number = 1): Tetromino {
  if (tetromino.type === TetrominoType.O) {
    // O 方块旋转后形状不变
    return tetromino;
  }
  
  const newRotation = (tetromino.rotation + direction + 4) % 4;
  const newShape = TETROMINO_SHAPES[tetromino.type as TetrominoType][newRotation];
  
  return {
    ...tetromino,
    rotation: newRotation,
    shape: newShape,
  };
}

/**
 * 创建空棋盘
 */
export function createEmptyBoard(): (string | null)[][] {
  const board: (string | null)[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    board[y] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      board[y][x] = null;
    }
  }
  return board;
}

/**
 * 检查方块是否与棋盘发生碰撞
 * @param tetromino 方块
 * @param board 棋盘
 * @param offsetX x 偏移
 * @param offsetY y 偏移
 */
export function checkCollision(
  tetromino: Tetromino,
  board: (string | null)[][],
  offsetX: number = 0,
  offsetY: number = 0
): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = tetromino.x + x + offsetX;
        const newY = tetromino.y + y + offsetY;
        
        // 检查边界
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return true;
        }
        
        // 检查与已落方块的碰撞
        if (newY >= 0 && board[newY][newX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 将方块固定到棋盘上
 * @param tetromino 方块
 * @param board 棋盘
 */
export function lockTetromino(
  tetromino: Tetromino,
  board: (string | null)[][]
): (string | null)[][] {
  const newBoard = board.map(row => [...row]);
  
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardX = tetromino.x + x;
        const boardY = tetromino.y + y;
        
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = tetromino.color;
        }
      }
    }
  }
  
  return newBoard;
}

/**
 * 检查并消除满行
 * @param board 棋盘
 * @returns 消除的行数和消除后的新棋盘
 */
export function clearLines(
  board: (string | null)[][]
): { clearedLines: number; newBoard: (string | null)[][] } {
  let clearedLines = 0;
  let newBoard = board.map(row => [...row]);
  
  // 从底部向上检查
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    let isFull = true;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (newBoard[y][x] === null) {
        isFull = false;
        break;
      }
    }
    
    if (isFull) {
      clearedLines++;
      // 移除该行
      newBoard.splice(y, 1);
      // 在顶部添加新行
      newBoard.unshift(new Array(BOARD_WIDTH).fill(null));
      // 重新检查当前位置（因为上面的行下来了）
      y++;
    }
  }
  
  return { clearedLines, newBoard };
}

/**
 * 计算得分
 * @param clearedLines 消除的行数
 * @param level 当前等级
 */
export function calculateScore(clearedLines: number, level: number): number {
  const baseScores = [
    0,
    SCORE_CONFIG.SINGLE,
    SCORE_CONFIG.DOUBLE,
    SCORE_CONFIG.TRIPLE,
    SCORE_CONFIG.TETRIS,
  ];
  
  const baseScore = baseScores[Math.min(clearedLines, 4)] || 0;
  
  // 等级加成
  return baseScore * (level + 1);
}

/**
 * 计算当前等级
 * @param totalClearedLines 累计消除的行数
 */
export function calculateLevel(totalClearedLines: number): number {
  return Math.floor(totalClearedLines / LEVEL_CONFIG.LINES_PER_LEVEL);
}

/**
 * 获取下落速度（毫秒）
 * @param level 等级
 */
export function getDropSpeed(level: number): number {
  return LEVEL_CONFIG.SPEED_PER_LEVEL[Math.min(level, LEVEL_CONFIG.SPEED_PER_LEVEL.length - 1)] || 100;
}
