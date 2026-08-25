import bcrypt from 'bcryptjs';
import pg from 'pg';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  name: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

export interface InviteCode {
  id: number;
  code: string;
  role_id: number;
  role_name?: string;
  is_used: boolean;
  created_by?: number;
  created_at: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  join_date: string;
  role: 'member' | 'leader' | 'admin';
  spiritual_stage: 'new' | 'saved' | 'baptized' | 'foundations' | 'ready_to_lead' | 'leading';
  pod_id?: number | null;
  pod_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Pod {
  id: number;
  name: string;
  leader_id: number | null;
  created_at: string;
}

export interface PodMember {
  pod_id: number;
  member_id: number;
  joined_at: string;
}

export interface Attendance {
  id: number;
  member_id: number;
  pod_id: number;
  date: string;
  present: boolean;
}

export interface WeeklyPlan {
  id: number;
  pod_id: number;
  pod_name?: string;
  leader_id: number;
  week_date: string;
  bible_passage: string;
  discussion_questions: string; // JSON string or text
  spiritual_goals: string; // JSON string or text
  post_meeting_notes?: string;
  members_struggling?: string;
  members_ready_to_lead?: string;
  created_at: string;
}

export interface PrayerRequest {
  id: number;
  member_id: number | null;
  member_name?: string;
  requester_name?: string;
  request_text: string;
  is_urgent: boolean;
  status: 'active' | 'answered';
  testimony?: string | null;
  created_at: string;
  answered_at?: string | null;
  supporter_count?: number;
}

export interface PrayerSupporter {
  id: number;
  request_id: number;
  member_id: number;
  created_at: string;
}

export interface Newcomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  stage: 'first_contact' | 'welcomed' | 'invited_to_pod' | 'integrated';
  notes: string;
  assigned_to?: number | null;
  first_visit_date: string;
  created_at: string;
}

export interface Devotional {
  id: number;
  title: string;
  content: string;
  author_id: number;
  week_date: string;
  created_at: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  created_at: string;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: number;
  is_used: boolean;
}

class InMemoryStore {
  users: User[] = [];
  roles: Role[] = [];
  permissions: Permission[] = [];
  rolePermissions: RolePermission[] = [];
  inviteCodes: InviteCode[] = [];
  members: Member[] = [];
  pods: Pod[] = [];
  podMembers: PodMember[] = [];
  attendance: Attendance[] = [];
  weeklyPlans: WeeklyPlan[] = [];
  prayerRequests: PrayerRequest[] = [];
  prayerSupporters: PrayerSupporter[] = [];
  pipeline: Newcomer[] = [];
  devotionals: Devotional[] = [];
  resources: Resource[] = [];
  resetTokens: PasswordResetToken[] = [];

  private nextIds = {
    users: 1,
    members: 1,
    pods: 1,
    weeklyPlans: 1,
    prayerRequests: 1,
    prayerSupporters: 1,
    pipeline: 1,
    devotionals: 1,
    resources: 1,
    inviteCodes: 1,
    attendance: 1,
    resetTokens: 1,
  };

  constructor() {
    this.seed();
  }

