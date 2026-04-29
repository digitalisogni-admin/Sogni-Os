import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Product } from '@/src/types';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  price: string;
  total: string;
}

interface InvoiceGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts?: Product[];
}

export function InvoiceGeneratorModal({ isOpen, onClose, selectedProducts = [] }: InvoiceGeneratorModalProps) {
  const { t } = useTranslation();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [agencyInfo, setAgencyInfo] = useState({
    name: 'Nexus Agency',
    details: 'JOHN DOE\nJOHN.DOE@EXAMPLE.COM\n123 MOCKUP STREET, NY 10001\nVAT : US123456789'
  });

  const [clientInfo, setClientInfo] = useState('A mock client corp');
  
  const [items, setItems] = useState<InvoiceItem[]>(
    selectedProducts.length > 0 
      ? selectedProducts.map(p => ({
          id: p.id,
          description: p.name,
          quantity: '1',
          price: p.price.toString(),
          total: p.price.toString()
        }))
      : [
          { id: '1', description: 'Infrastruttura web, ottimizzazione per i motori di ricerca locale e Google', quantity: '1', price: '800', total: '800' },
          { id: '2', description: 'Integrazione dei social network nel sito web', quantity: '1', price: '0', total: '0' },
          { id: '3', description: 'Chatbot IA e Formazione Professionale', quantity: '1', price: '0', total: '0' },
          { id: '4', description: 'Hostinger 1 anno (CODICE PROMOZIONALE: IK5TRAVELFS4)', quantity: '1 anno', price: '227,88', total: '11,88' },
        ]
  );

  const [iva, setIva] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [terms, setTerms] = useState('Al saldo della fattura, la proprietà del sito web e dei contenuti social viene trasferita completamente al Cliente. Le licenze dei software di terze parti (Hostinger) sono a carico del Cliente per i rinnovi annuali successivi al primo anno.');

  useEffect(() => {
    if (isOpen && selectedProducts.length > 0) {
      setItems(selectedProducts.map(p => ({
        id: p.id,
        description: p.name,
        quantity: '1',
        price: p.price.toString(),
        total: p.price.toString()
      })));
    }
  }, [isOpen, selectedProducts]);

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: '1', price: '0', total: '0' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate total if quantity and price are numbers
        if (field === 'quantity' || field === 'price') {
          const q = parseFloat(updatedItem.quantity.replace(',', '.'));
          const p = parseFloat(updatedItem.price.replace(',', '.'));
          if (!isNaN(q) && !isNaN(p)) {
            updatedItem.total = (q * p).toFixed(2).replace('.', ',');
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const total = parseFloat(item.total.replace(',', '.'));
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = (subtotal * parseFloat(discount) / 100) || 0;
  const ivaAmount = ((subtotal - discountAmount) * parseFloat(iva) / 100) || 0;
  const total = subtotal - discountAmount + ivaAmount;

  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${clientInfo.replace(/\s+/g, '_')}.pdf`);
      
      toast.success(t('invoice_generated', 'Invoice generated successfully!'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('error_generating_invoice', 'Error generating invoice'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] sm:max-w-[100vw] w-full bg-card border-border text-foreground rounded-none h-[100vh] flex flex-col p-0 overflow-hidden m-0">
        <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('generate_invoice', 'Generate Invoice')}
          </DialogTitle>
          <Button onClick={generatePDF} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" />
            {t('download_pdf', 'Download PDF')}
          </Button>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Sidebar */}
          <div className="w-5/12 border-r border-border p-6 overflow-y-auto space-y-6 bg-black/20">
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">{t('agency_info', 'Agency Info')}</h3>
              <div className="space-y-2">
                <Label>{t('agency_name', 'Agency Name')}</Label>
                <Input value={agencyInfo.name} onChange={e => setAgencyInfo({...agencyInfo, name: e.target.value})} className="bg-white/5 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{t('agency_details', 'Agency Details')}</Label>
                <Textarea value={agencyInfo.details} onChange={e => setAgencyInfo({...agencyInfo, details: e.target.value})} className="bg-white/5 border-none rounded-xl h-24" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">{t('client_info', 'Client Info')}</h3>
              <div className="space-y-2">
                <Label>{t('client_name', 'Client Name')}</Label>
                <Input value={clientInfo} onChange={e => setClientInfo(e.target.value)} className="bg-white/5 border-none rounded-xl" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase text-muted-foreground">{t('items', 'Items')}</h3>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="h-8 rounded-lg border-border">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-xl space-y-3 relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Description</Label>
                    <Input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="h-8 text-xs bg-black/20 border-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Qty</Label>
                      <Input value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="h-8 text-xs bg-black/20 border-none" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Price</Label>
                      <Input value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="h-8 text-xs bg-black/20 border-none" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Total</Label>
                      <Input value={item.total} onChange={e => handleItemChange(item.id, 'total', e.target.value)} className="h-8 text-xs bg-black/20 border-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">{t('totals', 'Totals')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('iva_percentage', 'IVA (%)')}</Label>
                  <Input type="number" value={iva} onChange={e => setIva(e.target.value)} className="bg-white/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>{t('discount_percentage', 'Discount (%)')}</Label>
                  <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="bg-white/5 border-none rounded-xl" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">{t('terms', 'Terms & Conditions')}</h3>
              <div className="space-y-2">
                <Textarea value={terms} onChange={e => setTerms(e.target.value)} className="bg-white/5 border-none rounded-xl h-32" />
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="w-7/12 bg-neutral-200 overflow-y-auto p-8 flex justify-center">
            <div 
              ref={invoiceRef}
              className="w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl shrink-0"
              style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', color: '#000000' }}
            >
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter mb-8">{agencyInfo.name}</h1>
                  <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {agencyInfo.details}
                  </div>
                </div>
                <div className="text-right mt-16">
                  <div className="text-sm font-mono uppercase">{clientInfo}</div>
                </div>
              </div>

              <table className="w-full mb-16">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#000000' }}>
                    <th className="text-left py-4 font-normal text-sm w-1/2" style={{ color: '#4b5563' }}>Descrizione</th>
                    <th className="text-left py-4 font-normal text-sm" style={{ color: '#4b5563' }}>Quantità</th>
                    <th className="text-left py-4 font-normal text-sm" style={{ color: '#4b5563' }}>Prezzo</th>
                    <th className="text-left py-4 font-normal text-sm" style={{ color: '#4b5563' }}>Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: '#d1d5db' }}>
                      <td className="py-4 text-sm pr-4">{item.description}</td>
                      <td className="py-4 text-sm">{item.quantity}</td>
                      <td className="py-4 text-sm">{item.price}</td>
                      <td className="py-4 text-sm">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-16">
                <div className="w-1/3">
                  <div className="flex justify-between py-2 text-sm">
                    <span>Subtotale:</span>
                    <span>{subtotal.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-2 text-sm text-red-500">
                      <span>Sconto ({discount}%):</span>
                      <span>-{discountAmount.toFixed(2).replace('.', ',')} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-sm">
                    <span>IVA ({iva}%):</span>
                    <span>{ivaAmount.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  <div className="flex justify-between py-3 mt-2 px-4 rounded-full font-bold text-sm items-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                    <span>TOTALE:</span>
                    <span>{total.toFixed(2).replace('.', ',')} € IVA inclusa</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-16">
                <h4 className="font-bold mb-4">Termini e Condizioni di Servizio</h4>
                <p className="text-sm max-w-2xl mx-auto leading-relaxed font-mono" style={{ color: '#4b5563' }}>
                  {terms}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
