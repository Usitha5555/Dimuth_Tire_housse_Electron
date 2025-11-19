import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceData {
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: InvoiceItem[];
}

/**
 * Generate PDF receipt from invoice data
 */
export function generateReceiptPDF(invoice: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DIMUTH TIREHOUSE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Dimuth Tirehouse Receipt', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Divider line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, margin + 50, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  // Extract date and time directly from local datetime string (format: "YYYY-MM-DD HH:MM:SS")
  // This avoids timezone conversion issues
  const dateTimeStr = invoice.created_at.toString();
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  const formattedDate = format(date, 'dd MMM yyyy, hh:mm a');
  doc.text(formattedDate, margin + 50, yPos);
  yPos += 8;

  // Customer info (if available)
  if (invoice.customer_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer_name, margin + 50, yPos);
    yPos += 6;
  }

  if (invoice.customer_phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer_phone, margin + 50, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Divider line
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Items header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', margin, yPos);
  doc.text('Qty', margin + 80, yPos);
  doc.text('Price', margin + 110, yPos);
  doc.text('Total', pageWidth - margin - 20, yPos, { align: 'right' });
  yPos += 5;

  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Items
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    // Product name (may wrap)
    const productLines = doc.splitTextToSize(item.product_name, 60);
    doc.text(productLines[0], margin, yPos);
    if (productLines.length > 1) {
      yPos += 4;
      doc.text(productLines[1], margin, yPos);
    }

    doc.text(item.quantity.toString(), margin + 80, yPos);
    doc.text(`Rs. ${item.unit_price.toFixed(2)}`, margin + 110, yPos);
    doc.text(`Rs. ${item.total_price.toFixed(2)}`, pageWidth - margin - 20, yPos, {
      align: 'right',
    });
    yPos += 8;
  });

  yPos += 5;

  // Totals section
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
  doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 6;

  if (invoice.tax_amount > 0) {
    doc.text('Tax:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`Rs. ${invoice.tax_amount.toFixed(2)}`, pageWidth - margin - 5, yPos, {
      align: 'right',
    });
    yPos += 6;
  }

  if (invoice.discount_amount > 0) {
    doc.text('Discount:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`Rs. ${invoice.discount_amount.toFixed(2)}`, pageWidth - margin - 5, yPos, {
      align: 'right',
    });
    yPos += 6;
  }

  yPos += 2;
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - margin - 60, yPos, { align: 'right' });
  doc.text(`Rs. ${invoice.total_amount.toFixed(2)}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 10;

  // Payment method
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${invoice.payment_method.toUpperCase()}`, margin, yPos);
  yPos += 10;

  // Footer
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('This is a computer-generated receipt.', pageWidth / 2, yPos, {
    align: 'center',
  });

  // Save PDF
  doc.save(`Receipt-${invoice.invoice_number}.pdf`);
}

/**
 * Print receipt directly (opens print dialog)
 */
export function printReceipt(invoice: InvoiceData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print receipt');
    return;
  }

  // Extract date and time directly from local datetime string (format: "YYYY-MM-DD HH:MM:SS")
  // This avoids timezone conversion issues
  const dateTimeStr = invoice.created_at.toString();
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  const formattedDate = format(date, 'dd MMM yyyy, hh:mm a');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${invoice.invoice_number}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          width: 70mm;
          margin: 0;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 18px;
          margin: 0;
          font-weight: bold;
        }
        .header p {
          font-size: 10px;
          margin: 5px 0;
        }
        .divider {
          border-top: 1px solid #000;
          margin: 10px 0;
        }
        .info {
          margin: 5px 0;
        }
        .info-label {
          font-weight: bold;
          display: inline-block;
          width: 80px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-size: 10px;
        }
        td {
          padding: 3px 0;
          font-size: 11px;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-top: 10px;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .total-final {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DIMUTH TIREHOUSE</h1>
        <p>Dimuth Tirehouse Receipt</p>
      </div>
      <div class="divider"></div>
      <div class="info">
        <span class="info-label">Invoice:</span> ${invoice.invoice_number}
      </div>
      <div class="info">
        <span class="info-label">Date:</span> ${formattedDate}
      </div>
      ${invoice.customer_name ? `<div class="info"><span class="info-label">Customer:</span> ${invoice.customer_name}</div>` : ''}
      ${invoice.customer_phone ? `<div class="info"><span class="info-label">Phone:</span> ${invoice.customer_phone}</div>` : ''}
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (item) => `
            <tr>
              <td>${item.product_name}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">Rs. ${item.unit_price.toFixed(2)}</td>
              <td class="text-right">Rs. ${item.total_price.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rs. ${invoice.subtotal.toFixed(2)}</span>
        </div>
        ${invoice.tax_amount > 0 ? `<div class="total-row"><span>Tax:</span><span>Rs. ${invoice.tax_amount.toFixed(2)}</span></div>` : ''}
        ${invoice.discount_amount > 0 ? `<div class="total-row"><span>Discount:</span><span>Rs. ${invoice.discount_amount.toFixed(2)}</span></div>` : ''}
        <div class="total-row total-final">
          <span>Total:</span>
          <span>Rs. ${invoice.total_amount.toFixed(2)}</span>
        </div>
      </div>
      <div class="info">
        <span class="info-label">Payment:</span> ${invoice.payment_method.toUpperCase()}
      </div>
      <div class="divider"></div>
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated receipt.</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

