import { apiClient } from '/static/js/dashboard/apiClient.js';

    const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

    createApp({
        setup() {
            const userPermissions = window.USER_PERMISSIONS || [];
            const hasPermission = (p) => userPermissions.includes(p);
            const userEmail = ref(window.USER_EMAIL || "");
            const userRole = ref(window.USER_ROLE || "");
            const currentView = ref('overview');
            const loading = ref(true);
            const searchQuery = ref('');
            const showAddMember = ref(false);
            const prayerTab = ref('active');
            const resourceCategory = ref('All');
            const editingMemberId = ref(null);
            const showAddPrayer = ref(false);
            const showAddNewcomer = ref(false);
            const showAddResource = ref(false);
            const showNotifications = ref(false);


            const allNavItems = [

                { id: 'overview', label: 'Overview', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>' },
                { id: 'members', label: 'Members', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' },
                { id: 'pods', label: 'DNA Pods', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
                { id: 'pipeline', label: 'Pipeline', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' },
                { id: 'planner', label: 'Planner', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' },
                { id: 'prayer', label: 'Prayer Wall', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>' },
                { id: 'journey', label: 'Journey', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' },
                { id: 'training', label: 'Training Guide', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>' },
                { id: 'resources', label: 'Resources', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
                { id: 'invites', label: 'Team Invites', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>' }
            ];
            const navItems = computed(() => {
                return allNavItems.filter(nav => {
                    if (nav.id === 'members' || nav.id === 'journey') return hasPermission('manage_members');
                    if (nav.id === 'pods' || nav.id === 'planner') return hasPermission('manage_pods');
                    if (nav.id === 'resources' || nav.id === 'training') return hasPermission('manage_settings');
                    if (nav.id === 'invites') return hasPermission('manage_users');
                    return true;
                });
            });


            
            const currentViewTitle = computed(() => {
                const item = navItems.value.find(n => n.id === currentView.value);
                if (item) return item.label;
                const yaTitles = {
                    'ya_hub': 'Young Adult Hub',
                    'ya_groups': 'YA Small Groups',
                    'ya_toolkit': 'YA Leadership Toolkit',
                    'ya_reflections': 'YA Reflections'
                };
                return yaTitles[currentView.value] || 'Dashboard';
            });

            // STATE
            const stats = ref([]);
            const rawStats = ref({});
            const stageDistribution = ref([]);
            const recentPrayers = ref([]);
            const allMembers = ref([]);
            const memberForm = ref({ name: '', email: '', phone: '', join_date: '', role: 'member', spiritual_stage: 'new' });
            const pods = ref([]);
            const podForm = ref({ name: '', leader_id: '' });
            const pipelineCols = ref([
                { id: 'first_contact', title: 'First Contact', items: [] },
                { id: 'welcomed', title: 'Welcomed', items: [] },
                { id: 'invited_to_pod', title: 'Invited to Pod', items: [] },
                { id: 'integrated', title: 'Integrated', items: [] }
            ]);
            const plans = ref([]);
            const planForm = ref({ pod_id: '', week_date: '', bible_passage: '', discussion_questions: '', spiritual_goals: '' });
            const prayers = ref({ active: [], answered: [] });
            const prayerForm = ref({ member_id: '', request_text: '', is_urgent: false });
            const resources = ref([]);
            const resourceForm = ref({ title: '', description: '', category: 'Bible Study', file_url: '' });
            const newcomerForm = ref({ name: '', phone: '', email: '', notes: '' });
            const journeyStages = ['new', 'saved', 'baptized', 'foundations', 'ready_to_lead', 'leading'];

            // API HELPERS

            // DATA FETCHERS
            const fetchStats = async () => {
                const data = await apiClient('/api/stats');
                if (!data) return;
                rawStats.value = data;
                stats.value = [
                    { label: 'Total Members', value: data.total_members, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' },
                    { label: 'DNA Pods', value: data.total_pods, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
                    { label: 'Leaders', value: data.total_leaders, icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>' },
                    { label: 'Attendance Rate', value: data.attendance_rate + '%', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' }
                ];
                const dist = data.stage_distribution || {};
                const total = data.total_members || 1;
                stageDistribution.value = Object.entries(dist).map(([k, v]) => ({
                    name: formatStage(k), count: v, percent: (v / total) * 100
                }));
            };

            const fetchMembers = async () => {
                const data = await apiClient('/api/members');
                if (data) allMembers.value = data;
            };

            const fetchPods = async () => {
                const data = await apiClient('/api/pods');
                if (data) pods.value = data;
            };

            const fetchPipeline = async () => {
                const data = await apiClient('/api/pipeline');
                if (!data) return;
                const stages = ['first_contact', 'welcomed', 'invited_to_pod', 'integrated'];
                const titles = ['First Contact', 'Welcomed', 'Invited to Pod', 'Integrated'];
                pipelineCols.value = stages.map((s, i) => ({
                    id: s, title: titles[i],
                    items: data.filter(d => d.stage === s)
                }));
            };

            const fetchPlans = async () => {
                const data = await apiClient('/api/weekly-plans');
                if (!data) return;
                plans.value = data.map(p => ({
                    ...p,
                    questions: p.discussion_questions ? (typeof p.discussion_questions === 'string' ? JSON.parse(p.discussion_questions) : p.discussion_questions) : [],
                    goals: p.spiritual_goals ? (typeof p.spiritual_goals === 'string' ? JSON.parse(p.spiritual_goals) : p.spiritual_goals) : [],
                    report: p.post_meeting_notes
                }));
            };

            const fetchPrayers = async () => {
                const active = await apiClient('/api/prayer?status=active');
                const answered = await apiClient('/api/prayer?status=answered');
                prayers.value = {
                    active: (active || []).map(p => ({ ...p, name: p.member_name || p.requester_name || 'Anonymous', time: p.created_at, text: p.request_text, urgent: p.is_urgent, prays: p.supporter_count || 0 })),
                    answered: (answered || []).map(p => ({ ...p, name: p.member_name || p.requester_name || 'Anonymous', text: p.request_text, answeredDate: p.answered_at }))
                };
                recentPrayers.value = prayers.value.active.slice(0, 5);
            };

            const fetchResources = async () => {
                const data = await apiClient('/api/resources');
                if (data) resources.value = data;
            };

            const fetchAll = async () => {
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
            };

            // MEMBER CRUD
            const saveMember = async () => {
                if (editingMemberId.value) {
                    await apiClient(`/api/members/${editingMemberId.value}`, { method: 'PUT', body: memberForm.value });
                    editingMemberId.value = null;
                } else {
                    await apiClient('/api/members', { method: 'POST', body: memberForm.value });
                }
                memberForm.value = { name: '', email: '', phone: '', join_date: '', role: 'member', spiritual_stage: 'new' };
                showAddMember.value = false;
                await Promise.all([fetchMembers(), fetchStats()]);
            };

            const editMember = (member) => {
                editingMemberId.value = member.id;
                memberForm.value = { name: member.name, email: member.email || '', phone: member.phone || '', join_date: member.join_date || '', role: member.role, spiritual_stage: member.spiritual_stage };
                showAddMember.value = true;
            };

            const deleteMember = async (id) => {
                if (!confirm('Delete this member?')) return;
                await apiClient(`/api/members/${id}`, { method: 'DELETE' });
                await Promise.all([fetchMembers(), fetchStats(), fetchPods()]);
            };

            const updateStage = async (member, newStage) => {
                if (!newStage) return;
                await apiClient(`/api/members/${member.id}/stage`, { method: 'PUT', body: { stage: newStage } });
                await Promise.all([fetchMembers(), fetchStats()]);
            };

            // POD CRUD
            const isSidebarOpen = ref(false);
            // Watch sidebar for iOS scroll locking
            let dashScroll = 0;
            watch(isSidebarOpen, (isOpen) => {
                if (isOpen) {
                    dashScroll = window.pageYOffset;
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${dashScroll}px`;
                    document.body.style.width = '100%';
                } else {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, dashScroll);
                }
            });

            const editingPodId = ref(null);
            
            const createPod = async () => {
                if (editingPodId.value) {
                    await apiClient(`/api/pods/${editingPodId.value}`, { method: 'PUT', body: { name: podForm.value.name, leader_id: podForm.value.leader_id || null } });
                    editingPodId.value = null;
                } else {
                    await apiClient('/api/pods', { method: 'POST', body: { name: podForm.value.name, leader_id: podForm.value.leader_id || null } });
                }
                podForm.value = { name: '', leader_id: '' };
                await Promise.all([fetchPods(), fetchStats(), fetchMembers()]);
            };

            const editPod = (pod) => {
                editingPodId.value = pod.id;
                podForm.value = { name: pod.name, leader_id: pod.leader_id || '' };
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            const cancelEditPod = () => {
                editingPodId.value = null;
                podForm.value = { name: '', leader_id: '' };
            };

            const deletePod = async (id) => {
                if (!confirm("Are you sure you want to delete this pod?")) return;
                await apiClient(`/api/pods/${id}`, { method: 'DELETE' });
                await Promise.all([fetchPods(), fetchStats(), fetchMembers()]);
            };

            const addToPod = async (event, podId) => {
                const memberId = event.target.value;
                if (!memberId) return;
                await apiClient(`/api/pods/${podId}/members`, { method: 'POST', body: { member_id: parseInt(memberId) } });
                event.target.value = '';
                await Promise.all([fetchPods(), fetchMembers()]);
            };

            const removeFromPod = async (podId, memberId) => {
                await apiClient(`/api/pods/${podId}/members/${memberId}`, { method: 'DELETE' });
                await Promise.all([fetchPods(), fetchMembers()]);
            };

            // PIPELINE CRUD
            const addNewcomer = async () => {
                await apiClient('/api/pipeline', { method: 'POST', body: newcomerForm.value });
                newcomerForm.value = { name: '', phone: '', email: '', notes: '' };
                showAddNewcomer.value = false;
                await fetchPipeline();
            };

            const moveNewcomer = async (item, colIndex) => {
                try {
                    const stages = ['first_contact', 'welcomed', 'invited_to_pod', 'integrated'];
                    const nextStage = stages[parseInt(colIndex) + 1];
                    if (!nextStage) {
                        alert("Cannot move: No next stage found for index " + colIndex);
                        return;
                    }
                    const res = await apiClient(`/api/pipeline/${item.id}`, { method: 'PUT', body: { ...item, stage: nextStage } });
                    if (res) {
                        await fetchPipeline();
                    } else {
                        alert("Failed to update pipeline stage.");
                    }
                } catch (e) {
                    alert("Error moving newcomer: " + e.message);
                }
            };

            const moveNewcomerBack = async (item, colIndex) => {
                try {
                    const stages = ['first_contact', 'welcomed', 'invited_to_pod', 'integrated'];
                    const prevStage = stages[parseInt(colIndex) - 1];
                    if (!prevStage) return;
                    
                    const res = await apiClient(`/api/pipeline/${item.id}`, { method: 'PUT', body: { ...item, stage: prevStage } });
                    if (res) {
                        await fetchPipeline();
                    } else {
                        alert("Failed to update pipeline stage.");
                    }
                } catch (e) {
                    alert("Error moving newcomer back: " + e.message);
                }
            };

            const convertToMember = async (item) => {
                await apiClient('/api/members', { method: 'POST', body: { name: item.name, phone: item.phone, email: item.email } });
                await apiClient(`/api/pipeline/${item.id}`, { method: 'DELETE' });
                await Promise.all([fetchPipeline(), fetchMembers(), fetchStats()]);
            };

            // PLANNER CRUD
            const createPlan = async () => {
                const body = {
                    pod_id: parseInt(planForm.value.pod_id),
                    leader_id: 1,
                    week_date: planForm.value.week_date,
                    bible_passage: planForm.value.bible_passage,
                    discussion_questions: JSON.stringify(planForm.value.discussion_questions.split('\n').filter(q => q.trim())),
                    spiritual_goals: JSON.stringify(planForm.value.spiritual_goals.split('\n').filter(g => g.trim()))
                };
                await apiClient('/api/weekly-plans', { method: 'POST', body });
                planForm.value = { pod_id: '', week_date: '', bible_passage: '', discussion_questions: '', spiritual_goals: '' };
                await fetchPlans();
            };

            const submitReport = async (plan, reportText) => {
                await apiClient(`/api/weekly-plans/${plan.id}`, { method: 'PUT', body: { ...plan, post_meeting_notes: reportText } });
                await fetchPlans();
            };

            // PRAYER CRUD
            const addPrayer = async () => {
                const mId = parseInt(prayerForm.value.member_id);
                await apiClient('/api/prayer', { method: 'POST', body: { member_id: isNaN(mId) ? null : mId, request_text: prayerForm.value.request_text, is_urgent: prayerForm.value.is_urgent } });
                prayerForm.value = { member_id: '', request_text: '', is_urgent: false };
                showAddPrayer.value = false;
                await Promise.all([fetchPrayers(), fetchStats()]);
            };

            const supportPrayer = async (reqId) => {
                await apiClient(`/api/prayer/${reqId}/support`, { method: 'POST', body: { member_id: 1 } });
                await fetchPrayers();
            };

            const markAnswered = async (reqId, testimony) => {
                await apiClient(`/api/prayer/${reqId}`, { method: 'PUT', body: { status: 'answered', testimony } });
                await Promise.all([fetchPrayers(), fetchStats()]);
            };

            const promptAndMarkAnswered = (reqId) => {
                const t = prompt('Enter a short testimony (optional):');
                if (t !== null) {
                    markAnswered(reqId, t);
                }
            };

            // RESOURCE CRUD
            const addResource = async () => {
                await apiClient('/api/resources', { method: 'POST', body: resourceForm.value });
                resourceForm.value = { title: '', description: '', category: 'Bible Study', file_url: '' };
                showAddResource.value = false;
                await fetchResources();
            };

            const deleteResource = async (id) => {
                await apiClient(`/api/resources/${id}`, { method: 'DELETE' });
                await fetchResources();
            };

            // COMPUTED
            const filteredMembers = computed(() => {
                if (!searchQuery.value) return allMembers.value;
                const q = searchQuery.value.toLowerCase();
                return allMembers.value.filter(m => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
            });

            const leaders = computed(() => allMembers.value.filter(m => m.role === 'leader' || m.role === 'admin'));
            const unassignedMembers = computed(() => {
                const assignedIds = new Set();
                pods.value.forEach(p => (p.members || []).forEach(m => assignedIds.add(m.id)));
                return allMembers.value.filter(m => !assignedIds.has(m.id));
            });

            const filteredResources = computed(() => {
                if (resourceCategory.value === 'All') return resources.value;
                return resources.value.filter(r => r.category === resourceCategory.value);
            });

            const stageCounts = computed(() => {
                const counts = {};
                journeyStages.forEach(s => counts[s] = 0);
                allMembers.value.forEach(m => {
                    if (counts[m.spiritual_stage] !== undefined) counts[m.spiritual_stage]++;
                });
                return counts;
            });

            // HELPERS
            const formatStage = (stage) => (stage || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            const getStageClass = (stage) => {
                const map = { new: 'bg-gray-800 text-slate-300', saved: 'bg-green-900/50 text-green-400 border border-green-500/30', baptized: 'bg-blue-900/50 text-blue-400 border border-blue-500/30', foundations: 'bg-amber-900/50 text-amber-400 border border-amber-500/30', ready_to_lead: 'bg-orange-900/50 text-orange-400 border border-orange-500/30', leading: 'bg-purple-900/50 text-purple-400 border border-purple-500/30' };
                return map[stage] || 'bg-gray-800 text-slate-300';
            };

            const getStageBg = (stage) => {
                const map = { new: 'bg-gray-600', saved: 'bg-green-500 shadow-sm', baptized: 'bg-blue-500 shadow-sm', foundations: 'bg-amber-500 shadow-sm', ready_to_lead: 'bg-orange-500 shadow-sm', leading: 'bg-purple-500 shadow-sm' };
                return map[stage] || 'bg-gray-600';
            };

            const getResourceCatClass = (cat) => {
                const map = { 'Bible Study': 'text-blue-400', 'Leadership': 'text-purple-400', 'Devotional': 'text-pink-400' };
                return map[cat] || 'text-slate-400';
            };

            const isStageCompleted = (currentStage, targetStage) => journeyStages.indexOf(currentStage) > journeyStages.indexOf(targetStage);

            const getJourneyProgress = (currentStage) => {
                const idx = journeyStages.indexOf(currentStage);
                const total = journeyStages.length - 1;
                return `${(idx / total) * 100}%`;
            };

            let chartInstance = null;
            const initChart = () => {
                const ctx = document.getElementById('growthChart');
                if (!ctx) return;
                if (chartInstance) chartInstance.destroy();
                const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(0,117,255,0.4)');
                gradient.addColorStop(1, 'rgba(0,117,255,0)');
                const mbm = rawStats.value.members_by_month || [];
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: mbm.length ? mbm.map(m => m.month) : ['Now'],
                        datasets: [{ label: 'Members', data: mbm.length ? mbm.map(m => m.count) : [rawStats.value.total_members || 0], borderColor: '#0075ff', backgroundColor: gradient, borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#0075ff', pointBorderWidth: 2, pointRadius: 4 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } }, x: { grid: { display: false, drawBorder: false } } } }
                });
            };

            watch(currentView, (nv) => {
                if (nv === 'overview') nextTick(() => initChart());
            });


            // Compute notifications dynamically based on state
            const notifications = computed(() => {
                try {
                    let notifs = [];
                    let notifId = 1;
                    if (pipelineCols.value && pipelineCols.value[0] && pipelineCols.value[0].items) {
                        const newcomers = pipelineCols.value[0].items.length;
                        if (newcomers > 0) {
                            notifs.push({
                                id: notifId++,
                                type: 'pipeline',
                                title: 'New Contacts',
                                message: `${newcomers} newcomer(s) waiting for initial contact.`,
                                icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                            });
                        }
                    }
                    if (prayers.value && prayers.value.active) {
                        const urgentPrayers = prayers.value.active.filter(p => p && (p.is_urgent || p.urgent)).length;
                        if (urgentPrayers > 0) {
                            notifs.push({
                                id: notifId++,
                                type: 'prayer',
                                title: 'Urgent Prayer Request',
                                message: `${urgentPrayers} urgent prayer request(s) need attention.`,
                                icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
                            });
                        }
                    }
                    return notifs;
                } catch (e) {
                    console.error("Vue computed property error:", e);
                    return [];
                }
            });

            const handleNotificationClick = (notif) => {
                if (notif.type === 'pipeline') currentView.value = 'pipeline';
                if (notif.type === 'prayer') currentView.value = 'prayer';
                showNotifications.value = false;
            };

            
            const invitesList = ref([]);
            const inviteRole = ref(2); // Default to Basic Manager
            
            const fetchInvites = async () => {
                if (!hasPermission('manage_users')) return;
                try {
                    const data = await apiClient('/api/invites');
                    invitesList.value = data || [];
                } catch(e) {}
            };
            
            const generateInvite = async () => {
                try {
                    await apiClient('/api/invites', { method: 'POST', body: { role_id: inviteRole.value } });
                    await fetchInvites();
                } catch(e) {}
            };

            const revokeInvite = async (id) => {
                if (!confirm("Are you sure you want to revoke and delete this invite code?")) return;
                
                // Optimistic UI update to remove it immediately
                invitesList.value = invitesList.value.filter(inv => inv.id !== id);
                
                try {
                    const res = await apiClient(`/api/invites/${id}`, { method: 'DELETE' });
                    if (!res) throw new Error("Network error or invalid ID (API returned null).");
                    if (res.error) throw new Error(res.error);
                    if (res.rowcount === 0) throw new Error("Database reported 0 rows deleted. The ID may be invalid.");
                } catch(e) {
                    // Revert if failed
                    alert("Failed to delete invite: " + e.message);
                    await fetchInvites();
                }
            };
            
            onMounted(() => {
                fetchAll();
                fetchInvites();
            });


            return {
                inviteRole,
                invitesList,
                generateInvite,
                revokeInvite,
                hasPermission, userEmail, userRole,
                userPermissions,
                isSidebarOpen,
                currentView, loading, navItems, currentViewTitle,
                stats, stageDistribution, recentPrayers,
                allMembers, filteredMembers, searchQuery, showAddMember, memberForm, saveMember, editMember, deleteMember, editingMemberId,
                formatStage, getStageClass, getStageBg, leaders, unassignedMembers,
                editingPodId, pods, podForm, createPod, editPod, cancelEditPod, deletePod, addToPod, removeFromPod,
                pipelineCols, addNewcomer, moveNewcomer, moveNewcomerBack, convertToMember, newcomerForm, showAddNewcomer,
                plans, planForm, createPlan, submitReport,
                prayerTab, prayers, prayerForm, addPrayer, supportPrayer, markAnswered, promptAndMarkAnswered, showAddPrayer,
                journeyStages, stageCounts, isStageCompleted, getJourneyProgress, updateStage,
                resources, filteredResources, resourceCategory, getResourceCatClass, resourceForm, addResource, deleteResource, showAddResource, showNotifications, notifications, handleNotificationClick
            };
        }
    }).mount('#app');
