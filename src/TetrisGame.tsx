/**
 * 俄罗斯方块游戏组件
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createGameEngine, GameStatus, BOARD_WIDTH, BOARD_HEIGHT } from './game';

function TetrisGame() {
  const [game] = useState(() => createGameEngine());
  const [board, setBoard] = useState<(string | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [status, setStatus] = useState(GameStatus.IDLE);
  const [nextPiece, setNextPiece] = useState<string | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // 更新游戏状态到 React 状态
  const syncState = useCallback(() => {
    const state = game.getState();
    setBoard(state.board.map(row => [...row]));
    setScore(state.score);
    setLevel(state.level);
    setLines(state.lines);
    setStatus(state.status);
    
    // 设置下一个方块预览
    if (state.nextPiece) {
      setNextPiece(state.nextPiece.color);
    }
  }, [game]);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (status === GameStatus.PLAYING) {
      const updated = game.update();
      if (updated) {
        syncState();
      }
    }
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [game, status, syncState]);

  // 启动/停止游戏循环
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING && status !== GameStatus.PAUSED) {
        if (e.code === 'Space' || e.code === 'Enter') {
          game.start();
          syncState();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          game.move('left');
          syncState();
          break;
        case 'ArrowRight':
          game.move('right');
          syncState();
          break;
        case 'ArrowDown':
          game.move('down');
          syncState();
          break;
        case 'ArrowUp':
          game.rotate(1);
          syncState();
          break;
        case 'Space':
          game.hardDrop();
          syncState();
          break;
        case 'KeyP':
        case 'Escape':
          if (status === GameStatus.PLAYING) {
            game.pause();
          } else if (status === GameStatus.PAUSED) {
            game.resume();
          }
          syncState();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, status, syncState]);

  // 渲染单个单元格
  const renderCell = (color: string | null, x: number, y: number) => {
    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: color || '#1a1a2e',
          border: color ? '2px solid rgba(0,0,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
          boxSizing: 'border-box',
        }}
      />
    );
  };

  return (
    <div style={{
      display: 'flex',
      gap: '40px',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '40px',
      fontFamily: '"Press Start 2P", monospace',
      backgroundColor: '#0f0f1a',
      minHeight: '100vh',
      color: '#fff',
    }}>
      {/* 游戏棋盘 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 30px)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 30px)`,
        border: '4px solid #4a4a6a',
        backgroundColor: '#1a1a2e',
      }}>
        {board.map((row, y) =>
          row.map((cell, x) => renderCell(cell, x, y))
        )}
      </div>

      {/* 信息面板 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minWidth: '150px',
      }}>
        {/* 下一个方块预览 */}
        <div>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#888' }}>NEXT</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 20px)',
            gridTemplateRows: 'repeat(4, 20px)',
            backgroundColor: '#1a1a2e',
            padding: '8px',
            border: '2px solid #4a4a6a',
          }}>
            {Array(16).fill(null).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: nextPiece || '#1a1a2e',
                }}
              />
            ))}
          </div>
        </div>

        {/* 分数 */}
        <div>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#888' }}>SCORE</div>
          <div style={{ fontSize: '18px' }}>{score.toString().padStart(6, '0')}</div>
        </div>

        {/* 等级 */}
        <div>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#888' }}>LEVEL</div>
          <div style={{ fontSize: '18px' }}>{level}</div>
        </div>

        {/* 行数 */}
        <div>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#888' }}>LINES</div>
          <div style={{ fontSize: '18px' }}>{lines}</div>
        </div>

        {/* 游戏状态 */}
        <div style={{ marginTop: '20px' }}>
          {status === GameStatus.IDLE && (
            <div style={{ color: '#ffff00' }}>PRESS SPACE TO START</div>
          )}
          {status === GameStatus.PAUSED && (
            <div style={{ color: '#ff8800' }}>PAUSED</div>
          )}
          {status === GameStatus.GAME_OVER && (
            <div style={{ color: '#ff0000' }}>GAME OVER</div>
          )}
        </div>

        {/* 操作说明 */}
        <div style={{ marginTop: '20px', fontSize: '10px', color: '#666', lineHeight: '1.8' }}>
          <div>← → MOVE</div>
          <div>↓ SOFT DROP</div>
          <div>↑ ROTATE</div>
          <div>SPACE HARD DROP</div>
          <div>P / ESC PAUSE</div>
        </div>
      </div>
    </div>
  );
}

export default TetrisGame;
