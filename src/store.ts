import { create } from 'zustand';
import { toast } from 'sonner';
import { Lead, Task, Product, Project, CalendarEvent, Campaign, EmailTemplate, SecurityEvent, ChatMessage, FontTheme } from './types';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lead' | 'system' | 'chat';
  read: boolean;
  createdAt: any;
  uid: string;
}

interface DashboardState {
  leads: Lead[];
  tasks: Task[];
  products: Product[];
  projects: Project[];
  events: CalendarEvent[];
  campaigns: Campaign[];
  templates: EmailTemplate[];
  notifications: Notification[];
  securityEvents: SecurityEvent[];
  chatMessages: ChatMessage[];
  users: any[];
  theme: 'light' | 'dark';
  accentColor: 'blue' | 'yellow' | 'green' | 'pink' | 'purple';
  fontTheme: FontTheme;
  isGlassMode: boolean;
  userRole: 'superadmin' | 'admin' | 'affiliate';
  user: any | null;
  isAuthReady: boolean;
  webhooks: {
    n8n: string;
    zapier: string;
  };
  googleSheetId: string;
  apiKey: string;
  whatsappConfig: {
    accessToken: string;
    phoneNumberId: string;
  };
  cookieConfig: {
    enabled: boolean;
    collectIP: boolean;
    collectUserAgent: boolean;
    customCookies: string[];
  };
  targetRevenue: number;
  dashboardWidgets: string[];
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'uid'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'uid'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addTemplate: (template: Omit<EmailTemplate, 'id'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  sendMessage: (message: Omit<ChatMessage, 'id'>) => Promise<void>;
  setWebhooks: (webhooks: { n8n: string; zapier: string }) => Promise<void>;
  setGoogleSheetId: (id: string) => Promise<void>;
  setApiKey: (apiKey: string) => Promise<void>;
  setWhatsappConfig: (config: { accessToken: string; phoneNumberId: string }) => Promise<void>;
  setCookieConfig: (config: DashboardState['cookieConfig']) => Promise<void>;
  setTargetRevenue: (revenue: number) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setAccentColor: (color: DashboardState['accentColor']) => Promise<void>;
  setFontTheme: (theme: FontTheme) => Promise<void>;
  setGlassMode: (glass: boolean) => Promise<void>;
  setUserRole: (role: DashboardState['userRole']) => Promise<void>;
  setDashboardWidgets: (widgets: string[]) => Promise<void>;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  linkGoogleAuth: () => Promise<void>;
  initAuth: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  leads: [],
  tasks: [],
  products: [],
  projects: [],
  events: [],
  campaigns: [],
  templates: [],
  notifications: [],
  securityEvents: [],
  chatMessages: [],
  users: [],
  theme: 'dark',
  accentColor: 'blue',
  fontTheme: 'inter',
  isGlassMode: true,
  userRole: 'admin',
  user: { uid: 'mock-uid', email: 'guest@example.com', displayName: 'Guest' },
  isAuthReady: true,
  webhooks: {
    n8n: '',
    zapier: '',
  },
  googleSheetId: '',
  apiKey: '',
  whatsappConfig: {
    accessToken: '',
    phoneNumberId: '',
  },
  cookieConfig: {
    enabled: false,
    collectIP: true,
    collectUserAgent: true,
    customCookies: [],
  },
  targetRevenue: 85000,
  dashboardWidgets: [
    'kpi-revenue', 
    'kpi-daily-avg', 
    'kpi-conversion', 
    'kpi-campaigns', 
    'quick-lead', 
    'income-amounts', 
    'revenue-chart', 
    'top-performance', 
    'tasks'
  ],

  initAuth: () => {
    set({ isAuthReady: true });
  },

  login: async () => {
    set({ user: { uid: 'mock-uid', email: 'user@example.com', displayName: 'Mock User' } });
  },

  loginWithEmail: async (email, pass) => {
    set({ user: { uid: 'mock-uid', email: email, displayName: 'Mock User' } });
  },

  signupWithEmail: async (email, pass) => {
    set({ user: { uid: 'mock-uid', email: email, displayName: 'Mock User' } });
  },

  resetPassword: async (email) => {
     toast.success("Password reset sent (mock).");
  },

  logout: async () => {
    set({ user: null });
  },

  linkGoogleAuth: async () => {},

  addLead: async (lead) => {
    const newLead = { ...lead, id: Math.random().toString() };
    set(state => ({ leads: [...state.leads, newLead] }));
  },

  updateLead: async (id, updates) => {
    set(state => ({
      leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  },

  updateLeadStatus: async (id, status) => {
    set(state => ({
      leads: state.leads.map(l => l.id === id ? { ...l, status } : l)
    }));
  },

  deleteLead: async (id) => {
    set(state => ({
      leads: state.leads.filter(l => l.id !== id)
    }));
  },

  addTask: async (task) => {
    set(state => ({ tasks: [...state.tasks, { ...task, id: Math.random().toString() }] }));
  },

  updateTask: async (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  },

  deleteTask: async (id) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
  },

  addProduct: async (product) => {
    set(state => ({ products: [...state.products, { ...product, id: Math.random().toString() }] }));
  },

  deleteProduct: async (id) => {
     set(state => ({
       products: state.products.filter(p => p.id !== id)
     }));
  },

  addProject: async (project) => {
    set(state => ({ projects: [...state.projects, { ...project, id: Math.random().toString() } as Project] }));
  },

  updateProject: async (id, updates) => {
     set(state => ({
       projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
     }));
  },

  deleteProject: async (id) => {
    set(state => ({
      projects: state.projects.filter(p => p.id !== id)
    }));
  },

  addEvent: async (event) => {
    set(state => ({ events: [...state.events, { ...event, id: Math.random().toString() } as CalendarEvent] }));
  },

  updateEvent: async (id, updates) => {
    set(state => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  },

  deleteEvent: async (id) => {
    set(state => ({
       events: state.events.filter(e => e.id !== id)
    }));
  },

  addCampaign: async (campaign) => {
    set(state => ({ campaigns: [...state.campaigns, { ...campaign, id: Math.random().toString() }] }));
  },

  updateCampaign: async (id, updates) => {
     set(state => ({
       campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
     }));
  },

  deleteCampaign: async (id) => {
     set(state => ({
       campaigns: state.campaigns.filter(c => c.id !== id)
     }));
  },

  addTemplate: async (template) => {
    set(state => ({ templates: [...state.templates, { ...template, id: Math.random().toString() }] }));
  },

  updateTemplate: async (id, updates) => {
     set(state => ({
       templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
     }));
  },

  deleteTemplate: async (id) => {
     set(state => ({
       templates: state.templates.filter(t => t.id !== id)
     }));
  },

  sendMessage: async (message) => {
    set(state => ({ chatMessages: [...state.chatMessages, { ...message, id: Math.random().toString() }] }));
  },

  setWebhooks: async (webhooks) => {
    set({ webhooks });
  },

  setGoogleSheetId: async (googleSheetId) => {
    set({ googleSheetId });
  },

  setApiKey: async (apiKey) => {
    set({ apiKey });
  },

  setWhatsappConfig: async (config) => {
    set({ whatsappConfig: config });
  },

  setCookieConfig: async (cookieConfig) => {
    set({ cookieConfig });
  },

  setTargetRevenue: async (targetRevenue) => {
    set({ targetRevenue });
  },

  markNotificationRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  toggleTheme: async () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
  },

  setAccentColor: async (accentColor) => {
    set({ accentColor });
  },

  setGlassMode: async (isGlassMode) => {
    set({ isGlassMode });
  },

  setFontTheme: async (fontTheme) => {
    set({ fontTheme });
  },

  setUserRole: async (role) => {
    set({ userRole: role });
  },

  setDashboardWidgets: async (dashboardWidgets) => {
    set({ dashboardWidgets });
  }
}));
