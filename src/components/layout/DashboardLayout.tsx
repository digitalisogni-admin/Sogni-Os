import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Package, 
  Share2, 
  Kanban as KanbanIcon,
  Calendar,
  FileText,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  Mail,
  Moon,
  Sun,
  Shield,
  UserCircle,
  UserPlus,
  Lock,
  Camera,
  Languages,
  Vault,
  ShieldCheck,
  Inbox,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { ReactNode, useState, useRef, useEffect, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { useDashboardStore } from '@/src/store';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'affiliate'] },
  { id: 'crm', label: 'crm', icon: Users, roles: ['superadmin', 'admin', 'affiliate'] },
  { id: 'kanban', label: 'lead_pipeline', icon: KanbanIcon, roles: ['superadmin', 'admin', 'affiliate'] },
  { id: 'intelligence', label: 'sd_intelligence', icon: Sparkles, roles: ['superadmin', 'admin', 'affiliate'] },
  { 
    id: 'projects_group', 
    label: 'projects', 
    icon: Briefcase, 
    roles: ['superadmin', 'admin'],
    subItems: [
      { id: 'projects', label: 'projects', icon: Briefcase },
      { id: 'passwords', label: 'password_vault', icon: Vault },
    ]
  },
  { id: 'inventory', label: 'inventory', icon: Package, roles: ['superadmin', 'admin', 'affiliate'] },
  { 
    id: 'communication', 
    label: 'communication', 
    icon: MessageSquare, 
    roles: ['superadmin', 'admin'],
    subItems: [
      { id: 'inbox', label: 'inbox', icon: Inbox },
      { id: 'whatsapp', label: 'whatsapp', icon: MessageCircle },
      { id: 'social', label: 'social', icon: Share2 },
      { id: 'marketing', label: 'email_marketing', icon: Mail },
    ]
  },
  { id: 'reporting', label: 'reporting', icon: BarChart3, roles: ['superadmin', 'admin'] },
  { 
    id: 'affiliates_group', 
    label: 'affiliates', 
    icon: UserPlus, 
    roles: ['superadmin', 'admin'],
    subItems: [
      { id: 'affiliates', label: 'affiliates', icon: UserPlus },
      { id: 'chat', label: 'admin_chat', icon: MessageSquare },
    ]
  },
  { id: 'calendar', label: 'calendar', icon: Calendar, roles: ['superadmin', 'admin', 'affiliate'] },
  { id: 'documents', label: 'documents', icon: FileText, roles: ['superadmin', 'admin', 'affiliate'] },
  { id: 'settings', label: 'settings', icon: Settings, roles: ['superadmin', 'admin'] },
];

