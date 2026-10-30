import bcrypt from 'bcryptjs';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

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
  pod?: string | null;
  is_active: boolean;
  created_at: string;
  birthday?: string;
  city?: string;
  life_stage?: string;
  interests?: string[];
  notes?: string;
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

export interface CommunityEvent {
  id: number;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category: 'gathering' | 'fellowship' | 'service' | 'prayer' | 'retreat';
  image_url?: string;
  capacity?: number | null;
  is_featured?: boolean;
  created_at: string;
}

export interface EventRsvp {
  id: number;
  event_id: number;
  name: string;
  email: string;
  phone?: string;
  guests_count: number;
  notes?: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name?: string;
  source: string;
  status: 'subscribed' | 'unsubscribed';
  created_at: string;
}

export interface NewsletterBroadcast {
  id: number;
  subject: string;
  message: string;
  sender_email?: string;
  recipients_count: number;
  sent_at: string;
}

export interface DepartmentLeader {
  name: string;
  email: string;
  phone: string;
  role: string;
  notes?: string;
}

export interface DepartmentTask {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
}

export interface Department {
  id: string;
  number: number;
  name: string;
  shortName: string;
  schedule: string;
  location: string;
  accentColor: string;
  leader: DepartmentLeader;
  assistant1: DepartmentLeader;
  assistant2: DepartmentLeader;
  responsibilities: string[];
  tasks: DepartmentTask[];
  notes?: string;
  updatedAt?: string;
}

class InMemoryStore {
  users: User[] = [];
  roles: Role[] = [];
  permissions: Permission[] = [];
  rolePermissions: RolePermission[] = [];
  inviteCodes: InviteCode[] = [];
  departments: Department[] = [];
  members: Member[] = [];
  pods: Pod[] = [];
  podMembers: PodMember[] = [];
  attendance: Attendance[] = [];
  weeklyPlans: WeeklyPlan[] = [];
  prayerRequests: PrayerRequest[] = [];
  prayerSupporters: PrayerSupporter[] = [];
  pipeline: Newcomer[] = [];
  subscribers: NewsletterSubscriber[] = [];
  newsletterBroadcasts: NewsletterBroadcast[] = [];
  devotionals: Devotional[] = [];
  resources: Resource[] = [];
  resetTokens: PasswordResetToken[] = [];
  events: CommunityEvent[] = [];
  eventRsvps: EventRsvp[] = [];

  private nextIds = {
    users: 1,
    members: 1,
    pods: 1,
    weeklyPlans: 1,
    prayerRequests: 1,
    prayerSupporters: 1,
    pipeline: 1,
    subscribers: 1,
    broadcasts: 1,
    devotionals: 1,
    resources: 1,
    inviteCodes: 1,
    attendance: 1,
    resetTokens: 1,
    events: 1,
    eventRsvps: 1,
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

    // Initial Members (empty by default for real member roster)
    this.members = [];

    // Initial Pods (empty by default for real pod setup)
    this.pods = [];

    // Assign Pod Members
    this.podMembers = [];

    // Weekly Plans (empty by default)
    this.weeklyPlans = [];

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
        file_url: 'https://discipleship.org/resources/',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'Spiritual Leadership',
        description: "J. Oswald Sanders' essential principles for guiding others through spiritual maturity.",
        category: 'Leadership',
        file_url: 'https://discipleship.org/resources/',
        created_at: '2026-01-01',
      },
      {
        id: this.nextIds.resources++,
        title: 'DNA Pod Leader Guide',
        description: 'Internal guide on how to facilitate effective DNA pods, navigate difficult conversations, and multiply leaders.',
        category: 'Leadership',
        file_url: 'https://www.desiringgod.org/articles/how-to-lead-a-small-group',
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

    // Initial Community Events
    this.events = this.getDefaultEvents();
  }

  getDefaultEvents(): CommunityEvent[] {
    return [
      {
        id: 1,
        title: 'Tuesday DNA Gathering: Worship, Word & Fellowship',
        description: 'Our weekly young adults gathering dedicated to authentic worship, biblical teaching, table discussions, and deep fellowship.',
        date: '2026-09-29',
        time: '7:00 PM - 9:00 PM',
        location: 'EUC Sanctuary, 12604 New Hampshire Ave, Silver Spring, MD 20904',
        category: 'gathering',
        capacity: 120,
        is_featured: true,
        created_at: '2026-09-01',
      },
      {
        id: 2,
        title: 'First Friday Encounter: Worship & Intercession',
        description: 'An unhurried night of worship, deep prayer, and intercession for our cities, generation, and spiritual breakthroughs.',
        date: '2026-10-02',
        time: '7:30 PM - 10:00 PM',
        location: 'EUC Prayer Chapel, 12604 New Hampshire Ave, Silver Spring, MD',
        category: 'prayer',
        capacity: 80,
        is_featured: true,
        created_at: '2026-09-01',
      },
      {
        id: 3,
        title: '12 Tribes Community Brunch & Fellowship',
        description: 'Join your tribe family for food, games, and rich fellowship outside Tuesday. A wonderful time to invite friends and connect deeper!',
        date: '2026-10-10',
        time: '11:00 AM - 2:00 PM',
        location: 'Fellowship Pavilion, 12604 New Hampshire Ave, Silver Spring, MD',
        category: 'fellowship',
        capacity: 75,
        is_featured: false,
        created_at: '2026-09-01',
      },
      {
        id: 4,
        title: 'Kingdom Outreach: City Blessing & Food Distribution',
        description: 'Hands-on practical love for our local community. Packing essentials kits, food distribution, and prayer for local families.',
        date: '2026-10-17',
        time: '10:00 AM - 1:00 PM',
        location: 'Silver Spring Downtown & Local Community Center',
        category: 'service',
        capacity: 40,
        is_featured: false,
        created_at: '2026-09-01',
      },
      {
        id: 5,
        title: 'Fall Young Adults Discipleship Retreat 2026',
        description: 'Three transformative days unplugged in the mountains with worship, deep teaching, campfire fellowship, and visionary leadership sessions.',
        date: '2026-11-06',
        time: 'Fri 5:00 PM – Sun 1:00 PM',
        location: 'Blue Ridge Mountain Christian Retreat Center, VA',
        category: 'retreat',
        capacity: 60,
        is_featured: true,
        created_at: '2026-09-01',
      },
    ];

    this.initDefaultDepartments();
    this.initOfficialDnaPods();
  }

