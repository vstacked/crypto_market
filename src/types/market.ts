export const FILTERS = ["All", "Cryptocurrency", "Favorites"] as const;
export type FilterType = (typeof FILTERS)[number];
