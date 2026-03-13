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
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 3,
      life: 40,
      size: 4 + Math.random() * 4,
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
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 25,
      size: 2 + Math.random() * 3,
    },
  };

  const config = baseConfig[type];
  
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

// 更新粒子
export function updateParticle(particle: Particle): Particle {
  const gravity = 0.2;
  const friction = 0.98;
  
  return {
    ...particle,
    x: particle.x + particle.vx,
    y: particle.y + particle.vy,
    vy: particle.vy + gravity,
    vx: particle.vx * friction,
    life: particle.life - 1,
    size: particle.size * 0.97,
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
