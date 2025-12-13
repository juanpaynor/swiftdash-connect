// Database Types for SwiftDash Connect
// This file contains TypeScript types for all Supabase database tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// PLATFORM ADMIN TABLES
// ============================================

export interface PlatformAdmin {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// ============================================
// ORGANIZATION TABLES
// ============================================

export interface Organization {
  id: string
  name: string
  slug: string // Unique slug for branded URLs
  subscription_tier: 'free' | 'pro' | 'enterprise'
  branding_enabled: boolean
  branding_granted_by_admin: string | null // Timestamp when platform admin enabled branding
  meeting_limit: number | null // NULL = unlimited
  participant_limit: number | null // NULL = unlimited
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface OrganizationBranding {
  id: string
  organization_id: string
  primary_color: string | null // Hex color, default '#00BFFF'
  secondary_color: string | null // Hex color, default '#B0E2FF'
  accent_color: string | null // Hex color, default '#E6E6FA'
  logo_url: string | null // URL to logo in Supabase Storage
  favicon_url: string | null // URL to favicon
  meeting_background_color: string | null // Meeting room background, default '#000000'
  meeting_border_style: 'none' | 'subtle' | 'bold' | null // Video tile border style
  show_logo_on_tiles: boolean | null // Display logo on participant videos
  button_style: 'rounded' | 'square' | null // Button border radius
  branding_enabled: boolean | null // Master toggle for branding
  font_family: string | null // Font family, default 'Inter'
  custom_css: string | null // Custom CSS overrides
  created_at: string
  updated_at: string
}

// ============================================
// USER TABLES
// ============================================

export interface User {
  id: string // Matches Supabase Auth user ID
  email: string
  full_name: string | null
  avatar_url: string | null
  default_organization_id: string | null // User's default organization
  created_at: string
  updated_at: string
}

// ============================================
// MEETING TABLES
// ============================================

export interface Meeting {
  id: string
  organization_id: string
  host_id: string // User ID of meeting host
  title: string
  meeting_slug: string // Unique slug for meeting URL
  scheduled_date: string | null
  scheduled_time: string | null
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  password: string | null // Optional meeting password
  waiting_room_enabled: boolean // Whether waiting room is active
  stream_call_id: string | null
  stream_channel_id: string | null
  created_at: string
  updated_at: string
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  user_id: string
  role: 'host' | 'participant'
  status: 'admitted' | 'waiting' | 'denied' // Status for waiting room
  joined_at: string | null
  left_at: string | null
}

export interface MeetingInvitation {
  id: string
  meeting_id: string
  invited_by: string // User ID
  invitee_email: string | null // For email invitations
  invitee_user_id: string | null // For in-app invitations
  invitation_token: string // Unique token for shareable links
  invitation_type: 'email' | 'link' | 'user' // How invitation was sent
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string // 7 days for email, 24 hours for links
  accepted_at: string | null
  created_at: string
}

// ============================================
// CONTACT/DIRECTORY TABLES
// ============================================

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  nickname: string | null // Optional custom name
  created_at: string
}

// ============================================
// STREAM USAGE TRACKING (for Platform Admin)
// ============================================

export interface StreamUsageLog {
  id: string
  organization_id: string
  meeting_id: string
  participant_minutes: number
  peak_concurrent_participants: number
  recorded_at: string
}

// ============================================
// DATABASE TYPE (for Supabase Client)
// ============================================

export interface Database {
  public: {
    Tables: {
      platform_admins: {
        Row: PlatformAdmin
        Insert: Omit<PlatformAdmin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PlatformAdmin, 'id' | 'created_at'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      organization_members: {
        Row: OrganizationMember
        Insert: Omit<OrganizationMember, 'id' | 'joined_at'>
        Update: Partial<Omit<OrganizationMember, 'id'>>
      }
      organization_branding: {
        Row: OrganizationBranding
        Insert: Omit<OrganizationBranding, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OrganizationBranding, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      meetings: {
        Row: Meeting
        Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Meeting, 'id' | 'created_at'>>
      }
      meeting_participants: {
        Row: MeetingParticipant
        Insert: Omit<MeetingParticipant, 'id'>
        Update: Partial<Omit<MeetingParticipant, 'id'>>
      }
      meeting_invitations: {
        Row: MeetingInvitation
        Insert: Omit<MeetingInvitation, 'id' | 'created_at'>
        Update: Partial<Omit<MeetingInvitation, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      stream_usage_logs: {
        Row: StreamUsageLog
        Insert: Omit<StreamUsageLog, 'id'>
        Update: Partial<Omit<StreamUsageLog, 'id'>>
      }
    }
  }
}
