import { LRUCache } from "typescript-lru-cache";
import { Book, Category } from "./data";

export const cache = new LRUCache<string, Book | Category>({
  maxSize: 100,
  entryExpirationTimeInMS: 5000,
  onEntryEvicted: ({ key, value, isExpired }) =>
    console.log(
      `Entry with key ${key} and value ${value} was evicted from the cache. Expired: ${isExpired}`,
    ),
  onEntryMarkedAsMostRecentlyUsed: ({ key, value }) =>
    console.log(
      `Entry with key ${key} and value ${value} was just marked as most recently used.`,
    ),
});
