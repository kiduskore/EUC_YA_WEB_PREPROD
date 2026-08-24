with open('static/js/dashboard/main.js', 'r') as f:
    content = f.read()

target = """            const fetchAll = async () => {
                loading.value = true;
                await Promise.all([fetchStats(), fetchMembers(), fetchPods(), fetchPipeline(), fetchPlans(), fetchPrayers(), fetchResources()]);
                loading.value = false;
                if (currentView.value === 'overview') nextTick(() => initChart());
            };"""

replacement = """            const fetchAll = async () => {
                loading.value = true;
                try {
                    await Promise.allSettled([
                        fetchStats().catch(e => console.error("fetchStats failed", e)), 
                        fetchMembers().catch(e => console.error("fetchMembers failed", e)), 
                        fetchPods().catch(e => console.error("fetchPods failed", e)), 
                        fetchPipeline().catch(e => console.error("fetchPipeline failed", e)), 
                        fetchPlans().catch(e => console.error("fetchPlans failed", e)), 
                        fetchPrayers().catch(e => console.error("fetchPrayers failed", e)), 
                        fetchResources().catch(e => console.error("fetchResources failed", e))
                    ]);
                } catch (e) {
                    console.error("Dashboard data load error:", e);
                } finally {
                    loading.value = false;
                    if (currentView.value === 'overview') nextTick(() => initChart());
                }
            };"""

content = content.replace(target, replacement)

# Also fix fetchInvites
invites_target = """            const fetchInvites = async () => {
                const data = await apiClient('/api/invites');
                if (data) invitesList.value = data;
            };"""

invites_replacement = """            const fetchInvites = async () => {
                try {
                    const data = await apiClient('/api/invites');
                    if (data) invitesList.value = data;
                } catch (e) {
                    console.error("fetchInvites failed:", e);
                }
            };"""

content = content.replace(invites_target, invites_replacement)

with open('static/js/dashboard/main.js', 'w') as f:
    f.write(content)