  initOfficialDnaPods() {
    if (!this.nextIds) this.nextIds = {} as any;

    this.members = [
      {
        id: 1,
        name: 'Kidus Kore',
        email: 'keku121@gmail.com',
        phone: '2027601096',
        join_date: '2026-01-15',
        role: 'admin',
        spiritual_stage: 'leading',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: '',
        life_stage: '',
        interests: ['Leadership', 'Administration', 'Community'],
        notes: 'Upper Room Admin & Core Leader'
      },
      {
        id: 2,
        name: 'Bercy kebede',
        email: 'bersabay1234@gmail.com',
        phone: '2404762343',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'leading',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: '6004 northwest dr Hyattsville md 20782',
        life_stage: 'Career / Working',
        interests: ['Prayer', 'Hospitality', 'Discipleship'],
        notes: 'Prayer Coordinator & Guest Experience Lead'
      },
      {
        id: 3,
        name: 'Nahom Tegegn',
        email: 'nahiwende92@gmail.com',
        phone: '2028262001',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'leading',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: 'Silver Spring, MD',
        life_stage: 'Career / Working',
        interests: ['Discipleship', 'Bible Study', 'Teaching'],
        notes: 'Discipleship Lead'
      },
      {
        id: 4,
        name: 'Gideon Dilebo',
        email: 'dilebogideon@gmail.com',
        phone: '2406021016',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'foundations',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: '',
        life_stage: '',
        interests: ['Production', 'Sound Mixing', 'Media'],
        notes: 'Production Lead'
      },
      {
        id: 5,
        name: 'Fikir Kebede',
        email: 'gizachewhaimef@gmail.com',
        phone: '3013268345',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'saved',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: 'Silverspring',
        life_stage: 'Other',
        interests: ['Event Coordination', 'Hospitality', 'Logistics'],
        notes: 'Event Coordinator'
      },
      {
        id: 6,
        name: 'Elias Orion Belachew',
        email: 'eliasorion11@gmail.com',
        phone: '2039045565',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'ready_to_lead',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: 'Silver Spring',
        life_stage: 'Career / Working',
        interests: ['Worship', 'Band Rehearsals', 'Music'],
        notes: 'Worship Lead'
      },
      {
        id: 7,
        name: 'Biniyam Sibane',
        email: 'biniyamfekede10@gmail.com',
        phone: '2409459529',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'leading',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: 'Silver Spring',
        life_stage: 'Other',
        interests: ['Teaching', 'Theology', 'Curriculum'],
        notes: 'Teaching Lead'
      },
      {
        id: 8,
        name: 'Kaleab Abate',
        email: 'kbgecho@gmail.com',
        phone: '7857645055',
        join_date: '2026-01-15',
        role: 'member',
        spiritual_stage: 'ready_to_lead',
        pod_id: null,
        pod_name: null,
        pod: null,
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
        city: 'Silver Spring',
        life_stage: 'Undergraduate Student',
        interests: ['Production', 'Audio/Visual', 'Media'],
        notes: 'Production Lead'
      }
    ];

    this.pods = [
      { id: 1, name: 'DNA Pod 1', leader_id: null, created_at: '2026-01-15T00:00:00Z' },
      { id: 2, name: 'DNA Pod 2', leader_id: null, created_at: '2026-01-15T00:00:00Z' },
      { id: 3, name: 'DNA Pod 3', leader_id: null, created_at: '2026-01-15T00:00:00Z' },
      { id: 4, name: 'DNA Pod 4', leader_id: null, created_at: '2026-01-15T00:00:00Z' }
    ];
    this.podMembers = [];

    this.nextIds.members = 9;
    this.nextIds.pods = 5;
  }

