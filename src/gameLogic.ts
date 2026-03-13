// 俄罗斯方块游戏核心逻辑
import { type TetrominoType, TETROMINO_SHAPES, GAME_CONFIG, type GameState } from './types';

// 随机获取方块类型
export function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  return types[Math.floor(Math.random() * types.length)];
}

// 创建空游戏板
export function createEmptyBoard(): (TetrominoType | null)[][] {
  return Array(GAME_CONFIG.BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(GAME_CONFIG.BOARD_WIDTH).fill(null));
}

// 初始化游戏状态
export function initGameState(): GameState {
  const nextPiece = getRandomTetromino();
  return {
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    isPaused: false,
    isPlaying: false,
  };
}

// 旋转矩阵
function rotateMatrix(matrix: boolean[][], times: number): boolean[][] {
  let result = matrix.map(row => [...row]);
  for (let t = 0; t < times; t++) {
    const rotated = result[0].map((_, i) =>
      result.map(row => row[i]).reverse()
    );
    result = rotated;
  }
  return result;
}

// 获取当前方块的形状矩阵
export function getPieceShape(type: TetrominoType, rotation: number): boolean[][] {
  return rotateMatrix(TETROMINO_SHAPES[type], rotation % 4);
}

// 检查碰撞
export function checkCollision(
  board: (TetrominoType | null)[][],
  piece: { type: TetrominoType; x: number; y: number; rotation: number }
): boolean {
  const shape = getPieceShape(piece.type, piece.rotation);
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = piece.x + col;
        const boardY = piece.y + row;
        
        // 边界检查
        if (
          boardX < 0 ||
          boardX >= GAME_CONFIG.BOARD_WIDTH ||
          boardY >= GAME_CONFIG.BOARD_HEIGHT
        ) {
          return true;
        }
        
        // 碰撞检测
        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 放置方块到游戏板
export function placePiece(
  board: (TetrominoType | null)[][],
  piece: { type: TetrominoType; x: number; y: number; rotation: number }
): (TetrominoType | null)[][] {
  const newBoard = board.map(row => [...row]);
  const shape = getPieceShape(piece.type, piece.rotation);
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = piece.x + col;
        const boardY = piece.y + row;
        
        if (boardY >= 0 && boardY < GAME_CONFIG.BOARD_HEIGHT && boardX >= 0 && boardX < GAME_CONFIG.BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }
  
  return newBoard;
}

// 消除满行
export function clearLines(board: (TetrominoType | null)[][]): { 
  newBoard: (TetrominoType | null)[][]; 
  linesCleared: number;
} {
  const newBoard: (TetrominoType | null)[][] = [];
  let linesCleared = 0;
  
  for (let row = 0; row < board.length; row++) {
    if (board[row].every(cell => cell !== null)) {
      linesCleared++;
    } else {
      newBoard.push([...board[row]]);
    }
  }
  
  // 添加新空行在顶部
  while (newBoard.length < GAME_CONFIG.BOARD_HEIGHT) {
    newBoard.unshift(Array(GAME_CONFIG.BOARD_WIDTH).fill(null));
  }
  
  return { newBoard, linesCleared };
}

// 计算得分
export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  const multiplier = level;
  return (baseScores[Math.min(linesCleared, 4)] || linesCleared * 200) * multiplier;
}

// 计算等级
export function calculateLevel(lines: number): number {
  return Math.floor(lines / GAME_CONFIG.LEVEL_UP_LINES) + 1;
}

// 计算下落间隔
export function calculateDropInterval(level: number): number {
  const interval = GAME_CONFIG.DROP_INTERVAL_BASE - (level - 1) * 100;
  return Math.max(interval, GAME_CONFIG.DROP_INTERVAL_MIN);
}

