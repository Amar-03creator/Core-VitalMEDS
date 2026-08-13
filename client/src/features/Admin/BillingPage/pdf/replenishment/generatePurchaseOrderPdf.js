import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // FIX: Direct import

export const generatePurchaseOrderPdf = (companyName, shortCode, items) => {
    if (!items || items.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('en-IN');

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Purchase Order: ${companyName}`, 14, 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Generated: ${today}`, 14, 26);
    doc.text(`Items: ${items.length}`, 14, 30);

    const validItems = items.filter(item => item.finalQty > 0);

    const tableBody = validItems.map((item, index) => [
        index + 1,
        item.productName,
        item.currentStock.toString(),
        item.finalQty.toString()
    ]);

    // FIX: Call autoTable directly as a function, passing the doc
    autoTable(doc, {
        startY: 35,
        head: [['#', 'Medicine Name', 'Current Stock', 'Order Qty']],
        body: tableBody,
        theme: 'grid',
        styles: {
            fontSize: 9, 
            cellPadding: 3,
            textColor: [40, 40, 40],
        },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 15 }, 
            1: { cellWidth: 'auto' }, 
            2: { cellWidth: 35, halign: 'center' }, 
            3: { cellWidth: 35, halign: 'center', fontStyle: 'bold' } 
        }
    });

    const filename = `PO_${shortCode || 'SUPPLIER'}_${today.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
};