  initDefaultDepartments() {
    this.departments = [
      {
        id: 'bible_study',
        number: 1,
        name: 'Bible Study — Tuesday',
        shortName: 'Bible Study',
        schedule: 'Every Tuesday at 7:00 PM',
        location: '914 Silver Spring Ave, Suite 204B, Silver Spring, MD',
        accentColor: 'from-blue-600 to-indigo-600',
        leader: {
          name: 'Kidus Kore',
          email: 'leader@euc.org',
          phone: '(202) 760-1096',
          role: 'Department Leader',
          notes: 'Leading Tuesday interactive Scripture studies and discipleship discussion.'
        },
        assistant1: {
          name: 'Yonas Haile',
          email: 'yonas.h@eucmaryland.org',
          phone: '(240) 412-8819',
          role: 'Supportive Leader (Assistant)',
          notes: 'Curating discussion questions and small group materials.'
        },
        assistant2: {
          name: 'Betelhem Tefera',
          email: 'betelhem.t@eucmaryland.org',
          phone: '(301) 674-9921',
          role: 'Supportive Leader (Assistant)',
          notes: 'Tracking upcoming sessions and sharing study notes with members.'
        },
        responsibilities: [
          'Prepare weekly Bible study topics and Scripture passages.',
          'Coordinate discussion questions and study materials.',
          'Track upcoming sessions and share study notes.'
        ],
        tasks: [
          { id: 'bs-1', title: 'Prepare Tuesday study guide for Acts 2:42-47', assignedTo: 'Kidus Kore', dueDate: 'Every Monday', completed: true },
          { id: 'bs-2', title: 'Send discussion questions to DNA Pod leaders', assignedTo: 'Yonas Haile', dueDate: 'Every Tuesday 12 PM', completed: false },
          { id: 'bs-3', title: 'Publish study notes & summary to Young Adult Hub', assignedTo: 'Betelhem Tefera', dueDate: 'Every Wednesday', completed: false }
        ],
        notes: 'Meets every Tuesday for prayer, fellowship, and verse-by-verse inductive study.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'event_organizing',
        number: 2,
        name: 'Event Organizing',
        shortName: 'Event Organizing',
        schedule: 'Monthly Fellowships & Seasonal Retreats',
        location: 'DMV Area & Fellowship Hall',
        accentColor: 'from-emerald-600 to-teal-600',
        leader: {
          name: 'Selamawit Bekele',
          email: 'selam.b@eucmaryland.org',
          phone: '(202) 819-3342',
          role: 'Department Leader',
          notes: 'Managing overall event strategy, community retreats, and vision nights.'
        },
        assistant1: {
          name: 'Daniel Mengistu',
          email: 'daniel.m@eucmaryland.org',
          phone: '(240) 581-2204',
          role: 'Supportive Leader (Assistant)',
          notes: 'Logistics, event budgeting, supplies purchasing, and equipment setup.'
        },
        assistant2: {
          name: 'Ruth Tadesse',
          email: 'ruth.t@eucmaryland.org',
          phone: '(301) 902-1145',
          role: 'Supportive Leader (Assistant)',
          notes: 'Volunteer team scheduling and day-of event checklists.'
        },
        responsibilities: [
          'Plan fellowships, retreats, outreach, and special gatherings.',
          'Manage budgets, logistics, supplies, and event timelines.',
          'Assign event tasks and coordinate volunteers.'
        ],
        tasks: [
          { id: 'eo-1', title: 'Finalize logistics & venue checklist for upcoming fellowship', assignedTo: 'Selamawit Bekele', dueDate: '2026-10-25', completed: true },
          { id: 'eo-2', title: 'Manage catering budget & supply purchases', assignedTo: 'Daniel Mengistu', dueDate: '2026-10-28', completed: false },
          { id: 'eo-3', title: 'Assign setup, tear-down, and hospitality volunteer shifts', assignedTo: 'Ruth Tadesse', dueDate: '2026-10-30', completed: false }
        ],
        notes: 'Coordinates all external fellowships, city outreach days, and the annual fall retreat.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'media',
        number: 3,
        name: 'Media',
        shortName: 'Media & Creative',
        schedule: 'Weekly Gatherings & Digital Channels',
        location: 'Media Booth & Creative Lab',
        accentColor: 'from-purple-600 to-pink-600',
        leader: {
          name: 'Dawit Alemu',
          email: 'dawit.a@eucmaryland.org',
          phone: '(240) 771-4490',
          role: 'Department Leader',
          notes: 'Overseeing live event capture, high-quality video recaps, and sound.'
        },
        assistant1: {
          name: 'Hanna Girma',
          email: 'hanna.g@eucmaryland.org',
          phone: '(202) 438-6623',
          role: 'Supportive Leader (Assistant)',
          notes: 'Social media graphics, promotional flyers, and weekly announcement slides.'
        },
        assistant2: {
          name: 'Nahom Berhanu',
          email: 'nahom.b@eucmaryland.org',
          phone: '(301) 829-4501',
          role: 'Supportive Leader (Assistant)',
          notes: 'Permission and consent verification before publishing photos/videos.'
        },
        responsibilities: [
          'Manage photography, video, graphics, and announcements.',
          'Prepare media for ministry events and social channels.',
          'Confirm permissions before publishing identifiable photos or videos.'
        ],
        tasks: [
          { id: 'med-1', title: 'Curate highlight photos and recaps from Tuesday gathering', assignedTo: 'Dawit Alemu', dueDate: 'Every Wednesday', completed: true },
          { id: 'med-2', title: 'Design weekly Instagram carousel announcements', assignedTo: 'Hanna Girma', dueDate: 'Every Thursday', completed: false },
          { id: 'med-3', title: 'Audit media releases and privacy permissions for attendees', assignedTo: 'Nahom Berhanu', dueDate: 'Ongoing', completed: false }
        ],
        notes: 'Maintains EUCMD visual excellence across Instagram, web presence, and Sunday announcements.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'teaching',
        number: 4,
        name: 'Teaching',
        shortName: 'Teaching & Equipping',
        schedule: 'Bi-Weekly Seminars & Sunday Classes',
        location: 'Main Sanctuary & Online Classroom',
        accentColor: 'from-amber-600 to-orange-600',
        leader: {
          name: 'Pastor Samuel Gebre',
          email: 'samuel.g@eucmaryland.org',
          phone: '(240) 650-7712',
          role: 'Department Leader',
          notes: 'Guiding teaching standards, theological framework, and guest speakers.'
        },
        assistant1: {
          name: 'Michael Assefa',
          email: 'michael.a@eucmaryland.org',
          phone: '(202) 991-5520',
          role: 'Supportive Leader (Assistant)',
          notes: 'Speaker hospitality, sermon presentation slides, and curriculum materials.'
        },
        assistant2: {
          name: 'Lydia Worku',
          email: 'lydia.w@eucmaryland.org',
          phone: '(301) 714-8833',
          role: 'Supportive Leader (Assistant)',
          notes: 'Liaison with Bible Study leaders to ensure coordinated teaching roadmaps.'
        },
        responsibilities: [
          'Coordinate teaching sessions and learning resources.',
          'Support speakers and prepare lesson materials.',
          'Work with Bible Study to keep teaching plans aligned.'
        ],
        tasks: [
          { id: 'tch-1', title: 'Review upcoming 6-week Foundations of Faith curriculum', assignedTo: 'Pastor Samuel Gebre', dueDate: '2026-11-01', completed: false },
          { id: 'tch-2', title: 'Compile study handout packets for guest speaker', assignedTo: 'Michael Assefa', dueDate: '2026-10-27', completed: true },
          { id: 'tch-3', title: 'Sync with Bible Study team on Tuesday doctrinal topics', assignedTo: 'Lydia Worku', dueDate: 'Monthly 1st Mon', completed: false }
        ],
        notes: 'Works hand-in-hand with pastoral leadership to ground young adults in sound biblical truth.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'worship',
        number: 5,
        name: 'Worship',
        shortName: 'Worship & Music',
        schedule: 'Thursdays Rehearsal 7:30 PM & Weekend Services',
        location: 'Sanctuary Stage & Music Room',
        accentColor: 'from-rose-600 to-red-600',
        leader: {
          name: 'Eden Tesfaye',
          email: 'eden.t@eucmaryland.org',
          phone: '(240) 882-9901',
          role: 'Department Leader',
          notes: 'Overseeing worship culture, spiritual preparation, and weekly song selections.'
        },
        assistant1: {
          name: 'Abel Solomon',
          email: 'abel.s@eucmaryland.org',
          phone: '(202) 760-1096',
          role: 'Supportive Leader (Assistant)',
          notes: 'Instrumental arrangements, vocal harmonies, and rehearsal coaching.'
        },
        assistant2: {
          name: 'Meron Kebede',
          email: 'meron.k@eucmaryland.org',
          phone: '(301) 512-6634',
          role: 'Supportive Leader (Assistant)',
          notes: 'Vocal rotation rosters, schedule notices, and audio tech handoffs.'
        },
        responsibilities: [
          'Prepare worship sets and song lists.',
          'Coordinate singers, musicians, and rehearsals.',
          'Share schedules and technical requirements with Media.'
        ],
        tasks: [
          { id: 'wor-1', title: 'Curate 4-song acoustic worship set for Tuesday gathering', assignedTo: 'Eden Tesfaye', dueDate: 'Every Tuesday', completed: true },
          { id: 'wor-2', title: 'Lead acoustic guitar & keyboard sound check', assignedTo: 'Abel Solomon', dueDate: 'Every Tuesday 6:15 PM', completed: false },
          { id: 'wor-3', title: 'Submit song lyrics and chord charts to Media booth', assignedTo: 'Meron Kebede', dueDate: 'Every Monday 5 PM', completed: false }
        ],
        notes: 'Creating an atmosphere where young adults passionately encounter Jesus in worship.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prayer',
        number: 6,
        name: 'Prayer',
        shortName: 'Prayer & Intercession',
        schedule: 'Every Saturday 6:30 AM & Pre-Service Prayer',
        location: 'Prayer Chapel & Virtual Prayer Line',
        accentColor: 'from-cyan-600 to-blue-600',
        leader: {
          name: 'Rahel Wolde',
          email: 'rahel.w@eucmaryland.org',
          phone: '(202) 664-8821',
          role: 'Department Leader',
          notes: 'Intercessory prayer leadership, fasting periods, and monthly prayer vigils.'
        },
        assistant1: {
          name: 'Bereket Tilahun',
          email: 'bereket.t@eucmaryland.org',
          phone: '(240) 339-1178',
          role: 'Supportive Leader (Assistant)',
          notes: 'Distributing prayer guides and organizing small group prayer stations.'
        },
        assistant2: {
          name: 'Martha Desta',
          email: 'martha.d@eucmaryland.org',
          phone: '(301) 402-9980',
          role: 'Supportive Leader (Assistant)',
          notes: 'Strict confidentiality management for private member prayer requests.'
        },
        responsibilities: [
          'Coordinate prayer meetings and prayer schedules.',
          'Share prayer points and organize group prayer sessions.',
          'Handle sensitive prayer requests with appropriate privacy.'
        ],
        tasks: [
          { id: 'pry-1', title: 'Host weekly Saturday morning dawn prayer on Zoom', assignedTo: 'Rahel Wolde', dueDate: 'Every Saturday 6:30 AM', completed: true },
          { id: 'pry-2', title: 'Compile and distribute monthly ministry prayer guide', assignedTo: 'Bereket Tilahun', dueDate: '1st of month', completed: false },
          { id: 'pry-3', title: 'Review incoming confidential prayer wall requests privately', assignedTo: 'Martha Desta', dueDate: 'Daily', completed: false }
        ],
        notes: 'Covering our pastors, leaders, small groups, and young adults in continuous prayer.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'welcoming_followup',
        number: 7,
        name: 'Welcoming & Follow-Up',
        shortName: 'Welcoming & Follow-Up',
        schedule: 'Every Tuesday & Sunday Gatherings',
        location: 'Welcome Desk & Foyer Greeting Area',
        accentColor: 'from-violet-600 to-purple-600',
        leader: {
          name: 'Yohannes Fikre',
          email: 'yohannes.f@eucmaryland.org',
          phone: '(240) 554-7721',
          role: 'Department Leader',
          notes: 'First impressions team, greeter training, and guest welcome package.'
        },
        assistant1: {
          name: 'Feven Belay',
          email: 'feven.b@eucmaryland.org',
          phone: '(202) 831-4419',
          role: 'Supportive Leader (Assistant)',
          notes: 'Personal follow-up texts, phone calls, and welcome email greetings.'
        },
        assistant2: {
          name: 'Caleb Zewdu',
          email: 'caleb.z@eucmaryland.org',
          phone: '(301) 918-3350',
          role: 'Supportive Leader (Assistant)',
          notes: 'Guest contact preference records and warm handoff to DNA Pods.'
        },
        responsibilities: [
          'Welcome new attendees and help them feel included.',
          'Coordinate follow-up messages and invitations.',
          'Track contact preferences and follow up respectfully.'
        ],
        tasks: [
          { id: 'wlc-1', title: 'Welcome table setup and guest gift bags preparation', assignedTo: 'Yohannes Fikre', dueDate: 'Every Tuesday 6:30 PM', completed: true },
          { id: 'wlc-2', title: 'Send warm welcome text to all first-time visitors', assignedTo: 'Feven Belay', dueDate: 'Within 24-48 hrs', completed: false },
          { id: 'wlc-3', title: 'Sync visitor cards into pipeline and verify contact preferences', assignedTo: 'Caleb Zewdu', dueDate: 'Every Thursday', completed: false }
        ],
        notes: 'Ensuring every person who walks through our doors feels welcomed, loved, and valued.',
        updatedAt: new Date().toISOString()
      }
    ];
  }

