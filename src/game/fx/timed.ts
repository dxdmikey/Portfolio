/**
 * Fixed-capacity pool of short-lived effects that only need a position, an age and a
 * colour: expanding ripples and floating "+XP" labels. The renderer reads `progress(i)`
 * (0 → 1) and decides how to draw it. When full, the oldest effect is replaced.
 */
export interface TimedEffect {
  x: number;
  y: number;
  age: number;
  duration: number;
  color: number;
  label: string;
}

export class TimedPool {
  private readonly items: TimedEffect[];
  private live = 0;

  constructor(readonly capacity: number) {
    this.items = Array.from({ length: capacity }, () => ({
      x: 0,
      y: 0,
      age: 0,
      duration: 1,
      color: 0,
      label: "",
    }));
  }

  get count(): number {
    return this.live;
  }

  add(x: number, y: number, duration: number, color: number, label = ""): void {
    const slot = this.live < this.capacity ? this.items[this.live++]! : this.oldest();
    slot.x = x;
    slot.y = y;
    slot.age = 0;
    slot.duration = duration;
    slot.color = color;
    slot.label = label;
  }

  get(i: number): TimedEffect {
    return this.items[i]!;
  }

  /** 0 at spawn, 1 when expired. */
  progress(i: number): number {
    const it = this.items[i]!;
    return Math.min(it.age / it.duration, 1);
  }

  step(dt: number): void {
    let i = 0;
    while (i < this.live) {
      const it = this.items[i]!;
      it.age += dt;
      if (it.age >= it.duration) {
        // Swap the expired slot with the last live one (objects are reused, never freed).
        const last = this.live - 1;
        this.items[i] = this.items[last]!;
        this.items[last] = it;
        this.live = last;
        continue;
      }
      i++;
    }
  }

  clear(): void {
    this.live = 0;
  }

  private oldest(): TimedEffect {
    let best = this.items[0]!;
    for (let i = 1; i < this.live; i++) if (this.items[i]!.age > best.age) best = this.items[i]!;
    return best;
  }
}