  private seed() {
    // Roles
    this.roles = [
      { id: 1, name: 'Site Admin' },
      { id: 2, name: 'Basic Manager' },
    ];

    // Permissions
    this.permissions = [
      { id: 1, name: 'manage_users' },
      { id: 2, name: 'manage_pods' },
      { id: 3, name: 'manage_members' },
      { id: 4, name: 'manage_settings' },
      { id: 5, name: 'view_dashboard' },
    ];

    // Role Permissions
    this.rolePermissions = [
      { role_id: 1, permission_id: 1 },
      { role_id: 1, permission_id: 2 },
      { role_id: 1, permission_id: 3 },
      { role_id: 1, permission_id: 4 },
      { role_id: 1, permission_id: 5 },
      { role_id: 2, permission_id: 5 },
      { role_id: 2, permission_id: 3 },
      { role_id: 2, permission_id: 2 },
    ];

    // Default password: password123 or test
    const defaultHash = bcrypt.hashSync('password123', 10);

    // Initial Users
    this.users = [
      {
        id: this.nextIds.users++,
        email: 'keku121@gmail.com',
        password_hash: defaultHash,
        full_name: 'Kidus',
        role_id: 1,
        is_active: true,
      },
      {
        id: this.nextIds.users++,
        email: 'admin@euc.org',
        password_hash: defaultHash,
        full_name: 'Site Administrator',
        role_id: 1,
        is_active: true,
      },
      {
        id: this.nextIds.users++,
        email: 'leader@euc.org',
        password_hash: defaultHash,
        full_name: 'Kidus Kore',
        role_id: 2,
        is_active: true,
      },
    ];

    // Initial Invite Codes
    this.inviteCodes = [
      {
        id: this.nextIds.inviteCodes++,
        code: 'EUCleader26',
        role_id: 1,
        role_name: 'Site Admin',
        is_used: false,
        created_at: new Date().toISOString(),
      },
      {
        id: this.nextIds.inviteCodes++,
        code: 'GROWTH2026',
        role_id: 2,
        role_name: 'Basic Manager',
        is_used: false,
        created_at: new Date().toISOString(),
      },
    ];

    // Initial Members
    const seedMembersData: Array<Omit<Member, 'id' | 'created_at'>> = [
      { name: 'Kidus Kore', email: 'kidus@euc.org', phone: '(301) 555-0199', join_date: '2024-01-15', role: 'leader', spiritual_stage: 'leading', is_active: true },
      { name: 'Selam Tesfaye', email: 'selam.t@gmail.com', phone: '(240) 555-0182', join_date: '2024-02-10', role: 'leader', spiritual_stage: 'leading', is_active: true },
      { name: 'Dawit Haile', email: 'dawit.h@outlook.com', phone: '(202) 555-0144', join_date: '2024-03-01', role: 'leader', spiritual_stage: 'leading', is_active: true },
      { name: 'Bethlehem Tadesse', email: 'beth.t@gmail.com', phone: '(301) 555-0177', join_date: '2024-03-20', role: 'leader', spiritual_stage: 'ready_to_lead', is_active: true },
      { name: 'Yared Bekele', email: 'yared.b@yahoo.com', phone: '(240) 555-0163', join_date: '2024-04-12', role: 'member', spiritual_stage: 'ready_to_lead', is_active: true },
      { name: 'Meron Alemayehu', email: 'meron.a@gmail.com', phone: '(202) 555-0129', join_date: '2024-05-05', role: 'member', spiritual_stage: 'foundations', is_active: true },
      { name: 'Ephrem Girma', email: 'ephrem.g@gmail.com', phone: '(301) 555-0188', join_date: '2024-06-18', role: 'member', spiritual_stage: 'foundations', is_active: true },
      { name: 'Hanna Wolde', email: 'hanna.w@gmail.com', phone: '(240) 555-0111', join_date: '2024-07-22', role: 'member', spiritual_stage: 'baptized', is_active: true },
      { name: 'Samuel Berhanu', email: 'samuel.b@gmail.com', phone: '(202) 555-0195', join_date: '2024-08-14', role: 'member', spiritual_stage: 'baptized', is_active: true },
      { name: 'Rahel Kassaye', email: 'rahel.k@outlook.com', phone: '(301) 555-0133', join_date: '2024-09-30', role: 'member', spiritual_stage: 'saved', is_active: true },
      { name: 'Nebiyu Solomon', email: 'nebiyu.s@gmail.com', phone: '(240) 555-0155', join_date: '2024-10-15', role: 'member', spiritual_stage: 'saved', is_active: true },
      { name: 'Ruth Worku', email: 'ruth.w@gmail.com', phone: '(202) 555-0104', join_date: '2024-11-08', role: 'member', spiritual_stage: 'new', is_active: true },
      { name: 'Abel Mulugeta', email: 'abel.m@gmail.com', phone: '(301) 555-0120', join_date: '2024-12-01', role: 'member', spiritual_stage: 'new', is_active: true },
    ];

    for (const m of seedMembersData) {
      this.members.push({
        id: this.nextIds.members++,
        ...m,
        created_at: new Date().toISOString(),
      });
    }

    // Initial Pods
    this.pods = [
      { id: this.nextIds.pods++, name: 'Silver Spring Young Pros', leader_id: 1, created_at: '2024-01-20' },
      { id: this.nextIds.pods++, name: 'Bethesda Campus Pod', leader_id: 2, created_at: '2024-02-15' },
      { id: this.nextIds.pods++, name: 'College Park DNA Group', leader_id: 3, created_at: '2024-03-10' },
      { id: this.nextIds.pods++, name: 'Rockville Discipleship Circle', leader_id: 4, created_at: '2024-04-05' },
    ];

    // Assign Pod Members
    this.podMembers = [
      { pod_id: 1, member_id: 1, joined_at: '2024-01-20' },
      { pod_id: 1, member_id: 5, joined_at: '2024-04-15' },
      { pod_id: 1, member_id: 6, joined_at: '2024-05-10' },
      { pod_id: 2, member_id: 2, joined_at: '2024-02-15' },
      { pod_id: 2, member_id: 7, joined_at: '2024-06-20' },
      { pod_id: 2, member_id: 8, joined_at: '2024-07-25' },
      { pod_id: 3, member_id: 3, joined_at: '2024-03-10' },
      { pod_id: 3, member_id: 9, joined_at: '2024-08-18' },
      { pod_id: 3, member_id: 10, joined_at: '2024-10-01' },
      { pod_id: 4, member_id: 4, joined_at: '2024-04-05' },
      { pod_id: 4, member_id: 11, joined_at: '2024-10-20' },
      { pod_id: 4, member_id: 12, joined_at: '2024-11-10' },
    ];

    // Update member pod_ids
    for (const pm of this.podMembers) {
      const mem = this.members.find((m) => m.id === pm.member_id);
      if (mem) mem.pod_id = pm.pod_id;
    }

    // Weekly Plans
    this.weeklyPlans = [
      {
        id: this.nextIds.weeklyPlans++,
        pod_id: 1,
        leader_id: 1,
        week_date: '2026-02-24',
        bible_passage: 'Romans 12:1-8',
        discussion_questions: JSON.stringify([
          'What does it mean to present your body as a living sacrifice?',
          'How do we discern God\'s will in our daily careers?',
          'Where are you experiencing conformity to the world versus transformation of mind?',
        ]),
        spiritual_goals: JSON.stringify([
          'Memorize Romans 12:2',
          'Pray daily for one unreached co-worker',
          'Practice one act of hidden generosity',
        ]),
        post_meeting_notes: 'Vibrant discussion around career purpose and kingdom stewardship. 7 members attended.',
        created_at: '2026-02-20',
      },
      {
        id: this.nextIds.weeklyPlans++,
        pod_id: 2,
        leader_id: 2,
        week_date: '2026-02-25',
        bible_passage: 'John 15:1-11',
        discussion_questions: JSON.stringify([
          'What is the difference between abiding in Christ and religious performance?',
          'What pruning has God been doing in your life recently?',
        ]),
        spiritual_goals: JSON.stringify([
          '15 minutes of uninterrupted morning prayer and Scripture meditation daily',
        ]),
        post_meeting_notes: 'Encouraging time of confession and praying over upcoming college midterms.',
        created_at: '2026-02-21',
      },
    ];

    // Prayer Requests
    this.prayerRequests = [
      {
        id: this.nextIds.prayerRequests++,
        member_id: 1,
        requester_name: 'Kidus Kore',
        request_text: 'Prayers for our upcoming young adult discipleship retreat and wisdom for new pod leaders stepping up.',
        is_urgent: true,
        status: 'active',
        created_at: '2026-02-22',
        supporter_count: 8,
      },
      {
        id: this.nextIds.prayerRequests++,
        member_id: 6,
        requester_name: 'Meron Alemayehu',
        request_text: 'Seeking God\'s guidance regarding a job offer and career transition into non-profit ministry.',
        is_urgent: false,
        status: 'active',
        created_at: '2026-02-23',
        supporter_count: 5,
      },
      {
        id: this.nextIds.prayerRequests++,
        member_id: 8,
        requester_name: 'Hanna Wolde',
        request_text: 'Health and healing for my mother who had outpatient surgery this past Friday.',
        is_urgent: true,
        status: 'active',
        created_at: '2026-02-24',
        supporter_count: 11,
      },
      {
        id: this.nextIds.prayerRequests++,
        member_id: 7,
        requester_name: 'Ephrem Girma',
        request_text: 'Praise God! The immigration visa process was approved after two years of praying!',
        is_urgent: false,
        status: 'answered',
        testimony: 'God proved faithful when we had exhausted all human options. Thank you church family for standing in faith!',
        created_at: '2026-02-10',
        answered_at: '2026-02-20',
        supporter_count: 14,
      },
    ];

    // Newcomer Pipeline
    this.pipeline = [
      {
        id: this.nextIds.pipeline++,
        name: 'Emanuel Bekele',
        phone: '(240) 555-0142',
        email: 'emanuel.b@gmail.com',
        stage: 'first_contact',
        notes: 'Visited Tuesday gathering; interested in Silver Spring Pod.',
        first_visit_date: '2026-02-24',
        created_at: '2026-02-24',
      },
      {
        id: this.nextIds.pipeline++,
        name: 'Tigist Assefa',
        phone: '(301) 555-0176',
        email: 'tigist.a@yahoo.com',
        stage: 'welcomed',
        notes: 'Followed up via text and sent welcome packet; invited for coffee.',
        first_visit_date: '2026-02-17',
        created_at: '2026-02-17',
      },
      {
        id: this.nextIds.pipeline++,
        name: 'Nathnael Teshome',
        phone: '(202) 555-0118',
        email: 'nathnael.t@gmail.com',
        stage: 'invited_to_pod',
        notes: 'Connected with Dawit for College Park DNA Pod; attended first session.',
        first_visit_date: '2026-02-10',
        created_at: '2026-02-10',
      },
      {
        id: this.nextIds.pipeline++,
        name: 'Liya Desta',
        phone: '(301) 555-0192',
        email: 'liya.d@gmail.com',
        stage: 'integrated',
        notes: 'Fully integrated into Bethesda pod; interested in worship team serving.',
        first_visit_date: '2026-01-20',
        created_at: '2026-01-20',
      },
    ];

    // Discipleship Resources
    this.resources = [
      {
        id: this.nextIds.resources++,
        title: 'How to Read the Bible for All Its Worth',
        description: 'A foundational guide to understanding and interpreting Scripture effectively.',
        category: 'Bible Study',
        file_url: 'https://bibleproject.com/explore/how-to-read-the-bible/',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'Gospel of John Study Guide',
        description: 'A 12-week deep dive into the Gospel of John focusing on the identity of Jesus.',
        category: 'Bible Study',
        file_url: 'https://www.thegospelcoalition.org/course/knowing-bible-john/',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'The Master Plan of Evangelism',
        description: "Robert Coleman's classic on how Jesus made disciples and how we can follow His model.",
        category: 'Leadership',
        file_url: 'https://discipleship.org/wp-content/uploads/2018/01/Master-Plan-of-Evangelism.pdf',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'Spiritual Leadership',
        description: "J. Oswald Sanders' essential principles for guiding others through spiritual maturity.",
        category: 'Leadership',
        file_url: 'https://www.desiringgod.org/books/spiritual-leadership',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'DNA Pod Leader Guide',
        description: 'Internal guide on how to facilitate effective DNA pods, navigate difficult conversations, and multiply leaders.',
        category: 'Leadership',
        file_url: '#',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'New Morning Mercies',
        description: 'Daily gospel-centered devotionals by Paul David Tripp.',
        category: 'Devotional',
        file_url: 'https://www.paultripp.com/new-morning-mercies',
        created_at: '2026-01-01',
      },
    ];
  }