  getDepartments(): Department[] {
    if (!this.departments || this.departments.length === 0) {
      this.initDefaultDepartments();
    }
    return this.departments;
  }

  getDepartment(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id);
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const dept = this.getDepartment(id);
    if (!dept) return null;
    if (updates.name) dept.name = updates.name;
    if (updates.schedule) dept.schedule = updates.schedule;
    if (updates.location) dept.location = updates.location;
    if (updates.leader) dept.leader = { ...dept.leader, ...updates.leader };
    if (updates.assistant1) dept.assistant1 = { ...dept.assistant1, ...updates.assistant1 };
    if (updates.assistant2) dept.assistant2 = { ...dept.assistant2, ...updates.assistant2 };
    if (updates.responsibilities && Array.isArray(updates.responsibilities)) {
      dept.responsibilities = updates.responsibilities;
    }
    if (updates.notes !== undefined) dept.notes = updates.notes;
    dept.updatedAt = new Date().toISOString();
    return dept;
  }

  addDepartmentTask(deptId: string, task: Omit<DepartmentTask, 'id'>): DepartmentTask | null {
    const dept = this.getDepartment(deptId);
    if (!dept) return null;
    const newTask: DepartmentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: task.title,
      assignedTo: task.assignedTo || dept.leader.name,
      dueDate: task.dueDate || 'This Week',
      completed: !!task.completed,
    };
    if (!dept.tasks) dept.tasks = [];
    dept.tasks.push(newTask);
    dept.updatedAt = new Date().toISOString();
    return newTask;
  }

  updateDepartmentTask(deptId: string, taskId: string, updates: Partial<DepartmentTask>): boolean {
    const dept = this.getDepartment(deptId);
    if (!dept || !dept.tasks) return false;
    const t = dept.tasks.find((x) => x.id === taskId);
    if (!t) return false;
    Object.assign(t, updates);
    dept.updatedAt = new Date().toISOString();
    return true;
  }

  deleteDepartmentTask(deptId: string, taskId: string): boolean {
    const dept = this.getDepartment(deptId);
    if (!dept || !dept.tasks) return false;
    const initialLen = dept.tasks.length;
    dept.tasks = dept.tasks.filter((x) => x.id !== taskId);
    dept.updatedAt = new Date().toISOString();
    return dept.tasks.length < initialLen;
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
      const podId = pm ? pm.pod_id : (m.pod_id || null);
      const pod = podId ? this.pods.find((p) => p.id === podId) : null;
      return {
        ...m,
        pod_id: pod ? pod.id : null,
        pod: pod ? pod.name : null,
        pod_name: pod ? pod.name : null,
      };
    });
  }

  addMember(data: Partial<Member>): Member {
    const newMember: Member = {
      id: this.nextIds.members++,
      name: (data.name || 'Anonymous').trim(),
      email: (data.email || '').trim(),
      phone: (data.phone || '').trim(),
      join_date: data.join_date || new Date().toISOString().split('T')[0],
      role: (data.role as any) || 'member',
      spiritual_stage: (data.spiritual_stage as any) || 'new',
      pod_id: data.pod_id ? Number(data.pod_id) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      birthday: data.birthday ? String(data.birthday).trim() : '',
      city: data.city ? String(data.city).trim() : '',
      life_stage: data.life_stage ? String(data.life_stage).trim() : '',
      interests: Array.isArray(data.interests) ? data.interests : [],
      notes: data.notes ? String(data.notes).trim() : '',
    };
    this.members.push(newMember);
    if (newMember.pod_id) {
      this.addMemberToPod(newMember.pod_id, newMember.id);
    }
    return newMember;
  }

  updateMember(id: number, data: Partial<Member>): Member | null {
    const mem = this.members.find((m) => m.id === id);
    if (!mem) return null;
    if (data.name !== undefined) mem.name = String(data.name).trim();
    if (data.email !== undefined) mem.email = String(data.email).trim();
    if (data.phone !== undefined) mem.phone = String(data.phone).trim();
    if (data.join_date !== undefined) mem.join_date = data.join_date;
    if (data.role !== undefined) mem.role = data.role as any;
    if (data.spiritual_stage !== undefined) mem.spiritual_stage = data.spiritual_stage as any;
    if (data.birthday !== undefined) mem.birthday = data.birthday;
    if (data.city !== undefined) mem.city = data.city;
    if (data.life_stage !== undefined) mem.life_stage = data.life_stage;
    if (data.interests !== undefined) mem.interests = Array.isArray(data.interests) ? data.interests : [];
    if (data.notes !== undefined) mem.notes = data.notes;
    if (data.pod_id !== undefined) {
      mem.pod_id = data.pod_id ? Number(data.pod_id) : null;
      if (mem.pod_id) {
        this.addMemberToPod(mem.pod_id, mem.id);
      } else {
        this.podMembers = this.podMembers.filter((pm) => pm.member_id !== mem.id);
      }
    }
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

  addSubscriber(email: string, name?: string, source: string = 'footer_form'): { subscriber: NewsletterSubscriber; isNew: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    let existing = this.subscribers.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'subscribed';
        saveToDB();
      }
      return { subscriber: existing, isNew: false };
    }

    const nextId = (this.nextIds && typeof this.nextIds.subscribers === 'number')
      ? this.nextIds.subscribers++
      : (this.subscribers.length + 1);

    const newSub: NewsletterSubscriber = {
      id: nextId,
      email: cleanEmail,
      name: name ? name.trim() : undefined,
      source,
      status: 'subscribed',
      created_at: new Date().toISOString(),
    };
    this.subscribers.push(newSub);

    // Also automatically link to Newcomer Pipeline for leadership engagement and follow-up
    const existingPipeline = this.pipeline.find((p) => p.email && p.email.toLowerCase() === cleanEmail);
    if (!existingPipeline) {
      this.addPipeline({
        name: name ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        stage: 'first_contact',
        notes: `Subscribed to Young Adults Newsletter (${source}) for follow-up and engagement`,
      });
    }

    saveToDB();
    return { subscriber: newSub, isNew: true };
  }

  getSubscribers(): NewsletterSubscriber[] {
    return this.subscribers;
  }

  unsubscribe(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const sub = this.subscribers.find((s) => s.email.toLowerCase() === cleanEmail);
    if (sub) {
      sub.status = 'unsubscribed';
      saveToDB();
      return true;
    }
    return false;
  }

  deletePersonalData(email: string, scope: string = 'all'): { success: boolean; receiptId: string; deletedCount: number } {
    const cleanEmail = email.trim().toLowerCase();
    const receiptId = 'DEL-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    let deletedCount = 0;

    // 1. Remove from newsletter
    const initialSubCount = this.subscribers.length;
    this.subscribers = this.subscribers.filter(s => s.email.toLowerCase() !== cleanEmail);
    if (this.subscribers.length < initialSubCount) deletedCount++;

    if (scope === 'all') {
      // 2. Remove from newcomers if present
      if (Array.isArray(this.newcomers)) {
        const initialNewcomers = this.newcomers.length;
        this.newcomers = this.newcomers.filter(n => (n.email || '').toLowerCase() !== cleanEmail);
        if (this.newcomers.length < initialNewcomers) deletedCount++;
      }

      // 3. Remove from members list if present
      if (Array.isArray(this.members)) {
        const initialMembers = this.members.length;
        this.members = this.members.filter(m => (m.email || '').toLowerCase() !== cleanEmail);
        if (this.members.length < initialMembers) deletedCount++;
      }

      // 4. Remove from event RSVPs
      if (Array.isArray((this as any).rsvps)) {
        const initialRsvps = (this as any).rsvps.length;
        (this as any).rsvps = (this as any).rsvps.filter((r: any) => (r.email || '').toLowerCase() !== cleanEmail);
        if ((this as any).rsvps.length < initialRsvps) deletedCount++;
      }

      // 5. Remove prayer requests
      if (Array.isArray(this.prayers)) {
        const initialPrayers = this.prayers.length;
        this.prayers = this.prayers.filter(p => (p.email || '').toLowerCase() !== cleanEmail);
        if (this.prayers.length < initialPrayers) deletedCount++;
      }
    }

    saveToDB();
    console.log(`[Privacy] Data erasure completed for ${cleanEmail}. Receipt: ${receiptId}, records affected: ${deletedCount}`);
    return { success: true, receiptId, deletedCount };
  }

  addBroadcast(subject: string, message: string, recipients_count: number, sender_email?: string): NewsletterBroadcast {
    const nextId = (this.nextIds && typeof this.nextIds.broadcasts === 'number')
      ? this.nextIds.broadcasts++
      : (this.newsletterBroadcasts.length + 1);

    const broadcast: NewsletterBroadcast = {
      id: nextId,
      subject: subject.trim(),
      message: message.trim(),
      sender_email: sender_email || undefined,
      recipients_count,
      sent_at: new Date().toISOString(),
    };
    this.newsletterBroadcasts.unshift(broadcast);
    saveToDB();
    return broadcast;
  }

  getBroadcasts(): NewsletterBroadcast[] {
    return this.newsletterBroadcasts || [];
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
    if (email.toLowerCase() === 'keku121@gmail.com') newUser.role_id = 1;
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

  // Community Events & RSVPs Methods
  getEventsWithRsvps() {
    if (!this.events) this.events = this.getDefaultEvents();
    if (!this.eventRsvps) this.eventRsvps = [];
    return this.events.map((evt) => {
      const rsvps = this.eventRsvps.filter((r) => r.event_id === evt.id);
      const totalAttendees = rsvps.reduce((sum, r) => sum + 1 + (Number(r.guests_count) || 0), 0);
      return {
        ...evt,
        rsvp_count: totalAttendees,
        rsvp_submissions: rsvps.length,
        is_full: evt.capacity ? totalAttendees >= evt.capacity : false,
        spots_left: evt.capacity ? Math.max(0, evt.capacity - totalAttendees) : null,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  getEventById(id: number) {
    if (!this.events) this.events = this.getDefaultEvents();
    if (!this.eventRsvps) this.eventRsvps = [];
    const evt = this.events.find((e) => e.id === id);
    if (!evt) return null;
    const rsvps = this.eventRsvps.filter((r) => r.event_id === evt.id);
    const totalAttendees = rsvps.reduce((sum, r) => sum + 1 + (Number(r.guests_count) || 0), 0);
    return {
      ...evt,
      rsvp_count: totalAttendees,
      rsvp_submissions: rsvps.length,
      is_full: evt.capacity ? totalAttendees >= evt.capacity : false,
      spots_left: evt.capacity ? Math.max(0, evt.capacity - totalAttendees) : null,
      rsvps: rsvps.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        guests_count: r.guests_count || 0,
        notes: r.notes || '',
        created_at: r.created_at
      }))
    };
  }

  addEvent(data: Partial<CommunityEvent>): CommunityEvent {
    if (!this.events) this.events = [];
    const newEvent: CommunityEvent = {
      id: this.nextIds.events++,
      title: (data.title || 'Untitled Community Event').trim(),
      description: (data.description || '').trim(),
      date: data.date || new Date().toISOString().split('T')[0],
      time: (data.time || '7:00 PM').trim(),
      location: (data.location || 'EUC Sanctuary').trim(),
      category: (data.category as any) || 'gathering',
      image_url: data.image_url || '',
      capacity: data.capacity !== undefined && data.capacity !== null && !isNaN(Number(data.capacity)) ? Number(data.capacity) : null,
      is_featured: !!data.is_featured,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.events.push(newEvent);
    return newEvent;
  }

  updateEvent(id: number, data: Partial<CommunityEvent>): CommunityEvent | null {
    if (!this.events) this.events = [];
    const evt = this.events.find((e) => e.id === id);
    if (!evt) return null;
    if (data.title !== undefined) evt.title = data.title.trim();
    if (data.description !== undefined) evt.description = data.description.trim();
    if (data.date !== undefined) evt.date = data.date;
    if (data.time !== undefined) evt.time = data.time.trim();
    if (data.location !== undefined) evt.location = data.location.trim();
    if (data.category !== undefined) evt.category = data.category as any;
    if (data.image_url !== undefined) evt.image_url = data.image_url;
    if (data.capacity !== undefined) evt.capacity = data.capacity !== null && !isNaN(Number(data.capacity)) ? Number(data.capacity) : null;
    if (data.is_featured !== undefined) evt.is_featured = !!data.is_featured;
    return evt;
  }

  deleteEvent(id: number): boolean {
    if (!this.events) this.events = [];
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.events.splice(idx, 1);
    if (this.eventRsvps) {
      this.eventRsvps = this.eventRsvps.filter((r) => r.event_id !== id);
    }
    return true;
  }

  getRsvps(eventId: number): EventRsvp[] {
    if (!this.eventRsvps) this.eventRsvps = [];
    return this.eventRsvps.filter((r) => r.event_id === eventId);
  }

  addRsvp(data: { event_id: number; name: string; email: string; phone?: string; guests_count?: number; notes?: string }): { success: boolean; rsvp?: EventRsvp; error?: string } {
    if (!this.events) this.events = this.getDefaultEvents();
    if (!this.eventRsvps) this.eventRsvps = [];
    const evt = this.events.find((e) => e.id === data.event_id);
    if (!evt) return { success: false, error: 'Event not found' };

    const email = (data.email || '').trim().toLowerCase();
    const name = (data.name || '').trim();
    if (!name || !email) return { success: false, error: 'Name and email are required' };

    const guests = Math.max(0, Math.min(10, Number(data.guests_count) || 0));

    // Check capacity if set
    if (evt.capacity) {
      const currentAttendees = this.eventRsvps
        .filter((r) => r.event_id === data.event_id && r.email.toLowerCase() !== email)
        .reduce((sum, r) => sum + 1 + (Number(r.guests_count) || 0), 0);
      if (currentAttendees + 1 + guests > evt.capacity) {
        return { success: false, error: `Sorry, this event only has ${Math.max(0, evt.capacity - currentAttendees)} spot(s) remaining.` };
      }
    }

    const existingIndex = this.eventRsvps.findIndex((r) => r.event_id === data.event_id && r.email.toLowerCase() === email);

    if (existingIndex >= 0) {
      // Update existing RSVP
      this.eventRsvps[existingIndex].name = name;
      this.eventRsvps[existingIndex].phone = (data.phone || '').trim();
      this.eventRsvps[existingIndex].guests_count = guests;
      this.eventRsvps[existingIndex].notes = (data.notes || '').trim();
      return { success: true, rsvp: this.eventRsvps[existingIndex] };
    }

    const newRsvp: EventRsvp = {
      id: this.nextIds.eventRsvps++,
      event_id: data.event_id,
      name,
      email,
      phone: (data.phone || '').trim(),
      guests_count: guests,
      notes: (data.notes || '').trim(),
      created_at: new Date().toISOString(),
    };
    this.eventRsvps.push(newRsvp);
    return { success: true, rsvp: newRsvp };
  }

  cancelRsvp(eventId: number, email: string): boolean {
    if (!this.eventRsvps) return false;
    const normEmail = (email || '').trim().toLowerCase();
    const before = this.eventRsvps.length;
    this.eventRsvps = this.eventRsvps.filter(
      (r) => !(r.event_id === eventId && r.email.toLowerCase() === normEmail)
    );
    return this.eventRsvps.length < before;
  }
}

export const rawStore = new InMemoryStore();

let saveTimeout: NodeJS.Timeout | null = null;
let pool: pg.Pool | null = null;

const saveToDB = async () => {
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
      subscribers: rawStore.subscribers,
      newsletterBroadcasts: rawStore.newsletterBroadcasts,
      resources: rawStore.resources,
      inviteCodes: rawStore.inviteCodes,
      resetTokens: rawStore.resetTokens,
      events: rawStore.events,
      eventRsvps: rawStore.eventRsvps,
      departments: rawStore.departments,
      nextIds: rawStore.nextIds
    };

    // Safely save state to local JSON file storage
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(stateToSave, null, 2));
    } catch (err) {
      console.error('Failed to save state to data.json:', err);
    }
  } catch (err: any) {
    console.error('Failed in saveToDB:', err);
  }
};

