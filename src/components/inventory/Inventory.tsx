import { 
  Plus, 
  Copy, 
  Link as LinkIcon, 
  ShoppingCart,
  Check,
  Zap,
  Shield,
  Crown,
  MapPin,
  Sparkles,
  QrCode,
  CreditCard,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'sonner';
import { useDashboardStore } from '@/src/store';
import { Product } from '@/src/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

import { InvoiceGeneratorModal } from './InvoiceGeneratorModal';

const iconMap: Record<string, any> = {
  Zap, Shield, Crown, MapPin, Sparkles, QrCode, CreditCard
};

interface ProductCardProps {
  key?: string;
  product: Product;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
}

function ProductCard({ product, isAdmin, onDelete, onSelect }: ProductCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[product.iconName || 'Zap'] || Zap;

  const copyFeatures = () => {
    const list = product.features?.map(f => `• ${f}`).join('\n') || '';
    navigator.clipboard.writeText(`${product.name} (${product.price} €)\n${list}`);
    toast.success(t('feature_list_copied'));
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative rounded-3xl p-8 transition-all duration-500 cursor-pointer overflow-hidden group h-[450px]",
        "bg-[#0A0A0A] border-2",
        product.borderColor || "border-white/10"
      )}
      style={{
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
      }}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 transition-opacity duration-500",
        isHovered ? "opacity-40" : "opacity-20",
        (product.color || "text-primary").replace('text-', 'bg-')
      )} />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5", product.color || "text-primary")}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Badge className={cn("bg-white/5 border-none font-bold", product.color || "text-primary")}>
              {product.price} €
            </Badge>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-4">{product.name}</h3>
        
        <ul className="space-y-3 mb-8 flex-1 overflow-y-auto no-scrollbar">
          {product.features?.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[#6F767E]">
              <Check className={cn("w-4 h-4", product.color || "text-primary")} />
              {feature}
            </li>
          ))}
        </ul>

        {/* Quick Actions Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-auto flex flex-col gap-2"
            >
              <Button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (onSelect) onSelect(product.id);
                  toast.success(t('added_to_quote')); 
                }}
                className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-10 text-xs font-bold"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                {t('add_to_quote')}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={(e) => { e.stopPropagation(); copyFeatures(); }}
                  variant="outline" 
                  className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-10 text-[10px] font-bold"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  {t('copy_list')}
                </Button>
                <Button 
                  onClick={(e) => { e.stopPropagation(); toast.success(t('payment_link_copied')); }}
                  variant="outline" 
                  className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-10 text-[10px] font-bold"
                >
                  <LinkIcon className="w-3.5 h-3.5 mr-2" />
                  {t('pay_link')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function Inventory() {
  const { t } = useTranslation();
  const { products, addProduct, deleteProduct, userRole } = useDashboardStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  const totalValue = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  // Initial products from Intel
  const corePacks: Omit<Product, 'id'>[] = [
    {
      name: 'Pack Essential',
      category: 'Core Pack',
      stock: 999,
      price: 849,
      status: 'In Stock',
      features: ['5-7 page website', 'LiteSpeed hosting optimized', 'Local SEO — Google Maps', '100% client ownership'],
      color: 'text-blue-400',
      borderColor: 'border-blue-400/30',
      iconName: 'Zap'
    },
    {
      name: 'Pack Professional',
      category: 'Core Pack',
      stock: 999,
      price: 1599,
      status: 'In Stock',
      features: ['Everything in Essential', 'AI Concierge — Gemini 1.5', 'Lead Hub micro-CRM (Firebase)', 'WhatsApp Connect'],
      color: 'text-primary',
      borderColor: 'border-primary/30',
      iconName: 'Crown'
    },
    {
      name: 'Pack Custom',
      category: 'Core Pack',
      stock: 999,
      price: 2999,
      status: 'In Stock',
      features: ['Full ERP / CRM su misura', 'Payment & billing automation', 'Deep API integrations', 'Starting price'],
      color: 'text-purple-400',
      borderColor: 'border-purple-400/30',
      iconName: 'Sparkles'
    }
  ];

  const addOns: Omit<Product, 'id'>[] = [
    {
      name: 'Google Local',
      category: 'Add-on',
      stock: 999,
      price: 249,
      status: 'In Stock',
      features: ['Aggressive Google Business optimization', 'Dominate Maps vs competitors'],
      color: 'text-orange-400',
      borderColor: 'border-orange-400/30',
      iconName: 'MapPin'
    },
    {
      name: 'AI Content',
      category: 'Add-on',
      stock: 999,
      price: 349,
      status: 'In Stock',
      features: ['5 high-quality SEO articles', 'Drives organic traffic'],
      color: 'text-emerald-400',
      borderColor: 'border-emerald-400/30',
      iconName: 'Zap'
    },
    {
      name: 'Reputation QR',
      category: 'Add-on',
      stock: 999,
      price: 179,
      status: 'In Stock',
      features: ['Cyber-luxury QR system', 'Collect 5-star Google reviews'],
      color: 'text-pink-400',
      borderColor: 'border-pink-400/30',
      iconName: 'QrCode'
    }
  ];

  const maintenance: Omit<Product, 'id'>[] = [
    {
      name: 'Care Essential',
      category: 'Maintenance',
      stock: 999,
      price: 49,
      status: 'In Stock',
      features: ['Security updates', 'Monthly backup', 'Gemini API monitoring', '1h changes/month'],
      color: 'text-blue-400',
      borderColor: 'border-blue-400/30',
      iconName: 'Shield'
    },
    {
      name: 'Care Pro',
      category: 'Maintenance',
      stock: 999,
      price: 99,
      status: 'In Stock',
      features: ['Everything Essential', 'AI tuning quarterly', '3h changes/month', 'Priority WhatsApp'],
      color: 'text-primary',
      borderColor: 'border-primary/30',
      iconName: 'Crown'
    }
  ];

  // Auto-seed if empty and isAdmin
  useEffect(() => {
    if (isAdmin && products.length === 0) {
      const seed = async () => {
        const allInitial = [...corePacks, ...addOns, ...maintenance];
        for (const p of allInitial) {
          // Double check to prevent duplicates in case of race conditions
          if (!products.some(existing => existing.name === p.name)) {
            await addProduct(p);
          }
        }
        toast.info(t('inventory_synced', 'Inventory synced with latest Nexus Agency catalog'));
      };
      // Short delay to avoid race condition with initial Firebase fetch
      const timer = setTimeout(seed, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, products.length, addProduct]);

  const handleSeedProducts = async () => {
    const allInitial = [...corePacks, ...addOns, ...maintenance];
    for (const p of allInitial) {
      if (!products.find(existing => existing.name === p.name)) {
        await addProduct(p);
      }
    }
    toast.success('Inventory seeded with Nexus Agency products');
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const productData: Omit<Product, 'id'> = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      price: Number(formData.get('price')),
      status: 'In Stock',
      features: (formData.get('features') as string).split(',').map(f => f.trim()),
      color: 'text-primary',
      borderColor: 'border-primary/30',
      iconName: 'Zap'
    };
    await addProduct(productData);
    setIsAddModalOpen(false);
    toast.success(t('product_added'));
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('core_arsenal')}</h1>
          <p className="text-[#6F767E] mt-2">{t('digital_presence_foundation')}</p>
        </div>
        <div className="flex gap-4">
          {isAdmin && products.length === 0 && (
            <Button 
              onClick={handleSeedProducts}
              variant="outline" 
              className="rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 h-12 px-6 text-primary font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Seed Nexus Products
            </Button>
          )}
          <Button onClick={() => setIsInvoiceModalOpen(true)} variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 h-12 px-6">
            {t('view_draft_quote')}
          </Button>
          
          {isAdmin && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl h-12 px-8 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                  <Plus className="w-5 h-5 mr-2" /> {t('custom_item')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t('add_custom_item')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('item_name')}</Label>
                    <Input id="name" name="name" required className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('price')} (€)</Label>
                      <Input id="price" name="price" type="number" required className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t('initial_stock')}</Label>
                      <Input id="stock" name="stock" type="number" required className="rounded-xl bg-white/5 border-none h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category')}</Label>
                    <Input id="category" name="category" required className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="features">{t('features_comma')}</Label>
                    <Input id="features" name="features" placeholder="Feature 1, Feature 2, Feature 3" className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">{t('add_to_arsenal')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="relative group">
            <ProductCard 
              product={product}
              isAdmin={isAdmin}
              onDelete={deleteProduct}
              onSelect={toggleProductSelection}
            />
            <div className="absolute top-4 left-4 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleProductSelection(product.id); }}
                className={cn(
                  "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                  selectedProductIds.includes(product.id) 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "border-white/20 bg-black/50 text-transparent hover:border-primary/50"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Default Items if empty */}
        {products.length === 0 && (
          <div className="col-span-3 text-center py-20 bg-white/5 rounded-3xl border border-dashed border-border">
            <p className="text-muted-foreground">{t('no_items_arsenal')}</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-8 shadow-2xl z-50"
      >
        <div className="flex items-center gap-4 px-4 border-r border-white/10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[10px] text-[#6F767E] font-bold uppercase">{t('active_quote')}</p>
            <p className="text-sm font-bold">{t('items_selected', { count: selectedProductIds.length })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#6F767E] font-bold uppercase">{t('total_value')}</p>
          <p className="text-xl font-bold text-primary">{totalValue.toLocaleString()} €</p>
        </div>
        <Button onClick={() => setIsInvoiceModalOpen(true)} className="bg-white text-black hover:bg-white/90 rounded-xl px-8 font-bold h-12">
          {t('generate_invoice')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>

      <InvoiceGeneratorModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        selectedProducts={selectedProducts} 
      />
    </div>
  );
}
