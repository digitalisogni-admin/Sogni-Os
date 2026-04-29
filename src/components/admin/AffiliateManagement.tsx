import { useState, useEffect, FormEvent } from 'react';
import { UserPlus, Mail, Shield, Trash2, Search, Filter, MoreVertical, CheckCircle2, XCircle, Phone, Building, User, Edit, Ban, CheckCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDashboardStore } from '@/src/store';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
// Removed firebase imports

interface Affiliate {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  company?: string;
  role: 'affiliate' | 'admin' | 'superadmin';
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export function AffiliateManagement() {
  const { t } = useTranslation();
  const { userRole } = useDashboardStore();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'superadmin') return;

    setAffiliates([
      {
        id: 'mock-1',
        email: 'partner@example.com',
        fullName: 'Jane Doe',
        phone: '+1 234 567 8900',
        company: 'Partner Inc',
        role: 'affiliate',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ]);
    setIsLoading(false);
  }, [userRole]);

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Shield className="w-16 h-16 text-destructive opacity-20" />
        <h2 className="text-2xl font-bold">{t('access_denied')}</h2>
        <p className="text-muted-foreground">{t('only_admins_security')}</p>
      </div>
    );
  }

  const handleCreateAffiliate = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const company = formData.get('company') as string;

    const data: Affiliate = {
      id: Math.random().toString(),
      email,
      fullName,
      phone,
      company,
      role: 'affiliate',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setAffiliates(prev => [...prev, data]);
    setIsAddModalOpen(false);
    toast.success(t('affiliate_invitation_sent', { email }));
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (!confirm(t('confirm_delete_affiliate'))) return;
    setAffiliates(prev => prev.filter(a => a.id !== id));
    toast.success(t('affiliate_account_removed'));
  };

  const handleUpdateAffiliateStatus = async (id: string, status: Affiliate['status']) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(t('affiliate_status_updated', { status }));
  };

  const handleEditAffiliate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAffiliate) return;
    const formData = new FormData(e.target as HTMLFormElement);
    
    setAffiliates(prev => prev.map(a => {
      if (a.id === editingAffiliate.id) {
        return {
          ...a,
          fullName: formData.get('fullName') as string,
          email: formData.get('email') as string,
          phone: formData.get('phone') as string,
          company: formData.get('company') as string,
        };
      }
      return a;
    }));
    
    setIsEditModalOpen(false);
    setEditingAffiliate(null);
    toast.success(t('affiliate_updated'));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('affiliates')}</h1>
          <p className="text-muted-foreground">{t('manage_affiliates')}</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl px-6 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              <UserPlus className="w-4 h-4 mr-2" />
              {t('add_affiliate')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t('create_affiliate_account')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAffiliate} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('full_name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="fullName" name="fullName" placeholder="John Doe" required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email_address')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="partner@example.com" required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone_number')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" name="phone" placeholder="+1 234 567 890" required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('company_name')}</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="company" name="company" placeholder="Acme Inc." className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxCode">{t('tax_code')}</Label>
                      <Input id="taxCode" name="taxCode" placeholder="RSSMRA80A01H501U" className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">{t('vat_number')}</Label>
                      <Input id="vatNumber" name="vatNumber" placeholder="IT12345678901" className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditions">{t('conditions')}</Label>
                    <textarea 
                      id="conditions" 
                      name="conditions" 
                      placeholder="Contractual terms..." 
                      className="w-full rounded-xl bg-white/5 border-none min-h-[100px] p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('initial_password_hint')}</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" className="rounded-xl bg-white/5 border-none h-11" />
                    <p className="text-[10px] text-muted-foreground">{t('password_creation_info')}</p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">{t('create_account')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('total_affiliates')}</p>
            <p className="text-3xl font-bold">{affiliates.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('active_now')}</p>
            <p className="text-3xl font-bold text-primary">{affiliates.filter(a => a.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('pending_invites')}</p>
            <p className="text-3xl font-bold text-yellow-500">{affiliates.filter(a => a.status === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('search_affiliates')} className="bg-white/5 border-none rounded-xl h-10 pl-10 text-xs" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-border text-xs">
              <Filter className="w-3 h-3 mr-2" /> {t('filter')}
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('affiliates')}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('contact')}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('status')}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('created_at')}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {(affiliate.fullName || affiliate.email)[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{affiliate.fullName || 'No Name'}</span>
                          <span className="text-[10px] text-muted-foreground">{affiliate.company || 'No Company'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs">{affiliate.email}</span>
                        <span className="text-[10px] text-muted-foreground">{affiliate.phone || 'No Phone'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "rounded-lg border-none px-2 py-0.5 text-[10px] font-bold",
                        affiliate.status === 'active' ? "bg-green-500/10 text-green-500" :
                        affiliate.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-destructive/10 text-destructive"
                      )}>
                        {(affiliate.status || 'pending').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {affiliate.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingAffiliate(affiliate);
                                setIsEditModalOpen(true);
                              }} 
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" /> {t('edit')}
                            </DropdownMenuItem>
                            {userRole === 'superadmin' && affiliate.role !== 'superadmin' && (
                              <DropdownMenuItem 
                                onClick={async () => {
                                  setAffiliates(prev => prev.map(a => a.id === affiliate.id ? { ...a, role: 'admin' } : a));
                                  toast.success(t('promoted_to_admin', 'Promoted to Admin'));
                                }} 
                                className="gap-2 cursor-pointer text-primary"
                              >
                                <Shield className="w-4 h-4" /> {t('promote_to_admin', 'Promote to Admin')}
                              </DropdownMenuItem>
                            )}
                            {affiliate.status === 'suspended' ? (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'active')} 
                                className="gap-2 cursor-pointer text-green-500 focus:text-green-500 focus:bg-green-500/10"
                              >
                                <CheckCircle className="w-4 h-4" /> {t('activate')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'suspended')} 
                                className="gap-2 cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10"
                              >
                                <Ban className="w-4 h-4" /> {t('suspend')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAffiliate(affiliate.id)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" /> {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      {t('no_affiliates_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_affiliate_account')}</DialogTitle>
          </DialogHeader>
          {editingAffiliate && (
            <form key={editingAffiliate.uid} onSubmit={handleEditAffiliate} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">{t('full_name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="edit-fullName" name="fullName" defaultValue={editingAffiliate.fullName} required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{t('email_address')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="edit-email" name="email" type="email" defaultValue={editingAffiliate.email} required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">{t('phone_number')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="edit-phone" name="phone" defaultValue={editingAffiliate.phone} required className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">{t('company_name')}</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="edit-company" name="company" defaultValue={editingAffiliate.company} className="rounded-xl bg-white/5 border-none h-11 pl-10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-taxCode">{t('tax_code')}</Label>
                      <Input id="edit-taxCode" name="taxCode" defaultValue={(editingAffiliate as any).taxCode} className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-vatNumber">{t('vat_number')}</Label>
                      <Input id="edit-vatNumber" name="vatNumber" defaultValue={(editingAffiliate as any).vatNumber} className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