  // Helpers
  getUserPermissions(userId: number): string[] {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return ['view_dashboard', 'manage_members', 'manage_pods'];
    const rps = this.rolePermissions.filter((rp) => rp.role_id === user.role_id);
    const permIds = new Set(rps.map((rp) => rp.permission_id));
    return this.permissions.filter((p) => permIds.has(p.id)).map((p) => p.name);
  }

  getStats() {
    const totalMembers = this.members.filter((m) => m.is_active).length;
    const totalPods = this.pods.length;
    const totalLeaders = this.members.filter((m) => m.role === 'leader' || m.role === 'admin').length;
    const stageDist: Record<string, number> = {
      new: 0,
      saved: 0,
      baptized: 0,
      foundations: 0,
      ready_to_lead: 0,
      leading: 0,
    };

    for (const m of this.members) {
      if (stageDist[m.spiritual_stage] !== undefined) {
        stageDist[m.spiritual_stage]++;
      }
    }

    return {
      total_members: totalMembers,
      total_pods: totalPods,
      total_leaders: totalLeaders,
      attendance_rate: 88,
      stage_distribution: stageDist,
      members_by_month: [
        { month: 'Oct', count: 8 },
        { month: 'Nov', count: 10 },
        { month: 'Dec', count: 11 },
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: totalMembers },
      ],
    };
  }

  getPodsWithMembers() {
    return this.pods.map((p) => {
      const leader = this.members.find((m) => m.id === p.leader_id);
      const memberIds = this.podMembers.filter((pm) => pm.pod_id === p.id).map((pm) => pm.member_id);
      const podMems = this.members.filter((m) => memberIds.includes(m.id));
      return {
        id: p.id,
        name: p.name,
        leader_id: p.leader_id,
        leader_name: leader ? leader.name : 'Unassigned',
        member_count: podMems.length,
        members: podMems,
        created_at: p.created_at,
      };
    });
  }

  getMembersWithPods() {
    return this.members.map((m) => {
      const pm = this.podMembers.find((item) => item.member_id === m.id);
      const pod = pm ? this.pods.find((p) => p.id === pm.pod_id) : null;
      return {
        ...m,
        pod_id: pod ? pod.id : null,
        pod_name: pod ? pod.name : null,
      };
    });
  }

  addMember(data: Partial<Member>): Member {
    const newMember: Member = {
      id: this.nextIds.members++,
      name: data.name || 'Anonymous',
      email: data.email || '',
      phone: data.phone || '',
      join_date: data.join_date || new Date().toISOString().split('T')[0],
      role: (data.role as any) || 'member',
      spiritual_stage: (data.spiritual_stage as any) || 'new',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.members.push(newMember);
    return newMember;
  }

  updateMember(id: number, data: Partial<Member>): Member | null {
    const mem = this.members.find((m) => m.id === id);
    if (!mem) return null;
    if (data.name !== undefined) mem.name = data.name;
    if (data.email !== undefined) mem.email = data.email;
    if (data.phone !== undefined) mem.phone = data.phone;
    if (data.join_date !== undefined) mem.join_date = data.join_date;
    if (data.role !== undefined) mem.role = data.role as any;
    if (data.spiritual_stage !== undefined) mem.spiritual_stage = data.spiritual_stage as any;
    return mem;
  }

  deleteMember(id: number): boolean {
    this.members = this.members.filter((m) => m.id !== id);
    this.podMembers = this.podMembers.filter((pm) => pm.member_id !== id);
    return true;
  }

  addPod(name: string, leader_id: number | null): Pod {
    const newPod: Pod = {
      id: this.nextIds.pods++,
      name,
      leader_id,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.pods.push(newPod);
    if (leader_id) {
      if (!this.podMembers.some((pm) => pm.pod_id === newPod.id && pm.member_id === leader_id)) {
        this.podMembers.push({ pod_id: newPod.id, member_id: leader_id, joined_at: new Date().toISOString().split('T')[0] });
      }
    }
    return newPod;
  }

  updatePod(id: number, name: string, leader_id: number | null): Pod | null {
    const pod = this.pods.find((p) => p.id === id);
    if (!pod) return null;
    pod.name = name;
    pod.leader_id = leader_id;
    if (leader_id && !this.podMembers.some((pm) => pm.pod_id === id && pm.member_id === leader_id)) {
      this.podMembers.push({ pod_id: id, member_id: leader_id, joined_at: new Date().toISOString().split('T')[0] });
    }
    return pod;
  }

  deletePod(id: number): boolean {
    this.pods = this.pods.filter((p) => p.id !== id);
    this.podMembers = this.podMembers.filter((pm) => pm.pod_id !== id);
    this.weeklyPlans = this.weeklyPlans.filter((wp) => wp.pod_id !== id);
    return true;
  }

  addMemberToPod(pod_id: number, member_id: number): boolean {
    if (!this.podMembers.some((pm) => pm.pod_id === pod_id && pm.member_id === member_id)) {
      this.podMembers.push({ pod_id, member_id, joined_at: new Date().toISOString().split('T')[0] });
    }
    const mem = this.members.find((m) => m.id === member_id);
    if (mem) mem.pod_id = pod_id;
    return true;
  }

  removeMemberFromPod(pod_id: number, member_id: number): boolean {
    this.podMembers = this.podMembers.filter((pm) => !(pm.pod_id === pod_id && pm.member_id === member_id));
    const mem = this.members.find((m) => m.id === member_id);
    if (mem && mem.pod_id === pod_id) mem.pod_id = null;
    return true;
  }

  addPrayer(data: Partial<PrayerRequest>): PrayerRequest {
    let authorName = data.requester_name;
    if (!authorName && data.member_id) {
      const mem = this.members.find((m) => m.id === data.member_id);
      if (mem) authorName = mem.name;
    }
    const newPrayer: PrayerRequest = {
      id: this.nextIds.prayerRequests++,
      member_id: data.member_id || null,
      requester_name: authorName || 'Anonymous',
      request_text: data.request_text || '',
      is_urgent: !!data.is_urgent,
      status: 'active',
      testimony: null,
      created_at: new Date().toISOString().split('T')[0],
      supporter_count: 1,
    };
    this.prayerRequests.unshift(newPrayer);
    return newPrayer;
  }

  supportPrayer(reqId: number, memberId: number = 1): number {
    const prayer = this.prayerRequests.find((p) => p.id === reqId);
    if (prayer) {
      prayer.supporter_count = (prayer.supporter_count || 0) + 1;
      this.prayerSupporters.push({
        id: this.nextIds.prayerSupporters++,
        request_id: reqId,
        member_id: memberId,
        created_at: new Date().toISOString(),
      });
      return prayer.supporter_count;
    }
    return 0;
  }

  answerPrayer(reqId: number, testimony: string): PrayerRequest | null {
    const prayer = this.prayerRequests.find((p) => p.id === reqId);
    if (prayer) {
      prayer.status = 'answered';
      prayer.testimony = testimony;
      prayer.answered_at = new Date().toISOString().split('T')[0];
      return prayer;
    }
    return null;
  }

  addPipeline(data: Partial<Newcomer>): Newcomer {
    const newItem: Newcomer = {
      id: this.nextIds.pipeline++,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      stage: data.stage || 'first_contact',
      notes: data.notes || '',
      assigned_to: data.assigned_to || null,
      first_visit_date: data.first_visit_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
    };
    this.pipeline.push(newItem);
    return newItem;
  }

  updatePipeline(id: number, data: Partial<Newcomer>): Newcomer | null {
    const item = this.pipeline.find((p) => p.id === id);
    if (!item) return null;
    if (data.stage !== undefined) item.stage = data.stage;
    if (data.notes !== undefined) item.notes = data.notes;
    if (data.name !== undefined) item.name = data.name;
    if (data.phone !== undefined) item.phone = data.phone;
    if (data.email !== undefined) item.email = data.email;
    if (data.assigned_to !== undefined) item.assigned_to = data.assigned_to;
    return item;
  }

  deletePipeline(id: number): boolean {
    this.pipeline = this.pipeline.filter((p) => p.id !== id);
    return true;
  }

  addResource(data: Partial<Resource>): Resource {
    const res: Resource = {
      id: this.nextIds.resources++,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'Bible Study',
      file_url: data.file_url || '#',
      created_at: new Date().toISOString().split('T')[0],
    };
    this.resources.push(res);
    return res;
  }

  deleteResource(id: number): boolean {
    this.resources = this.resources.filter((r) => r.id !== id);
    return true;
  }

  addInvite(roleId: number): InviteCode {
    const randomCode = 'EUC' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const roleName = roleId === 1 ? 'Site Admin' : 'Basic Manager';
    const inv: InviteCode = {
      id: this.nextIds.inviteCodes++,
      code: randomCode,
      role_id: roleId,
      role_name: roleName,
      is_used: false,
      created_at: new Date().toISOString(),
    };
    this.inviteCodes.push(inv);
    return inv;
  }

  deleteInvite(id: number): boolean {
    const initialLen = this.inviteCodes.length;
    this.inviteCodes = this.inviteCodes.filter((inv) => inv.id !== id);
    return this.inviteCodes.length < initialLen;
  }

  claimInvite(code: string, email: string, password: string,fullName: string): User | string {
    const invite = this.inviteCodes.find((i) => i.code === code && !i.is_used);
    if (!invite) return 'Invalid or already used invite code.';
    if (this.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return 'An account with this email already exists.';
    }

    const hashed = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: this.nextIds.users++,
      email: email.toLowerCase(),
      password_hash: hashed,
      full_name: fullName,
      role_id: invite.role_id,
      is_active: true,
    };
    this.users.push(newUser);
    invite.is_used = true;
    return newUser;
  }

  createPasswordResetToken(email: string): string | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (!user) {
      console.warn(`[Reset Token] User not found for email: ${cleanEmail}. Registered users:`, this.users.map(u => u.email));
      return null;
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires_at = Date.now() + 1000 * 60 * 60 * 2; // 2 hours validity
    
    if (!this.resetTokens) {
      this.resetTokens = [];
    }

    this.resetTokens.push({
      id: this.nextIds.resetTokens++,
      user_id: user.id,
      token,
      expires_at,
      is_used: false,
    });
    
    console.log(`[Reset Token] Created token for user ${user.email} (ID: ${user.id}). Token: ${token}`);
    return token;
  }

  resetPassword(token: string, newPassword: string): boolean {
    const cleanToken = (token || '').trim();
    if (!this.resetTokens) this.resetTokens = [];

    console.log(`[Reset Password] Attempting reset for token: "${cleanToken}". Total active tokens in memory:`, this.resetTokens.length);
    
    const resetToken = this.resetTokens.find(rt => rt.token === cleanToken && !rt.is_used && rt.expires_at > Date.now());
    if (!resetToken) {
      console.warn(`[Reset Password] Token "${cleanToken}" not found, already used, or expired.`);
      return false;
    }

    const user = this.users.find(u => u.id === resetToken.user_id);
    if (!user) {
      console.warn(`[Reset Password] User with ID ${resetToken.user_id} not found for token ${cleanToken}`);
      return false;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    resetToken.is_used = true;
    console.log(`[Reset Password] Successfully updated password for user ${user.email}`);
    return true;
  }
}

export const rawStore = new InMemoryStore();

let saveTimeout: NodeJS.Timeout | null = null;
let pool: pg.Pool | null = null;

const initDb = () => {
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  if (!dbUrl) return;

  try {
    // Validate that the URL is syntactically valid before passing to pg.Pool
    const parsedUrl = new URL(dbUrl);
    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
      console.warn('[PostgreSQL Warning] DATABASE_URL must start with postgres:// or postgresql://. Skipping DB sync.');
      return;
    }

    // Check if it's an unexpanded template like ${{...}}
    if (dbUrl.includes('${{') || dbUrl.includes('}}')) {
      console.warn('[PostgreSQL Warning] DATABASE_URL contains unresolved template variables (${{...}}). Skipping DB sync.');
      return;
    }

    const isInternal = parsedUrl.hostname.includes('railway.internal') || parsedUrl.hostname.includes('localhost') || parsedUrl.hostname === '127.0.0.1';

    pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: isInternal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Error] Unexpected client error:', err.message);
    });

    // Init table and load data
    pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      return pool!.query('SELECT data FROM app_state ORDER BY id DESC LIMIT 1');
    }).then(res => {
      if (res && res.rows.length > 0) {
        const state = res.rows[0].data;
        Object.assign(rawStore, state);

        const defaultHash = bcrypt.hashSync('password123', 10);
        if (!rawStore.users.some(u => u.email.toLowerCase() === 'keku121@gmail.com')) {
          rawStore.users.push({
            id: rawStore.nextIds.users++,
            email: 'keku121@gmail.com',
            password_hash: defaultHash,
            full_name: 'Kidus',
            role_id: 1,
            is_active: true,
          });
        }
        if (!rawStore.users.some(u => u.email.toLowerCase() === 'admin@euc.org')) {
          rawStore.users.push({
            id: rawStore.nextIds.users++,
            email: 'admin@euc.org',
            password_hash: defaultHash,
            full_name: 'Site Administrator',
            role_id: 1,
            is_active: true,
          });
        }
        if (!rawStore.resetTokens) {
          rawStore.resetTokens = [];
        }

        console.log('[PostgreSQL] Successfully restored app state from PostgreSQL Database');
        saveToDB();
      } else {
        console.log('[PostgreSQL] Database connected. Initializing first state snapshot...');
        saveToDB();
      }
    }).catch(err => {
      console.error('[PostgreSQL Connection Error]:', err.message);
    });
  } catch (err: any) {
    console.error('[PostgreSQL URL Parse Error]:', err.message);
    pool = null;
  }
};

