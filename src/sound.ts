/**
 * 8-bit 风格音效系统
 * 使用 Web Audio API 生成复古游戏音效
 */

// 音频上下文（延迟初始化）
let audioContext: AudioContext | null = null;

// 音效类型
export const SoundType = {
  MOVE: 'move',
  ROTATE: 'rotate',
  DROP: 'drop',
  HARD_DROP: 'hard_drop',
  LINE_CLEAR: 'line_clear',
  LEVEL_UP: 'level_up',
  GAME_OVER: 'game_over',
  START: 'start',
  PAUSE: 'pause',
  ERROR: 'error',
} as const;

export type SoundType = typeof SoundType[keyof typeof SoundType];

// 音效配置
interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  decay?: number;
  slide?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  [SoundType.MOVE]: {
    frequency: 200,
    duration: 0.05,
    type: 'square',
    volume: 0.1,
  },
  [SoundType.ROTATE]: {
    frequency: 300,
    duration: 0.08,
    type: 'square',
    volume: 0.1,
  },
  [SoundType.DROP]: {
    frequency: 150,
    duration: 0.05,
    type: 'square',
    volume: 0.1,
  },
  [SoundType.HARD_DROP]: {
    frequency: 100,
    duration: 0.15,
    type: 'square',
    volume: 0.15,
    decay: 0.1,
  },
  [SoundType.LINE_CLEAR]: {
    frequency: 440,
    duration: 0.2,
    type: 'square',
    volume: 0.2,
    slide: 200,
  },
  [SoundType.LEVEL_UP]: {
    frequency: 523,
    duration: 0.3,
    type: 'square',
    volume: 0.25,
    slide: 400,
  },
  [SoundType.GAME_OVER]: {
    frequency: 300,
    duration: 0.8,
    type: 'sawtooth',
    volume: 0.3,
    decay: 0.5,
    slide: -200,
  },
  [SoundType.START]: {
    frequency: 262,
    duration: 0.15,
    type: 'square',
    volume: 0.2,
    slide: 200,
  },
  [SoundType.PAUSE]: {
    frequency: 400,
    duration: 0.1,
    type: 'square',
    volume: 0.15,
  },
  [SoundType.ERROR]: {
    frequency: 100,
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.2,
  },
};

// 初始化音频上下文（需要在用户交互后调用）
export function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // 恢复挂起的上下文
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// 播放单个音效
export function playSound(type: SoundType): void {
  if (!audioContext) {
    initAudio();
  }
  
  if (!audioContext) return;
  
  const config = SOUND_CONFIGS[type];
  if (!config) return;
  
  const now = audioContext.currentTime;
  
  // 创建振荡器
  const oscillator = audioContext.createOscillator();
  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, now);
  
  // 频率滑动效果
  if (config.slide) {
    oscillator.frequency.linearRampToValueAtTime(
      config.frequency + config.slide,
      now + config.duration
    );
  }
  
  // 创建增益节点（控制音量）
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(config.volume, now);
  
  // 音量衰减
  if (config.decay) {
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      now + config.duration + config.decay
    );
  } else {
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
  }
  
  // 连接节点
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // 播放
  oscillator.start(now);
  oscillator.stop(now + config.duration + (config.decay || 0.1));
}

// 播放背景音乐
class BackgroundMusic {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private noteIndex: number = 0;
  private nextNoteTime: number = 0;
  private schedulerInterval: number | null = null;
  
  // 8-bit 风格旋律（音符频率）
  private melody: number[] = [
    262, 330, 392, 523,  // C4, E4, G4, C5
    262, 330, 392, 523,  // 重复
    294, 349, 440, 587,  // D4, F4, A4, D5
    247, 294, 370, 494,  // B3, D4, G4, B4
  ];
  
  // 音符时长（相对于全音符的分数）
  private noteLengths: number[] = [0.25, 0.25, 0.25, 0.25];
  
  init(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  start(): void {
    if (this.isPlaying) return;
    
    this.init();
    if (!this.audioContext) return;
    
    this.isPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    // 开始调度音符
    this.scheduleNextNote();
    
    // 每 100ms 检查是否需要调度更多音符
    this.schedulerInterval = window.setInterval(() => {
      this.scheduleNextNote();
    }, 100);
  }
  
  stop(): void {
    this.isPlaying = false;
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }
  
  private scheduleNextNote(): void {
    if (!this.audioContext || !this.isPlaying) return;
    
    const secondsPerBeat = 60.0 / this.bpm;
    
    while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
      this.playNote(this.melody[this.noteIndex], this.nextNoteTime);
      
      // 移动到下一个音符
      const noteLength = this.noteLengths[this.noteIndex % this.noteLengths.length];
      this.nextNoteTime += noteLength * secondsPerBeat * 2;
      this.noteIndex = (this.noteIndex + 1) % this.melody.length;
    }
  }
  
  private playNote(frequency: number, time: number): void {
    if (!this.audioContext) return;
    
    // 创建振荡器
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square'; // 8-bit 风格方波
    oscillator.frequency.setValueAtTime(frequency, time);
    
    // 创建增益节点
    const gainNode = this.audioContext.createGain();
    const volume = 0.08;
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    // 添加低通滤波，使声音更柔和
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    
    // 连接节点
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // 播放
    oscillator.start(time);
    oscillator.stop(time + 0.2);
  }
}

// 背景音乐单例
export const backgroundMusic = new BackgroundMusic();

// 音效管理器
class SoundManager {
  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  
  setBgmEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled;
    if (!enabled) {
      backgroundMusic.stop();
    }
  }
  
  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }
  
  isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }
  
  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }
  
  // 播放移动音效
  playMove(): void {
    if (this.sfxEnabled) playSound(SoundType.MOVE);
  }
  
  // 播放旋转音效
  playRotate(): void {
    if (this.sfxEnabled) playSound(SoundType.ROTATE);
  }
  
  // 播放下落音效
  playDrop(): void {
    if (this.sfxEnabled) playSound(SoundType.DROP);
  }
  
  // 播放硬降音效
  playHardDrop(): void {
    if (this.sfxEnabled) playSound(SoundType.HARD_DROP);
  }
  
  // 播放消除音效
  playLineClear(lines: number): void {
    if (!this.sfxEnabled) return;
    
    // 根据消除行数播放不同音效
    if (lines >= 4) {
      // 四行消除（Tetris）播放特殊音效
      playSound(SoundType.LEVEL_UP);
    } else if (lines > 0) {
      playSound(SoundType.LINE_CLEAR);
    }
  }
  
  // 播放升级音效
  playLevelUp(): void {
    if (this.sfxEnabled) playSound(SoundType.LEVEL_UP);
  }
  
  // 播放游戏结束音效
  playGameOver(): void {
    if (this.sfxEnabled) playSound(SoundType.GAME_OVER);
    backgroundMusic.stop();
  }
  
  // 播放开始音效
  playStart(): void {
    if (this.sfxEnabled) playSound(SoundType.START);
    if (this.bgmEnabled) {
      backgroundMusic.start();
    }
  }
  
  // 播放暂停音效
  playPause(): void {
    if (this.sfxEnabled) playSound(SoundType.PAUSE);
    if (backgroundMusic) {
      // 暂停时停止背景音乐
      backgroundMusic.stop();
    }
  }
  
  // 播放恢复音效
  playResume(): void {
    if (this.sfxEnabled) playSound(SoundType.PAUSE);
    if (this.bgmEnabled && backgroundMusic) {
      backgroundMusic.start();
    }
  }
}

export const soundManager = new SoundManager();
