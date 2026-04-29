import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/src/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Key, 
  Plus, 
  Search, 
  Copy, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Trash2, 
  Shield, 
  Lock,
  Globe,
  Settings,
  Share2,
  Filter,
  MoreHorizontal,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
// Removed firebase imports
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PasswordEntry } from '@/src/types';

export function PasswordManager() {
  const { t } = useTranslation();
  const { user } = useDashboardStore();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([
    {
      id: '1',
      title: 'SiteGround Hosting',
      username: 'admin@mockagency.com',
      password: 'mockpassword123',
      url: 'https://siteground.com/login',
      category: 'Hosting',
      notes: 'Main hosting account',
      uid: 'mock-uid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('All');

  const handleAddPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const newEntry: PasswordEntry = {
      id: Math.random().toString(),
      title: formData.get('title') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      url: formData.get('url') as string,
      category: formData.get('category') as any,
      notes: formData.get('notes') as string,
      uid: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPasswords(prev => [...prev, newEntry]);
    toast.success(t('password_saved'));
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    toast.success(t('password_deleted'));
  };

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t('copied')}`);
  };

  const filteredPasswords = passwords.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = ['All', 'Hosting', 'CMS', 'Social', 'Other'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            {t('password_vault')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('secure_client_credentials')}</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl h-12 px-6 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        >
          <Plus className="w-5 h-5 mr-2" /> {t('add_credential')}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={t('search_vault')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-2xl focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              onClick={() => setFilter(cat)}
              className={cn(
                "rounded-xl h-12 px-6 font-medium transition-all",
                filter === cat ? "bg-primary text-primary-foreground" : "border-border hover:bg-white/5"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPasswords.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-card border-border text-foreground shadow-2xl rounded-3xl overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      {p.category === 'Hosting' && <HardDrive className="w-5 h-5 text-primary" />}
                      {p.category === 'CMS' && <Settings className="w-5 h-5 text-primary" />}
                      {p.category === 'Social' && <Globe className="w-5 h-5 text-primary" />}
                      {p.category === 'Other' && <Key className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{p.title}</CardTitle>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{p.category}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-xl">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Edit mode opened')}>
                        <Edit className="w-4 h-4" /> {t('edit', 'Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Share link copied')}>
                        <Share2 className="w-4 h-4" /> {t('share', 'Share')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" /> {t('delete', 'Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('username')}</Label>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-transparent hover:border-border transition-all">
                      <span className="text-sm font-medium truncate mr-2">{p.username}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => copyToClipboard(p.username, t('username'))}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('password')}</Label>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-transparent hover:border-border transition-all">
                      <span className="text-sm font-mono tracking-wider truncate mr-2">
                        {visiblePasswords[p.id] ? p.password : '••••••••••••'}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toggleVisibility(p.id)}>
                          {visiblePasswords[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => copyToClipboard(p.password, t('password'))}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {p.url && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-border bg-white/5 hover:bg-white/10 text-xs h-10"
                      onClick={() => window.open(p.url, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-2" /> {t('open_link')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('add_new_credential')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-xl">
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>
            <form onSubmit={handleAddPassword} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('service_name')}</Label>
                  <Input id="title" name="title" placeholder="e.g. SiteGround Hosting" required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <select name="category" className="w-full rounded-xl bg-white/5 border-none h-11 px-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="Hosting">Hosting</option>
                    <option value="CMS">CMS (WordPress/Shopify)</option>
                    <option value="Social">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input id="username" name="username" required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input id="password" name="password" type="password" required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">{t('login_url')}</Label>
                <Input id="url" name="url" type="url" placeholder="https://..." className="rounded-xl bg-white/5 border-none h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  className="w-full rounded-xl bg-white/5 border-none p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl h-12 border-border">
                  {t('cancel')}
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-12 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                  {t('save_credential')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const HardDrive = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>
  </svg>
);
