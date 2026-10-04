import { createRng } from "./prng";
import type { IncidentOption, IncidentSpec } from "./types";

/** An incident as played: the options are shuffled so the right fix isn't always first. */
export interface PickedIncident {
  spec: IncidentSpec;
  options: readonly IncidentOption[];
}

/** Keeps incident picks independent from the record batches of the same seed. */
const INCIDENT_SEED_SALT = 0x9e37_79b9;

/** A registry entry is playable when it has options and exactly one right fix. */
export function isPlayable(spec: IncidentSpec): boolean {
  return spec.options.length > 1 && spec.options.filter((o) => o.correct === true).length === 1;
}

/** Picks `count` distinct incidents for a shift. Same seed → same incidents and option order. */
export function pickIncidents(
  pool: readonly IncidentSpec[],
  count: number,
  seed: number,
): readonly PickedIncident[] {
  const rng = createRng((seed ^ INCIDENT_SEED_SALT) >>> 0);
  return rng
    .shuffle(pool.filter(isPlayable))
    .slice(0, Math.max(0, count))
    .map((spec) => ({ spec, options: rng.shuffle(spec.options) }));
}

export function isRightFix(incident: PickedIncident, option: number): boolean {
  return incident.options[option]?.correct === true;
}

export function rightFixIndex(incident: PickedIncident): number {
  return incident.options.findIndex((o) => o.correct === true);
}
