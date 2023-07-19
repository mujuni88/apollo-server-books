import LRU from "lru-cache";
export const cache = LRU({ max: 25, maxAge: 1000 * 60 * 5 });
