import { store } from './src/data/store.ts';

setTimeout(() => {
  console.log(JSON.stringify(store.members.slice(0,2), null, 2));
  process.exit(0);
}, 2000);
