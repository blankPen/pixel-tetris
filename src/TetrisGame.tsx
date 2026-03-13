// 俄罗斯方块游戏主组件
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { 
  type GameState, 
  type TetrominoType, 
  type Particle,
  PIXEL_COLORS, 
  GAME_CONFIG,
} from './types';
import {
  initGameState,
  startGame,
  movePiece,
  rotatePiece,
  hardDrop,
  lockPiece,
  togglePause,
  getPieceShape,
  checkCollision,
} from './gameLogic';
import {
  particleSystem,
  createExplosionParticles,
} from './particles';
import {
  soundManager,
  initAudio,
} from './sound';

// 方块组件 - 使用 memo 避免不必要的重渲染
const Block = memo(function Block({ 
  type, 
  x, 
  y, 
  size = GAME_CONFIG.BLOCK_SIZE,
  isGhost = false,
}: { 
  type: TetrominoType | null; 
  x: number; 
  y: number;
  size?: number;
  isGhost?: boolean;
}) {
  if (!type) return null;
  
  const color = PIXEL_COLORS[type];
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x * size,
        top: y * size,
        width: size,
        height: size,
        backgroundColor: isGhost ? 'transparent' : color,
        border: isGhost 
          ? `2px dashed ${color}40`
          : `3px solid ${color}80`,
        boxShadow: isGhost 
          ? 'none' 
          : `inset 0 0 ${size / 3}px ${color}60, 0 0 ${size / 4}px ${color}40`,
        imageRendering: 'pixelated',
        transition: 'none',
      }}
    />
  );
});

// 粒子渲染组件 - 使用 memo 优化
const ParticleRenderer = memo(function ParticleRenderer({ 
  particles,
  blockSize = GAME_CONFIG.BLOCK_SIZE,
}: {
  particles: Particle[];
  blockSize?: number;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map(particle => {
        const opacity = particle.life / particle.maxLife;
        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: particle.x * blockSize,
              top: particle.y * blockSize,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.type === 'glow' ? '50%' : '2px',
              opacity,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            }}
          />
        );
      })}
    </div>
  );
});

// 下一个方块预览 - 使用 memo 优化
const NextPiecePreview = memo(function NextPiecePreview({ 
  pieceType,
  size = 100,
}: { 
  pieceType: TetrominoType | null;
  size?: number;
}) {
  if (!pieceType) return null;
  
  const shape = getPieceShape(pieceType, 0);
  const blockSize = size / 4;
  
  return (
    <div style={{
      width: size,
      height: size,
      backgroundColor: PIXEL_COLORS.gridBg,
      border: `2px solid ${PIXEL_COLORS.gridLine}`,
      position: 'relative',
      imageRendering: 'pixelated',
    }}>
      {shape.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (!cell) return null;
          const color = PIXEL_COLORS[pieceType];
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                position: 'absolute',
                left: (colIndex + 0.5) * blockSize,
                top: (rowIndex + 0.5) * blockSize,
                width: blockSize - 2,
                height: blockSize - 2,
                backgroundColor: color,
                border: `2px solid ${color}80`,
                boxShadow: `inset 0 0 ${blockSize / 4}px ${color}60`,
              }}
            />
          );
        })
      )}
    </div>
  );
});

