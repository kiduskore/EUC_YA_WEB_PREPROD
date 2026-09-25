const rawStore = { rolePermissions: [1, 2, 3] };
const state = {}; // saved in DB without rolePermissions
Object.assign(rawStore, state);
console.log(rawStore.rolePermissions);

const state2 = { rolePermissions: undefined };
Object.assign(rawStore, state2);
console.log(rawStore.rolePermissions);
