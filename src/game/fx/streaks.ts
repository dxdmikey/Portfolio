/**
 * Shooting stars launched from a point: a head moving in a straight line with a fading
 * trail. Fixed capacity, reused slots, no allocation after construction.
 */
export interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  duration: number;
}

export const STREAK_SPEED = 620;
export const STREAK_S = 0.7;
/** Shallow downward angle, like the sky's own shooting stars. */
const STREAK_SLOPE = 0.42;

export class StreakPool {
  private readonly items: Streak[];
  private live = 0;

  constructor(readonly capacity: number) {
    this.items = Array.from({ length: capacity }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      duration: 1,
    }));
  }

  get count(): number {
    return this.live;
  }

  get(i: number): Streak {
    return this.items[i]!;
  }

  /** Launches towards the wider side of the screen so the streak has room to travel. */
  launch(x: number, y: number, screenWidth: number): void {
    if (this.live >= this.capacity) return;
    const s = this.items[this.live++]!;
    const dir = x > screenWidth / 2 ? -1 : 1;
    const norm = Math.hypot(1, STREAK_SLOPE);
    s.x = x;
    s.y = y;
    s.vx = (dir * STREAK_SPEED) / norm;
    s.vy = (STREAK_SPEED * STREAK_SLOPE) / norm;
    s.age = 0;
    s.duration = STREAK_S;
  }

  step(dt: number): void {
    let i = 0;
    while (i < this.live) {
      const s = this.items[i]!;
      s.age += dt;
      if (s.age >= s.duration) {
        const last = --this.live;
        this.items[i] = this.items[last]!;
        this.items[last] = s;
        continue;
      }
      i++;
    }
  }

  clear(): void {
    this.live = 0;
  }
}