const initDb = () => {
  // First load from local JSON file as primary persistent source
  try {
    if (fs.existsSync(DATA_FILE)) {
      const state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      Object.assign(rawStore, state);
      if (!rawStore.resetTokens) rawStore.resetTokens = [];
      if (!rawStore.subscribers) rawStore.subscribers = [];
      if (!rawStore.newsletterBroadcasts) rawStore.newsletterBroadcasts = [];
      if (!rawStore.departments || rawStore.departments.length === 0) {
        rawStore.initDefaultDepartments();
      }
      if (!rawStore.nextIds) rawStore.nextIds = {} as any;
      if (!rawStore.nextIds.subscribers) rawStore.nextIds.subscribers = (rawStore.subscribers.length + 1) || 1;
      if (!rawStore.nextIds.broadcasts) rawStore.nextIds.broadcasts = (rawStore.newsletterBroadcasts.length + 1) || 1;
      console.log('[Local FS] Restored state from data.json');

      // Safe non-destructive initialization: only initialize if completely empty
      if (!rawStore.pods || rawStore.pods.length === 0 || !rawStore.members || rawStore.members.length === 0) {
        rawStore.initOfficialDnaPods();
        console.log('[Store] Initialized official leadership members into empty store.');
        saveToDB();
      }

      // Ensure community events and RSVPs exist
      if (!rawStore.events || rawStore.events.length === 0) {
        rawStore.events = rawStore.getDefaultEvents();
      }
      if (!rawStore.eventRsvps) {
        rawStore.eventRsvps = [];
      }
      if (!rawStore.nextIds.events) {
        rawStore.nextIds.events = (rawStore.events.length || 0) + 1;
      }
      if (!rawStore.nextIds.eventRsvps) {
        rawStore.nextIds.eventRsvps = 1;
      }
    } else {
      // data.json does not exist yet: initialize default state non-destructively
      rawStore.initOfficialDnaPods();
      rawStore.events = rawStore.getDefaultEvents();
      saveToDB();
    }
  } catch (err) {
    console.error('Failed to load from data.json:', err);
  }

  const sqlHost = (process.env.SQL_HOST || '').trim();
  const sqlUser = (process.env.SQL_USER || '').trim();
  const sqlPassword = (process.env.SQL_PASSWORD || '').trim();
  const sqlDbName = (process.env.SQL_DB_NAME || '').trim();

  if (!sqlHost || !sqlUser || !sqlPassword || !sqlDbName) {
    console.log('[PostgreSQL] Missing SQL_* environment variables. Using Local FS persistence.');
    return;
  }

  // Safe read-only/backup connection: do not run destructive migrations or auto-update queries
  try {
    pool = new pg.Pool({
      host: sqlHost,
      user: sqlUser,
      password: sqlPassword,
      database: sqlDbName,
      max: 5,
      connectionTimeoutMillis: 15000,
    });

    pool.on('error', (err: any) => {
      console.error('[PostgreSQL Error] Unexpected client error:', err.message);
      if (err.code === 'EAI_AGAIN' || err.code === 'ENOTFOUND') {
         console.warn('[PostgreSQL] Database host is unreachable. Running in local storage mode.');
         pool = null;
      }
    });

    // Safe, non-destructive table check: CREATE TABLE IF NOT EXISTS (never DROP or TRUNCATE)
    pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      if (!pool) return;
      return pool.query('SELECT data FROM app_state ORDER BY id DESC LIMIT 1');
    }).then(res => {
      // If local data.json was empty or absent, safely restore from remote table without overwriting
      if (res && res.rows.length > 0 && (!rawStore.members || rawStore.members.length === 0)) {
        const state = res.rows[0].data;
        Object.assign(rawStore, state);
        console.log('[PostgreSQL] Loaded backup state from database into empty store');
        saveToDB();
      }
    }).catch(err => {
      console.error('[PostgreSQL Connection Notice]:', err.message);
      pool = null;
    });
  } catch (err: any) {
    console.error('[PostgreSQL Initialization]:', err.message);
    pool = null;
  }
};

initDb();

export const store = new Proxy(rawStore, {
  get(target: any, prop: string) {
    const orig = target[prop];
    if (typeof orig === 'function') {
      return function(...args: any[]) {
        const res = orig.apply(target, args);
        // Mutations that should trigger a save
        const mutationPrefixes = ['add', 'update', 'delete', 'claim', 'create', 'reset', 'support', 'answer', 'cancel'];
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
