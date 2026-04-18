import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Users,
  Target,
  Shield,
  Clock,
  MessageSquare,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { toast } from 'sonner';
import { useDashboardStore } from '@/src/store';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const demographicData = [
  { name: '18-24', value: 15, color: '#00FFFF' },
  { name: '25-34', value: 45, color: '#008080' },
  { name: '35-44', value: 25, color: '#A855F7' },
  { name: '45+', value: 15, color: '#EF4444' },
];

const growthData = [
  { month: 'Jan', leads: 400, deals: 240 },
  { month: 'Feb', leads: 300, deals: 139 },
  { month: 'Mar', leads: 200, deals: 980 },
  { month: 'Apr', leads: 278, deals: 390 },
  { month: 'May', leads: 189, deals: 480 },
  { month: 'Jun', leads: 239, deals: 380 },
];

export function Reporting() {
  const { t } = useTranslation();
  const { userRole, leads, projects, targetRevenue, setTargetRevenue } = useDashboardStore();
  const isAdmin = userRole === 'admin';
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(targetRevenue.toString());
  const [timeRange, setTimeRange] = useState('6m');
  const [filterSegment, setFilterSegment] = useState('all');

  // Filter leads based on segment
  const filteredLeads = leads.filter(l => {
    if (filterSegment === 'all') return true;
    if (filterSegment === 'ads') return l.source === 'Meta' || l.source === 'TikTok';
    if (filterSegment === 'email') return l.source === 'Email';
    if (filterSegment === 'manual') return l.source === 'Manual' || !l.source;
    return true;
  });

  // Calculate real-time stats
  const wonLeads = filteredLeads.filter(l => l.status === 'Closed');
  const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const revenuePercentage = Math.min((totalRevenue / targetRevenue) * 100, 100);
  const revenueLeft = Math.max(targetRevenue - totalRevenue, 0);

  // ROI / CPA Mock Logic (Enhanced with Source Info)
  const calculateROI = () => {
    const metaLeads = filteredLeads.filter(l => l.source === 'Meta');
    const tiktokLeads = filteredLeads.filter(l => l.source === 'TikTok');
    const adSpend = (metaLeads.length + tiktokLeads.length) * 15; // Mock €15/lead cost
    const adRevenue = wonLeads.filter(l => l.source === 'Meta' || l.source === 'TikTok').reduce((sum, l) => sum + (l.value || 0), 0);
    const roi = adSpend > 0 ? ((adRevenue - adSpend) / adSpend) * 100 : 0;
    return { adSpend, adRevenue, roi };
  };

  const { adSpend, adRevenue, roi } = calculateROI();

  // New Customers this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newCustomersThisMonth = filteredLeads.filter(l => {
    const createdDate = l.lastContacted ? new Date(l.lastContacted) : new Date(); // Fallback if no createdAt
    return createdDate >= firstDayOfMonth && l.status === 'Closed';
  }).length;

  // Conversion Funnel Data
  const funnelData = [
    { name: 'Total Leads', value: filteredLeads.length, fill: '#00FFFF' },
    { name: 'Qualified', value: filteredLeads.filter(l => l.status !== 'New').length, fill: '#008080' },
    { name: 'Proposal', value: filteredLeads.filter(l => l.status === 'Negotiation').length, fill: '#A855F7' },
    { name: 'Closed', value: wonLeads.length, fill: '#10B981' },
  ];

  // Calculate growth data dynamically
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(currentMonth - 5 + i);
    return {
      month: months[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      leads: 0,
      deals: 0
    };
  });

  filteredLeads.forEach(lead => {
    const date = lead.lastContacted ? new Date(lead.lastContacted) : new Date();
    const monthData = last6Months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear());
    if (monthData) {
      monthData.leads++;
      if (lead.status === 'Closed') {
        monthData.deals++;
      }
    }
  });

  const dynamicGrowthData = last6Months.some(m => m.leads > 0) ? last6Months : growthData;

  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: t('generating_pdf'),
        success: t('report_exported'),
        error: t('failed_to_generate'),
      }
    );
  };

  const handleUpdateGoal = async () => {
    const amount = parseFloat(newGoal);
    if (isNaN(amount)) return;
    await setTargetRevenue(amount);
    setIsGoalModalOpen(false);
    toast.success(t('goal_updated', 'Monthly goal updated successfully'));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('robust_reporting')}</h1>
          <p className="text-muted-foreground">{t('deep_dive')}</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-border rounded-xl h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">{t('last_30_days')}</SelectItem>
              <SelectItem value="6m">{t('last_6_months')}</SelectItem>
              <SelectItem value="1y">{t('last_year')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSegment} onValueChange={setFilterSegment}>
            <SelectTrigger className="w-40 bg-white/5 border-border rounded-xl h-10 text-xs">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_segments', 'All Segments')}</SelectItem>
              <SelectItem value="ads">{t('paid_ads', 'Paid Ads (Meta/TK)')}</SelectItem>
              <SelectItem value="email">{t('email_marketing', 'Email Marketing')}</SelectItem>
              <SelectItem value="manual">{t('manual_leads', 'Manual')}</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={handleExport} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              <Download className="w-4 h-4 mr-2" /> {t('export_pdf')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t('conversion_funnel', 'Conversion Funnel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={80} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {funnelData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">{t('roi_metrics', 'ROI & Marketing Efficiency')}</CardTitle>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Ad Spend (Est)</p>
                <p className="text-sm font-bold">€{adSpend.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">ROI</p>
                <p className={cn("text-sm font-bold", roi >= 0 ? "text-green-500" : "text-destructive")}>{roi.toFixed(1)}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="leads" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deals" fill="rgba(0, 255, 255, 0.4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin ? (
          <Card 
            className="bg-primary border-none shadow-2xl rounded-2xl text-primary-foreground cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setIsGoalModalOpen(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none">{t('monthly_goal')}</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">€{targetRevenue.toLocaleString()}</p>
              <p className="text-xs text-white/70 mb-6">{t('current_revenue', { amount: `€${totalRevenue.toLocaleString()}` })}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>{revenuePercentage.toFixed(1)}% {t('achieved')}</span>
                  <span>€{revenueLeft.toLocaleString()} {t('left')}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${revenuePercentage}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-2xl rounded-2xl flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
              <p className="text-xs text-muted-foreground font-medium">{t('financial_goals_restricted')}</p>
            </div>
          </Card>
        )}

        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-none">{t('active_now')}</Badge>
            </div>
            <p className="text-3xl font-bold mb-1 text-foreground">{newCustomersThisMonth}</p>
            <p className="text-xs text-muted-foreground mb-6">{t('new_customers_month')}</p>
            <div className="flex items-center gap-2 text-green-500">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm font-bold">18.2%</span>
              <span className="text-xs text-muted-foreground">{t('vs_last_month')}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-card border-border shadow-2xl rounded-2xl cursor-pointer hover:border-primary/20 transition-colors"
          onClick={() => setIsResponseModalOpen(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-destructive/10 text-destructive border-none">High</Badge>
            </div>
            <p className="text-3xl font-bold mb-1 text-foreground">4.8s</p>
            <p className="text-xs text-muted-foreground mb-6">{t('avg_response_time')}</p>
            <div className="flex items-center gap-2 text-destructive">
              <ArrowUpRight className="w-4 h-4 rotate-90" />
              <span className="text-sm font-bold">2.4%</span>
              <span className="text-xs text-muted-foreground">{t('vs_last_month')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_monthly_goal', 'Edit Monthly Goal')}</DialogTitle>
            <DialogDescription>{t('set_revenue_target', 'Set your revenue target for this month.')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">{t('revenue_goal', 'Revenue Goal (€)')}</Label>
              <Input 
                id="goal" 
                type="number" 
                value={newGoal} 
                onChange={(e) => setNewGoal(e.target.value)}
                className="bg-white/5 border-none h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateGoal} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">
              {t('update_goal', 'Update Goal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Time Modal */}
      <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t('response_time_analysis', 'Response Time Analysis')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">{t('avg_first_response', 'Avg. First Response')}</p>
                <p className="text-xl font-bold">2.4s</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">{t('resolution_time', 'Resolution Time')}</p>
                <p className="text-xl font-bold">14.2m</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                {t('performance_insights', 'Performance Insights')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-border">
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">{t('improving_trend', 'Improving Trend')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('response_time_decreased', 'Response time decreased by 12% compared to last week.')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-border">
                  <MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">{t('peak_hours', 'Peak Hours')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('peak_hours_desc', 'Highest volume between 14:00 and 16:00 CET.')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t('sla_compliance', 'SLA Compliance')}</span>
                <span className="font-bold text-primary">98.4%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[98.4%]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsResponseModalOpen(false)} variant="outline" className="rounded-xl w-full h-11 font-bold border-border">
              {t('close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
