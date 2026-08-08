
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Transaction, Category, Wallet, Currency } from '../types';

export const generateAndSharePDF = async (
  elementId: string,
  fileName: string
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return;
    }

    // Create a clone to render off-screen but visible to html2canvas
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove hidden classes and ensure visibility
    clone.classList.remove('hidden', 'print:block', 'print:flex');
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '0';
    clone.style.width = '210mm'; // A4 width
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    
    // Append to body
    document.body.appendChild(clone);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    await doc.html(clone, {
      callback: async (doc) => {
        // Clean up
        document.body.removeChild(clone);
        
        if (Capacitor.isNativePlatform()) {
          // Mobile: Write to filesystem and Share
          const base64Data = doc.output('datauristring').split(',')[1];
          
          try {
            const result = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
              // encoding is not needed for base64 data in recent Capacitor versions or defaults to binary
            });

            await Share.share({
              title: 'Thari Report',
              text: 'Here is your financial report.',
              url: result.uri,
              dialogTitle: 'Share PDF',
            });
          } catch (e) {
            console.error('Error sharing PDF:', e);
            alert('Failed to share PDF. Please check permissions.');
          }
        } else {
          // Web: Download directly
          doc.save(fileName);
        }
      },
      x: 0,
      y: 0,
      width: 210, // A4 width in mm
      windowWidth: 800, // CSS pixels width
      html2canvas: {
        scale: 0.25, // Adjust scale to fit content better if needed
        useCORS: true,
        logging: false
      },
      margin: [10, 10, 10, 10],
      autoPaging: 'text'
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Could not generate PDF. Please try again.');
  }
};