export function DashboardLayout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, userRole, setUserRole, user, logout, notifications, markNotificationRead, isGlassMode } = useDashboardStore();

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const isGroupActive = (item: any) => {
    if (!item.subItems) return activeTab === item.id;
    return item.subItems.some((sub: any) => sub.id === activeTab);
  };

  useEffect(() => {
    // Auto-expand active group
    const activeGroup = navItems.find(item => 
      item.subItems?.some(sub => sub.id === activeTab)
    );
    if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
      setExpandedGroups(prev => [...prev, activeGroup.id]);
    }
  }, [activeTab]);

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  const prevNotificationsRef = useRef<number>(notifications.length);

  useEffect(() => {
    if (notifications.length > prevNotificationsRef.current) {
      const newNotification = notifications[0]; // Since it's sorted by date desc
      if (newNotification && !newNotification.read && newNotification.type === 'lead') {
        toast.success(newNotification.title, {
          description: newNotification.message,
          duration: 5000,
        });
      }
    }
    prevNotificationsRef.current = notifications.length;
  }, [notifications.length, notifications]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const displayName = formData.get('displayName') as string;
    const photoURL = formData.get('photoURL') as string;

    try {
      useDashboardStore.setState({
        user: {
          ...user,
          displayName,
          photoURL
        }
      });
      toast.success(t('profile_updated'));
      setIsProfileModalOpen(false);
    } catch (error) {
      toast.error(t('failed_to_update_profile'));
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(t('language_changed', { lng: lng.toUpperCase() }));
  };

  return (
    <div className={cn(
      "flex h-screen bg-background text-foreground selection:bg-primary/30 transition-all duration-500",
      isGlassMode && "glass-mode"
    )}>
      {/* Animated Liquid Background Background */}
      <div className="liquid-bg">
        <div className="liquid-blob top-[10%] left-[10%]" />
        <div className="liquid-blob bottom-[10%] right-[10%] [animation-delay:5s] opacity-10" />
      </div>
      <div 
        className="fixed left-0 top-0 bottom-0 w-4 z-50"
        onMouseEnter={() => setIsSidebarExpanded(true)}
      />

      {/* Sidebar */}
      <motion.aside 
        ref={sidebarRef}
        initial={false}
        animate={{ width: isSidebarExpanded ? 280 : 80 }}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className="relative z-40 bg-card border-r border-border flex flex-col overflow-hidden shadow-[20px_0_50_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 flex items-center gap-4 h-20 shrink-0">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,255,255,0.1)] overflow-hidden">
            <ShieldCheck className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-black text-xl tracking-[0.2em] whitespace-nowrap shimmer-text font-heading">
                  NEXUS CRM
                </span>
                <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-muted-foreground/60 -mt-1 ml-0.5">
                  Intelligence v1
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = isGroupActive(item);
            const isExpanded = expandedGroups.includes(item.id);

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (item.subItems) {
                      toggleGroup(item.id);
                      if (!isSidebarExpanded) setIsSidebarExpanded(true);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group relative",
                    isActive && !item.subItems
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.2)]" 
                      : isActive 
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-6 h-6 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <AnimatePresence>
                    {isSidebarExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 flex items-center justify-between"
                      >
                        <span className="whitespace-nowrap">{t(item.label)}</span>
                        {item.subItems && (
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isActive && !item.subItems && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full"
                    />
                  )}
                </button>

                {/* Sub Items */}
                <AnimatePresence>
                  {isExpanded && isSidebarExpanded && item.subItems && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-10 space-y-1"
                    >
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                            activeTab === sub.id
                              ? "text-primary bg-primary/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <sub.icon className="w-4 h-4" />
                          {t(sub.label)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <div className={cn(
            "bg-white/5 rounded-2xl p-4 transition-all duration-300",
            !isSidebarExpanded && "p-2 flex justify-center"
          )}>
            {isSidebarExpanded ? (
              <>
                <p className="text-xs font-semibold text-foreground mb-1">Cyber-Luxury v2.0</p>
                <p className="text-[10px] text-muted-foreground">Premium Agency Dashboard</p>
              </>
            ) : (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="h-20 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 shrink-0 z-30">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t('search_anything')} 
              className="pl-12 bg-white/5 border-none rounded-2xl h-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 text-muted-foreground hover:text-foreground transition-all bg-white/5 rounded-2xl hover:bg-white/10 flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">{i18n.language}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-card border-border text-foreground rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem onClick={() => changeLanguage('en')} className="px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3">
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('it')} className="px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3">
                  Italiano
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('fr')} className="px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3">
                  Français
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button 
              onClick={toggleTheme}
              className="p-3 text-muted-foreground hover:text-foreground transition-all bg-white/5 rounded-2xl hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-3 text-muted-foreground hover:text-foreground transition-all bg-white/5 rounded-2xl hover:bg-white/10 group">
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-destructive border-2 border-card rounded-full group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-card border-border text-foreground rounded-2xl p-2 shadow-2xl">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-4 py-3 text-sm font-bold">{t('notifications')}</DropdownMenuLabel>
                  <div className="max-h-80 overflow-y-auto py-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={cn(
                            "px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer",
                            !notification.read && "bg-primary/5"
                          )}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              notification.type === 'lead' ? "bg-primary/20" : "bg-muted"
                            )}>
                              {notification.type === 'lead' ? <Users className="w-5 h-5 text-primary" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-2">
                                {notification.createdAt?.seconds ? new Date(notification.createdAt.seconds * 1000).toLocaleString() : t('just_now')}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">{t('no_notifications')}</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-4 pl-6 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">{t(userRole)}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                    <Avatar className="w-12 h-12 border-2 border-border shadow-lg">
                      <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/katie/100/100"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border text-foreground rounded-2xl p-2 shadow-2xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-4 py-3 text-sm font-bold">{t('my_account')}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)} className="px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3">
                      <User className="w-4 h-4" /> {t('edit_profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')} className="px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3">
                      <Settings className="w-4 h-4" /> {t('settings')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-4 py-2 text-[10px] uppercase text-muted-foreground font-bold">{t('switch_role')}</DropdownMenuLabel>
                    {(user?.email === 'admin@mockagency.com') && (
                      <DropdownMenuItem 
                        onClick={() => setUserRole('superadmin')}
                        className={cn("px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3", userRole === 'superadmin' && "text-primary")}
                      >
                        <ShieldCheck className="w-4 h-4" /> {t('superadmin_view')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setUserRole('admin')}
                      className={cn("px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3", userRole === 'admin' && "text-primary")}
                    >
                      <Shield className="w-4 h-4" /> {t('admin_view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setUserRole('affiliate')}
                      className={cn("px-4 py-3 focus:bg-white/5 rounded-xl cursor-pointer gap-3", userRole === 'affiliate' && "text-primary")}
                    >
                      <UserCircle className="w-4 h-4" /> {t('affiliate_view')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="px-4 py-3 focus:bg-red-500/10 text-red-500 rounded-xl cursor-pointer gap-3"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_profile')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-border shadow-2xl">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="text-2xl">{user?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('click_to_change_avatar')}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('full_name')}</Label>
                <Input id="displayName" name="displayName" defaultValue={user?.displayName || ""} required className="rounded-xl bg-white/5 border-none h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photoURL">{t('avatar_url')}</Label>
                <Input id="photoURL" name="photoURL" defaultValue={user?.photoURL || ""} placeholder="https://..." className="rounded-xl bg-white/5 border-none h-11" />
              </div>
              <div className="space-y-2">
                <Label>{t('email_address')}</Label>
                <Input value={user?.email || ""} disabled className="rounded-xl bg-white/5 border-none h-11 opacity-50" />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">{t('save_changes')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
