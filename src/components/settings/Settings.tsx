import { useDashboardStore } from '@/src/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Zap, ChevronRight, Layout, Mail, MousePointerClick, Copy, Check, ExternalLink, Trash2, Lock, Fingerprint, Shield, Webhook, Save, User, Bell, Globe, MessageCircle, Sparkles, Cookie, Activity } from 'lucide-react';
import { FormEvent, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SecurityPage } from '../admin/SecurityPage';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { 
    webhooks, 
    setWebhooks, 
    userRole, 
    apiKey, 
    user, 
    whatsappConfig, 
    setWhatsappConfig,
    accentColor,
    setAccentColor,
    isGlassMode,
    setGlassMode,
    theme,
    toggleTheme,
    fontTheme,
    setFontTheme,
    cookieConfig,
    setCookieConfig
  } = useDashboardStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState(user?.displayName || "Rosa Trolese");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pendingFont, setPendingFont] = useState(fontTheme);

  useEffect(() => {
    setPendingFont(fontTheme);
  }, [fontTheme]);

  const firebaseUid = user?.uid || "efrnC5pxl3ZF8zhcOxUPPH1hWaI3"; // Use real UID
  const userEmail = user?.email || "digitalisogni@gmail.com";

  const handleConnectGmail = async () => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`/api/auth/google/url?uid=${user.uid}`);
      const data = await response.json();
      if (data.url) {
        // Open in a popup as per OAuth guidelines
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(data.url, 'google_auth', `width=${width},height=${height},left=${left},top=${top}`);
      }
    } catch (error) {
      console.error("Failed to get OAuth URL:", error);
      toast.error("Failed to initiate Gmail connection");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if needed
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        toast.success(t('gmail_connected_successfully', 'Gmail connected successfully!'));
        // Refresh state
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [t]);

  const copySnippet = () => {
    const snippet = `
<!-- Sogni Hub Lead Capture -->
<script>
  window.SOGNI_HUB_CONFIG = {
    apiKey: "${apiKey}",
    endpoint: "${window.location.origin}/api/leads/capture"
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/digitalisogni/sogni-hub-lead-capture@main/dist/capture.js" async></script>
    `.trim();
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success(t('snippet_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setWebhooks({
      n8n: formData.get('n8n') as string,
      zapier: formData.get('zapier') as string,
    });
    toast.success(t('save_configuration'));
  };

  const sections = [
    { id: 'overview', label: t('overview'), icon: Layout, roles: ['superadmin', 'admin', 'affiliate'] },
    { id: 'appearance', label: t('appearance', 'Appearance'), icon: Sparkles, roles: ['superadmin', 'admin', 'affiliate'] },
    { id: 'automation', label: t('automation'), icon: Zap, roles: ['superadmin', 'admin'] },
    { id: 'integrations', label: t('integrations'), icon: Globe, roles: ['superadmin', 'admin'] },
    { id: 'lead_capture', label: t('lead_capture'), icon: MousePointerClick, roles: ['superadmin', 'admin'] },
    { id: 'cookie_collection', label: t('cookie_collection', 'Cookie Intelligence'), icon: Cookie, roles: ['superadmin', 'admin'] },
    { id: 'notifications', label: t('notification_settings'), icon: Bell, roles: ['superadmin', 'admin', 'affiliate'] },
    { id: 'security', label: t('security'), icon: Shield, roles: ['superadmin', 'admin'] },
  ];

  const filteredSections = sections.filter(s => s.roles.includes(userRole));

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden glass">
              <CardHeader className="bg-primary/5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t('profile_overview')}</CardTitle>
                    <CardDescription>{t('manage_personal_info')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('user_name')}</Label>
                    <Input 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('email_address')}</Label>
                    <Input 
                      value={userEmail} 
                      readOnly
                      className="bg-white/5 border-none h-11 opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('id_label')}</Label>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-border/50">
                      <Fingerprint className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono">{firebaseUid}</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('security')}</Label>
                    <Button variant="outline" className="w-full h-11 rounded-xl border-border hover:bg-white/5 gap-2">
                      <Lock className="w-4 h-4" /> {t('reset_password')}
                    </Button>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl px-8 h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    {t('save_changes')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('agency_status')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">Sogni Agency</p>
                      <p className="text-sm text-primary font-bold">{t('enterprise_ai_plan')}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('automation_health')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{t('active_now')}</p>
                      <p className="text-sm text-green-500 font-bold">{t('workflows_running', { count: 124 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <Webhook className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">{t('quick_actions')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 rounded-2xl border-border bg-white/5 hover:bg-white/10 flex flex-col gap-1 items-start p-4 transition-all" onClick={() => setActiveSection('notifications')}>
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold">{t('notification_settings')}</span>
                </Button>
                <Button variant="outline" className="h-20 rounded-2xl border-border bg-white/5 hover:bg-white/10 flex flex-col gap-1 items-start p-4 transition-all" onClick={() => setActiveSection('security')}>
                  <Shield className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-bold">{t('security_audit')}</span>
                </Button>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="bg-destructive/5 border-destructive/20 text-foreground shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    {t('delete_agency')}
                  </CardTitle>
                  <CardDescription>{t('delete_agency_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="rounded-xl font-bold h-11 px-8">
                    {t('permanently_delete_agency')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6">
            <Card className="glass border-none text-foreground shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t('theme_personalization', 'Theme Personalization')}</CardTitle>
                    <CardDescription>{t('customize_os_look', 'Customize the look and feel of the SOGNI OS.')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('accent_color', 'Accent Color')}</Label>
                  <div className="flex flex-wrap gap-4">
                    {(['blue', 'yellow', 'green', 'pink', 'purple'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={cn(
                          "w-12 h-12 rounded-2xl transition-all duration-300 transform hover:scale-110",
                          accentColor === color ? "ring-2 ring-primary ring-offset-4 ring-offset-background scale-110" : "opacity-70 hover:opacity-100",
                        )}
                        style={{
                          background: color === 'blue' ? 'oklch(0.6 0.2 250)' :
                                     color === 'yellow' ? 'oklch(0.8 0.2 90)' :
                                     color === 'green' ? 'oklch(0.7 0.2 150)' :
                                     color === 'pink' ? 'oklch(0.7 0.2 330)' :
                                     'oklch(0.6 0.2 280)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">{t('glass_mode', 'Glass interface')}</Label>
                    <p className="text-[10px] text-muted-foreground">{t('glass_mode_desc', 'Enable acrylic and liquid transparency effects.')}</p>
                  </div>
                  <Switch 
                    checked={isGlassMode} 
                    onCheckedChange={setGlassMode} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">{t('dark_mode', 'Dark Mode')}</Label>
                    <p className="text-[10px] text-muted-foreground">{t('toggle_dark_light', 'Switch between dark and light themes.')}</p>
                  </div>
                  <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={toggleTheme} 
                  />
                </div>

                <div className="h-px bg-white/10" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('font_theme', 'Font Theme Selection (10 Themes)')}</Label>
                    <AnimatePresence>
                      {pendingFont !== fontTheme && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <Button 
                            onClick={() => setFontTheme(pendingFont)}
                            size="sm" 
                            className="bg-primary hover:bg-primary/80 text-primary-foreground h-8 rounded-lg px-4 font-bold text-[10px] uppercase shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                          >
                            {t('apply_font', 'Apply Font')}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {([
                      { id: 'inter', label: 'Inter', class: 'font-sans' },
                      { id: 'space', label: 'Space', class: 'font-sans' },
                      { id: 'outfit', label: 'Outfit', class: 'font-sans' },
                      { id: 'playfair', label: 'Playfair', class: 'font-serif' },
                      { id: 'jetbrains', label: 'JetBrains', class: 'font-mono' },
                      { id: 'syne', label: 'Syne', class: 'font-sans' },
                      { id: 'lexend', label: 'Lexend', class: 'font-sans' },
                      { id: 'roboto', label: 'Roboto', class: 'font-mono' },
                      { id: 'montserrat', label: 'Montserrat', class: 'font-sans' },
                      { id: 'silkscreen', label: 'Pixel', class: 'font-pixel' }
                    ] as const).map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setPendingFont(font.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 group h-20",
                          pendingFont === font.id && "ring-2 ring-primary border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        )}
                      >
                        <span className={cn("text-lg font-bold mb-1 group-hover:scale-110 transition-transform", font.class)}>Aa</span>
                        <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-mono">{font.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-none shadow-2xl rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full transition-opacity group-hover:opacity-40" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="space-y-4 flex-1">
                  <h3 className="text-3xl font-black italic text-primary">Preview OS Liquid Mode</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                    The liquid mode background dynamically adjusts based on your primary accent color, creating a unique ambient atmosphere.
                  </p>
                </div>
                <div className="w-full md:w-64 aspect-video rounded-3xl overflow-hidden glass-card p-4 flex flex-col justify-between">
                   <div className="flex justify-between items-center">
                     <div className="w-8 h-8 rounded-lg bg-primary/30" />
                     <div className="w-16 h-4 rounded-full bg-white/10" />
                   </div>
                   <div className="space-y-2">
                     <div className="w-full h-8 rounded-xl bg-primary/20" />
                     <div className="w-2/3 h-4 rounded-full bg-white/5" />
                   </div>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'automation':
        return (
          <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary" />
                {t('automation_webhooks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="n8n" className="text-xs font-bold uppercase text-muted-foreground">{t('n8n_webhook')}</Label>
                  <Input 
                    id="n8n" 
                    name="n8n" 
                    defaultValue={webhooks.n8n} 
                    placeholder="https://your-n8n-instance.com/webhook/..." 
                    className="bg-white/5 border-none rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zapier" className="text-xs font-bold uppercase text-muted-foreground">{t('zapier_webhook')}</Label>
                  <Input 
                    id="zapier" 
                    name="zapier" 
                    defaultValue={webhooks.zapier} 
                    placeholder="https://hooks.zapier.com/hooks/catch/..." 
                    className="bg-white/5 border-none rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-12 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                  <Save className="w-4 h-4 mr-2" /> {t('save_configuration')}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'integrations':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  {t('external_integrations')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl border border-border bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Gmail</p>
                      <p className="text-[10px] text-muted-foreground">{t('connect_gmail_desc')}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-border hover:bg-white/10 text-xs"
                    onClick={handleConnectGmail}
                  >
                    {t('connect')}
                  </Button>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Social Media (Meta/LinkedIn)</p>
                      <p className="text-[10px] text-muted-foreground">{t('connect_social_desc')}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-border hover:bg-white/10 text-xs">
                    {t('connect')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  WhatsApp Business API
                </CardTitle>
                <CardDescription>{t('whatsapp_api_desc', 'Connect your WhatsApp Business API for automated outreach.')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    setWhatsappConfig({
                      accessToken: formData.get('wa_token') as string,
                      phoneNumberId: formData.get('wa_phone_id') as string,
                    });
                    toast.success(t('whatsapp_config_saved', 'WhatsApp configuration saved!'));
                  }} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="wa_token" className="text-xs font-bold uppercase text-muted-foreground">{t('wa_access_token', 'Access Token')}</Label>
                    <Input 
                      id="wa_token" 
                      name="wa_token" 
                      type="password"
                      defaultValue={whatsappConfig.accessToken} 
                      placeholder="EAA..." 
                      className="bg-white/5 border-none rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa_phone_id" className="text-xs font-bold uppercase text-muted-foreground">{t('wa_phone_id', 'Phone Number ID')}</Label>
                    <Input 
                      id="wa_phone_id" 
                      name="wa_phone_id" 
                      defaultValue={whatsappConfig.phoneNumberId} 
                      placeholder="123456789..." 
                      className="bg-white/5 border-none rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <Button type="submit" className="bg-[#25D366] hover:bg-[#25D366]/80 text-white rounded-xl w-full h-12 font-bold shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                    <Save className="w-4 h-4 mr-2" /> {t('save_whatsapp_config', 'Save WhatsApp Config')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      case 'lead_capture':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-primary" />
                  {t('website_integration')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <h4 className="text-sm font-bold mb-2">{t('how_to_integrate')}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('integration_steps')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('api_endpoint')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/api/leads/capture`}
                        className="bg-white/5 border-none rounded-xl h-10 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-amber-500/80 italic">
                      {t('webhook_preview_warning')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('api_key')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="password"
                        readOnly 
                        value={apiKey || "••••••••••••••••"}
                        className="bg-white/5 border-none rounded-xl h-10 text-xs"
                      />
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-border h-10"
                        onClick={() => setActiveSection('security')}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Code Snippet</Label>
                    <div className="relative group">
                      <pre className="p-4 rounded-2xl bg-black/40 border border-border text-[10px] font-mono overflow-x-auto text-primary/80">
{`<!-- Sogni Hub Lead Capture -->
<script>
  window.SOGNI_HUB_CONFIG = {
    apiKey: "${apiKey || 'YOUR_CRM_API_KEY'}",
    endpoint: "${window.location.host === 'localhost:3000' ? 'http://localhost:3000' : window.location.origin}/api/leads/capture",
    collectCookies: ${cookieConfig.enabled}
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/digitalisogni/sogni-hub-lead-capture@main/dist/capture.js" async></script>`}
                      </pre>
                      <Button 
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 rounded-lg hover:bg-white/10"
                        onClick={copySnippet}
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'cookie_collection':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden glass">
              <CardHeader className="bg-primary/5 border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Cookie className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t('cookie_intelligence', 'Cookie Intelligence')}</CardTitle>
                      <CardDescription>{t('track_visitors_behavior', 'Track visitor behavior and identify return users across your sites.')}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-xl hover:bg-white/10 text-xs flex items-center gap-2"
                    onClick={async () => {
                      const toastId = toast.loading("Sending test lead...");
                      try {
                        const res = await fetch(`${window.location.origin}/api/leads/capture`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: "Test Diagnostic",
                            email: "diagnostic@sogni.os",
                            phone: "+1 234 567 890",
                            source: "Diagnostic Tool",
                            apiKey: apiKey,
                            visitorData: {
                              cookies: { _sh_diag: "active" },
                              screen: { w: window.screen.width, h: window.screen.height }
                            }
                          })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success("Lead Capture Working!", { id: toastId });
                        } else {
                          toast.error(`Error: ${data.detail || data.error}`, { id: toastId });
                        }
                      } catch (err: any) {
                        toast.error(`Network Error: ${err.message}`, { id: toastId });
                      }
                    }}
                  >
                    <Activity className="w-4 h-4" />
                    {t('test_api', 'Test API')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">{t('enable_cookie_tracking', 'Enable Cookie Tracking')}</Label>
                    <p className="text-[10px] text-muted-foreground">{t('track_return_visitors', 'Identify returning visitors and correlate their sessions.')}</p>
                  </div>
                  <Switch 
                    checked={cookieConfig.enabled} 
                    onCheckedChange={(val) => setCookieConfig({ ...cookieConfig, enabled: val })} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">{t('collect_ip', 'Collect IP Address')}</Label>
                      <p className="text-[10px] text-muted-foreground">{t('identify_geo_location', 'Approximate geographic location from user IP.')}</p>
                    </div>
                    <Switch 
                      checked={cookieConfig.collectIP} 
                      onCheckedChange={(val) => setCookieConfig({ ...cookieConfig, collectIP: val })} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">{t('collect_user_agent', 'User Agent Insight')}</Label>
                      <p className="text-[10px] text-muted-foreground">{t('identify_device_browser', 'Identify devices and browsers used by visitors.')}</p>
                    </div>
                    <Switch 
                      checked={cookieConfig.collectUserAgent} 
                      onCheckedChange={(val) => setCookieConfig({ ...cookieConfig, collectUserAgent: val })} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">{t('custom_cookies_to_sync', 'Custom Cookies to Synchronize')}</Label>
                  <div className="space-y-2">
                    <Input 
                      placeholder={t('cookie_names_comma', 'e.g. user_id, session_token, cart_id (comma separated)')}
                      value={cookieConfig.customCookies.join(', ')}
                      onChange={(e) => {
                        const cookies = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                        setCookieConfig({ ...cookieConfig, customCookies: cookies });
                      }}
                      className="bg-white/5 border-none rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      {t('custom_cookies_desc', 'Enter the names of cookies from your primary domain that you want to capture when a lead is submitted.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-500 mb-1">{t('privacy_policy_reminder', 'Privacy Policy Reminder')}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {t('gdpr_warning', 'By enabling cookie tracking, you are responsible for updating your privacy policy and obtaining necessary consent from users in compliance with GDPR, CCPA, and other local regulations.')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'notifications':
        return (
          <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('notification_preferences')}</CardTitle>
                  <CardDescription>{t('configure_notifications')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">{t('enable_notifications')}</Label>
                  <p className="text-[10px] text-muted-foreground">{t('receive_system_alerts')}</p>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={setNotificationsEnabled} 
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50 opacity-50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Email Notifications</Label>
                  <p className="text-[10px] text-muted-foreground">Receive daily summaries via email</p>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        );
      case 'security':
        return <SecurityPage />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>{t('section_coming_soon')}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground mt-2">{t('manage_infrastructure')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group",
                activeSection === section.id 
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.2)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <section.icon className={cn("w-5 h-5", activeSection === section.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {section.label}
              <ChevronRight className={cn("ml-auto w-4 h-4 opacity-0 transition-all", activeSection === section.id && "opacity-100 translate-x-1")} />
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