export const buildExecutiveCSVContent = ({
  transactions,
  categories,
  wallets,
  userName = 'مستخدم ثري',
  currency,
  exchangeRates = {},
  type = 'detailed',
  filterWalletId = null,
  filterCurrency = null
}: {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  userName?: string;
  currency: Currency;
  exchangeRates?: Record<string, number>;
  type?: 'summary' | 'detailed';
  filterWalletId?: string | null;
  filterCurrency?: string | null;
}): string => {
  let activeTxs = filterWalletId 
    ? transactions.filter(t => t.walletId === filterWalletId) 
    : transactions;

  if (filterCurrency) {
    activeTxs = activeTxs.filter(t => t.currency === filterCurrency);
  }

  const activeWallet = filterWalletId ? wallets.find(w => w.id === filterWalletId) : null;
  const statementId = `THARI-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const issueDate = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const issueTime = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const currCode = currency?.code || 'SAR';
  const currSymbol = currency?.symbol || 'ر.س';

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;

  activeTxs.forEach(t => {
    const converted = convertCurrency(t.amount, t.currency, currCode, exchangeRates);
    if (t.type === 'income') totalIncome += converted;
    if (t.type === 'expense') totalExpense += converted;
  });

  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = activeTxs
        .filter(t => t.categoryId === c.id && t.type === 'expense')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, currCode, exchangeRates), 0);
      return { name: c.name, amount };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Wallets breakdown (if no specific wallet filter)
  const walletBalances = !filterWalletId ? wallets.map(w => {
    const converted = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (convertCurrency(t.amount, t.currency, currCode, exchangeRates) * (t.type === 'income' ? 1 : -1)), 0);
    return { name: w.name, currencyCode: w.currencyCode, balance: converted };
  }) : [];

  const displayTxs = type === 'summary' ? activeTxs.slice(0, 20) : activeTxs;

  const escapeCSV = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines: string[] = [];

  // Creative Executive Institutional Header
  csvLines.push(`========================================================================================================`);
  csvLines.push(`تطبيق ثري المالي - كشف الحساب والتقرير المالي المؤسسي الشامل (Thari Executive Financial Report)`);
  csvLines.push(`========================================================================================================`);
  csvLines.push(`صاحب الحساب,${escapeCSV(userName)},مرجع المستند,${escapeCSV(statementId)},تاريخ الإصدار,${escapeCSV(issueDate + ' ' + issueTime)}`);
  csvLines.push(`نوع التقرير,${escapeCSV(type === 'detailed' ? 'كشف تفصيلي كامل' : 'ملخص مالي مختصر')},نطاق التقرير,${escapeCSV(activeWallet ? activeWallet.name : 'جميع المحافظ')},العملة الأساسية,${escapeCSV(currCode + ' (' + currSymbol + ')')}`);
  csvLines.push(`--------------------------------------------------------------------------------------------------------`);
  csvLines.push(`الملخص المالي العام:`);
  csvLines.push(`إجمالي الواردات (المقبوضات),+${Math.round(totalIncome)} ${currSymbol},إجمالي المنصرفات (المصروفات),-${Math.round(totalExpense)} ${currSymbol},صافي الحركة المالية,${Math.round(netBalance)} ${currSymbol}`);
  csvLines.push(`--------------------------------------------------------------------------------------------------------`);

  // Wallet Breakdown Section
  if (walletBalances.length > 0) {
    csvLines.push(`توزيع أرصدة المحافظ المالية (مقيمة بـ ${currCode}):`);
    csvLines.push(`اسم المحفظة,العملة الأصلية,الرصيد المعادل (${currCode})`);
    walletBalances.forEach(w => {
      csvLines.push(`${escapeCSV(w.name)},${escapeCSV(w.currencyCode)},${Math.round(w.balance)} ${currSymbol}`);
    });
    csvLines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Expense Category Breakdown Section
  if (categoryBreakdown.length > 0) {
    csvLines.push(`تحليل الإنفاق حسب التصنيفات:`);
    csvLines.push(`اسم التصنيف,المبلغ المقدر (${currCode}),النسبة المئوية من إجمالي المنصرفات`);
    categoryBreakdown.forEach(c => {
      const pct = totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) + '%' : '0%';
      csvLines.push(`${escapeCSV(c.name)},${Math.round(c.amount)} ${currSymbol},${pct}`);
    });
    csvLines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Detailed Transaction Records
  csvLines.push(`سجل المعاملات والعمليات المالية التفصيلية (${displayTxs.length} عملية):`);
  csvLines.push(`التاريخ,نوع العملية,التصنيف,المحفظة,المبلغ الأصلي,العملة الأصلية,المبلغ المعادل (${currCode}),البيان / الملاحظة`);

  displayTxs.forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || 'غير مصنف';
    const wallet = wallets.find(w => w.id === t.walletId)?.name || 'محفظة';
    const typeLabel = t.type === 'income' ? 'إيراد (+)' : 'مصروف (-)';
    const converted = convertCurrency(t.amount, t.currency, currCode, exchangeRates);
    csvLines.push(`${escapeCSV(t.date)},${escapeCSV(typeLabel)},${escapeCSV(cat)},${escapeCSV(wallet)},${t.amount},${escapeCSV(t.currency)},${Math.round(converted)} ${currSymbol},${escapeCSV(t.note || '-')}`);
  });

  csvLines.push(`--------------------------------------------------------------------------------------------------------`);
  csvLines.push(`إجمالي الحركة والمعاملات, , , , , ,${Math.round(netBalance)} ${currSymbol},عدد العمليات المسجلة: ${displayTxs.length} عملية`);
  csvLines.push(`تنويه هام,تم توليد هذا المستند المؤسسي إلكترونياً وبشكل آمن مباشرة من تطبيق ثري لإدارة الثروة والمالية الشخصية.`);
  csvLines.push(`========================================================================================================`);

  return '\ufeff' + csvLines.join('\n');
};

export const exportAndShareExecutiveCSV = async (
  csvContent: string,
  fileName: string = `Thari_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`
) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: 'تقرير ثري المالي (Excel CSV)',
        text: 'كشف الحساب والتقرير المالي المؤسسي من تطبيق ثري',
        url: result.uri,
        dialogTitle: 'تصدير ومشاركة التقرير',
      });
    } catch (e) {
      console.error('Error sharing CSV:', e);
      alert('تم إكمال التصدير بنجاح.');
    }
  } else {
    // Web Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};

export const generateAndShareCSV = async (
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[]
) => {
  const header = ['التاريخ', 'النوع', 'التصنيف', 'المبلغ الأصلي', 'العملة', 'المحفظة', 'ملاحظات'];
  const rows = transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || 'غير مصنف';
    const wallet = wallets.find(w => w.id === t.walletId)?.name || 'محفظة محذوفة';
    const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
    const typeLabel = t.type === 'income' ? 'دخل' : 'صرف';
    return `${t.date},${typeLabel},${cat},${t.amount},${t.currency},${wallet},${note}`;
  });
  
  const csvContent = '\ufeff' + [header.join(','), ...rows].join('\n');
  const fileName = `Thari_Transactions_${new Date().toISOString().split('T')[0]}.csv`;

  await exportAndShareExecutiveCSV(csvContent, fileName);
};

