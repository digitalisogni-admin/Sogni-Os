import React, { useState, FormEvent } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Check,
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone,
  ArrowUpRight,
  ArrowLeft,
  Globe,
  Building,
  Calendar,
  CreditCard,
  Briefcase,
  ExternalLink,
  MessageCircle,
  Hash,
  Activity,
  UserCheck,
  Shield,
  Sparkles,
  Kanban,
  List as ListIcon,
  MessageSquare,
  FileText,
  TrendingUp,
  Instagram,
  Linkedin,
  Music2,
  Send,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { Lead } from '@/src/types';
import { useDashboardStore } from '@/src/store';
import Papa from 'papaparse';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit } from 'lucide-react';
import { EmailInbox } from '../marketing/EmailInbox';
import { Kanban as KanbanBoard } from '../kanban/Kanban';

export function CRM() {
  const { t } = useTranslation();
  const { leads, projects, addLead, updateLead, deleteLead, userRole, user } = useDashboardStore();
  const [activeView, setActiveView] = useState<'contacts' | 'inbox'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Lead | null>(null);
  const [selectedContact, setSelectedContact] = useState<Lead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const googleSheetUrl = useDashboardStore(state => state.googleSheetId); // We reused this property for the CSV URL

  const handleSyncSheets = async () => {
    if (!googleSheetUrl) {
      toast.error('Please configure your Google Sheets CSV URL in Settings first.');
      return;
    }

    setIsSyncing(true);
    toast.info('Syncing from Google Sheets...', { duration: 2000 });

    try {
      const response = await fetch(googleSheetUrl);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as any[];
          let addedCount = 0;

          for (const row of rows) {
            // Find map keys flexibly
            const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
            const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
            const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel'));
            const messageKey = Object.keys(row).find(k => k.toLowerCase().includes('message') || k.toLowerCase().includes('note'));
            
            const parsedEmail = emailKey ? row[emailKey]?.trim() : '';
            const phone = phoneKey ? row[phoneKey]?.trim() : '';

            // Skip if no email or phone
            if (!parsedEmail && !phone) continue;
            
            // Firebase strictly requires a valid email string
            const email = parsedEmail || `no-email-${Math.random().toString(36).substring(7)}@nexus.os`;

            // Prevent duplicates
            const isDuplicate = leads.some(l => 
              (parsedEmail && l.email?.toLowerCase() === parsedEmail.toLowerCase()) || 
              (phone && l.phone === phone)
            );

            if (!isDuplicate) {
              await addLead({
                name: nameKey ? row[nameKey] : "Unknown",
                company: "Unknown", // Added missing required property
                email: email,
                phone: phone,
                message: messageKey ? row[messageKey] : "",
                source: "Google Sheets",
                status: "New",
                value: 0,
                lastContacted: new Date().toISOString().split('T')[0],
                avatar: `https://picsum.photos/seed/${Math.random()}/100/100`,
                uid: user?.uid || "",
                createdAt: new Date().toISOString()
              });
              addedCount++;
            }
          }

          setIsSyncing(false);
          toast.success(`Synced successfully. Added ${addedCount} new leads.`);
        },
        error: (err: any) => {
          console.error("PapaParse error:", err);
          setIsSyncing(false);
          toast.error('Failed to parse the Google Sheet CSV.');
        }
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setIsSyncing(false);
      toast.error('Could not fetch Google Sheet. Make sure the link is published to web.');
    }
  };

  const filteredContacts = leads
    .filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const aVal = a[key] ?? '';
      const bVal = b[key] ?? '';
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: keyof Lead) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const contactProjects = selectedContact 
    ? projects.filter(p => p.leadId === selectedContact.id || p.client === selectedContact.name || p.client === selectedContact.company)
    : [];

  // Affiliate Discount Engine Logic
  const calculateCommission = (lead: Lead) => {
    const value = lead.value || 0;
    const scenario = lead.commissionScenario || 'A';
    const carePlan = lead.carePlan || 'None';
    
    let commission = 0;
    
    // Scenarios based on provided manual logic
    switch (scenario) {
      case 'A': commission = value * 0.10; break; // 10% base
      case 'B': commission = value * 0.15; break; // 15% medium
      case 'C': commission = value * 0.20; break; // 20% high
      case 'D': commission = 200; break; // Fixed 200 fee
    }

    // Care Plan Bonuses (Net)
    let careBonus = 0;
    if (carePlan === 'Essential') careBonus = 24;
    if (carePlan === 'Pro') careBonus = 40;

    const grossTotal = commission;
    const taxWithholding = grossTotal * 0.20; // 20% Ritenuta d'acconto (Admin internal info)
    const netCash = (grossTotal - taxWithholding) + careBonus;

    return { grossTotal, taxWithholding, netCash, careBonus };
  };

  const handleWhatsApp = (phone: string, template: 'intro' | 'followup') => {
    if (!phone) {
      toast.error(t('no_phone_number', 'No phone number available'));
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = template === 'intro' 
      ? `Ciao! Mi chiamo ${user?.displayName || 'Nexus Agent'}, ti contatto per il tuo interesse nei nostri servizi.`
      : `Ciao! Ti scrivo per sapere se hai ricevuto la nostra proposta e se hai delle domande.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddContact = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newLead: Omit<Lead, 'id'> = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      status: 'New',
      value: isAdmin ? Number(formData.get('value')) : 0,
      lastContacted: new Date().toISOString().split('T')[0],
      avatar: `https://picsum.photos/seed/${Math.random()}/100/100`,
      role: formData.get('role') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      businessType: formData.get('businessType') as string,
      message: formData.get('message') as string,
      vatNumber: formData.get('vat') as string,
      taxCode: formData.get('cf') as string,
      address: formData.get('address') as string,
      pecEmail: formData.get('pec') as string,
      sdiCode: formData.get('sdi') as string,
      source: formData.get('source') as any || 'Manual',
      commissionScenario: formData.get('scenario') as any || 'A',
      carePlan: formData.get('carePlan') as any || 'None',
    };
    addLead(newLead);
    setIsAddModalOpen(false);
    toast.success(t('contact_added_successfully'));
  };

  const handleEditContact = (e: FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const updates: Partial<Lead> = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      value: isAdmin ? Number(formData.get('value')) : editingContact.value,
      role: formData.get('role') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      businessType: formData.get('businessType') as string,
      message: formData.get('message') as string,
      vatNumber: formData.get('vat') as string,
      taxCode: formData.get('cf') as string,
      address: formData.get('address') as string,
      pecEmail: formData.get('pec') as string,
      sdiCode: formData.get('sdi') as string,
      source: formData.get('source') as any,
      commissionScenario: formData.get('scenario') as any,
      carePlan: formData.get('carePlan') as any,
    };
    updateLead(editingContact.id, updates);
    setIsEditModalOpen(false);
    setEditingContact(null);
    toast.success(t('contact_updated_successfully'));
  };

  const handleDeleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app we'd use a custom Dialog for this, but for now we'll use a toast confirmation pattern
    setSelectedContactForDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedContactForDelete) return;
    await deleteLead(selectedContactForDelete);
    setIsDeleteModalOpen(false);
    setSelectedContactForDelete(null);
    toast.success(t('contact_deleted_successfully'));
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<string | null>(null);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex border-b border-border mb-6">
        <button 
          onClick={() => setActiveView('contacts')}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2",
            activeView === 'contacts' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t('contacts', 'Contacts')}
        </button>
        <button 
          onClick={() => setActiveView('inbox')}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-2",
            activeView === 'inbox' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="w-4 h-4" />
          {t('inbox', 'Inbox')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'inbox' ? (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <EmailInbox />
          </motion.div>
        ) : !selectedContact ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight font-heading">{t('crm_system')}</h1>
                <p className="text-muted-foreground font-medium">{t('manage_contacts')}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/5 p-1 rounded-xl border border-border flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewMode('list')}
                    className={cn("h-9 w-9 rounded-lg", viewMode === 'list' ? "bg-primary/20 text-primary" : "text-muted-foreground")}
                  >
                    <ListIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewMode('kanban')}
                    className={cn("h-9 w-9 rounded-lg", viewMode === 'kanban' ? "bg-primary/20 text-primary" : "text-muted-foreground")}
                  >
                    <Kanban className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={handleSyncSheets} 
                  disabled={isSyncing}
                  variant="outline"
                  className="rounded-xl shadow-sm border-border hover:bg-white/5 transition-all text-sm gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                  {isSyncing ? "Syncing..." : "Sync Sheets"}
                </Button>

                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg ring-1 ring-primary/20 transition-all hover:scale-[1.02]">
                    <Plus className="w-4 h-4 mr-2" /> {t('add_contact')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground rounded-3xl p-0 overflow-hidden">
                  <DialogHeader className="p-6 border-b border-border">
                    <DialogTitle className="text-xl font-bold">{t('add_new_contact')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddContact} className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className="p-6 space-y-8">
                      {/* Identity Core */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">1. {t('identity_core')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground">{t('full_name')}</Label>
                            <Input id="name" name="name" placeholder="Rosa Trolese" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-muted-foreground">{t('role_title')}</Label>
                            <Input id="role" name="role" placeholder="Founder & CEO" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-muted-foreground">{t('company_name')}</Label>
                          <Input id="company" name="company" placeholder="Nexus Agency" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground">{t('email_address')}</Label>
                            <Input id="email" name="email" type="email" placeholder="rosa@nexus.it" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-muted-foreground">{t('phone_whatsapp')}</Label>
                            <Input id="phone" name="phone" placeholder="+39 345 678 9012" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-muted-foreground">{t('website_url')}</Label>
                          <Input id="website" name="website" placeholder="https://example.com" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessType" className="text-muted-foreground">{t('business_type')}</Label>
                          <Select name="businessType">
                            <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
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
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="message" className="text-muted-foreground">{t('message_label')}</Label>
                          <textarea 
                            id="message" 
                            name="message" 
                            className="w-full min-h-[100px] rounded-xl bg-white/5 border-none p-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder={t('type_message')}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="source" className="text-muted-foreground">{t('source', 'Lead Source')}</Label>
                            <Select name="source" defaultValue="Manual">
                              <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                                <SelectValue placeholder="Select Source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Meta">Meta Ads</SelectItem>
                                <SelectItem value="TikTok">TikTok Ads</SelectItem>
                                <SelectItem value="Email">Email Marketing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">2. {t('marketing_commissions', 'Marketing & Commissions')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="scenario" className="text-muted-foreground">{t('comm_scenario', 'Scenario')}</Label>
                            <Select name="scenario" defaultValue="A">
                              <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                                <SelectValue placeholder="Select Scenario" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Scenario A (10%)</SelectItem>
                                <SelectItem value="B">Scenario B (15%)</SelectItem>
                                <SelectItem value="C">Scenario C (20%)</SelectItem>
                                <SelectItem value="D">Scenario D (Fixed €200)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carePlan" className="text-muted-foreground">{t('care_plan', 'Care Plan')}</Label>
                            <Select name="carePlan" defaultValue="None">
                              <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                                <SelectValue placeholder="Select Plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Essential">Essential (€24 Net)</SelectItem>
                                <SelectItem value="Pro">Professional (€40 Net)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Italian Billing Engine - Admin Only */}
                      {isAdmin && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">3. {t('billing_engine')}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="vat" className="text-muted-foreground">{t('vat_number')}</Label>
                              <Input id="vat" name="vat" placeholder="IT12345678901" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cf" className="text-muted-foreground">{t('tax_code')}</Label>
                              <Input id="cf" name="cf" placeholder="TRLRS80A01L219X" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address" className="text-muted-foreground">{t('billing_address')}</Label>
                            <Input id="address" name="address" placeholder="Via Roma 123, 10121 Torino (TO)" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="pec" className="text-muted-foreground">{t('pec_email')}</Label>
                              <Input id="pec" name="pec" type="email" placeholder="nexus@legalmail.it" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sdi" className="text-muted-foreground">{t('sdi_code')}</Label>
                              <Input id="sdi" name="sdi" placeholder="M5UXCR1" maxLength={7} className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="space-y-2">
                          <Label htmlFor="value" className="text-muted-foreground">{t('estimated_value')} (€)</Label>
                          <Input id="value" name="value" type="number" placeholder="1599" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 border-t border-border bg-white/5">
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full h-12 font-bold shadow-xl transition-all hover:scale-[1.01]">
                        {t('create_contact')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {viewMode === 'kanban' ? (
              <div className="h-[600px] mt-4">
                <KanbanBoard hideHeader />
              </div>
            ) : (
            <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('search_contacts')}
                      className="pl-10 bg-white/5 border-none rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-border hover:bg-white/5">
                          <Filter className="w-4 h-4 mr-2" /> {sortConfig ? `${t('sorted_by')}: ${t(sortConfig.key)}` : t('sort_by')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border text-foreground rounded-xl">
                        <DropdownMenuItem onClick={() => handleSort('name')}>{t('name')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('status')}>{t('status')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('value')}>{t('value')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('lastContacted')}>{t('last_contact')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="rounded-xl border-border hover:bg-white/5">
                      <Filter className="w-4 h-4 mr-2" /> {t('filter')}
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" className="rounded-xl border-border hover:bg-white/5">
                        {t('export')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[300px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px] py-4">{t('contact')}</TableHead>
                      <TableHead className="font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px] py-4">{t('status')}</TableHead>
                      {isAdmin && <TableHead className="font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px] py-4">{t('estimated_value')}</TableHead>}
                      <TableHead className="font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px] py-4">{t('last_contact')}</TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px] py-4">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow 
                        key={contact.id} 
                        className="hover:bg-white/5 border-border transition-colors group cursor-pointer"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-border">
                              <AvatarImage src={contact.avatar} />
                              <AvatarFallback>{contact.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-foreground">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">{contact.company}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "rounded-full border shadow-sm px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              contact.status === 'Closed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              contact.status === 'New' ? "bg-primary/10 text-primary border-primary/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {contact.status}
                            </Badge>
                            {contact.source === 'Website' && (
                              <div className="w-5 h-5 bg-primary/20 rounded-lg flex items-center justify-center text-primary" title="Captured via Web Bridge">
                                <Globe className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <p className="text-sm font-bold text-foreground">${contact.value.toLocaleString()}</p>
                          </TableCell>
                        )}
                        <TableCell>
                          <p className="text-xs text-muted-foreground">{contact.lastContacted}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${contact.email}`; }}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedContact(contact)} className="gap-2 cursor-pointer">
                                  <ExternalLink className="w-4 h-4" /> {t('view_profile')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setIsEditModalOpen(true);
                                  }} 
                                  className="gap-2 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" /> {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem 
                                  onClick={(e) => handleDeleteContact(contact.id, e as any)}
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" /> {t('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )}

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border">
                  <DialogTitle className="text-xl font-bold">{t('edit_contact')}</DialogTitle>
                </DialogHeader>
                {editingContact && (
                  <form key={editingContact.id} onSubmit={handleEditContact} className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className="p-6 space-y-8">
                      {/* Identity Core */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">1. {t('identity_core')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-muted-foreground">{t('full_name')}</Label>
                            <Input id="edit-name" name="name" defaultValue={editingContact.name} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-role" className="text-muted-foreground">{t('role_title')}</Label>
                            <Input id="edit-role" name="role" defaultValue={editingContact.role} placeholder="Founder & CEO" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-company" className="text-muted-foreground">{t('company_name')}</Label>
                          <Input id="edit-company" name="company" defaultValue={editingContact.company} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-muted-foreground">{t('email_address')}</Label>
                            <Input id="edit-email" name="email" type="email" defaultValue={editingContact.email} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone" className="text-muted-foreground">{t('phone_whatsapp')}</Label>
                            <Input id="edit-phone" name="phone" defaultValue={editingContact.phone} placeholder="+39 345 678 9012" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-website" className="text-muted-foreground">{t('website_url')}</Label>
                          <Input id="edit-website" name="website" defaultValue={editingContact.website} placeholder="https://example.com" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-businessType" className="text-muted-foreground">{t('business_type')}</Label>
                          <Select name="businessType" defaultValue={editingContact.businessType}>
                            <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
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
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="edit-message" className="text-muted-foreground">{t('message_label')}</Label>
                          <textarea 
                            id="edit-message" 
                            name="message" 
                            defaultValue={editingContact.message}
                            className="w-full min-h-[100px] rounded-xl bg-white/5 border-none p-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder={t('type_message')}
                          />
                        </div>
                      </div>

                      {/* Italian Billing Engine - Admin Only */}
                      {isAdmin && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">2. {t('billing_engine')}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-vat" className="text-muted-foreground">{t('vat_number')}</Label>
                              <Input id="edit-vat" name="vat" defaultValue={editingContact.vatNumber} placeholder="IT12345678901" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-cf" className="text-muted-foreground">{t('tax_code')}</Label>
                              <Input id="edit-cf" name="cf" defaultValue={editingContact.taxCode} placeholder="TRLRS80A01L219X" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-address" className="text-muted-foreground">{t('billing_address')}</Label>
                            <Input id="edit-address" name="address" defaultValue={editingContact.address} placeholder="Via Roma 123, 10121 Torino (TO)" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-pec" className="text-muted-foreground">{t('pec_email')}</Label>
                              <Input id="edit-pec" name="pec" type="email" defaultValue={editingContact.pecEmail} placeholder="nexus@legalmail.it" className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-sdi" className="text-muted-foreground">{t('sdi_code')}</Label>
                              <Input id="edit-sdi" name="sdi" defaultValue={editingContact.sdiCode} placeholder="M5UXCR1" maxLength={7} className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-value" className="text-muted-foreground">{t('estimated_value')} (€)</Label>
                          <Input id="edit-value" name="value" type="number" defaultValue={editingContact.value} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t('comm_scenario', 'Scenario')}</Label>
                          <Select name="scenario" defaultValue={editingContact.commissionScenario || 'A'}>
                            <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">Scenario A (10%)</SelectItem>
                              <SelectItem value="B">Scenario B (15%)</SelectItem>
                              <SelectItem value="C">Scenario C (20%)</SelectItem>
                              <SelectItem value="D">Scenario D (Fixed €200)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t('care_plan', 'Care Plan')}</Label>
                          <Select name="carePlan" defaultValue={editingContact.carePlan || 'None'}>
                            <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="Essential">Essential (€24 Net)</SelectItem>
                              <SelectItem value="Pro">Professional (€40 Net)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t('source', 'Lead Source')}</Label>
                          <Select name="source" defaultValue={editingContact.source || 'Manual'}>
                            <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manual">Manual</SelectItem>
                              <SelectItem value="Meta">Meta Ads</SelectItem>
                              <SelectItem value="TikTok">TikTok Ads</SelectItem>
                              <SelectItem value="Email">Email Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-border bg-white/5">
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full h-12 font-bold shadow-xl transition-all hover:scale-[1.01]">
                        {t('save_changes')}
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedContact(null)}
                className="rounded-xl hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('contact_profile')}</h1>
                <p className="text-muted-foreground">{selectedContact.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Sidebar */}
              <div className="space-y-6">
                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <div className="h-24 bg-primary/10" />
                  <CardContent className="p-6 -mt-12 flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 border-4 border-card shadow-2xl mb-4">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback className="text-2xl">{selectedContact.name[0]}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{selectedContact.role || selectedContact.company}</p>
                    <Badge className={cn(
                      "rounded-lg border-none px-3 py-1 text-[10px] font-bold",
                      selectedContact.status === 'Closed' ? "bg-green-500/10 text-green-500" :
                      selectedContact.status === 'New' ? "bg-primary/10 text-primary" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {selectedContact.status.toUpperCase()}
                    </Badge>

                    <div className="w-full grid grid-cols-2 gap-2 mt-8">
                      <Button variant="outline" className="rounded-xl border-border h-10 text-xs gap-2" onClick={() => window.location.href = `mailto:${selectedContact.email}`}>
                        <Mail className="w-3 h-3" /> {t('email')}
                      </Button>
                      <Button variant="outline" className="rounded-xl border-border h-10 text-xs gap-2 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/5" onClick={() => window.open(`https://wa.me/${selectedContact.phone?.replace(/\+/g, '')}`, '_blank')}>
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">{t('lead_score', 'AI Lead Score')}</CardTitle>
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center p-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            className="text-white/5 stroke-current"
                            strokeWidth="2.5"
                            fill="none"
                            cx="18" cy="18" r="16"
                          />
                          <circle
                            className="text-primary stroke-current"
                            strokeWidth="2.5"
                            strokeDasharray="85, 100"
                            strokeLinecap="round"
                            fill="none"
                            cx="18" cy="18" r="16"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black font-heading leading-none">85</span>
                          <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-bold">score</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('engagement', 'Engagement')}</span>
                        <span className="text-primary font-bold">High</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('fit', 'Market Fit')}</span>
                        <span className="text-primary font-bold">92%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic text-center mt-2 italic">* {t('ai_score_note', 'Based on recent interactions and company profile.')}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-border">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      {t('activity_timeline', 'Activity Timeline')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedContact.activities && selectedContact.activities.length > 0 ? (
                      <div className="space-y-6">
                        {selectedContact.activities.map((activity, idx) => (
                          <div key={activity.id} className="relative flex gap-4">
                            {idx !== selectedContact.activities.length - 1 && (
                              <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border" />
                            )}
                            <div className="relative z-10 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-foreground">{activity.type}</p>
                                <p className="text-[10px] text-muted-foreground">{activity.date}</p>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{activity.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground uppercase tracking-widest gap-2">
                        <MessageSquare className="w-8 h-8 opacity-20" />
                        <p className="text-[10px] font-bold">{t('no_activities', 'No Activity Logged')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{t('contact_details')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm group cursor-pointer" onClick={() => window.location.href = `mailto:${selectedContact.email}`}>
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm group">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Building className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{selectedContact.company}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm group">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{t('last_contact')}: {selectedContact.lastContacted}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm group cursor-pointer" onClick={() => selectedContact.website && window.open(selectedContact.website, '_blank')}>
                      <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{selectedContact.website || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                {selectedContact.meta && (
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" />
                        {t('technical_insights', 'Technical Insights')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {selectedContact.meta.ip && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">{t('ip_address', 'IP Address')}</p>
                          <p className="text-xs font-mono bg-white/5 p-1 rounded border border-border/50">{selectedContact.meta.ip}</p>
                        </div>
                      )}
                      {selectedContact.meta.userAgent && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">{t('browser_device', 'Browser / Device')}</p>
                          <p className="text-[10px] leading-tight text-muted-foreground bg-white/5 p-2 rounded border border-border/50 truncate hover:whitespace-normal transition-all" title={selectedContact.meta.userAgent}>
                            {selectedContact.meta.userAgent}
                          </p>
                        </div>
                      )}
                      {selectedContact.meta.cookies && Object.keys(selectedContact.meta.cookies).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">{t('captured_cookies', 'Captured Cookies')}</p>
                          <div className="grid grid-cols-1 gap-1">
                            {Object.entries(selectedContact.meta.cookies).map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-0.5 bg-white/5 p-1.5 rounded border border-border/50">
                                <span className="text-[10px] font-bold text-primary">{key}</span>
                                <span className="text-[10px] font-mono text-muted-foreground truncate">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Profile Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('estimated_value')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">€{selectedContact.value.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('active_projects')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{contactProjects.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedContact.message && (
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-between">
                        {t('message_label')}
                        {selectedContact.businessType && (
                           <Badge variant="outline" className="border-primary/20 text-primary text-[8px] uppercase">{selectedContact.businessType}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic leading-relaxed text-foreground/90">"{selectedContact.message}"</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-border">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      {t('social_footprint', 'Social & Digital Footprint')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-border/30 text-center hover:bg-white/10 transition-colors cursor-pointer">
                        <Instagram className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Instagram</p>
                        <p className={cn("text-[9px] font-bold mt-1", selectedContact.source === 'Meta' ? "text-green-500" : "text-muted-foreground")}>
                          {selectedContact.source === 'Meta' ? 'Direct Source' : 'Linked'}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-border/30 text-center hover:bg-white/10 transition-colors cursor-pointer">
                        <Music2 className="w-6 h-6 mx-auto mb-2 text-foreground" />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">TikTok</p>
                        <p className={cn("text-[9px] font-bold mt-1", selectedContact.source === 'TikTok' ? "text-green-500" : "text-muted-foreground text-orange-500")}>
                          {selectedContact.source === 'TikTok' ? 'Active Tracking' : 'Not Found'}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-border/30 text-center hover:bg-white/10 transition-colors cursor-pointer">
                        <Linkedin className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">LinkedIn</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Found Profiles</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-border/30 text-center hover:bg-white/10 transition-colors cursor-pointer">
                        <Globe className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Website</p>
                        <p className={cn("text-[9px] font-bold mt-1", selectedContact.website ? "text-green-500" : "text-muted-foreground")}>
                          {selectedContact.website ? 'Verified' : 'Missing URL'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden text-center p-8 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleWhatsApp(selectedContact.phone || '', 'intro')}>
                    <div className="mx-auto w-12 h-12 bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center justify-center mb-4">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-1">{t('whatsapp_outreach', 'WhatsApp Intro')}</h3>
                    <p className="text-xs text-muted-foreground">{t('send_intro_msg', 'Send personalized intro template')}</p>
                  </Card>
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden text-center p-8 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleWhatsApp(selectedContact.phone || '', 'followup')}>
                    <div className="mx-auto w-12 h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                      <Send className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-1">{t('whatsapp_followup', 'WhatsApp Follow-up')}</h3>
                    <p className="text-xs text-muted-foreground">{t('send_followup_msg', 'Check on proposal status')}</p>
                  </Card>
                </div>

                <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-border">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      {t('associated_projects')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {contactProjects.length > 0 ? (
                      <div className="divide-y divide-border">
                        {contactProjects.map((project) => (
                          <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div>
                              <p className="text-sm font-bold">{project.name}</p>
                              <p className="text-[10px] text-muted-foreground">{project.status} • {project.dueDate}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs font-bold">{project.progress}%</p>
                                <div className="w-20 h-1 bg-white/10 rounded-full mt-1">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <ArrowUpRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <p className="text-sm">{t('no_projects_found')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isAdmin && (
                  <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('billing_info')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('vat_number')}</p>
                          <p className="text-sm font-mono">{selectedContact.vatNumber || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('tax_code')}</p>
                          <p className="text-sm font-mono">{selectedContact.taxCode || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('billing_address')}</p>
                          <p className="text-sm">{selectedContact.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('pec_email')}</p>
                          <p className="text-sm">{selectedContact.pecEmail || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('sdi_code')}</p>
                          <p className="text-sm font-mono">{selectedContact.sdiCode || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('delete_contact_confirm', 'Delete Contact')}</DialogTitle>
            <CardDescription>{t('delete_contact_warning', 'Are you sure you want to delete this contact? This action cannot be undone.')}</CardDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl">{t('cancel')}</Button>
            <Button onClick={confirmDelete} variant="destructive" className="rounded-xl">{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
