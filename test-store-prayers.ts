import { store } from './src/data/store.ts';

setTimeout(() => {
  console.log(JSON.stringify(store.prayerRequests.slice(0, 3), null, 2));
  process.exit(0);
}, 2000);
