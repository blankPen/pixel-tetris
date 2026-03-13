/**
 * 游戏状态管理
 * 管理游戏的核心状态，包括棋盘、当前方块、分数、等级等
 */

import {
  Tetromino,
  TetrominoType,
  SpecialBlockType,
  GameStatus,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  createEmptyBoard,
  createTetromino,
  rotateTetromino,
  checkCollision,
  lockTetromino,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropSpeed,
} from './types';

// 游戏状态接口
export interface GameState {
  status: GameStatus;           // 游戏状态
  board: (string | null)[][];   // 棋盘
  currentPiece: Tetromino | null; // 当前方块
  nextPiece: Tetromino | null;   // 下一个方块
  score: number;                // 当前分数
  level: number;                // 当前等级
  lines: number;                // 累计消除行数
  dropSpeed: number;            // 下落速度（毫秒）
}

// 游戏状态管理类
export class GameEngine {
  private state: GameState;
  private lastDropTime: number = 0;
  private isPaused: boolean = false;
  
  constructor() {
    this.state = this.getInitialState();
  }
  
  // 获取初始状态
  private getInitialState(): GameState {
    return {
      status: GameStatus.IDLE,
      board: createEmptyBoard(),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 0,
      lines: 0,
      dropSpeed: getDropSpeed(0),
    };
  }
  
  // 获取当前状态
  getState(): GameState {
    return this.state;
  }
  
  // 开始游戏
  start(): void {
    this.state = this.getInitialState();
    this.spawnPiece();
    this.state.status = GameStatus.PLAYING;
    this.lastDropTime = Date.now();
  }
  
  // 暂停游戏
  pause(): void {
    if (this.state.status === GameStatus.PLAYING) {
      this.state.status = GameStatus.PAUSED;
    }
  }
  
  // 恢复游戏
  resume(): void {
    if (this.state.status === GameStatus.PAUSED) {
      this.state.status = GameStatus.PLAYING;
      this.lastDropTime = Date.now();
    }
  }
  
  // 生成新方块
  private spawnPiece(): void {
    // 如果没有下一个方块，生成一个
    if (!this.state.nextPiece) {
      this.state.nextPiece = createTetromino();
    }
    
    // 将下一个方块设为当前方块
    this.state.currentPiece = this.state.nextPiece;
    
    // 生成新的下一个方块
    this.state.nextPiece = createTetromino();
    
    // 检查游戏结束（生成的方块直接与棋盘碰撞）
    if (this.state.currentPiece && checkCollision(this.state.currentPiece, this.state.board)) {
      this.state.status = GameStatus.GAME_OVER;
    }
  }
  
  // 移动方块
  move(direction: 'left' | 'right' | 'down'): boolean {
    if (!this.state.currentPiece || this.state.status !== GameStatus.PLAYING) {
      return false;
    }
    
    const offsetX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const offsetY = direction === 'down' ? 1 : 0;
    
    if (!checkCollision(this.state.currentPiece, this.state.board, offsetX, offsetY)) {
      this.state.currentPiece.x += offsetX;
      this.state.currentPiece.y += offsetY;
      
      // 软降得分
      if (direction === 'down') {
        this.state.score += 1;
      }
      
      return true;
    }
    
    // 如果是向下移动且发生碰撞，锁定方块
    if (direction === 'down') {
      this.lockAndClear();
    }
    
    return false;
  }
  
  // 旋转方块
  rotate(direction: number = 1): boolean {
    if (!this.state.currentPiece || this.state.status !== GameStatus.PLAYING) {
      return false;
    }
    
    const rotated = rotateTetromino(this.state.currentPiece, direction);
    
    // 检查旋转后是否发生碰撞
    if (!checkCollision(rotated, this.state.board)) {
      this.state.currentPiece = rotated;
      return true;
    }
    
    // 如果发生碰撞，尝试踢墙（wall kick）
    // 简单实现：尝试左右移动一格
    for (let offset of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, x: rotated.x + offset };
      if (!checkCollision(kicked, this.state.board)) {
        this.state.currentPiece = kicked;
        return true;
      }
    }
    
    return false;
  }
  
  // 硬降（直接落到底部）
  hardDrop(): boolean {
    if (!this.state.currentPiece || this.state.status !== GameStatus.PLAYING) {
      return false;
    }
    
    let dropDistance = 0;
    while (!checkCollision(this.state.currentPiece, this.state.board, 0, 1)) {
      this.state.currentPiece.y += 1;
      dropDistance += 2; // 硬降每格2分
    }
    
    this.state.score += dropDistance;
    this.lockAndClear();
    return true;
  }
  
  // 锁定方块并清除行
  private lockAndClear(): void {
    if (!this.state.currentPiece) return;
    
    // 将当前方块锁定到棋盘
    this.state.board = lockTetromino(this.state.currentPiece, this.state.board);
    
    // 检查并清除行
    const { clearedLines, newBoard } = clearLines(this.state.board);
    this.state.board = newBoard;
    
    // 更新分数
    if (clearedLines > 0) {
      this.state.score += calculateScore(clearedLines, this.state.level);
      this.state.lines += clearedLines;
      
      // 检查升级
      const newLevel = calculateLevel(this.state.lines);
      if (newLevel > this.state.level) {
        this.state.level = newLevel;
        this.state.dropSpeed = getDropSpeed(this.state.level);
      }
    }
    
    // 生成新方块
    this.spawnPiece();
  }
  
  // 游戏主循环（自动下落）
  update(): boolean {
    if (this.state.status !== GameStatus.PLAYING) {
      return false;
    }
    
    const now = Date.now();
    if (now - this.lastDropTime >= this.state.dropSpeed) {
      this.move('down');
      this.lastDropTime = now;
      return true;
    }
    
    return false;
  }
  
  // 获取当前方块的网格位置（用于渲染）
  getCurrentPieceCells(): { x: number; y: number; color: string }[] {
    if (!this.state.currentPiece) return [];
    
    const cells: { x: number; y: number; color: string }[] = [];
    
    for (let y = 0; y < this.state.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.state.currentPiece.shape[y].length; x++) {
        if (this.state.currentPiece.shape[y][x]) {
          cells.push({
            x: this.state.currentPiece.x + x,
            y: this.state.currentPiece.y + y,
            color: this.state.currentPiece.color,
          });
        }
      }
    }
    
    return cells;
  }
  
  // 获取棋盘所有填充的单元格（用于渲染）
  getBoardCells(): { x: number; y: number; color: string }[] {
    const cells: { x: number; y: number; color: string }[] = [];
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.state.board[y][x]) {
          cells.push({ x, y, color: this.state.board[y][x]! });
        }
      }
    }
    
    return cells;
  }
  
  // 重置游戏
  reset(): void {
    this.state = this.getInitialState();
  }
}

// 导出游戏引擎工厂函数
export function createGameEngine(): GameEngine {
  return new GameEngine();
}
