const fs = require('fs');
const path = require('path');
const storePath = path.join(__dirname, 'src/data/store.ts');
let content = fs.readFileSync(storePath, 'utf8');

const fixLogic = `
        // Fix for missing/empty rolePermissions in older DB state
        if (!rawStore.rolePermissions || rawStore.rolePermissions.length === 0) {
            rawStore.rolePermissions = [
              { role_id: 1, permission_id: 1 },
              { role_id: 1, permission_id: 2 },
              { role_id: 1, permission_id: 3 },
              { role_id: 1, permission_id: 4 },
              { role_id: 1, permission_id: 5 },
              { role_id: 2, permission_id: 5 },
              { role_id: 2, permission_id: 3 },
              { role_id: 2, permission_id: 2 },
            ];
        }
        if (!rawStore.permissions || rawStore.permissions.length === 0) {
            rawStore.permissions = [
              { id: 1, name: 'manage_users' },
              { id: 2, name: 'manage_pods' },
              { id: 3, name: 'manage_members' },
              { id: 4, name: 'manage_settings' },
              { id: 5, name: 'view_dashboard' },
            ];
        }
`;

content = content.replace("Object.assign(rawStore, state);", "Object.assign(rawStore, state);\n" + fixLogic);

fs.writeFileSync(storePath, content);
console.log("Role permissions patched");
