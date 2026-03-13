// 粒子动画系统
import { type Particle, PIXEL_COLORS } from './types';

let particleIdCounter = 0;

// 创建粒子
export function createParticle(
  x: number,
  y: number,
  type: Particle['type'],
  color?: string
): Particle {
  const baseConfig = {
    explosion: {
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      life: 45,
      size: 4 + Math.random() * 5,
    },
    trail: {
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2,
      life: 20,
      size: 3 + Math.random() * 2,
    },
    glow: {
      vx: (Math.random() - 0.5) * 1,
      vy: -Math.random() * 2,
      life: 30,
      size: 6 + Math.random() * 4,
    },
    sparkle: {
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      size: 2 + Math.random() * 4,
    },
    // 新增：碎片粒子 - 用于消除时的方块碎裂效果
    debris: {
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5,
      life: 50,
      size: 3 + Math.random() * 6,
    },
    // 新增：火花粒子 - 快速飞溅
    spark: {
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 3,
      life: 25,
      size: 1 + Math.random() * 2,
    },
    // 新增：光晕粒子 - 柔和发光
    halo: {
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1,
      life: 40,
      size: 8 + Math.random() * 6,
    },
  };

  const config = baseConfig[type] || baseConfig.explosion;
  
  return {
    id: particleIdCounter++,
    x,
    y,
    vx: config.vx,
    vy: config.vy,
    life: config.life,
    maxLife: config.life,
    color: color || PIXEL_COLORS.particleWhite,
    size: config.size,
    type,
  };
}

// 创建消除特效粒子
export function createExplosionParticles(
  x: number,
  y: number,
  color: string,
  count: number = 20
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'explosion', color));
  }
  return particles;
}

// 创建拖尾粒子
export function createTrailParticles(
  x: number,
  y: number,
  color: string,
  count: number = 3
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'trail', color));
  }
  return particles;
}

// 创建发光粒子
export function createGlowParticles(
  x: number,
  y: number,
  count: number = 5
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'glow', PIXEL_COLORS.particleWhite));
  }
  return particles;
}

// 创建闪烁粒子
export function createSparkleParticles(
  x: number,
  y: number,
  count: number = 8
): Particle[] {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.particleRainbow;
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(
      x, 
      y, 
      'sparkle', 
      colors[Math.floor(Math.random() * colors.length)]
    ));
  }
  return particles;
}

// 创建碎片粒子 - 用于消除时的方块碎裂效果
export function createDebrisParticles(
  x: number,
  y: number,
  color: string,
  count: number = 15
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'debris', color));
  }
  return particles;
}

// 创建火花粒子 - 快速飞溅效果
export function createSparkParticles(
  x: number,
  y: number,
  color: string,
  count: number = 10
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'spark', color));
  }
  return particles;
}

// 创建光晕粒子 - 柔和发光效果
export function createHaloParticles(
  x: number,
  y: number,
  color: string,
  count: number = 5
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, 'halo', color));
  }
  return particles;
}

// 创建连锁消除特效 - 多行消除时更炫酷
export function createChainReactionParticles(
  x: number,
  y: number,
  linesCleared: number,
  colors: string[]
): Particle[] {
  const particles: Particle[] = [];
  const baseCount = 15 + linesCleared * 10; // 行数越多，粒子越多
  
  for (let i = 0; i < baseCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    // 混合使用不同类型的粒子
    const types: Particle['type'][] = ['explosion', 'debris', 'spark', 'sparkle'];
    const type = types[Math.floor(Math.random() * types.length)];
    particles.push(createParticle(x, y, type, color));
  }
  return particles;
}

// 更新粒子
export function updateParticle(particle: Particle): Particle {
  const gravity = 0.25;
  const friction = 0.97;
  
  // 不同粒子类型有不同的物理效果
  let vx = particle.vx;
  let vy = particle.vy;
  let size = particle.size;
  
  switch (particle.type) {
    case 'spark':
      // 火花粒子更快的衰减
      vx *= 0.95;
      vy *= 0.95;
      size *= 0.92;
      break;
    case 'halo':
      // 光晕粒子缓慢飘动
      vx += (Math.random() - 0.5) * 0.3;
      vy -= 0.05; // 缓慢上升
      size *= 0.98;
      break;
    case 'debris':
      // 碎片粒子更重的重力
      vy += gravity * 1.2;
      vx *= friction;
      size *= 0.96;
      break;
    default:
      vy += gravity;
      vx *= friction;
      size *= 0.97;
  }
  
  return {
    ...particle,
    x: particle.x + vx,
    y: particle.y + vy,
    vx,
    vy,
    life: particle.life - 1,
    size,
  };
}

// 检查粒子是否存活
export function isParticleAlive(particle: Particle): boolean {
  return particle.life > 0 && particle.size > 0.5;
}

// 批量更新粒子
export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(updateParticle)
    .filter(isParticleAlive);
}

// 获取粒子透明度
export function getParticleOpacity(particle: Particle): number {
  return particle.life / particle.maxLife;
}

// 粒子系统管理器
export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 500;

  addParticles(newParticles: Particle[]): void {
    this.particles.push(...newParticles);
    // 限制粒子数量
    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(-this.maxParticles);
    }
  }

  update(): Particle[] {
    this.particles = updateParticles(this.particles);
    return this.particles;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }

  getCount(): number {
    return this.particles.length;
  }
}

// 创建粒子系统实例
export const particleSystem = new ParticleSystem();
