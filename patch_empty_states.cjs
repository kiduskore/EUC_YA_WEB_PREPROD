const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'views/dashboard.ejs');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Pods empty state
const podsEmptyState = `
            <div v-if="pods.length === 0" class="p-8 text-center text-slate-300 italic glass bg-cardDark">
                No DNA Pods found. Add one above!
            </div>
`;
content = content.replace(
  '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">',
  podsEmptyState + '\n            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">'
);

// Pipeline empty state
// pipelineCols is an array of columns.
// We can just add it inside the col.items loop.
const pipelineEmptyState = `
                        <div v-if="col.items.length === 0" class="p-4 text-center text-slate-400 text-xs italic bg-white/5 rounded-xl border border-white/5 border-dashed">
                            No contacts in this stage.
                        </div>
`;
content = content.replace(
  '<div v-for="item in col.items" :key="item.id" class="kanban-card p-4 cursor-grab bg-cardDark">',
  pipelineEmptyState + '\n                        <div v-for="item in col.items" :key="item.id" class="kanban-card p-4 cursor-grab bg-cardDark">'
);

fs.writeFileSync(dashboardPath, content);
console.log("Empty states patched");
