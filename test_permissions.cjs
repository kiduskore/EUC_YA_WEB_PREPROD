import('./src/data/store.js').then(m => {
  setTimeout(() => {
    const store = m.store;
    const user = store.users.find(u => u.email === 'keku121@gmail.com');
    console.log("User:", user);
    if (user) {
      console.log("Permissions:", store.getUserPermissions(user.id));
    }
    console.log("Role permissions length:", store.rolePermissions ? store.rolePermissions.length : 'undefined');
    process.exit(0);
  }, 2000);
}).catch(e => console.error(e));
