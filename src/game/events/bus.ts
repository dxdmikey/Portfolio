/**
 * Tiny typed pub/sub. Features talk through events instead of importing each other:
 * a click emits `discover`; NOVA and the FX layer each react on their own.
 */
export type Listener<E> = (event: E) => void;

export class EventBus<E extends { type: string }> {
  private readonly listeners = new Set<Listener<E>>();
  private readonly lastByType = new Map<E["type"], E>();

  emit(event: E): void {
    this.lastByType.set(event.type, event);
    // Copy so listeners can unsubscribe while handling.
    [...this.listeners].forEach((fn) => fn(event));
  }

  /** Subscribe to every event. Returns an unsubscribe function. */
  on(fn: Listener<E>): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * The most recent event of a type, if any. Lets a subscriber that mounts late (a lazily
   * loaded layer) catch up on state-like events such as `chapter:enter`.
   */
  latest<T extends E["type"]>(type: T): Extract<E, { type: T }> | undefined {
    return this.lastByType.get(type) as Extract<E, { type: T }> | undefined;
  }

  /** Subscribe to one event type, narrowed. */
  onType<T extends E["type"]>(type: T, fn: Listener<Extract<E, { type: T }>>): () => void {
    return this.on((e) => {
      if (e.type === type) fn(e as Extract<E, { type: T }>);
    });
  }
}
