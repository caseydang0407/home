export const CNA_LOCATIONS = [
  'Sacramento',
  'San Francisco',
  'Los Angeles',
  'Irvine',
  'San Diego',
] as const;

export type CnaLocation = (typeof CNA_LOCATIONS)[number];

export const MEMBER_ROLES = ['Union Rep', 'Unit Rep', 'PPC'] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export type SyncStatus = 'synced' | 'pending';

export interface CheckInRecord {
  id: string;
  dateKey: string; // YYYY-MM-DD in local time
  timestamp: string; // ISO string
  name: string;
  phone: string;
  email: string;
  role: MemberRole;
  department: string;
  location: CnaLocation;
  syncStatus: SyncStatus;
}

export interface RememberedMemberProfile {
  name: string;
  phone: string;
  email: string;
  role: MemberRole;
  department: string;
}

export type ResourceCategory = 'Manuals' | 'Guides' | 'Training Videos';

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  durationOrLength: string;
  updatedAt: string;
  summary: string;
  thumbnailType: 'ppc' | 'steward';
  videoDurationSeconds?: number;
  offlineSections: {
    heading: string;
    points: string[];
  }[];
  tags: string[];
}

export type AppSection = 'checkin' | 'dashboard' | 'resources';
