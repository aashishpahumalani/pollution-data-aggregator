class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = parseInt(process.env.CACHE_TTL_MINUTES || "60") * 60 * 1000; // Convert to milliseconds
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, {
      value,
      expiry,
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new MemoryCache();

setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

module.exports = cache;
