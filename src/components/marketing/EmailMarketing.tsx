import { useState, FormEvent } from 'react';
import { useDashboardStore } from '@/src/store';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Plus, 
  Send, 
  Layout, 
  Users, 
  CheckCircle2, 
  Clock, 
  Trash2,
  ChevronRight,
  Sparkles,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, EmailTemplate } from '@/src/types';

export function EmailMarketing() {
  const { t, i18n } = useTranslation();
  const { campaigns, templates, leads, addCampaign, updateCampaign, addTemplate, updateTemplate, deleteTemplate, userRole } = useDashboardStore();
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);
  const isAdmin = userRole === 'admin';

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedTemplate, setAiGeneratedTemplate] = useState<{subject: string, content: string} | null>(null);

  const defaultTemplates = [
    {
      id: 'welcome-lux',
      name: 'Welcome Email (Luxury)',
      subject: 'Welcome to the Nexus Digital Ecosystem',
      content: 'Hello {{name}}! Welcome to Nexus Agency. We are thrilled to have you on board as we redefine digital excellence together.'
    },
    {
      id: 'confirmation-lux',
      name: 'Confirmation (Modern)',
      subject: 'Order Confirmation: Your Digital Leap',
      content: 'Dear {{name}}, your request has been confirmed. Our team is already working on your bespoke infrastructure.'
    },
    {
      id: 'affiliate-welcome',
      name: 'Affiliate Welcome',
      subject: 'Welcome to the Nexus Affiliate Program',
      content: 'Ciao! Welcome to our partner network. You can now track your leads and commissions directly from your dashboard.'
    }
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAiGeneratedTemplate({
        subject: 'Explore the Future of Digital Excellence',
        content: 'Dear {{name}},\n\nWe are excited to share our latest advancements in digital strategy. Dive in and discover how we can elevate your brand.\n\nBest,\nThe Nexus Team'
      });
      toast.success(t('ai_content_ready', 'AI Suggestion ready! Click "Use AI Suggestion" to apply.'));
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error(t('ai_generation_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const templateId = formData.get('templateId') as string;
    const segment = formData.get('segment') as Campaign['segment'];
    
    // Calculate recipients based on segment
    let recipientsCount = leads.length;
    if (segment === 'Customers') {
      recipientsCount = leads.filter(l => l.status === 'Closed').length;
    } else if (segment === 'Prospects') {
      recipientsCount = leads.filter(l => l.status !== 'Closed').length;
    }

    const newCampaign: Omit<Campaign, 'id'> = {
      name: formData.get('name') as string,
      templateId,
      segment,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      recipientsCount
    };

    await addCampaign(newCampaign);
    setIsCampaignModalOpen(false);
    toast.success(t('campaign_sent_successfully'));
  };

  const handleCreateTemplate = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const templateData: Omit<EmailTemplate, 'id'> = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
    };

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, templateData);
      toast.success(t('template_updated_successfully'));
    } else {
      await addTemplate(templateData);
      toast.success(t('template_saved_successfully'));
    }
    
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('email_marketing')}</h1>
          <p className="text-muted-foreground mt-2">{t('manage_campaigns_desc')}</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 h-12 px-6">
                <Layout className="w-4 h-4 mr-2" /> {t('new_template')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground rounded-3xl">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? t('edit_template') : t('create_template')}</DialogTitle>
                </DialogHeader>
                <form key={editingTemplate?.id || 'new'} onSubmit={handleCreateTemplate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('template_name')}</Label>
                    <Input id="name" name="name" defaultValue={editingTemplate?.name} required className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('subject')}</Label>
                    <Input id="subject" name="subject" defaultValue={editingTemplate?.subject} required className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">{t('content')}</Label>
                    <Textarea id="content" name="content" defaultValue={editingTemplate?.content} required className="rounded-xl bg-white/5 border-none min-h-[200px]" />
                  </div>
                  <DialogFooter className="flex gap-2">
                    {editingTemplate && (
                      <Button type="button" variant="outline" onClick={() => { setEditingTemplate(null); setIsTemplateModalOpen(false); }} className="rounded-xl h-11 flex-1">
                        {t('cancel')}
                      </Button>
                    )}
                    <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl flex-[2] h-11 font-bold">
                      {editingTemplate ? t('update_template') : t('save_template')}
                    </Button>
                  </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl h-12 px-8 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                <Send className="w-4 h-4 mr-2" /> {t('new_campaign')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground rounded-3xl">
              <DialogHeader>
                <DialogTitle>{t('create_campaign')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCampaign} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">{t('campaign_name')}</Label>
                  <Input id="campaign_name" name="name" required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
                <div className="space-y-2">
                  <Label>{t('select_template')}</Label>
                  <Select name="templateId" required>
                    <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                      <SelectValue placeholder={t('select_template')} />
                    </SelectTrigger>
                    <SelectContent>
                      {allTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('select_segment')}</Label>
                  <Select name="segment" defaultValue="All Leads">
                    <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                      <SelectValue placeholder={t('select_segment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Leads">{t('all_leads')}</SelectItem>
                      <SelectItem value="Customers">{t('customers')}</SelectItem>
                      <SelectItem value="Prospects">{t('prospects')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">
                    {t('send_campaign')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaigns List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> {t('recent_campaigns')}
          </h2>
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="bg-card border-border hover:border-primary/30 transition-colors rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Send className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{campaign.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/20 text-primary">
                            {campaign.segment}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(campaign.sentAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{campaign.recipientsCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('recipients')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-border">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">{t('no_campaigns_yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" /> {t('email_templates')}
          </h2>
          <div className="grid gap-4">
            {allTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="bg-card border-border rounded-2xl group cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsViewTemplateOpen(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{template.name}</h3>
                      {template.id.startsWith('welcome') || template.id.startsWith('confirmation') || template.id.startsWith('affiliate') ? (
                        <Badge variant="outline" className="text-[8px] bg-primary/5 border-primary/20 text-primary uppercase">Default</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(template);
                          setIsTemplateModalOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-opacity"
                      >
                        < Sparkles className="w-4 h-4" />
                      </Button>
                      {!template.id.includes('-lux') && !template.id.includes('affiliate-') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.subject}</p>
                </CardContent>
              </Card>
            ))}
            {allTemplates.length === 0 && (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground">{t('no_templates_yet')}</p>
              </div>
            )}
          </div>

          {/* AI Suggestions Card */}
          <Card className="bg-primary/5 border-primary/20 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-bold">{t('ai_content_assistant')}</CardTitle>
              <CardDescription className="text-xs">{t('ai_marketing_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiGeneratedTemplate && (
                <div className="p-3 bg-white/5 rounded-xl border border-primary/20 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase">Preview:</p>
                  <p className="text-[10px] font-medium truncate">{aiGeneratedTemplate.subject}</p>
                  <Button 
                    variant="outline"
                    className="w-full h-8 text-[10px] rounded-lg border-primary/30 text-primary"
                    onClick={() => {
                      setEditingTemplate({
                        id: 'ai-generated',
                        name: 'AI Generated Template',
                        subject: aiGeneratedTemplate.subject,
                        content: aiGeneratedTemplate.content
                      });
                      setIsTemplateModalOpen(true);
                    }}
                  >
                    Use AI Suggestion
                  </Button>
                </div>
              )}
              <Button 
                onClick={generateAIContent}
                disabled={isGenerating}
                className="w-full bg-primary text-primary-foreground rounded-xl text-xs font-bold h-9"
              >
                {isGenerating ? t('generating') : t('generate_with_ai')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground rounded-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-white/5 rounded-xl border border-border">
              <p className="text-xs font-bold text-primary uppercase mb-1">Subject</p>
              <p className="text-sm font-medium">{selectedTemplate?.subject}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-border min-h-[150px]">
              <p className="text-xs font-bold text-primary uppercase mb-1">Content</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTemplate?.content}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsViewTemplateOpen(false); setEditingTemplate(selectedTemplate); setIsTemplateModalOpen(true); }} className="rounded-xl flex-1 h-11 border-border">
              <Edit className="w-4 h-4 mr-2" /> {t('edit')}
            </Button>
            <Button onClick={() => setIsViewTemplateOpen(false)} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl flex-1 h-11 font-bold">
              {t('close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
