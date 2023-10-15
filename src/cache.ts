import { LRUCache } from "typescript-lru-cache";
import { Book, Category } from "./data";

export const cache = new LRUCache<string, Book | Category>({
  maxSize: 100,
  entryExpirationTimeInMS: 1000 * 60 * 10,
  onEntryEvicted: ({ key, value, isExpired }) => {
    console.log(JSON.stringify(value));
    console.log(`Entry evicted from the cache. Expired: ${isExpired}`);
  },
  onEntryMarkedAsMostRecentlyUsed: ({ key, value }) => {
    console.log(JSON.stringify(value));
    console.log(`Entry marked as most recently used`);
  },
});
