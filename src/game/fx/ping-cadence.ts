/**
 * Rhythm for background "star pings": throttles rapid clicks and promotes every Nth
 * accepted click to a shooting star. Pure, so the cadence is unit-tested.
 */
export type PingKind = "skip" | "ping" | "shooting";

export const PING_THROTTLE_MS = 80;
export const SHOOTING_EVERY = 6;

export class PingCadence {
  private last = Number.NEGATIVE_INFINITY;
  private count = 0;

  constructor(
    private readonly throttleMs = PING_THROTTLE_MS,
    private readonly every = SHOOTING_EVERY,
  ) {}

  /** Call on each background click with a monotonic timestamp (ms). */
  hit(now: number): PingKind {
    if (now - this.last < this.throttleMs) return "skip";
    this.last = now;
    this.count += 1;
    return this.count % this.every === 0 ? "shooting" : "ping";
  }
}
