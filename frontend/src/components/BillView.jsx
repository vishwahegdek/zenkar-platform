
import { forwardRef } from 'react';
import { format } from 'date-fns';

const BillView = forwardRef(({ order, data, mode = 'ESTIMATE', title }, ref) => {
  if (!order && !data) return null;
  
  // Use passed data (GST snapshot) or fall back to order (Estimate)
  const source = data || order;
  const items = source.items || [];
  
  // Calculations handled in source for GST, or derived for Estimate
  const subtotal = source.subtotal !== undefined ? Number(source.subtotal) : items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const discount = Number(source.discount) || 0;
  // USER FIX: Total should be Subtotal - Discount (Net Payable)
  const total = subtotal - discount;
  const paid = Number(source.paidAmount || order?.paidAmount || 0);
  const balance = total - paid;
  
  const displayTitle = title || (mode === 'GST' ? 'GST INVOICE' : 'ESTIMATE');
  const invoiceNo = source.invoiceNo || order?.orderNo || order?.id;

  return (
    <div ref={ref} className="p-8 bg-white text-black w-[210mm] min-h-[297mm] mx-auto relative text-sm font-sans" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{displayTitle}</h1>
          <div className="text-gray-600 font-medium"># {invoiceNo}</div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">Zenkar Industries</h2>
          <p className="text-gray-500 text-xs mt-1">
             Kavalkuli, Sampakhanda<br/>
             Sirsi, Karnataka<br/>
             581315
          </p>
          <div className="text-gray-500 text-xs mt-2 space-y-0.5">
             <div>Ganapati Hegde : 9483485616</div>
             <div>Vishwa Hegde : 9482416347</div>
          </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="flex justify-between mb-8">
        <div>
          {/* Hide if Walk-in */}
          {source.customerName !== 'Walk-in' && order?.customer?.name !== 'Walk-in' && (
              <>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Bill To</h3>
                <div className="font-bold text-lg">{source.customerName || order?.customer?.name}</div>
                <div className="text-gray-600 max-w-[200px]">{order?.customer?.address}</div>
                <div className="text-gray-600">{order?.customer?.phone}</div>
              </>
          )}
        </div>
        <div className="text-right space-y-1">
          <div className="flex justify-between w-48 border-b border-gray-100 pb-1">
             <span className="text-gray-500">Date:</span>
             <span className="font-medium">{format(new Date(order?.orderDate || new Date()), 'dd/MM/yyyy')}</span>
          </div>
          {order?.dueDate && (
             <div className="flex justify-between w-48 border-b border-gray-100 pb-1">
                <span className="text-gray-500">Due Date:</span>
                <span className="font-medium">{format(new Date(order.dueDate), 'dd/MM/yyyy')}</span>
             </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-100 text-gray-800 text-xs uppercase tracking-wide">
            <th className="py-2 px-3 text-left w-12">#</th>
            <th className="py-2 px-3 text-left">Item / Description</th>
            <th className="py-2 px-3 text-right w-20">Qty</th>
            <th className="py-2 px-3 text-right w-24">Rate</th>
            <th className="py-2 px-3 text-right w-24">Amount</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 divide-y divide-gray-200">
          {items.map((item, i) => (
            <tr key={i}>
              <td className="py-3 px-3 align-top">{i + 1}</td>
              <td className="py-3 px-3 align-top">
                <div className="font-bold text-gray-900">{item.productName}</div>
                {item.description && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
              </td>
              <td className="py-3 px-3 text-right align-top">{Number(item.quantity)}</td>
              <td className="py-3 px-3 text-right align-top">₹{Number(item.unitPrice).toLocaleString()}</td>
              <td className="py-3 px-3 text-right font-medium text-gray-900 align-top">₹{Number(item.lineTotal).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment History - Only for ESTIMATE mode */}
      {mode === 'ESTIMATE' && order?.payments && order.payments.length > 0 && (
          <div className="mb-8">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment History</h3>
             <table className="w-full text-xs">
                 <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-1 text-left font-medium">Date</th>
                        <th className="py-1 text-left font-medium">Method</th>
                        <th className="py-1 text-right font-medium">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {order.payments.map((p, idx) => (
                        <tr key={idx}>
                           <td className="py-1 text-gray-700">{format(new Date(p.date), 'dd/MM/yyyy')}</td>
                           <td className="py-1 text-gray-600">{p.method || 'CASH'}</td>
                           <td className="py-1 text-right font-medium text-gray-900">₹{Number(p.amount).toLocaleString()}</td>
                        </tr>
                    ))}
                 </tbody>
             </table>
          </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-12">
         <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
               <span>Subtotal</span>
               <span>₹{(subtotal).toLocaleString()}</span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between text-orange-600">
                   <span>Discount</span>
                   <span>−₹{discount.toLocaleString()}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-800 text-gray-900">
               <span>Total</span>
               <span>₹{total.toLocaleString()}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-green-700 pt-1">
                 <span>Paid</span>
                 <span>−₹{paid.toLocaleString()}</span>
              </div>
            )}
            {balance > 0 && (
               <div className="flex justify-between font-bold text-red-600 pt-2 border-t border-gray-300">
                  <span>Balance Due</span>
                  <span>₹{balance.toLocaleString()}</span>
               </div>
            )}
         </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-8 right-8 text-center">
         <div className="text-gray-500 text-xs mb-8">
            Thank you for your business!
         </div>
         <div className="flex justify-between pt-8 border-t border-gray-200">
             <div className="text-xs text-gray-400">
                Generated via Zenkar Platform
             </div>
             <div className="text-xs text-gray-400">
                Authorized Signature
             </div>
         </div>
      </div>
    </div>
  );
});

BillView.displayName = 'BillView';

export default BillView;
