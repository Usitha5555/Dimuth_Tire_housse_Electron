import { useEffect, useState } from 'react';
import { generateReceiptPDF, printReceipt } from '../utils/receipt';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name?: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await window.electronAPI.invoices.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (id: number) => {
    try {
      const invoice = await window.electronAPI.invoices.getById(id);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.customer_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rs. {invoice.total_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewInvoice(invoice.id)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoiceDetailModal = ({ invoice, onClose }: InvoiceDetailModalProps) => {
  const [invoiceDetail, setInvoiceDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoiceDetail();
  }, [invoice.id]);

  const loadInvoiceDetail = async () => {
    try {
      const data = await window.electronAPI.invoices.getById(invoice.id);
      setInvoiceDetail(data);
    } catch (error) {
      console.error('Error loading invoice detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (invoiceDetail) {
      printReceipt(invoiceDetail);
    }
  };

  const handleDownloadPDF = () => {
    if (invoiceDetail) {
      generateReceiptPDF(invoiceDetail);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">Loading...</div>
      </div>
    );
  }

  if (!invoiceDetail) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invoice Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-medium">{invoiceDetail.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(invoiceDetail.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {invoiceDetail.customer_name && (
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{invoiceDetail.customer_name}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Items</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceDetail.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.product_name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      Rs. {item.unit_price.toFixed(2)}
                    </td>
                    <td className="text-right py-2">
                      Rs. {item.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {invoiceDetail.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>Rs. {invoiceDetail.tax_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>Rs. {invoiceDetail.total_amount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;