// 生成新方块
export function spawnPiece(state: GameState): GameState {
  const type = state.nextPiece || getRandomTetromino();
  const nextPiece = getRandomTetromino();
  
  const newPiece = {
    type,
    x: Math.floor(GAME_CONFIG.BOARD_WIDTH / 2) - 2,
    y: 0,
    rotation: 0,
  };
  
  // 检查游戏结束
  if (checkCollision(state.board, newPiece)) {
    return {
      ...state,
      currentPiece: newPiece,
      nextPiece,
      gameOver: true,
      isPlaying: false,
    };
  }
  
  return {
    ...state,
    currentPiece: newPiece,
    nextPiece,
  };
}

// 移动方块
export function movePiece(
  state: GameState,
  dx: number,
  dy: number
): GameState {
  if (!state.currentPiece || state.gameOver || state.isPaused) {
    return state;
  }
  
  const newPiece = {
    ...state.currentPiece,
    x: state.currentPiece.x + dx,
    y: state.currentPiece.y + dy,
  };
  
  if (!checkCollision(state.board, newPiece)) {
    return {
      ...state,
      currentPiece: newPiece,
    };
  }
  
  return state;
}

// 旋转方块
export function rotatePiece(state: GameState, direction: 'cw' | 'ccw'): GameState {
  if (!state.currentPiece || state.gameOver || state.isPaused) {
    return state;
  }
  
  const newRotation = direction === 'cw' 
    ? state.currentPiece.rotation + 1 
    : state.currentPiece.rotation - 1;
  
  const newPiece = {
    ...state.currentPiece,
    rotation: newRotation,
  };
  
  // 尝试旋转，如果碰撞则尝试踢墙（wall kick）
  if (!checkCollision(state.board, newPiece)) {
    return {
      ...state,
      currentPiece: newPiece,
    };
  }
  
  // 尝试向左踢墙
  const kickLeft = { ...newPiece, x: newPiece.x - 1 };
  if (!checkCollision(state.board, kickLeft)) {
    return {
      ...state,
      currentPiece: kickLeft,
    };
  }
  
  // 尝试向右踢墙
  const kickRight = { ...newPiece, x: newPiece.x + 1 };
  if (!checkCollision(state.board, kickRight)) {
    return {
      ...state,
      currentPiece: kickRight,
    };
  }
  
  // 无法旋转
  return state;
}

// 硬降（直接落到底部）
export function hardDrop(state: GameState): GameState {
  if (!state.currentPiece || state.gameOver || state.isPaused) {
    return state;
  }
  
  let dropDistance = 0;
  let newPiece = { ...state.currentPiece };
  
  while (!checkCollision(state.board, { ...newPiece, y: newPiece.y + 1 })) {
    newPiece.y++;
    dropDistance++;
  }
  
  return {
    ...state,
    currentPiece: newPiece,
    score: state.score + dropDistance * 2,
  };
}

// 锁定方块并生成新方块
export function lockPiece(state: GameState): GameState {
  if (!state.currentPiece) {
    return state;
  }
  
  const newBoard = placePiece(state.board, state.currentPiece);
  const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
  const newLines = state.lines + linesCleared;
  const newLevel = calculateLevel(newLines);
  const newScore = state.score + calculateScore(linesCleared, newLevel);
  
  const newState = spawnPiece({
    ...state,
    board: clearedBoard,
    score: newScore,
    level: newLevel,
    lines: newLines,
  });
  
  return {
    ...newState,
    isPlaying: !newState.gameOver,
  };
}

// 游戏循环一步
export function gameTick(state: GameState): GameState {
  if (!state.currentPiece || state.gameOver || state.isPaused || !state.isPlaying) {
    return state;
  }
  
  return movePiece(state, 0, 1);
}

// 开始游戏
export function startGame(): GameState {
  const initialState = initGameState();
  return spawnPiece({
    ...initialState,
    isPlaying: true,
  });
}

// 暂停/继续游戏
export function togglePause(state: GameState): GameState {
  if (state.gameOver) {
    return state;
  }
  
  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

// 重置游戏
export function resetGame(): GameState {
  return initGameState();
}
