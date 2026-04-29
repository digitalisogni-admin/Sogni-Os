import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/src/store';
import { 
  BookOpen, 
  Target, 
  Zap, 
  ShieldCheck, 
  Euro, 
  Rocket, 
  Clock, 
  Award,
  ChevronRight,
  Sparkles,
  Info,
  Globe,
  Copy,
  Check,
  FlaskConical,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TOPICS = [
  {
    id: 'partnership',
    title: 'partnership',
    icon: <Target className="w-5 h-5 text-primary" />,
    content: {
      philosophy: [
        { title: 'protected_margin', description: 'protected_margin_desc', icon: <ShieldCheck className="w-6 h-6" /> },
        { title: 'instant_payment', description: 'instant_payment_desc', icon: <Zap className="w-6 h-6" /> }
      ],
      rules: [
        'rule_vat',
        'rule_discount',
        'rule_loyalty'
      ]
    }
  },
  {
    id: 'pricing',
    title: 'pricing_offers',
    icon: <Euro className="w-5 h-5 text-primary" />,
    packs: [
      { name: 'Pack Essential', price: '849€', commission: '127€ (15%)', features: ['5-7 page website', 'LiteSpeed Optimized', 'Local SEO Google Maps'] },
      { name: 'Pack Professional', price: '1,599€', commission: '240€ (15%)', features: ['Everything in Essential', 'AI Concierge (Gemini)', 'Lead Hub CRM', 'WhatsApp Integration'] },
      { name: 'Pack Custom', price: '2,999€+', commission: '450€+ (15%)', features: ['Full ERP/CRM su misura', 'Deep API Integrations', 'Replaces subscriptions'] }
    ],
    addons: [
      { name: 'Google Local', price: '249€', desc: 'Aggressive GMB optimization' },
      { name: 'AI Content', price: '349€', desc: '5 high-quality SEO articles' },
      { name: 'Reputation QR', price: '179€', desc: 'Cyber-luxury QR review system' }
    ]
  },
  {
    id: 'maintenance',
    title: 'maintenance',
    icon: <Award className="w-5 h-5 text-primary" />,
    plans: [
      { name: 'Care Essential', price: '49€/mo', value: '588€/an', bonus: '30€ Brut', features: ['Security updates', 'Monthly backup', 'Gemini Monitoring'] },
      { name: 'Care Pro', price: '99€/mo', value: '1,188€/an', bonus: '50€ Brut', features: ['AI tuning quarterly', 'Priority WhatsApp', 'Strategy call x2/year'] }
    ]
  },
  {
    id: 'bridge',
    title: 'bridge',
    icon: <Globe className="w-5 h-5 text-primary" />,
    isSpecial: true
  }
];

export function Intelligence() {
  const { t } = useTranslation();
  const { userRole, apiKey, user } = useDashboardStore();
  const [copied, setCopied] = React.useState(false);
  const [isTestLoading, setIsTestLoading] = React.useState(false);

  const testCapture = async () => {
    if (!apiKey) {
      toast.error('Generate an API Key first in Settings > Security');
      return;
    }
    setIsTestLoading(true);
    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          name: "Test Nexus Simulation",
          email: user?.email || "test@simulation.com",
          phone: "+39 123 456 789",
          message: "Auto-generated test lead from Bridge Simulation console.",
          source: "Bridge Simulation"
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Simulation successful! Lead captured.');
      } else {
        toast.error(`Simulation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('Simulation error. Check console.');
    } finally {
      setIsTestLoading(false);
    }
  };

  const copySnippet = () => {
    const snippet = `
<!-- Nexus Hub Lead Capture -->
<script>
  window.NEXUS_HUB_CONFIG = {
    apiKey: "${apiKey}",
    endpoint: "${window.location.origin}/api/leads/capture"
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/digitalinexus/nexus-hub-lead-capture@main/dist/capture.js" async></script>
    `.trim();
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const partnershipTopic = TOPICS.find(t => t.id === 'partnership');
  const filteredPhilosophy = partnershipTopic?.content?.philosophy.filter(item => {
    // Hide protected margin for affiliates as per request
    if (userRole === 'affiliate' && item.title === 'protected_margin') return false;
    return true;
  }) || [];

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          {t('sd_intelligence')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('sd_intelligence_desc')}
        </p>
      </div>

      <Tabs defaultValue="partnership" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 backdrop-blur-sm self-start inline-flex">
          {TOPICS.map((topic) => (
            <TabsTrigger 
              key={topic.id} 
              value={topic.id}
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
            >
              {topic.icon}
              {t(topic.title)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="partnership" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPhilosophy.map((item: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass h-full border-none rounded-3xl overflow-hidden group">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      {item.icon}
                    </div>
                    <CardTitle className="text-2xl">{t(item.title)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {t(item.description)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="glass border-none rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                {t('golden_rules')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {TOPICS[0].content?.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3 text-lg text-muted-foreground">
                    <div className="p-1 rounded-full bg-primary/20 text-primary mt-1">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    {t(rule)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOPICS[1].packs?.map((pack, index) => (
              <Card key={index} className="glass border-none rounded-3xl overflow-hidden relative group">
                {index === 1 && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">{t('popular')}</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{pack.name}</CardTitle>
                  <div className="flex flex-col gap-1">
                    <span className="text-4xl font-bold">{pack.price}</span>
                    <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                      {t('affiliate_budget')}: {pack.commission}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-px bg-border/50" />
                  <ul className="space-y-3">
                    {pack.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOPICS[1].addons?.map((addon, index) => (
              <Card key={index} className="glass border-none rounded-2xl overflow-hidden p-6 flex flex-row items-center justify-between group hover:bg-white/5 transition-colors">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-lg">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground">{addon.desc}</p>
                </div>
                <div className="text-2xl font-bold text-primary">{addon.price}</div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TOPICS[2].plans?.map((plan, index) => (
              <Card key={index} className="glass border-none rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-6 mb-6">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground underline">{t('value_label')} {plan.value}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-black">{plan.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-2xl text-center border border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase mb-1">{t('gross_bonus')}</p>
                      <p className="text-2xl font-bold text-primary">{plan.bonus}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/10">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Trigger</p>
                      <p className="text-lg font-bold">First Payment</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bridge" className="space-y-8">
          <Card className="glass border-none rounded-3xl overflow-hidden p-8">
            <div className="max-w-3xl space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">{t('bridge')}</h2>
                <p className="text-muted-foreground text-lg">
                  {t('bridge_desc')}
                </p>
              </div>

              <div className="bg-black/40 p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Integration Snippet
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={testCapture}
                      disabled={isTestLoading}
                      className="rounded-xl h-10 gap-2 border-primary/20 hover:bg-primary/10 text-primary"
                    >
                      {isTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                      Run Simulation
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copySnippet}
                      className="rounded-xl h-10 gap-2 hover:bg-white/5"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                </div>
                <pre className="text-[10px] md:text-sm font-mono text-muted-foreground bg-white/5 p-4 rounded-xl overflow-x-auto border border-white/5 leading-relaxed">
{`<!-- Nexus Hub Lead Capture -->
<script>
  window.NEXUS_HUB_CONFIG = {
    apiKey: "${apiKey}",
    endpoint: "${window.location.origin}/api/leads/capture"
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/mockuser/nexus-hub-lead-capture@main/dist/capture.js" async></script>`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{t('how_to_integrate', 'Zero-Code Setup')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('bridge_instructions')}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-bold">{t('security')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('bridge_payload_desc')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-primary/10 border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            {t('need_help')}
          </h2>
          <p className="text-muted-foreground max-w-xl">
            {t('support_team_desc')}
          </p>
        </div>
        <Button className="rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all">
          {t('contact_support')}
        </Button>
      </Card>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
