
export enum StakeholderCategory {
  PRIVATE_COMPANY = 'Private Company',
  EDUCATIONAL = 'Educational Organization',
  GOVERNMENT = 'Government Body',
  NGO = 'NGO',
  INVESTOR = 'Investor'
}

export enum UserScenario {
  ORG_REPRESENTATIVE = 'Official Representative',
  ORG_MEMBER = 'Staff/Member',
  INDIVIDUAL = 'Individual Participant',
  PLATFORM_ADMIN = 'Platform Administrator'
}

export enum MatchStatus {
  INQUIRY = 'Inquiry',
  NDA_PENDING = 'NDA Pending',
  TECHNICAL_DD = 'Technical Due Diligence',
  NEGOTIATION = 'Negotiation',
  CONTRACT_SIGNED = 'Contract Signed'
}

export enum VerificationStatus {
  NONE = 'None',
  PENDING = 'Pending Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  UPDATE_PENDING = 'Update Pending Review'
}

export type StakeholderRole = 'Provider' | 'Seeker' | 'Investor';

export interface InvestorInfo {
  funding_types: string[];
  investment_range: string;
  preferred_trl_min: number;
  typical_deal_cycle?: string;
}

export interface Stakeholder {
  stakeholder_id: string;
  name: string;
  category: string;
  description: string;
  legal_address: string;
  legal_document_id: string;
  website: string;
  contact_name: string;
  contact_email: string;
  phone?: string;
  whatsapp_enabled?: boolean;
  is_verified: boolean;
  key_tech_areas: string[];
  roles: StakeholderRole[];
  investor_info?: InvestorInfo;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  scenario: UserScenario;
  stakeholder_id?: string;
  is_verified: boolean; // Legacy: Maps to is_id_verified
  is_email_verified: boolean;
  is_id_verified: boolean;
  verification_status: VerificationStatus;
  id_document_name?: string;
  is_primary_rep?: boolean;
  avatarUrl?: string;
  joinedDate: number;
  isAdmin?: boolean;
}

export interface Technology {
  id: string;
  name: string;
  stakeholder_id: string;
  tech_category_id: string;
  tech_sub_category_id: string;
  description: string;
  ip_status: string;
  patent_number?: string;
  ip_owner: string;
  licensing_availability: string;
  geographic_restrictions: string;
  disclosure_level: string;
  imageUrl?: string;
  image_url?: string;
  videoUrl?: string;
  trl_level?: number;
}

export interface TechNeed {
  id: string;
  seeker_id: string;
  title: string;
  description: string;
  industry: string;
  budget_range?: string;
  deadline?: string;
  status: 'open' | 'closed';
  createdAt: number;
}

export interface Message {
  id: string;
  sender_id: string;
  text: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  tech_id?: string;
  need_id?: string;
  item_name: string;
  participant_ids: string[];
  messages: Message[];
  last_updated: number;
  status: MatchStatus;
}

export interface Opportunity {
  id: string;
  type: 'Event' | 'Tour' | 'Service' | 'Support';
  title: string;
  description: string;
  stakeholder_id: string;
  date: string;
  imageUrl?: string;
  image_url?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  url: string;
}
