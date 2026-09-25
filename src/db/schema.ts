import { relations } from 'drizzle-orm';
import { integer, boolean, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Kept for legacy/fallback if needed
  fullName: text('full_name').notNull(),
  roleId: integer('role_id').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').notNull().references(() => roles.id),
  permissionId: integer('permission_id').notNull().references(() => permissions.id),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  joinDate: text('join_date').notNull(),
  role: text('role').notNull(),
  spiritualStage: text('spiritual_stage').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const pods = pgTable('pods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  leaderId: integer('leader_id').references(() => members.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const podMembers = pgTable('pod_members', {
  podId: integer('pod_id').notNull().references(() => pods.id),
  memberId: integer('member_id').notNull().references(() => members.id),
});

export const prayerRequests = pgTable('prayer_requests', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  authorName: text('author_name'),
  category: text('category'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const prayerSupporters = pgTable('prayer_supporters', {
  requestId: integer('request_id').notNull().references(() => prayerRequests.id),
  userId: integer('user_id').notNull().references(() => users.id),
});

export const weeklyPlans = pgTable('weekly_plans', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  theme: text('theme').notNull(),
  speaker: text('speaker').notNull(),
  worshipLeader: text('worship_leader').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pipeline = pgTable('pipeline', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id),
  stageId: text('stage_id').notNull(),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const inviteCodes = pgTable('invite_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  roleId: integer('role_id').notNull().references(() => roles.id),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resetTokens = pgTable('reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(), // Unix timestamp
  isUsed: boolean('is_used').default(false).notNull(),
});

export const appState = pgTable('app_state', {
  id: serial('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
