import React from 'react';
import { useDashboardStore } from '@/src/store';
import { cn } from '@/lib/utils';
import { 
  Instagram, 
  Linkedin, 
  Music2, 
  Facebook,
  TrendingUp,
  Users,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { SocialMetric } from '@/src/types';
import { useState, useEffect, FormEvent } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Settings, BarChart2, Unplug } from 'lucide-react';

const socialMetrics: SocialMetric[] = [
  { platform: 'Instagram', engagement: 4.2, followers: 12500, growth: 12 },
  { platform: 'LinkedIn', engagement: 5.8, followers: 8400, growth: 25 },
  { platform: 'TikTok', engagement: 2.1, followers: 15200, growth: -5 },
  { platform: 'Facebook', engagement: 1.5, followers: 22000, growth: 2 },
];

const engagementData = [
  { name: 'Mon', Instagram: 400, LinkedIn: 240, TikTok: 200 },
  { name: 'Tue', Instagram: 300, LinkedIn: 139, TikTok: 221 },
  { name: 'Wed', Instagram: 200, LinkedIn: 980, TikTok: 229 },
  { name: 'Thu', Instagram: 278, LinkedIn: 390, TikTok: 200 },
  { name: 'Fri', Instagram: 189, LinkedIn: 480, TikTok: 218 },
  { name: 'Sat', Instagram: 239, LinkedIn: 380, TikTok: 250 },
  { name: 'Sun', Instagram: 349, LinkedIn: 430, TikTok: 210 },
];

const platformColors = {
  Instagram: '#E4405F',
  LinkedIn: '#0A66C2',
  TikTok: '#00F2EA',
  Facebook: '#1877F2',
};

export function SocialMedia() {
  const { t } = useTranslation();
  const { userRole } = useDashboardStore();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/social/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Social Stats Fetch Error:", error);
      }
    };
    fetchStats();
  }, []);

  const isAdmin = userRole === 'admin';

  const handleConnect = (platform: string) => {
    setConnectingPlatform(platform);
    setIsConnectModalOpen(true);
  };

  const handleConfirmConnect = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: t('connecting_platform', `Connecting to ${connectingPlatform}...`),
        success: t('platform_connected', `${connectingPlatform} connected successfully!`),
        error: t('failed_to_connect', `Failed to connect to ${connectingPlatform}`),
      }
    );
    setIsConnectModalOpen(false);
  };

  const handlePost = (e: FormEvent) => {
    e.preventDefault();
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: t('publishing_to_all'),
        success: t('update_posted'),
        error: t('failed_to_post'),
      }
    );
    setIsPostModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('social_engagement')}</h1>
          <p className="text-muted-foreground">{t('monitor_brand')}</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                <Share2 className="w-4 h-4 mr-2" /> {t('post_update')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t('post_agency_update')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePost} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="post-content">{t('update_content')}</Label>
                  <textarea 
                    id="post-content" 
                    className="w-full rounded-xl bg-white/5 border-none p-3 text-sm min-h-[100px] focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground" 
                    placeholder={t('whats_happening')}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  {['Instagram', 'LinkedIn', 'TikTok', 'Facebook'].map(p => (
                    <Badge key={p} variant="outline" className="rounded-lg border-border text-[10px] font-bold text-muted-foreground">
                      {p}
                    </Badge>
                  ))}
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    <Send className="w-4 h-4 mr-2" /> {t('publish_everywhere')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {socialMetrics.map((metric) => (
          <Card key={metric.platform} className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${platformColors[metric.platform as keyof typeof platformColors]}10` }}>
                    {metric.platform === 'Instagram' && <Instagram className="w-5 h-5" style={{ color: platformColors[metric.platform] }} />}
                    {metric.platform === 'LinkedIn' && <Linkedin className="w-5 h-5" style={{ color: platformColors[metric.platform] }} />}
                    {metric.platform === 'TikTok' && <Music2 className="w-5 h-5" style={{ color: platformColors[metric.platform] }} />}
                    {metric.platform === 'Facebook' && <Facebook className="w-5 h-5" style={{ color: platformColors[metric.platform] }} />}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${metric.growth >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {metric.growth >= 0 ? '+' : ''}{metric.growth}%
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Opening analytics...')}>
                      <BarChart2 className="w-4 h-4" /> {t('view_analytics', 'View Analytics')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Opening settings...')}>
                      <Settings className="w-4 h-4" /> {t('manage_account', 'Manage Account')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => toast.success('Account disconnected')}>
                      <Unplug className="w-4 h-4" /> {t('disconnect', 'Disconnect')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats ? stats[metric.platform.toLowerCase()]?.followers.toLocaleString() : metric.followers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mb-4">{t('total_followers')}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('engagement')}</p>
                  <p className="text-sm font-bold text-foreground">
                    {stats ? stats[metric.platform.toLowerCase()]?.engagement : metric.engagement}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('growth')}</p>
                  <p className="text-sm font-bold text-foreground">{metric.growth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">{t('engagement_trends')}</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-border h-8 text-[10px] font-bold px-3 hover:bg-white/5"
                onClick={() => handleConnect('Meta Business')}
              >
                {t('connect_meta', 'Connect Meta')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-border h-8 text-[10px] font-bold px-3 hover:bg-white/5"
                onClick={() => handleConnect('TikTok Ads')}
              >
                {t('connect_tiktok', 'Connect TikTok')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="Instagram" fill="#E4405F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="LinkedIn" fill="#0A66C2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="TikTok" fill="#00F2EA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              {t('whatsapp_api', 'WhatsApp Marketing')}
              <Badge className="bg-green-500/10 text-green-500 border-none text-[10px]">Cloud API</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-border">
              <p className="text-xs font-bold mb-2 flex items-center gap-2">
                <MessageCircle className="w-3 h-3 text-green-500" />
                {t('api_status', 'API Status')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Connected as: Agency Pro</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold">{t('active_campaigns', 'Active Campaigns')}</h4>
              {[
                { name: 'Welcome Flow', status: 'Active', sent: 1240 },
                { name: 'Retargeting (IT)', status: 'Paused', sent: 850 },
              ].map((campaign, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <span className="text-xs font-medium">{campaign.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{campaign.sent} sent</span>
                    <Badge variant="outline" className={cn("text-[8px] py-0 px-1", campaign.status === 'Active' ? 'text-green-500 border-green-500/20' : 'text-muted-foreground')}>{campaign.status}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white border-none shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              {t('launch_wa_campaign', 'Launch WA Campaign')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('connect_platform_title', `Connect to ${connectingPlatform}`)}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-border flex flex-col items-center gap-4 text-center">
              {connectingPlatform === 'Meta Business' && <Facebook className="w-12 h-12 text-[#1877F2]" />}
              {connectingPlatform === 'TikTok Ads' && <Music2 className="w-12 h-12 text-[#00F2EA]" />}
              <div className="space-y-1">
                <p className="text-sm font-bold">{t('auth_required', 'Authentication Required')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('connect_desc', `Grant Sogni permissions to manage your ${connectingPlatform} assets and insights.`)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="client-id" className="text-[10px] uppercase font-bold text-muted-foreground">Client ID</Label>
                <Input id="client-id" placeholder="********" className="rounded-xl h-10 bg-white/5 border-none text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-secret" className="text-[10px] uppercase font-bold text-muted-foreground">Client Secret</Label>
                <Input id="client-secret" type="password" placeholder="********" className="rounded-xl h-10 bg-white/5 border-none text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmConnect} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">
              {t('authorize_now', 'Authorize & Connect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
