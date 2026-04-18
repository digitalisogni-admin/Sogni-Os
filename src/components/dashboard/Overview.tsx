import { useDashboardStore } from '@/src/store';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Send,
  MoreHorizontal,
  Plus,
  Shield,
  Settings2,
  Layout,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  UserPlus,
  GripVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, RefreshCw, FileText, CheckCircle2, LayoutGrid } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from './SortableWidget';

export function Overview() {
  const { t } = useTranslation();
  const { 
    userRole, 
    user, 
    leads, 
    campaigns, 
    tasks, 
    updateTask, 
    deleteTask, 
    users, 
    projects, 
    events,
    dashboardWidgets,
    setDashboardWidgets
  } = useDashboardStore();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const availableWidgets = [
    { id: 'kpi-revenue', name: t('revenue', 'Revenue KPI'), icon: DollarSign, adminOnly: true },
    { id: 'kpi-daily-avg', name: t('daily_avg', 'Daily Avg KPI'), icon: TrendingUp, adminOnly: true },
    { id: 'kpi-conversion', name: t('conversion', 'Conversion KPI'), icon: Users },
    { id: 'kpi-campaigns', name: t('campaigns', 'Campaigns KPI'), icon: Send },
    { id: 'quick-lead', name: t('quick_lead', 'Quick Lead Capture'), icon: UserPlus },
    { id: 'income-amounts', name: t('income_amounts', 'Income Bar Chart'), icon: BarChart, adminOnly: true },
    { id: 'revenue-chart', name: t('revenue_chart', 'Revenue Area Chart'), icon: AreaChart, adminOnly: true },
    { id: 'top-performance', name: t('top_performance', 'Top Performance'), icon: TrendingUp },
    { id: 'tasks', name: t('tasks', 'Tasks List'), icon: CheckCircle2 },
    { id: 'recent-leads', name: t('recent_leads', 'Recent Leads'), icon: Users },
    { id: 'active-projects', name: t('active_projects', 'Active Projects'), icon: Briefcase },
    { id: 'upcoming-events', name: t('upcoming_events', 'Upcoming Events'), icon: Calendar },
  ];

  const activeWidgets = availableWidgets.filter(w => 
    dashboardWidgets.includes(w.id) && (!w.adminOnly || isAdmin)
  );

  const isWidgetActive = (id: string) => dashboardWidgets.includes(id);

  const toggleWidget = (id: string) => {
    if (isWidgetActive(id)) {
      setDashboardWidgets(dashboardWidgets.filter(w => w !== id));
    } else {
      setDashboardWidgets([...dashboardWidgets, id]);
    }
  };

  // Calculate real-time stats
  const wonLeads = leads.filter(l => l.status === 'Closed');
  const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const dailyAverage = totalRevenue > 0 ? totalRevenue / 30 : 0; // Rough estimate
  const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;
  const sentCampaigns = campaigns.filter(c => c.status === 'Sent').length;

  // Calculate top performers dynamically
  const performers = users
    .filter(u => u.role === 'affiliate')
    .map(u => {
      const userLeads = leads.filter(l => l.uid === u.id);
      const userWonLeads = userLeads.filter(l => l.status === 'Closed');
      const userRevenue = userWonLeads.reduce((sum, l) => sum + (l.value || 0), 0);
      const userTasks = tasks.filter(t => t.assignee.name === (u.displayName || u.fullName || u.email) && t.status === 'Done').length;
      
      return {
        id: u.id,
        name: u.displayName || u.fullName || u.email,
        leads: userLeads.length,
        deals: userWonLeads.length,
        tasks: userTasks,
        rate: userLeads.length > 0 ? Math.round((userWonLeads.length / userLeads.length) * 100) : 0,
        amount: `€${userRevenue.toLocaleString()}`,
        avatar: u.photoURL || `https://picsum.photos/seed/${u.id}/100/100`
      };
    })
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 4);

  const displayPerformers = performers;

  // Calculate revenue data for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dynamicRevenueData = last7Days.map(date => {
    const dayRevenue = wonLeads
      .filter(l => l.lastContacted === date)
      .reduce((sum, l) => sum + (l.value || 0), 0);
    return {
      name: date.split('-').slice(1).join('/'),
      value: dayRevenue
    };
  });

  const dynamicIncomeData = [
    { name: 'Week 1', lastMonth: 12400, lastWeek: 4500 },
    { name: 'Week 2', lastMonth: 15600, lastWeek: 5200 },
    { name: 'Week 3', lastMonth: 11200, lastWeek: 6100 },
    { name: 'Week 4', lastMonth: 18900, lastWeek: 4800 },
  ];

  const handleTaskToggle = (id: string, completed: boolean) => {
    updateTask(id, { status: completed ? 'Done' : 'Todo' });
    toast.success(completed ? 'Task completed' : 'Task uncompleted');
  };

  const handleClearCompletedTasks = () => {
    tasks.filter(t => t.status === 'Done').forEach(t => deleteTask(t.id));
    toast.success('Cleared completed tasks');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dashboardWidgets.indexOf(active.id as string);
      const newIndex = dashboardWidgets.indexOf(over.id as string);

      const newOrder = arrayMove(dashboardWidgets, oldIndex, newIndex);
      setDashboardWidgets(newOrder);
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'kpi-revenue':
        return isAdmin && (
          <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold">€{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t('won_from_deals', { count: wonLeads.length })}</p>
              <div className="space-y-2">
                <Progress value={conversionRate} className="h-1 bg-white/5" indicatorClassName="bg-primary" />
                <div className="flex justify-end">
                  <span className="text-[10px] font-semibold">{conversionRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'kpi-daily-avg':
        return isAdmin && (
          <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold">€{dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t('daily_average_income', 'Daily Avg Income')}</p>
              <div className="space-y-2">
                <Progress value={dailyAverage > 0 ? 100 : 0} className="h-1 bg-white/5" indicatorClassName="bg-destructive" />
                <div className="flex justify-end">
                  <span className="text-[10px] font-semibold">{dailyAverage > 0 ? '100' : '0'}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'kpi-conversion':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold">{conversionRate.toFixed(2)}%</p>
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t('lead_conversion', 'Lead Conversion')}</p>
              <div className="space-y-2">
                <Progress value={conversionRate} className="h-1 bg-white/5" indicatorClassName="bg-blue-500" />
                <div className="flex justify-end">
                  <span className="text-[10px] font-semibold">{conversionRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'kpi-campaigns':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold">{sentCampaigns}</p>
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t('campaign_sent', 'Campaigns Sent')}</p>
              <div className="space-y-2">
                <Progress value={campaigns.length > 0 ? (sentCampaigns / campaigns.length) * 100 : 0} className="h-1 bg-white/5" indicatorClassName="bg-purple-500" />
                <div className="flex justify-end">
                  <span className="text-[10px] font-semibold">{campaigns.length > 0 ? ((sentCampaigns / campaigns.length) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'quick-lead':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                {t('quick_lead_capture', 'Quick Lead Capture')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-xs text-muted-foreground mb-4">{t('instantly_capture_leads', 'Instantly capture and route new leads.')}</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const leadData: any = {
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  website: formData.get('website'),
                  businessType: formData.get('businessType'),
                  message: formData.get('message'),
                  status: 'New',
                  source: 'Manual',
                  avatar: `https://picsum.photos/seed/${Math.random()}/100/100`,
                  lastContacted: new Date().toISOString().split('T')[0]
                };
                useDashboardStore.getState().addLead(leadData);
                toast.success(t('contact_added_successfully', 'Lead captured successfully!'));
                (e.target as HTMLFormElement).reset();
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('full_name')}</Label>
                    <Input id="quick-name" name="name" placeholder="John Doe" className="bg-white/5 border-border/50 rounded-xl h-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('email_address')}</Label>
                    <Input id="quick-email" name="email" type="email" placeholder="john@example.com" className="bg-white/5 border-border/50 rounded-xl h-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-phone" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('phone_number')}</Label>
                    <Input id="quick-phone" name="phone" placeholder="+39..." className="bg-white/5 border-border/50 rounded-xl h-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-website" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('website_url')}</Label>
                    <Input id="quick-website" name="website" placeholder="https://..." className="bg-white/5 border-border/50 rounded-xl h-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quick-business" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('business_type')}</Label>
                  <Select name="businessType">
                    <SelectTrigger className="bg-white/5 border-border/50 rounded-xl h-10 text-xs">
                      <SelectValue placeholder={t('business_select_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="local">{t('business_local')}</SelectItem>
                      <SelectItem value="professional">{t('business_professional')}</SelectItem>
                      <SelectItem value="agency">{t('business_agency')}</SelectItem>
                      <SelectItem value="ecommerce">{t('business_ecommerce')}</SelectItem>
                      <SelectItem value="other">{t('business_other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quick-message" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{t('message_label')}</Label>
                  <textarea 
                    id="quick-message" 
                    name="message" 
                    className="w-full min-h-[80px] rounded-xl bg-white/5 border border-border/50 p-3 text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder={t('type_message')}
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all active:scale-95">
                  {t('capture_lead', 'INVIA RICHIESTA')}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'income-amounts':
        return isAdmin && (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('income_amounts', 'Income Amounts')}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Exporting CSV...')}>
                    <Download className="w-4 h-4" /> {t('export_csv', 'Export CSV')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Refreshing data...')}>
                    <RefreshCw className="w-4 h-4" /> {t('refresh_data', 'Refresh Data')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicIncomeData}>
                    <Bar dataKey="lastMonth" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lastWeek" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('total_won', 'Total Won')}</p>
                  <p className="text-sm font-bold flex items-center justify-center gap-1 text-foreground">
                    <TrendingUp className="w-3 h-3 text-primary" /> {wonLeads.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('avg_value', 'Avg Value')}</p>
                  <p className="text-sm font-bold flex items-center justify-center gap-1 text-foreground">
                    <TrendingUp className="w-3 h-3 text-secondary" /> €{leads.length > 0 ? Math.round(totalRevenue / leads.length).toLocaleString() : 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('total_leads', 'Total Leads')}</p>
                  <p className="text-sm font-bold flex items-center justify-center gap-1 text-foreground">
                    <TrendingUp className="w-3 h-3 text-primary" /> {leads.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'revenue-chart':
        return isAdmin && (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('revenue', 'Revenue')}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Exporting CSV...')}>
                    <Download className="w-4 h-4" /> {t('export_csv', 'Export CSV')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Refreshing data...')}>
                    <RefreshCw className="w-4 h-4" /> {t('refresh_data', 'Refresh Data')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mb-6">{t('won_from_deals', { count: wonLeads.length })}</p>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicRevenueData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      case 'top-performance':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('top_performance', 'Top Performance')}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Opening full report...')}>
                    <FileText className="w-4 h-4" /> {t('view_full_report', 'View Full Report')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Exporting CSV...')}>
                    <Download className="w-4 h-4" /> {t('export_csv', 'Export CSV')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-6">Last 2 Weeks</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-muted-foreground uppercase font-bold border-b border-border">
                      <th className="text-left pb-4 font-bold">No</th>
                      <th className="text-left pb-4 font-bold">Ref</th>
                      <th className="text-right pb-4 font-bold">{t('leads', 'Leads')}</th>
                      <th className="text-right pb-4 font-bold">Deals</th>
                      <th className="text-right pb-4 font-bold">{t('tasks', 'Tasks')}</th>
                      <th className="text-right pb-4 font-bold">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayPerformers.length > 0 ? displayPerformers.map((person, i) => (
                      <tr key={person.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 text-sm font-medium text-foreground">{i + 1}.</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarImage src={person.avatar} />
                              <AvatarFallback>{person.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-foreground">{person.name}</p>
                              {isAdmin && <p className="text-[10px] text-muted-foreground">{person.amount}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right text-sm font-medium text-foreground">{person.leads}</td>
                        <td className="py-4 text-right text-sm font-medium text-foreground">{person.deals}</td>
                        <td className="py-4 text-right text-sm font-medium text-foreground">{person.tasks} Done</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                            <span className="text-sm font-bold text-foreground">{person.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          {t('no_performance_data', 'No performance data available yet')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      case 'tasks':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('tasks', 'Tasks')}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Opening all tasks...')}>
                    <FileText className="w-4 h-4" /> {t('view_all_tasks', 'View All Tasks')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleClearCompletedTasks}>
                    <CheckCircle2 className="w-4 h-4" /> {t('clear_completed', 'Clear Completed')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-6">{t('tasks_remaining', { remaining: tasks.filter(t => t.status !== 'Done').length, total: tasks.length })}</p>
              <div className="space-y-4 max-h-[200px] overflow-y-auto no-scrollbar">
                {tasks.length > 0 ? tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTaskToggle(task.id, task.status !== 'Done')}
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                          task.status === 'Done' ? "bg-primary border-primary" : "border-border hover:border-primary"
                        )}
                      >
                        {task.status === 'Done' && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                      </button>
                      <span className={cn("text-sm font-medium", task.status === 'Done' ? "text-muted-foreground line-through" : "text-foreground")}>
                        {task.title}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteTask(task.id)}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_tasks', 'No tasks')}</p>
                )}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('taskTitle') as HTMLInputElement;
                if (input.value.trim()) {
                  useDashboardStore.getState().addTask({
                    title: input.value.trim(),
                    description: '',
                    status: 'Todo',
                    priority: 'Medium',
                    assignee: { name: user?.displayName || 'User', avatar: user?.photoURL || '' },
                    dueDate: new Date().toISOString(),
                    progress: 0
                  });
                  form.reset();
                }
              }} className="mt-8 flex gap-2">
                <Input name="taskTitle" placeholder={t('add_new_todo', 'Add new todo')} className="bg-white/5 border-none rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary" required />
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-10 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">{t('add', 'Add')}</Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'recent-leads':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('recent_leads', 'Recent Leads')}</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={lead.avatar} />
                        <AvatarFallback>{lead.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-foreground">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.company}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      lead.status === 'Closed' ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                    )}>
                      {lead.status}
                    </span>
                  </div>
                ))}
                {leads.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_leads', 'No leads yet')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'active-projects':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('active_projects', 'Active Projects')}</CardTitle>
              <Briefcase className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.filter(p => p.status === 'Active').slice(0, 5).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{project.name}</p>
                      <span className="text-[10px] font-bold text-primary">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1 bg-white/5" indicatorClassName="bg-primary" />
                  </div>
                ))}
                {projects.filter(p => p.status === 'Active').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_active_projects', 'No active projects')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'upcoming-events':
        return (
          <Card className="bg-card border-border shadow-2xl rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{t('upcoming_events', 'Upcoming Events')}</CardTitle>
              <Calendar className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-primary uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-foreground">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground">{event.time || 'All day'}</p>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_events', 'No upcoming events')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('hi')} {user?.displayName || 'there'}</h1>
          <p className="text-muted-foreground">{t('welcome_back')}</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-border hover:bg-white/5">
                <Settings2 className="w-4 h-4 mr-2" /> {t('customize', 'Customize')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('customize_dashboard', 'Customize Dashboard')}</DialogTitle>
                <DialogDescription>
                  {t('customize_description', 'Choose which widgets you want to see on your dashboard.')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {availableWidgets.filter(w => !w.adminOnly || isAdmin).map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <widget.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{widget.name}</span>
                    </div>
                    <Switch 
                      checked={isWidgetActive(widget.id)} 
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-xl border-border hover:bg-white/5">
            {t('download')}
          </Button>
          <Button variant="outline" className="lg:hidden">
             <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-fr">
          <SortableContext 
            items={dashboardWidgets}
            strategy={rectSortingStrategy}
          >
            {dashboardWidgets.map((id) => {
              const widget = availableWidgets.find(w => w.id === id);
              if (!widget || (widget.adminOnly && !isAdmin)) return null;
              
              const isKpi = id.startsWith('kpi-');
              const gridCols = isKpi ? 'lg:col-span-3' : (id === 'top-performance' ? 'lg:col-span-8' : 'lg:col-span-4');

              return (
                <SortableWidget key={id} id={id} className={gridCols}>
                  {renderWidget(id)}
                </SortableWidget>
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
