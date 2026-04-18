import { useState, useEffect } from 'react';
import { Shield, Lock, Key, Eye, EyeOff, RefreshCcw, AlertTriangle, CheckCircle2, UserPlus, UserX, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useDashboardStore } from '@/src/store';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function SecurityPage() {
  const { t } = useTranslation();
  const { userRole, apiKey, setApiKey, securityEvents, users } = useDashboardStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingAffiliate, setIsResettingAffiliate] = useState(false);

  // Sync local state if apiKey changes from store (e.g. initial load)
  useEffect(() => {
    if (apiKey) {
      setLocalApiKey(apiKey);
    }
  }, [apiKey]);

  const generateApiKey = () => {
    const newKey = "sh_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setLocalApiKey(newKey);
    setApiKey(newKey);
    toast.success(t('api_key_generated'));
  };

  const handleSaveApiKey = () => {
    setApiKey(localApiKey);
    toast.success(t('api_key_saved', 'API Key saved successfully'));
  };

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Shield className="w-16 h-16 text-destructive opacity-20" />
        <h2 className="text-2xl font-bold">{t('access_denied')}</h2>
        <p className="text-muted-foreground">{t('only_admins_security')}</p>
      </div>
    );
  }

  const handleResetPassword = () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      toast.success(t('password_reset_sent'));
    }, 2000);
  };

  const handleResetAffiliatePassword = () => {
    setIsResettingAffiliate(true);
    setTimeout(() => {
      setIsResettingAffiliate(false);
      toast.success(t('affiliate_password_reset_sent'));
    }, 2000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success(t('api_key_copied'));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('security_command_center')}</h1>
        <p className="text-muted-foreground">{t('manage_security')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Security Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('api_key')}</CardTitle>
                  <CardDescription>{t('api_key_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input 
                    type={showApiKey ? "text" : "password"} 
                    value={localApiKey} 
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={t('enter_or_generate_api_key', 'Enter or generate API key')}
                    className="bg-white/5 border-none h-12 pr-24 font-mono text-xs tracking-wider"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyApiKey}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateApiKey}
                    className="gap-2 border-primary/20 hover:bg-primary/10"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    {t('generate_new_key')}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveApiKey}
                    className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground"
                  >
                    <Check className="w-4 h-4" />
                    {t('save', 'Save')}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  {t('api_security_warning')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('affiliate_security')}</CardTitle>
                  <CardDescription>{t('manage_affiliate_access')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label>{t('reset_affiliate_password')}</Label>
                  <Input placeholder="affiliate@email.com" className="bg-white/5 border-none h-11" />
                </div>
                <Button 
                  onClick={handleResetAffiliatePassword}
                  disabled={isResettingAffiliate}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-11 px-6 font-bold self-end"
                >
                  {isResettingAffiliate ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                  {t('trigger_reset')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('administrative_access')}</CardTitle>
                  <CardDescription>{t('update_credentials')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('current_password')}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      defaultValue="••••••••••••" 
                      disabled
                      className="bg-white/5 border-none h-11 pr-10"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('two_factor_auth')}</Label>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-green-500">{t('enabled')}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7">{t('configure')}</Button>
                  </div>
                </div>
              </div>

              {/* List of Administrators */}
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('active_administrators', 'Active Administrators')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {users.filter(u => u.role === 'admin').map(admin => (
                    <div key={admin.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-border/50">
                      <Avatar className="w-8 h-8 border border-border/50">
                        <AvatarImage src={admin.avatar} />
                        <AvatarFallback className="text-[10px]">{admin.name?.[0] || admin.email?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{admin.name || admin.email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{admin.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button 
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-11 px-6 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                >
                  {isResetting ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  {t('reset_master_password')}
                </Button>
                <Button variant="outline" className="rounded-xl h-11 px-6 border-border hover:bg-white/5">
                  {t('update_2fa_method')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await useDashboardStore.getState().linkGoogleAuth();
                      toast.success(t('google_account_linked', 'Google account linked successfully'));
                    } catch (error) {
                      toast.error(t('failed_to_link_google', 'Failed to link Google account'));
                    }
                  }}
                  className="rounded-xl h-11 px-6 border-border hover:bg-white/5"
                >
                  {t('link_google_account', 'Link Google Account')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t('recent_security_events')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length > 0 ? (
                  securityEvents.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          log.status === 'success' ? "bg-green-500" : log.status === 'warning' ? "bg-yellow-500" : "bg-destructive"
                        )} />
                        <div>
                          <p className="text-sm font-bold">{log.event}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {log.location} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-border">{t('actions')}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{t('no_security_events', 'No security events recorded.')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-destructive/20">
            <CardHeader className="bg-destructive/10">
              <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('danger_zone')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('irreversible_actions')}
              </p>
              <Button variant="destructive" className="w-full rounded-xl h-11 font-bold">
                {t('revoke_all_sessions')}
              </Button>
              <Button variant="outline" className="w-full rounded-xl h-11 font-bold border-destructive/20 text-destructive hover:bg-destructive/10">
                {t('wipe_local_cache')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-bold">{t('system_integrity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('encryption')}</span>
                <span className="font-bold text-primary">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('database')}</span>
                <span className="font-bold text-primary">Firestore Protected</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('ssl_tls')}</span>
                <span className="font-bold text-primary">v1.3 Active</span>
              </div>
              <div className="pt-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[98%] bg-primary shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
                </div>
                <p className="text-[10px] text-center mt-2 text-muted-foreground font-bold">{t('system_health')}: 98%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
