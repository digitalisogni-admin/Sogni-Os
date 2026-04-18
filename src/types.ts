export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed';

export type FontTheme = 'inter' | 'space' | 'outfit' | 'playfair' | 'jetbrains' | 'syne' | 'lexend' | 'roboto' | 'montserrat' | 'silkscreen';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  photoURL?: string;
  role: 'superadmin' | 'admin' | 'affiliate';
  status: 'active' | 'pending' | 'suspended';
  theme?: 'light' | 'dark';
  fontTheme?: FontTheme;
  phone?: string;
  company?: string;
  taxCode?: string; // Codice Fiscale
  vatNumber?: string; // Partita IVA
  conditions?: string;
  dashboardWidgets?: string[];
  webhooks?: {
    n8n?: string;
    zapier?: string;
  };
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  value: number;
  avatar?: string;
  lastContacted: string;
  role?: string;
  phone?: string;
  website?: string;
  businessType?: string;
  message?: string;
  vatNumber?: string;
  taxCode?: string;
  address?: string;
  pecEmail?: string;
  sdiCode?: string;
  uid?: string;
  source?: 'Meta' | 'TikTok' | 'Email' | 'WhatsApp' | 'Manual' | 'Website';
  commissionScenario?: 'A' | 'B' | 'C' | 'D';
  carePlan?: 'None' | 'Essential' | 'Pro';
  activities?: { id: string; type: string; date: string; description: string }[];
  meta?: {
    cookies?: Record<string, string>;
    ip?: string;
    userAgent?: string;
    screen?: { width: number; height: number };
    location?: { href: string; pathname: string };
  } | null;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  assignee: {
    name: string;
    avatar: string;
  };
  dueDate: string;
  progress: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  features?: string[];
  color?: string;
  borderColor?: string;
  iconName?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'Active' | 'Completed' | 'On Hold';
  progress: number;
  dueDate: string;
  documentation?: string;
  uid: string;
  leadId?: string; // Link to the lead
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'Meeting' | 'Call' | 'Deadline';
  uid: string;
  details?: string;
  comments?: { text: string; author: string; timestamp: string }[];
}

export interface SocialMetric {
  platform: 'Instagram' | 'LinkedIn' | 'TikTok' | 'Facebook';
  engagement: number;
  followers: number;
  growth: number;
}

export interface CustomerDemographic {
  ageGroup: string;
  percentage: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  segment: 'All Leads' | 'Customers' | 'Prospects';
  status: 'Draft' | 'Sent';
  sentAt?: string;
  recipientsCount: number;
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: 'Hosting' | 'CMS' | 'Social' | 'Other';
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  uid: string;
}

export interface SecurityEvent {
  id: string;
  event: string;
  location: string;
  timestamp: string;
  status: 'success' | 'warning' | 'danger';
  uid: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  recipientId: string;
  read?: boolean;
}
