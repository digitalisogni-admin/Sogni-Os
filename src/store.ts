import { create } from 'zustand';
import { Lead, Task, Product, Project, CalendarEvent, Campaign, EmailTemplate, SecurityEvent, ChatMessage, FontTheme } from './types';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  or,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser, 
  linkWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';

const cleanUpdates = (updates: any) => {
  return Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {} as any);
};

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
  user: FirebaseUser | null;
  isAuthReady: boolean;
  webhooks: {
    n8n: string;
    zapier: string;
  };
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
  user: null,
  isAuthReady: false,
  webhooks: {
    n8n: '',
    zapier: '',
  },
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
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch or create user profile
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            set({ 
              user, 
              isAuthReady: true, 
              userRole: data.role || 'affiliate',
              theme: data.theme || 'dark',
              fontTheme: data.fontTheme || 'inter',
              accentColor: data.accentColor || 'blue',
              isGlassMode: data.isGlassMode ?? true,
              webhooks: data.webhooks || { n8n: '', zapier: '' },
              apiKey: data.apiKey || '',
              whatsappConfig: data.whatsappConfig || { accessToken: '', phoneNumberId: '' },
              cookieConfig: data.cookieConfig || { enabled: false, collectIP: true, collectUserAgent: true, customCookies: [] },
              targetRevenue: data.targetRevenue || 85000,
              dashboardWidgets: data.dashboardWidgets || [
                'kpi-revenue', 
                'kpi-daily-avg', 
                'kpi-conversion', 
                'kpi-campaigns', 
                'quick-lead', 
                'income-amounts', 
                'revenue-chart', 
                'top-performance', 
                'tasks'
              ]
            });
          } else {
            // Check if admin created a profile for this email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            let profileData = {
              email: user.email,
              role: user.email === 'digitalisogni@gmail.com' ? 'superadmin' : 'affiliate',
              theme: 'dark',
              fontTheme: 'inter' as FontTheme,
              webhooks: { n8n: '', zapier: '' },
              apiKey: '',
              whatsappConfig: { accessToken: '', phoneNumberId: '' },
              cookieConfig: { enabled: false, collectIP: true, collectUserAgent: true, customCookies: [] },
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
              ]
            };

            if (!querySnapshot.empty) {
              const existingDoc = querySnapshot.docs[0];
              profileData = { ...profileData, ...existingDoc.data() };
              // We could delete the old document here, but we might need an admin function for that
              // For now, we just copy the data to the new UID document
            }

            await setDoc(userDocRef, profileData);
            set({ 
              user, 
              isAuthReady: true, 
              userRole: profileData.role as DashboardState['userRole'], 
              theme: profileData.theme as 'light' | 'dark', 
              fontTheme: profileData.fontTheme,
              apiKey: profileData.apiKey 
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback for Master Account if doc read fails
          const isMaster = user.email === 'digitalisogni@gmail.com';
          set({ 
            user, 
            isAuthReady: true, 
            userRole: isMaster ? 'superadmin' : 'affiliate' 
          });
        }

        // Final verification of role for consistency
        const currentState = get();
        const currentRole = currentState.userRole;
        const isAdmin = currentRole === 'admin' || currentRole === 'superadmin';
        
        console.log(`[Auth] Starting listeners for user ${user.uid} with role ${currentRole} (isAdmin: ${isAdmin})`);

      // Leads listener
      const leadsQuery = isAdmin ? collection(db, 'leads') : query(collection(db, 'leads'), where('uid', '==', user.uid));
        onSnapshot(leadsQuery, (snapshot) => {
          const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead))
            .sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime();
              const timeB = new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
          set({ leads });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads'));

        // Notifications listener
        const notificationsQuery = query(
          collection(db, 'notifications'), 
          where('uid', '==', user.uid)
        );
        onSnapshot(notificationsQuery, (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
            .sort((a, b) => {
              const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
              const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
          set({ notifications });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

        // Tasks listener
        const tasksQuery = isAdmin ? collection(db, 'tasks') : query(collection(db, 'tasks'), where('uid', '==', user.uid));
        onSnapshot(tasksQuery, (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          set({ tasks });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

        // Products listener
        onSnapshot(collection(db, 'products'), (snapshot) => {
          const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          set({ products });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

        // Projects listener
        const projectsQuery = isAdmin ? collection(db, 'projects') : query(collection(db, 'projects'), where('uid', '==', user.uid));
        onSnapshot(projectsQuery, (snapshot) => {
          const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
          set({ projects });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

        // Events listener
        const eventsQuery = isAdmin ? collection(db, 'events') : query(collection(db, 'events'), where('uid', '==', user.uid));
        onSnapshot(eventsQuery, (snapshot) => {
          const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
          set({ events });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

        // Campaigns listener
        const campaignsQuery = isAdmin ? collection(db, 'campaigns') : query(collection(db, 'campaigns'), where('uid', '==', user.uid));
        onSnapshot(campaignsQuery, (snapshot) => {
          const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
          set({ campaigns });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'campaigns'));

        // Templates listener
        const templatesQuery = isAdmin ? collection(db, 'templates') : query(collection(db, 'templates'), where('uid', '==', user.uid));
        onSnapshot(templatesQuery, (snapshot) => {
          const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
          set({ templates });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'templates'));

        // Security Events listener
        const securityEventsQuery = isAdmin ? collection(db, 'securityEvents') : query(collection(db, 'securityEvents'), where('uid', '==', user.uid));
        onSnapshot(securityEventsQuery, (snapshot) => {
          const securityEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityEvent));
          set({ securityEvents });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'securityEvents'));

        // Chat Messages listener
        const chatMessagesQuery = isAdmin 
          ? collection(db, 'chatMessages') 
          : query(
              collection(db, 'chatMessages'), 
              or(
                where('senderId', '==', user.uid),
                where('recipientId', '==', user.uid)
              )
            );
        
        onSnapshot(chatMessagesQuery, (snapshot) => {
          const chatMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
          set({ chatMessages });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'chatMessages'));

        // Users listener (for admin to see affiliates)
        if (isAdmin) {
          onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            set({ users });
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
        }

      } else {
        set({ 
          user: null, 
          isAuthReady: true, 
          leads: [], 
          tasks: [], 
          products: [], 
          projects: [], 
          events: [],
          campaigns: [],
          templates: [],
          securityEvents: [],
          chatMessages: []
        });
      }
    });
  },

  login: async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  loginWithEmail: async (email, pass) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email login failed:", error);
      throw error;
    }
  },

  signupWithEmail: async (email, pass) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  linkGoogleAuth: async () => {
    const user = get().user;
    if (!user) return;
    const provider = new GoogleAuthProvider();
    try {
      await linkWithPopup(user, provider);
    } catch (error) {
      console.error("Failed to link Google account:", error);
      throw error;
    }
  },

  addLead: async (lead) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'leads'), { ...lead, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  },

  updateLead: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'leads', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  },

  updateLeadStatus: async (id, status) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  },

  deleteLead: async (id) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  },

  addTask: async (task) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), { ...task, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  },

  updateTask: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'tasks', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  },

  deleteTask: async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  },

  addProduct: async (product) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'products'), { ...product, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  },

  deleteProduct: async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  },

  addProject: async (project) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'projects'), { ...project, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  },

  updateProject: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'projects', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  },

  deleteProject: async (id) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  },

  addEvent: async (event) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'events'), { ...event, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    }
  },

  updateEvent: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'events', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `events/${id}`);
    }
  },

  deleteEvent: async (id) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  },

  addCampaign: async (campaign) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'campaigns'), { ...campaign, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'campaigns');
    }
  },

  updateCampaign: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'campaigns', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${id}`);
    }
  },

  deleteCampaign: async (id) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`);
    }
  },

  addTemplate: async (template) => {
    const user = get().user;
    if (!user) return;
    try {
      await addDoc(collection(db, 'templates'), { ...template, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'templates');
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'templates', id), cleanUpdates(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `templates/${id}`);
    }
  },

  deleteTemplate: async (id) => {
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
    }
  },

  sendMessage: async (message) => {
    try {
      await addDoc(collection(db, 'chatMessages'), message);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chatMessages');
    }
  },

  setWebhooks: async (webhooks) => {
    const user = get().user;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { webhooks });
      set({ webhooks });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  setApiKey: async (apiKey) => {
    const user = get().user;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { apiKey });
      set({ apiKey });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  setWhatsappConfig: async (config) => {
    const user = get().user;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { whatsappConfig: config });
      set({ whatsappConfig: config });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  setCookieConfig: async (cookieConfig) => {
    const { user } = get();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { cookieConfig });
      set({ cookieConfig });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  setTargetRevenue: async (targetRevenue) => {
    const user = get().user;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { targetRevenue });
      set({ targetRevenue });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  toggleTheme: async () => {
    const user = get().user;
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
      } catch (error) {
        console.error("Failed to sync theme:", error);
      }
    }
  },

  setAccentColor: async (accentColor) => {
    const user = get().user;
    set({ accentColor });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { accentColor });
      } catch (error) {
        console.error("Failed to sync accent color:", error);
      }
    }
  },

  setGlassMode: async (isGlassMode) => {
    const user = get().user;
    set({ isGlassMode });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { isGlassMode });
      } catch (error) {
        console.error("Failed to sync glass mode:", error);
      }
    }
  },

  setFontTheme: async (fontTheme) => {
    const user = get().user;
    set({ fontTheme });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { fontTheme });
      } catch (error) {
        console.error("Failed to sync font theme:", error);
      }
    }
  },

  setUserRole: async (role) => {
    const user = get().user;
    set({ userRole: role });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { role });
      } catch (error) {
        console.error("Failed to sync role:", error);
      }
    }
  },

  setDashboardWidgets: async (widgets) => {
    const user = get().user;
    set({ dashboardWidgets: widgets });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { dashboardWidgets: widgets });
      } catch (error) {
        console.error("Failed to sync dashboard widgets:", error);
      }
    }
  },
}));
