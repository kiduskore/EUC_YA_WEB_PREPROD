with open('templates/dashboard.html', 'r') as f:
    content = f.read()

# Pods empty state
pods_target = """        <div v-show="currentView === 'pods' && !loading" class="space-y-6">
            <div class="flex justify-between items-end">
                <div>
                    <h2 class="text-3xl font-black text-white mb-2">DNA Pods</h2>
                    <p class="text-slate-400 font-medium">Manage small groups and leadership.</p>
                </div>
            </div>"""

pods_replacement = pods_target + """
            <div v-if="pods.length === 0" class="glass p-12 text-center bg-cardDark">
                <p class="text-slate-400 mb-4">No DNA Pods have been created yet.</p>
            </div>"""

content = content.replace(pods_target, pods_replacement)

# Planner empty state
planner_target = """                    </div>
                </div>
            </div>
            
            <div class="glass p-6 bg-cardDark">
                <h3 class="text-lg font-bold text-white mb-4">Recent Plans</h3>
                <div class="space-y-4">"""

planner_replacement = """                    </div>
                </div>
            </div>
            
            <div class="glass p-6 bg-cardDark">
                <h3 class="text-lg font-bold text-white mb-4">Recent Plans</h3>
                <div v-if="plans.length === 0" class="text-slate-400 py-6 text-center">No weekly plans have been submitted.</div>
                <div class="space-y-4">"""

content = content.replace(planner_target, planner_replacement)

# Pipeline empty state
pipeline_target = """            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div v-for="(col, index) in pipelineCols" :key="col.id" class="glass rounded-xl flex flex-col max-h-[80vh] bg-white/5">
                    <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-xl">
                        <h3 class="font-bold text-white uppercase tracking-wider text-sm">{{ col.title }}</h3>
                        <span class="bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-full">{{ col.items.length }}</span>
                    </div>
                    <div class="p-4 flex-1 overflow-y-auto space-y-4 min-h-[200px]">"""

pipeline_replacement = """            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div v-for="(col, index) in pipelineCols" :key="col.id" class="glass rounded-xl flex flex-col max-h-[80vh] bg-white/5">
                    <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-xl">
                        <h3 class="font-bold text-white uppercase tracking-wider text-sm">{{ col.title }}</h3>
                        <span class="bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-full">{{ col.items.length }}</span>
                    </div>
                    <div class="p-4 flex-1 overflow-y-auto space-y-4 min-h-[200px]">
                        <div v-if="col.items.length === 0" class="text-slate-400/50 text-xs text-center py-8">Empty</div>"""

content = content.replace(pipeline_target, pipeline_replacement)

with open('templates/dashboard.html', 'w') as f:
    f.write(content)
