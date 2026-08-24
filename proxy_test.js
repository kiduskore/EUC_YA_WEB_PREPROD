class Store {
  constructor() { this.x = 1; }
  addSomething() { this.x++; return this.x; }
  getSomething() { return this.x; }
}
const rawStore = new Store();
const store = new Proxy(rawStore, {
  get(target, prop) {
    const orig = target[prop];
    if (typeof orig === 'function') {
      return function(...args) {
        const res = orig.apply(target, args);
        if (['add', 'get'].some(prefix => prop.startsWith(prefix))) {
          console.log(`Intercepted ${prop}! Triggering save...`);
        }
        return res;
      };
    }
    return orig;
  }
});
store.addSomething();
store.getSomething();
