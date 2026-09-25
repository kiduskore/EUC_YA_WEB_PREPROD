const fs = require('fs');
const path = require('path');

// 1. Server route
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

const weeklyPlanDeleteRoute = `
app.delete('/api/weekly-plans/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.weeklyPlans = store.weeklyPlans.filter(p => p.id !== id);
  res.json({ success: true });
});
`;
serverContent = serverContent.replace(
  "app.put('/api/weekly-plans/:id', requireAuth, (req: Request, res: Response) => {",
  weeklyPlanDeleteRoute + "\napp.put('/api/weekly-plans/:id', requireAuth, (req: Request, res: Response) => {"
);
fs.writeFileSync(serverTsPath, serverContent);

// 2. UI
const dashboardPath = path.join(__dirname, 'views/dashboard.ejs');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const planEmptyState = `
            <div v-if="plans.length === 0" class="p-8 text-center text-slate-300 italic glass bg-cardDark">
                No weekly plans found. Create one above!
            </div>
`;
dashboardContent = dashboardContent.replace(
  '<div v-for="plan in plans" :key="plan.id" class="glass p-6 bg-cardDark">',
  planEmptyState + '\n                <div v-for="plan in plans" :key="plan.id" class="glass p-6 bg-cardDark relative group">'
);

// Add delete button to UI
const planDeleteBtn = `
                            <button @click="deletePlan(plan.id)" class="absolute top-4 right-4 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Plan">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
`;
dashboardContent = dashboardContent.replace(
  '<h4 class="font-bold text-lg text-white">{{ plan.pod }}</h4>',
  planDeleteBtn + '\n                            <h4 class="font-bold text-lg text-white">{{ plan.pod }}</h4>'
);

// Add deletePlan method to Vue
const deletePlanMethod = `
                async deletePlan(id) {
                    if (!confirm('Are you sure you want to delete this plan?')) return;
                    try {
                        const res = await apiClient(\`/api/weekly-plans/\${id}\`, { method: 'DELETE' });
                        if (res) this.fetchPlans();
                    } catch (err) {
                        alert(err.message);
                    }
                },
`;
dashboardContent = dashboardContent.replace(
  'async submitReport(plan, reportText) {',
  deletePlanMethod + '\n                async submitReport(plan, reportText) {'
);

fs.writeFileSync(dashboardPath, dashboardContent);
console.log("Weekly plans patched");