// 主游戏组件
export default function TetrisGame() {
  const [gameState, setGameState] = useState<GameState>(initGameState());
  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const prevLevelRef = useRef<number>(1);
  const prevLinesRef = useRef<number>(0);
  const prevGameOverRef = useRef<boolean>(false);

  // 监听游戏状态变化，播放音效
  useEffect(() => {
    // 检测等级提升
    if (gameState.level > prevLevelRef.current) {
      soundManager.playLevelUp();
      prevLevelRef.current = gameState.level;
    }
    
    // 检测消除行数
    const linesCleared = gameState.lines - prevLinesRef.current;
    if (linesCleared > 0) {
      soundManager.playLineClear(linesCleared);
      prevLinesRef.current = gameState.lines;
    }
    
    // 检测游戏结束
    if (gameState.gameOver && !prevGameOverRef.current && gameState.isPlaying === false) {
      soundManager.playGameOver();
    }
    prevGameOverRef.current = gameState.gameOver;
  }, [gameState]);

  // 游戏循环
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTickRef.current) lastTickRef.current = timestamp;
    
    const state = gameState;
    
    if (state.isPlaying && !state.gameOver && !state.isPaused) {
      const dropInterval = 1000 - (state.level - 1) * 100;
      const elapsed = timestamp - lastTickRef.current;
      
      if (elapsed >= Math.max(dropInterval, 100)) {
        setGameState(prevState => {
          const movedState = movePiece(prevState, 0, 1);
          
          // 检测是否触底
          if (movedState.currentPiece && prevState.currentPiece) {
            const wouldCollide = checkCollision(
              prevState.board,
              { ...prevState.currentPiece, y: prevState.currentPiece.y + 1 }
            );
            
            if (wouldCollide) {
              // 锁定方块
              const lockedState = lockPiece(prevState);
              
              // 生成消除特效
              if (lockedState.board !== prevState.board) {
                // 找出消除的行并添加粒子
                for (let y = 0; y < GAME_CONFIG.BOARD_HEIGHT; y++) {
                  if (lockedState.board[y].every(cell => cell !== null)) {
                    for (let x = 0; x < GAME_CONFIG.BOARD_WIDTH; x++) {
                      const newParticles = createExplosionParticles(
                        x + 0.5,
                        y + 0.5,
                        PIXEL_COLORS.particleGold,
                        10
                      );
                      particleSystem.addParticles(newParticles);
                    }
                  }
                }
              }
              
              return lockedState;
            }
          }
          
          return movedState;
        });
        lastTickRef.current = timestamp;
      }
    }
    
    // 更新粒子
    const updatedParticles = particleSystem.update();
    setParticles(updatedParticles);
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  // 启动游戏循环
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // 初始化音频（用户首次交互时）
  const handleUserInteraction = useCallback(() => {
    initAudio();
    window.removeEventListener('click', handleUserInteraction);
    window.removeEventListener('keydown', handleUserInteraction);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [handleUserInteraction]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // 检查按键
      const isLeft = key === 'ArrowLeft' || key.toLowerCase() === 'a';
      const isRight = key === 'ArrowRight' || key.toLowerCase() === 'd';
      const isDown = key === 'ArrowDown' || key.toLowerCase() === 's';
      const isRotateCW = key === 'ArrowUp' || key.toLowerCase() === 'e' || key.toLowerCase() === 'w';
      const isRotateCCW = key.toLowerCase() === 'q';
      const isHardDrop = key === ' ';
      const isPause = key === 'Escape' || key.toLowerCase() === 'p';
      const isEnter = key === 'Enter';

      if (isPause) {
        setGameState(prev => {
          const newState = togglePause(prev);
          // 根据暂停/恢复状态播放音效
          if (newState.isPaused) {
            soundManager.playPause();
          } else {
            soundManager.playResume();
          }
          return newState;
        });
        return;
      }

      if (gameState.gameOver || !gameState.isPlaying || gameState.isPaused) {
        if (isEnter || isHardDrop) {
          setGameState(startGame());
          particleSystem.clear();
          soundManager.playStart();
        }
        return;
      }

      if (isLeft) {
        e.preventDefault();
        setGameState(prev => movePiece(prev, -1, 0));
        soundManager.playMove();
      } else if (isRight) {
        e.preventDefault();
        setGameState(prev => movePiece(prev, 1, 0));
        soundManager.playMove();
      } else if (isDown) {
        e.preventDefault();
        setGameState(prev => {
          const moved = movePiece(prev, 0, 1);
          return { ...moved, score: moved.score + 1 };
        });
        soundManager.playDrop();
      } else if (isRotateCW) {
        e.preventDefault();
        setGameState(prev => rotatePiece(prev, 'cw'));
        soundManager.playRotate();
      } else if (isRotateCCW) {
        e.preventDefault();
        setGameState(prev => rotatePiece(prev, 'ccw'));
        soundManager.playRotate();
      } else if (isHardDrop) {
        e.preventDefault();
        setGameState(prev => {
          const dropped = hardDrop(prev);
          soundManager.playHardDrop();
          return lockPiece(dropped);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // 幽灵方块（显示下落位置）
  const ghostPiece = gameState.currentPiece 
    ? (() => {
        let ghostY = gameState.currentPiece!.y;
        while (!checkCollision(gameState.board, { ...gameState.currentPiece!, y: ghostY + 1 })) {
          ghostY++;
        }
        return { ...gameState.currentPiece!, y: ghostY };
      })()
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: PIXEL_COLORS.background,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      color: PIXEL_COLORS.text,
      padding: '20px',
    }}>
      
      <div style={{
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start',
      }}>
        {/* 左侧信息面板 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minWidth: '180px',
        }}>
          <div style={{
            backgroundColor: PIXEL_COLORS.gridBg,
            border: `4px solid ${PIXEL_COLORS.gridLine}`,
            padding: '15px',
          }}>
            <div style={{
              color: PIXEL_COLORS.textDim,
              fontSize: '10px',
              marginBottom: '8px',
            }}>
              SCORE
            </div>
            <div style={{
              color: PIXEL_COLORS.score,
              fontSize: '16px',
              textShadow: `0 0 10px ${PIXEL_COLORS.score}`,
            }}>
              {gameState.score.toString().padStart(6, '0')}
            </div>
          </div>
          
          <div style={{
            backgroundColor: PIXEL_COLORS.gridBg,
            border: `4px solid ${PIXEL_COLORS.gridLine}`,
            padding: '15px',
          }}>
            <div style={{
              color: PIXEL_COLORS.textDim,
              fontSize: '10px',
              marginBottom: '8px',
            }}>
              LEVEL
            </div>
            <div style={{
              color: PIXEL_COLORS.level,
              fontSize: '16px',
            }}>
              {gameState.level}
            </div>
          </div>
          
          <div style={{
            backgroundColor: PIXEL_COLORS.gridBg,
            border: `4px solid ${PIXEL_COLORS.gridLine}`,
            padding: '15px',
          }}>
            <div style={{
              color: PIXEL_COLORS.textDim,
              fontSize: '10px',
              marginBottom: '8px',
            }}>
              LINES
            </div>
            <div style={{
              color: PIXEL_COLORS.text,
              fontSize: '16px',
            }}>
              {gameState.lines}
            </div>
          </div>
          
          <div style={{
            backgroundColor: PIXEL_COLORS.gridBg,
            border: `4px solid ${PIXEL_COLORS.gridLine}`,
            padding: '15px',
          }}>
            <div style={{
              color: PIXEL_COLORS.textDim,
              fontSize: '10px',
              marginBottom: '8px',
            }}>
              NEXT
            </div>
            <NextPiecePreview pieceType={gameState.nextPiece} />
          </div>
          
          {!gameState.isPlaying && (
            <button
              className="pixel-btn"
              onClick={() => {
                setGameState(startGame());
                particleSystem.clear();
                // 重置音效跟踪 refs
                prevLevelRef.current = 1;
                prevLinesRef.current = 0;
                prevGameOverRef.current = false;
                soundManager.playStart();
              }}
              style={{
                width: '100%',
                animation: gameState.gameOver ? 'blink 1s infinite' : 'none',
              }}
            >
              {gameState.gameOver ? 'GAME OVER' : 'START'}
            </button>
          )}
          
          {gameState.isPlaying && (
            <button
              className="pixel-btn"
              onClick={() => setGameState(togglePause(gameState))}
              style={{ width: '100%' }}
            >
              {gameState.isPaused ? 'RESUME' : 'PAUSE'}
            </button>
          )}
          
          <div style={{
            color: PIXEL_COLORS.textDim,
            fontSize: '8px',
            lineHeight: '1.8',
            marginTop: '10px',
          }}>
            <div>← → MOVE</div>
            <div>↑ ROTATE</div>
            <div>↓ SOFT DROP</div>
            <div>SPACE HARD DROP</div>
          </div>
        </div>
        
        {/* 游戏区域 */}
        <div style={{
          position: 'relative',
        }}>
          {/* 游戏棋盘 */}
          <div style={{
            width: GAME_CONFIG.BOARD_WIDTH * GAME_CONFIG.BLOCK_SIZE,
            height: GAME_CONFIG.BOARD_HEIGHT * GAME_CONFIG.BLOCK_SIZE,
            backgroundColor: PIXEL_COLORS.gridBg,
            border: `4px solid ${PIXEL_COLORS.accent}`,
            boxShadow: `0 0 30px ${PIXEL_COLORS.accent}40, inset 0 0 50px rgba(0,0,0,0.5)`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* 网格线 */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(${PIXEL_COLORS.gridLine} 1px, transparent 1px),
                linear-gradient(90deg, ${PIXEL_COLORS.gridLine} 1px, transparent 1px)
              `,
              backgroundSize: `${GAME_CONFIG.BLOCK_SIZE}px ${GAME_CONFIG.BLOCK_SIZE}px`,
              opacity: 0.5,
            }} />
            
            {/* 已落下的方块 */}
            {gameState.board.map((row, y) =>
              row.map((cell, x) => (
                <Block
                  key={`board-${y}-${x}`}
                  type={cell}
                  x={x}
                  y={y}
                />
              ))
            )}
            
            {/* 幽灵方块 */}
            {ghostPiece && (
              <Block
                type={ghostPiece.type}
                x={ghostPiece.x}
                y={ghostPiece.y}
                isGhost
              />
            )}
            
            {/* 当前方块 */}
            {gameState.currentPiece && (() => {
              const shape = getPieceShape(
                gameState.currentPiece!.type,
                gameState.currentPiece!.rotation
              );
              return shape.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  if (!cell) return null;
                  return (
                    <Block
                      key={`piece-${rowIndex}-${colIndex}`}
                      type={gameState.currentPiece!.type}
                      x={gameState.currentPiece!.x + colIndex}
                      y={gameState.currentPiece!.y + rowIndex}
                    />
                  );
                })
              );
            })()}
            
            {/* 粒子效果 */}
            <ParticleRenderer particles={particles} />
            
            {/* 暂停/游戏结束覆盖层 */}
            {(gameState.isPaused || gameState.gameOver) && gameState.isPlaying && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
              }}>
                <div style={{
                  fontSize: gameState.gameOver ? '24px' : '32px',
                  color: gameState.gameOver ? '#ff0000' : PIXEL_COLORS.accent,
                  textShadow: `0 0 20px ${gameState.gameOver ? '#ff0000' : PIXEL_COLORS.accent}`,
                  animation: gameState.gameOver ? 'blink 1s infinite' : 'pixelGlow 2s infinite',
                }}>
                  {gameState.gameOver ? 'GAME OVER' : 'PAUSED'}
                </div>
                {gameState.gameOver && (
                  <div style={{
                    fontSize: '12px',
                    color: PIXEL_COLORS.textDim,
                  }}>
                    FINAL SCORE: {gameState.score}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
