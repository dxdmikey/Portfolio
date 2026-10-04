/** The bronze table the player is cleaning: fuel logs from construction sites. */
export const SCHEMA = ["order_id", "site", "fuel_litres", "logged_at"] as const;
export type Column = (typeof SCHEMA)[number];

export const ID_COLUMN: Column = "order_id";
export const QUANTITY_COLUMN: Column = "fuel_litres";
export const DATE_COLUMN: Column = "logged_at";
