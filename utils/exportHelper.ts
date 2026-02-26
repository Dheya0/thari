
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

export const generateAndShareCSV = async (
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[]
) => {
  const header = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Wallet', 'Note'];
  const rows = transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
    const wallet = wallets.find(w => w.id === t.walletId)?.name || 'Unknown';
    // Escape quotes in note
    const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
    return `${t.date},${t.type},${cat},${t.amount},${t.currency},${wallet},${note}`;
  });
  
  const csvContent = [header.join(','), ...rows].join('\n');
  const fileName = `Thari_Transactions_${new Date().toISOString().split('T')[0]}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: 'Thari Transactions CSV',
        text: 'Here is your transactions data.',
        url: result.uri,
        dialogTitle: 'Share CSV',
      });
    } catch (e) {
      console.error('Error sharing CSV:', e);
      alert('Failed to share CSV.');
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
  }
};
