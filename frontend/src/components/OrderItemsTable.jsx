import React from 'react';
import Autocomplete from './Autocomplete';

export default function OrderItemsTable({
  items,
  handleItemChange,
  handleChangeProduct,
  handleProductSelect,
  removeItem,
  addItem,
  calculateTotal,
  setTempProductName,
  setActiveProductRowIndex,
  setIsProductModalOpen,
  handleItemBlur,
  isItemInvalid,
  itemRefs,
  footerChildren
}) {
  return (
       <div className="bg-white md:rounded-xl shadow-sm border-b md:border border-gray-200 mt-0 md:mt-0 overflow-hidden">
          <div className="p-4 md:p-6 pb-2">
            <h2 className="font-semibold text-gray-900 border-b-2 border-gray-900 pb-2 mb-2">Order Items</h2>
          </div>

         <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-blue-700 uppercase bg-blue-50/60 border-b-2 border-blue-200">
               <div className="col-span-5 md:col-span-5">Product</div>
               <div className="col-span-2 md:col-span-1 text-center">Qty</div>
               <div className="col-span-3 md:col-span-2 text-right">Price</div>
               <div className="col-span-2 md:col-span-4 text-right">Total</div>
            </div>

             {items.map((item, idx) => {
               const invalid = isItemInvalid ? isItemInvalid(item, idx) : false;
               return (
               <div 
                  key={idx} 
                  ref={itemRefs ? el => itemRefs.current[idx] = el : null}
                  className={`grid grid-cols-12 gap-2 items-stretch px-3 py-3 transition-colors border-b ${
                    invalid ? 'bg-red-100 border-red-600' : `border-gray-900 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                  }`}>
                  <div className="col-span-5 md:col-span-5 space-y-1">
                     {item.productId ? (
                        <div className="group relative">
                           <div className="font-medium text-sm text-gray-900 truncate">{item.productName}</div>
                           <button 
                               type="button"
                               onClick={() => handleChangeProduct(idx)}
                               className="text-[10px] items-center text-blue-600 hover:text-blue-800 font-medium"
                           >
                               Change
                           </button>
                       </div>
                     ) : (
                        <Autocomplete 
                           value={item.productName}
                           placeholder="Select Product"
                           endpoint="/products"
                           displayKey="name"
                           subDisplayKey="defaultUnitPrice"
                           onChange={(val) => handleItemChange(idx, 'productName', val)}
                           onCreate={(name) => {
                               if (setTempProductName) setTempProductName(name);
                               if (setActiveProductRowIndex) setActiveProductRowIndex(idx);
                               window.location.hash = 'new-product';
                               if (setIsProductModalOpen) setIsProductModalOpen(true);
                           }}
                           onSelect={(p) => {
                               handleProductSelect(idx, p);
                           }}
                           onBlur={() => handleItemBlur && handleItemBlur(idx)}
                           error={invalid}
                           className="text-sm"
                        />
                     )}
                     <input type="text" placeholder="Notes" className="w-full text-xs text-black font-medium placeholder-gray-400 border-none p-0 focus:ring-0 bg-transparent"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                     />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                     <input type="number" 
                        className="w-full text-center text-sm border border-gray-400 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                     />
                  </div>

                  <div className="col-span-3 md:col-span-2">
                     <input type="number" 
                        className="w-full text-right text-sm border border-gray-400 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                     />
                  </div>

                  <div className="col-span-2 md:col-span-4 flex flex-col items-end justify-between h-full">
                     <div className="font-bold text-base text-blue-700 text-right w-full">
                        ₹{item.lineTotal.toLocaleString()}
                     </div>
                     <button 
                        onClick={() => removeItem(idx)} 
                        type="button" 
                        className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded p-1 transition-colors flex items-center justify-center mt-auto"
                        title="Remove Item"
                     >
                        <span className="text-lg font-bold leading-none w-5 h-5 flex items-center justify-center -mt-0.5">×</span>
                     </button>
                  </div>
               </div>
              );
             })}
          </div>

          <div className="p-4 md:p-6">
            <button onClick={addItem} type="button" className="w-full md:w-auto text-sm text-primary font-medium hover:underline border border-dashed border-primary/30 p-2 rounded-lg bg-blue-50/50">+ Add Another Item</button>
          </div>

          <div className="border-t border-gray-100 p-4 md:p-6 flex justify-end">
           <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between items-center text-xl md:text-2xl font-black text-blue-700 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                <span>Total</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>
              {footerChildren}
           </div>
          </div>
       </div>
  );
}
