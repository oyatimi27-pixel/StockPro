import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchApi } from '../apiClient';
import { Plus, Trash2, Save, Printer, ArrowLeft } from 'lucide-react';
import { Client, Product, InvoiceItem, Settings } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWordsTND } from '../utils/numberToWords';

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi('/clients').catch(() => []),
      fetchApi('/products').catch(() => []),
      fetchApi('/settings').catch(() => ({}))
    ]).then(([clientsRes, productsRes, settingsRes]) => {
      setClients(clientsRes || []);
      setProducts(productsRes || []);
      setSettings(settingsRes || {});
    });

    if (id) {
      // Allow editing instead of making it strictly read-only
      setIsReadOnly(false);
      fetchApi(`/invoices/${id}`).then(res => {
        if (!res) return;
        setInvoiceNumber(res.invoice_number || '');
        setDate(res.date || '');
        if (res.time) setTime(res.time);
        setClientId(String(res.client_id || ''));
        setGlobalDiscount(res.global_discount || 0);
        setItems(res.items || []);
      }).catch(err => {
        console.error("Error loading invoice:", err);
      });
    } else {
      fetchApi('/invoices/util/next-number').then(res => {
        if (res?.next) setInvoiceNumber(res.next);
      }).catch(err => {
        console.error("Error getting next invoice number:", err);
      });
    }
  }, [id]);

  const baseHT = items.reduce((sum, item) => sum + item.total_ht, 0);
  const baseTVA = items.reduce((sum, item) => sum + ((item.total_ht * item.tva) / 100), 0);
  
  const globalDiscountAmount = baseHT * (globalDiscount / 100);
  const totalHT = baseHT - globalDiscountAmount;
  
  const globalDiscountTVA = baseTVA * (globalDiscount / 100);
  const totalTVA = baseTVA - globalDiscountTVA;
  
  const fiscalStamp = settings.fiscal_stamp || 1.000;
  const totalTTC = totalHT + totalTVA + fiscalStamp;

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => String(p.id) === selectedProduct);
    if (!prod) return;

    if (prod.stock_quantity < quantity) {
      alert(`Attention: Le stock disponible pour ${prod.designation} est de ${prod.stock_quantity}.`);
    }

    const itemBaseHT = prod.sale_price * quantity;
    const itemDiscountAmount = itemBaseHT * (discount / 100);
    const itemTotalHT = itemBaseHT - itemDiscountAmount;

    const newItem: InvoiceItem = {
      product_id: prod.id,
      designation: prod.designation,
      quantity: quantity,
      unit_price_ht: prod.sale_price,
      tva: prod.tva,
      discount: discount,
      total_ht: itemTotalHT,
      total_ttc: itemTotalHT * (1 + (prod.tva / 100))
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!clientId) return alert("Veuillez sélectionner un client.");
    if (items.length === 0) return alert("Veuillez ajouter au moins un produit.");

    const payload = {
      invoice_number: invoiceNumber,
      date,
      time,
      client_id: parseInt(clientId),
      total_ht: totalHT,
      total_tva: totalTVA,
      fiscal_stamp: fiscalStamp,
      total_ttc: totalTTC,
      global_discount: globalDiscount,
      items
    };

    try {
      if (id) {
        await fetchApi(`/invoices/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert('Facture modifiée avec succès.');
      } else {
        await fetchApi('/invoices', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert('Facture validée avec succès.');
      }
      navigate('/invoices');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const generatePDF = (action: 'download' | 'print') => {
    const doc = new jsPDF();
    const client = clients.find(c => String(c.id) === clientId);
    if (!client) return;

    // --- 1. HEADER SECTION ---
    // Top Left: Logo
    if (settings.logo_path && settings.logo_path.trim() !== '') {
      try {
        const format = settings.logo_path.toLowerCase().includes('image/png') || settings.logo_path.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
        doc.addImage(settings.logo_path, format, 14, 8, 28, 20);
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 8, 28, 20, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, 8, 28, 20, 'S');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7.5);
        doc.setFont(undefined, 'bold');
        doc.text('LOGO', 28, 19, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, 8, 28, 20, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, 8, 28, 20, 'S');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      doc.text('LOGO', 28, 19, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Top Right Company Details (Right aligned, dynamic from settings)
    let curY = 8;
    const activity = settings.activity || '';
    const commercialReg = settings.commercial_register || '';
    const companyName = settings.company_name || '';
    const address = settings.address || '';
    const city = settings.city || '';
    const phone = settings.phone || '';
    const mobile = settings.mobile || '';
    const email = settings.email || '';
    const taxId = settings.tax_id || '';

    if (companyName) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(companyName, 196, curY, { align: 'right' });
      curY += 4.5;
    }

    if (activity) {
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(70, 70, 70);
      doc.text(activity, 196, curY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      curY += 3.8;
    }

    doc.setFontSize(7.5);
    doc.setFont(undefined, 'normal');
    const fullAddress = [address, city].filter(Boolean).join(' - ');
    if (fullAddress) {
      doc.text(fullAddress, 196, curY, { align: 'right' });
      curY += 3.8;
    }
    if (phone) {
      doc.text(`Tél : ${phone}`, 196, curY, { align: 'right' });
      curY += 3.8;
    }
    if (mobile) {
      doc.text(`Mobile : ${mobile}`, 196, curY, { align: 'right' });
      curY += 3.8;
    }
    if (email) {
      doc.text(`Email : ${email}`, 196, curY, { align: 'right' });
      curY += 3.8;
    }
    if (taxId) {
      doc.text(`MF : ${taxId}`, 196, curY, { align: 'right' });
      curY += 3.8;
    }
    if (commercialReg) {
      doc.text(`RC : ${commercialReg}`, 196, curY, { align: 'right' });
      curY += 3.8;
    }

    // Horizontal separator line below all header information
    const separatorY = Math.max(curY + 1.5, 34);
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, separatorY, 196, separatorY);

    // --- 2. SIDE-BY-SIDE BOXES (FACTURE BOX & CLIENT BOX) ---
    const boxY = separatorY + 3;
    const boxH = 26;

    // FACTURE BOX (Left: x=14, w=68)
    doc.setDrawColor(0, 0, 0);
    doc.roundedRect(14, boxY, 68, boxH, 2, 2);
    doc.setFontSize(10.5);
    doc.setFont(undefined, 'bold');
    doc.text('FACTURE', 48, boxY + 5.2, { align: 'center' });
    
    doc.setLineWidth(0.2);
    doc.line(14, boxY + 7.5, 82, boxY + 7.5);

    // Inner Grid Header inside FACTURE box (4 Columns: Numéro, Date, Heure, Page)
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.text('Numéro', 25, boxY + 11.5, { align: 'center' });
    doc.text('Date', 44.5, boxY + 11.5, { align: 'center' });
    doc.text('Heure', 61.5, boxY + 11.5, { align: 'center' });
    doc.text('Page', 76, boxY + 11.5, { align: 'center' });

    doc.line(14, boxY + 14, 82, boxY + 14);
    doc.line(36, boxY + 7.5, 36, boxY + boxH);
    doc.line(53, boxY + 7.5, 53, boxY + boxH);
    doc.line(70, boxY + 7.5, 70, boxY + boxH);

    // Inner Grid Values
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'normal');
    const formattedDate = date.split('-').reverse().join('/');
    doc.text(invoiceNumber || '', 25, boxY + 20, { align: 'center' });
    doc.text(formattedDate, 44.5, boxY + 20, { align: 'center' });
    doc.text(time || '', 61.5, boxY + 20, { align: 'center' });
    doc.text('1/1', 76, boxY + 20, { align: 'center' });

    // CLIENT BOX (Right: x=86, w=110)
    doc.roundedRect(86, boxY, 110, boxH, 2, 2);
    doc.setFontSize(8);
    
    doc.setFont(undefined, 'bold');
    doc.text('Code :', 89, boxY + 4.8);
    doc.setFont(undefined, 'normal');
    doc.text(client.code || '', 112, boxY + 4.8);

    doc.setFont(undefined, 'bold');
    doc.text('Client :', 89, boxY + 9.3);
    doc.setFont(undefined, 'normal');
    doc.text(client.name || '', 112, boxY + 9.3);

    doc.setFont(undefined, 'bold');
    doc.text('Téléphone :', 89, boxY + 13.8);
    doc.setFont(undefined, 'normal');
    doc.text(client.phone || '', 112, boxY + 13.8);

    doc.setFont(undefined, 'bold');
    doc.text('M.F :', 89, boxY + 18.3);
    doc.setFont(undefined, 'normal');
    doc.text(client.tax_id || '', 112, boxY + 18.3);

    doc.setFont(undefined, 'bold');
    doc.text('Adresse :', 89, boxY + 22.8);
    doc.setFont(undefined, 'normal');
    doc.text(client.address || '', 112, boxY + 22.8);

    // --- 3. CALCULATE TVA SUMMARY ---
    const tvaSummary: Record<number, { base: number, amount: number }> = {};
    items.forEach(item => {
      const itemBaseHT = item.unit_price_ht * item.quantity;
      const itemDiscountAmount = itemBaseHT * (item.discount || 0) / 100;
      const itemNetHT = itemBaseHT - itemDiscountAmount;
      
      const rate = item.tva;
      if (!tvaSummary[rate]) {
        tvaSummary[rate] = { base: 0, amount: 0 };
      }
      tvaSummary[rate].base += itemNetHT;
      tvaSummary[rate].amount += itemNetHT * (rate / 100);
    });

    if (globalDiscount > 0) {
      const discountFactor = 1 - (globalDiscount / 100);
      Object.keys(tvaSummary).forEach(key => {
        const rate = Number(key);
        tvaSummary[rate].base *= discountFactor;
        tvaSummary[rate].amount *= discountFactor;
      });
    }

    // --- 4. PRODUCT TABLE (Only actual products, no empty rows) ---
    const tableColumn = ["Désignation", "Rem %", "Qté", "P.U.H.T", "TVA %", "P.T.H.T", "P.T.T.C"];
    const tableRows = items.map(item => [
      item.designation,
      (item.discount || 0) > 0 ? `${item.discount}%` : '0.00',
      item.quantity.toString(),
      item.unit_price_ht.toFixed(3),
      item.tva.toString(),
      item.total_ht.toFixed(3),
      item.total_ttc.toFixed(3)
    ]);

    autoTable(doc, {
      startY: boxY + boxH + 4,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: 0 },
      columnStyles: {
        0: { cellWidth: 74, halign: 'left' },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 23, halign: 'right' },
        6: { cellWidth: 23, halign: 'right' }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 68;
    
    // Position bottom section at Y=204
    let footerY = 204;
    if (finalY > 200) {
      doc.addPage();
      footerY = 204;
    }

    // --- 5. BOTTOM SECTION ---
    
    // 1. TVA Box (Left: x=14, w=54, h=28)
    doc.roundedRect(14, footerY, 54, 28, 2, 2);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, footerY, 54, 5, 'F');
    doc.rect(14, footerY, 54, 5, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.text('Taxe', 16, footerY + 3.8);
    doc.text('Base', 33, footerY + 3.8);
    doc.text('Montant', 65, footerY + 3.8, { align: 'right' });
    
    doc.setFont(undefined, 'normal');
    let tvaY = footerY + 9.5;
    [0, 7, 13, 19].forEach(rate => {
      const summary = tvaSummary[rate];
      doc.text(`${rate}%`, 16, tvaY);
      if (summary) {
        doc.text(summary.base.toFixed(3), 33, tvaY);
        doc.text(summary.amount.toFixed(3), 65, tvaY, { align: 'right' });
      } else {
        doc.text('0.000', 33, tvaY);
        doc.text('0.000', 65, tvaY, { align: 'right' });
      }
      tvaY += 5;
    });

    // 2. Signature Area (Center: x=72, w=56, h=28)
    doc.roundedRect(72, footerY, 56, 28, 2, 2);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Signature & Cachet Société', 100, footerY + 6, { align: 'center' });

    // 3. Totals Area (Right: x=134 to x=196)
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    
    doc.text('P.T.H.T :', 134, footerY + 4);
    doc.text(`${baseHT.toFixed(3)} DT`, 196, footerY + 4, { align: 'right' });
    
    doc.text('Remise :', 134, footerY + 9);
    doc.text(`${globalDiscountAmount.toFixed(3)} DT`, 196, footerY + 9, { align: 'right' });
    
    doc.text('Net H.T :', 134, footerY + 14);
    doc.text(`${totalHT.toFixed(3)} DT`, 196, footerY + 14, { align: 'right' });
    
    doc.text('TVA :', 134, footerY + 19);
    doc.text(`${totalTVA.toFixed(3)} DT`, 196, footerY + 19, { align: 'right' });
    
    doc.text('T.T.C :', 134, footerY + 24);
    doc.text(`${(totalHT + totalTVA).toFixed(3)} DT`, 196, footerY + 24, { align: 'right' });
    
    doc.setLineWidth(0.3);
    doc.line(134, footerY + 26, 196, footerY + 26);

    doc.text('TIMBRE :', 134, footerY + 31);
    doc.text(`${fiscalStamp.toFixed(3)} DT`, 196, footerY + 31, { align: 'right' });

    doc.setFontSize(9.5);
    doc.text('Net à payer :', 134, footerY + 37);
    doc.text(`${totalTTC.toFixed(3)} DT`, 196, footerY + 37, { align: 'right' });

    // Amount in Words (Below TVA & Signature Boxes on left side)
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text('Arrêtée la présente facture à la somme de :', 14, footerY + 34);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(numberToWordsTND(totalTTC), 14, footerY + 40);

    // --- 6. BOTTOM FOOTER & PAGE NUMBERING ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Update Page Number inside FACTURE Box
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'normal');
      doc.setFillColor(255, 255, 255);
      doc.rect(71, boxY + 16, 10, 8, 'F');
      doc.text(`${i}/${totalPages}`, 76, boxY + 20, { align: 'center' });

      // Footer Divider Line
      doc.setLineWidth(0.3);
      doc.line(14, 265, 196, 265);

      // Centered Footer Text
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      const footerPhone = settings.phone || '';
      const footerMobile = settings.mobile || '';
      const footerEmail = settings.email || '';
      const footerParts: string[] = [];
      if (footerPhone) footerParts.push(`Tél : ${footerPhone}`);
      if (footerMobile) footerParts.push(`Mobile : ${footerMobile}`);
      if (footerEmail) footerParts.push(`E-mail : ${footerEmail}`);
      if (settings.website) footerParts.push(`Site : ${settings.website}`);
      if (footerParts.length > 0) {
        doc.text(footerParts.join('     -     '), 105, 270, { align: 'center' });
      }
    }

    if (action === 'download') {
      doc.save(`Facture_${invoiceNumber}.pdf`);
    } else {
      try {
        doc.autoPrint({ variant: 'non-conform' });
        const blobUrl = String(doc.output('bloburl'));
        
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.focus();
          setTimeout(() => {
            try {
              printWindow.print();
            } catch (e) {
              // autoPrint handles it natively in Chromium/Electron
            }
          }, 800);
        } else {
          // Fallback if popups are blocked by browser settings
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = 'none';
          iframe.src = blobUrl;
          document.body.appendChild(iframe);
        }

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      } catch (err) {
        console.error("Print Error:", err);
        alert("Impossible d'imprimer la facture.");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/invoices')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {isReadOnly ? 'Détails Facture' : 'Nouvelle Facture'}
          </h2>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => generatePDF('print')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" />
            Imprimer
          </button>
          <button 
            onClick={() => generatePDF('download')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center"
          >
            Télécharger PDF
          </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {id ? 'Mettre à jour' : 'Valider Facture'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">N° Facture</label>
          <input type="text" readOnly value={invoiceNumber} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-bold text-slate-700 dark:text-slate-300 outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date</label>
          <input type="date" readOnly={isReadOnly} value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Heure</label>
          <input type="time" step="1" readOnly={isReadOnly} value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Client</label>
          <select 
            disabled={isReadOnly} 
            value={clientId} 
            onChange={e => setClientId(e.target.value)} 
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none"
          >
            <option value="">Sélectionner un client...</option>
            {clients.filter(c => c.status === 'ACTIF' || !c.status).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!isReadOnly && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Produit</label>
            <select 
              value={selectedProduct} 
              onChange={e => setSelectedProduct(e.target.value)} 
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none"
            >
              <option value="">Choisir un produit...</option>
              {products.filter(p => p.status === 'ACTIF' || !p.status).map(p => <option key={p.id} value={p.id}>{p.code} - {p.designation} ({p.stock_quantity} en stock)</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Quantité</label>
            <input 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))} 
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" 
            />
          </div>
          <div className="w-24">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Remise %</label>
            <input 
              type="number" 
              min="0" 
              max="100"
              value={discount} 
              onChange={e => setDiscount(Number(e.target.value))} 
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" 
            />
          </div>
          <button 
            onClick={handleAddItem}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-[13px] font-bold uppercase tracking-wider hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors h-[38px] flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </button>
        </div>
      )}

      <table className="w-full text-left mb-8 text-[13px]">
        <thead className="bg-slate-100 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700">
          <tr>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Désignation</th>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center">Qté</th>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">P.U HT</th>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center">Remise %</th>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center">TVA %</th>
            <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Total HT</th>
            {!isReadOnly && <th className="py-2 px-4 font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.length === 0 ? (
            <tr><td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">Aucun produit ajouté</td></tr>
          ) : (
            items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-2 px-4 font-medium text-slate-700 dark:text-slate-200">{item.designation}</td>
                <td className="py-2 px-4 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                <td className="py-2 px-4 text-right text-slate-700 dark:text-slate-300">{item.unit_price_ht.toFixed(3)}</td>
                <td className="py-2 px-4 text-center text-slate-700 dark:text-slate-300 text-red-500">{item.discount || 0}%</td>
                <td className="py-2 px-4 text-center text-slate-700 dark:text-slate-300">{item.tva}</td>
                <td className="py-2 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{item.total_ht.toFixed(3)}</td>
                {!isReadOnly && (
                  <td className="py-2 px-4 text-right">
                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-80 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between mb-2 text-[13px] text-slate-600 dark:text-slate-400">
            <span>Total Brut HT</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{baseHT.toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between mb-2 text-[13px] text-slate-600 dark:text-slate-400 items-center">
            <span>Remise Globale %</span>
            {isReadOnly ? (
               <span className="font-semibold text-red-500">{globalDiscount}%</span>
            ) : (
               <input 
                 type="number" 
                 min="0"
                 max="100"
                 value={globalDiscount}
                 onChange={e => setGlobalDiscount(Number(e.target.value))}
                 className="w-16 px-2 py-1 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[13px] text-red-500 font-bold outline-none" 
               />
            )}
          </div>
          {globalDiscount > 0 && (
            <div className="flex justify-between mb-2 text-[13px] text-red-500 font-medium">
              <span>Montant Remise</span>
              <span>-{globalDiscountAmount.toFixed(3)} TND</span>
            </div>
          )}
          <div className="flex justify-between mb-2 text-[13px] text-slate-600 dark:text-slate-400">
            <span>Total Net HT</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalHT.toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between mb-2 text-[13px] text-slate-600 dark:text-slate-400">
            <span>TVA</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalTVA.toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700 text-[13px] text-slate-600 dark:text-slate-400">
            <span>Timbre Fiscal</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{fiscalStamp.toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-slate-100">
            <span>Total TTC</span>
            <span>{totalTTC.toFixed(3)} TND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
