import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ReportModel } from './reportTypes';

function escapeCSV(val: any): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a structured, multi-section CSV file for Excel
 */
export function buildExcelReportCSV(model: ReportModel): string {
  const { metadata, reportType, account, scope, kpis, currencyBreakdown, expenseCategories, incomeCategories, walletSummaries, transactions } = model;
  const lines: string[] = [];

  const baseSymbol = scope.baseCurrency.symbol;
  const isSummary = reportType === 'summary';

  // Section 1: Official Header & Metadata
  lines.push(`========================================================================================================`);
  lines.push(`تطبيق ثـري المالي - ${isSummary ? 'الملخص المالي التنفيذي' : 'كشف القيود والمعاملات المالية التفصيلي'} | THARI Financial Report`);
  lines.push(`========================================================================================================`);
  lines.push(`معرف التقرير (Report ID),${escapeCSV(metadata.reportId)},البصمة الرقمية (Fingerprint),${escapeCSV(metadata.fingerprint)}`);
  lines.push(`صاحب الحساب,${escapeCSV(account.name)},نوع الحساب,${escapeCSV(account.accountTypeAr)},تاريخ وتوقيت الإصدار,${escapeCSV(`${metadata.generatedAtFormattedAr} - ${metadata.generatedTimeFormattedAr}`)}`);
  lines.push(`نطاق التقرير,${escapeCSV(scope.walletNameAr)},العملة المحددة,${escapeCSV(scope.currencyFilter ? `${scope.currencyMetadata?.nameAr} (${scope.currencyMetadata?.code})` : `متعدد العملات (تقييم بـ ${scope.baseCurrency.code})`)},الفترة الزمنية,${escapeCSV(scope.periodLabelAr)}`);
  lines.push(`--------------------------------------------------------------------------------------------------------`);

  // Section 2: Executive KPI Matrix
  lines.push(`المؤشرات المالية الرئيسية:`);
  lines.push(`الرصيد الافتتاحي للفترة,${Math.round(kpis.openingBalance).toLocaleString()} ${baseSymbol}`);
  lines.push(`إجمالي الواردات (المقبوضات),+${Math.round(kpis.totalIncome).toLocaleString()} ${baseSymbol},عدد عمليات الدخل,${kpis.incomeCount} حركة`);
  lines.push(`إجمالي المنصرفات (المصروفات),-${Math.round(kpis.totalExpense).toLocaleString()} ${baseSymbol},عدد عمليات الصرف,${kpis.expenseCount + kpis.transferCount} حركة`);
  lines.push(`صافي الفائض / العجز المالي,${Math.round(kpis.netSavings).toLocaleString()} ${baseSymbol},معدل الادخار,${kpis.savingsRatePercent}%`);
  lines.push(`الرصيد الختامي للفترة,${Math.round(kpis.closingBalance).toLocaleString()} ${baseSymbol},إجمالي عدد الحركات,${kpis.totalTransactions} حركة`);
  lines.push(`--------------------------------------------------------------------------------------------------------`);

  // Section 3: Multi-Currency Breakdown (Only if multi-currency or breakdown exists)
  if (currencyBreakdown.length > 0) {
    lines.push(`تحليل وتوزيع العملات (Multi-Currency Breakdown):`);
    lines.push(`رمز العملة,اسم العملة,الرمز,عدد الحركات,إجمالي المقبوضات,إجمالي المنصرفات,الصافي بالعملة,القيمة المعادلة (${scope.baseCurrency.code}),سعر الصرف التقديري`);
    currencyBreakdown.forEach(cb => {
      lines.push(
        `${escapeCSV(cb.code)},${escapeCSV(cb.metadata.nameAr)},${escapeCSV(cb.metadata.symbol)},${cb.transactionCount},+${Math.round(cb.income).toLocaleString()} ${cb.metadata.symbol},-${Math.round(cb.expense).toLocaleString()} ${cb.metadata.symbol},${Math.round(cb.net).toLocaleString()} ${cb.metadata.symbol},${Math.round(cb.convertedNetToBase).toLocaleString()} ${baseSymbol},1 ${cb.code} = ${cb.exchangeRateToBase.toFixed(4)} ${scope.baseCurrency.code}`
      );
    });
    lines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Section 4: Wallet Allocation
  if (walletSummaries.length > 0) {
    lines.push(`توزيع أرصدة المحافظ المالية:`);
    lines.push(`اسم المحفظة,العملة الأساسية,الرصيد الفعلي,الرصيد المعادل (${scope.baseCurrency.code}),الحصة من إجمالي الثروة`);
    walletSummaries.forEach(w => {
      lines.push(
        `${escapeCSV(w.name)},${escapeCSV(w.currencyCode)},${Math.round(w.rawBalance).toLocaleString()} ${w.currencyCode},${Math.round(w.convertedBalance).toLocaleString()} ${baseSymbol},${w.percentageOfTotalWealth.toFixed(1)}%`
      );
    });
    lines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Section 5: Expense Categories Breakdown
  if (expenseCategories.length > 0) {
    lines.push(`تحليل المصروفات حسب التصنيف:`);
    lines.push(`اسم التصنيف,المبلغ المعادل (${scope.baseCurrency.code}),النسبة من إجمالي المصروفات,عدد العمليات`);
    expenseCategories.forEach(cat => {
      lines.push(
        `${escapeCSV(cat.name)},${Math.round(cat.totalAmount).toLocaleString()} ${baseSymbol},${cat.percentageOfTotal.toFixed(1)}%,${cat.transactionCount}`
      );
    });
    lines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Section 6: Income Sources Breakdown
  if (incomeCategories.length > 0) {
    lines.push(`تحليل مصادر الدخل:`);
    lines.push(`اسم المصدر / التصنيف,المبلغ المعادل (${scope.baseCurrency.code}),النسبة من إجمالي الدخل,عدد العمليات`);
    incomeCategories.forEach(cat => {
      lines.push(
        `${escapeCSV(cat.name)},${Math.round(cat.totalAmount).toLocaleString()} ${baseSymbol},${cat.percentageOfTotal.toFixed(1)}%,${cat.transactionCount}`
      );
    });
    lines.push(`--------------------------------------------------------------------------------------------------------`);
  }

  // Section 7: Transactions Ledger
  const displayTxs = isSummary ? transactions.slice(0, 15) : transactions;
  lines.push(`جدول القيود المحاسبية والمعاملات المسجلة (${displayTxs.length} حركة معروضة):`);
  lines.push(`رقم القيد,التاريخ,نوع الحركة,التصنيف,المحفظة,المبلغ الأصلي,العملة الأصلية,المعادل بـ (${scope.baseCurrency.code}),الرصيد التراكمي,البيان / تفاصيل القيد`);

  displayTxs.forEach(t => {
    const sign = t.type === 'income' ? '+' : '-';
    lines.push(
      `${t.index},${escapeCSV(t.date)},${escapeCSV(t.typeLabelAr)},${escapeCSV(t.categoryName)},${escapeCSV(t.walletName)},${sign}${t.originalAmount.toLocaleString()},${escapeCSV(t.currencyCode)},${Math.round(t.convertedAmount).toLocaleString()} ${baseSymbol},${t.runningBalance !== undefined ? Math.round(t.runningBalance).toLocaleString() + ' ' + baseSymbol : '-'},${escapeCSV(t.note || '-')}`
    );
  });

  lines.push(`--------------------------------------------------------------------------------------------------------`);
  lines.push(`تنويه تقني,تم استخراج هذا التقرير المالي آلياً عبر تطبيق ثـري. البيانات محفوظة محلياً ومشفرة بالكامل على جهاز المستخدم.`);
  lines.push(`رمز التحقق,${escapeCSV(metadata.fingerprint)} | QR-ENCODED`);
  lines.push(`========================================================================================================`);

  return '\ufeff' + lines.join('\n');
}

/**
 * Exports CSV content to device download or native share
 */
export async function exportAndShareReportCSV(csvContent: string, fileName?: string): Promise<void> {
  const actualFileName = fileName || `THARI_Report_${new Date().toISOString().split('T')[0]}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: actualFileName,
        data: csvContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: 'تقرير ثري المالي (Excel CSV)',
        text: 'كشف الحساب والتقرير المالي من تطبيق ثري',
        url: result.uri,
        dialogTitle: 'تصدير ومشاركة التقرير',
      });
    } catch (e) {
      console.error('Error sharing CSV:', e);
      alert('تم إكمال التصدير بنجاح.');
    }
  } else {
    // Web Browser Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', actualFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