initDb();

const saveToDB = async () => {
  if (!pool) return;
  try {
    const stateToSave = {
      users: rawStore.users,
      roles: rawStore.roles,
      permissions: rawStore.permissions,
      rolePermissions: rawStore.rolePermissions,
      members: rawStore.members,
      pods: rawStore.pods,
      podMembers: rawStore.podMembers,
      prayerRequests: rawStore.prayerRequests,
      prayerSupporters: rawStore.prayerSupporters,
      weeklyPlans: rawStore.weeklyPlans,
      pipeline: rawStore.pipeline,
      resources: rawStore.resources,
      inviteCodes: rawStore.inviteCodes,
      resetTokens: rawStore.resetTokens,
      nextIds: rawStore.nextIds
    };

    const res = await pool.query('SELECT id FROM app_state ORDER BY id DESC LIMIT 1');
    if (res.rows.length > 0) {
      await pool.query('UPDATE app_state SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [stateToSave, res.rows[0].id]);
    } else {
      await pool.query('INSERT INTO app_state (data) VALUES ($1)', [stateToSave]);
    }
  } catch (err) {
    console.error('Failed to save state to DB:', err);
  }
};

export const store = new Proxy(rawStore, {
  get(target: any, prop: string) {
    const orig = target[prop];
    if (typeof orig === 'function') {
      return function(...args: any[]) {
        const res = orig.apply(target, args);
        // Mutations that should trigger a save
        const mutationPrefixes = ['add', 'update', 'delete', 'claim', 'create', 'reset', 'support', 'answer'];
        if (mutationPrefixes.some(prefix => prop.startsWith(prefix))) {
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => saveToDB(), 500);
        }
        return res;
      };
    }
    return orig;
  }
});
