import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Loader2, Plus, Box, Trash2, ArrowRight, Eye, X } from 'lucide-react';
import { calculateEstimate } from '../utils/estimationEngine';

export default function CustomProducts() {
  const [products, setProducts] = useState([]);
  const [woodTypes, setWoodTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetailsProduct, setSelectedDetailsProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const [productsData, woodsData] = await Promise.all([
        api.get('/saved-estimates'),
        api.get('/wood-types')
      ]);
      setProducts(productsData);
      setWoodTypes(woodsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom product?')) return;
    try {
      await api.delete(`/saved-estimates/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateDetailField = (field, value) => {
    setSelectedDetailsProduct(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
  };

  const handleCloseModal = async () => {
    if (selectedDetailsProduct) {
      try {
        const estimate = calculateEstimate(selectedDetailsProduct.data, woodTypes);
        const payload = {
          name: selectedDetailsProduct.name,
          data: selectedDetailsProduct.data,
          totalCost: estimate.finalCost
        };
        // Auto-save on close
        api.put(`/saved-estimates/${selectedDetailsProduct.id}`, payload).catch(console.error);
        setProducts(products.map(p => p.id === selectedDetailsProduct.id ? { ...p, ...payload } : p));
      } catch (e) {
        console.error('Failed to auto-save:', e);
      }
    }
    setSelectedDetailsProduct(null);
  };

  const formatTemplateName = (id) => {
    const map = {
      'door_frame': 'Door Frame',
      'custom': 'Custom Blocks',
      'standard_door': 'Standard Door',
      'window_frame': 'Window Frame',
    };
    return map[id] || 'Product';
  };

  const formatDimension = (value, unit) => {
    let totalInches = parseFloat(value) || 0;
    if (unit === 'ft') {
      totalInches = totalInches * 12;
    }
    
    // Round to avoid floating point anomalies (e.g. 0.5 * 12 = 6, not 6.000000001)
    totalInches = Math.round(totalInches * 100) / 100;
    
    const ft = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    
    let result = '';
    if (ft > 0) result += `${ft}ft `;
    
    // If it's a perfect feet measurement, we can optionally omit '0in'
    if (inches > 0 || ft === 0) {
      // Cleanly format decimals if they exist
      const displayInches = Number.isInteger(inches) ? inches : inches.toFixed(1).replace(/\.0$/, '');
      result += `${displayInches}in`;
    }
    
    return result.trim();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Custom Products</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Your saved custom configurations and estimates.</p>
        </div>
        <button 
          onClick={() => navigate('/wood-estimator')}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Custom Product</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <Box className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Custom Products Yet</h2>
          <p className="text-gray-500 max-w-sm mb-6">Build a product in the Wood Estimator and click "Save" to build your custom product catalog.</p>
          <button 
            onClick={() => navigate('/wood-estimator')}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-colors"
          >
            Go to Estimator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(product => {
            const { data } = product;
            const isCarving = !!data.hasCarving;
            
            // Recalculate robust breakdown on the fly using shared engine
            const estimate = calculateEstimate(data, woodTypes);
            const {
              totalWoodCost: woodCost,
              totalLabour,
              totalCarvingArea,
              totalCarvingCost,
              profitMargin,
              finalCost
            } = estimate;
            
            const totalCostNum = finalCost || parseFloat(product.totalCost) || 0;
            
            const selectedWoodName = woodTypes.find(w => w.id === data.selectedWoodId)?.name || 'Unknown Wood';

            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:border-gray-900 transition-colors flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors line-clamp-2 pr-2">{product.name}</h3>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {formatTemplateName(data.activeTemplate)}
                    </span>
                    {isCarving && (
                       <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200">
                         With Carving
                       </span>
                    )}
                    {product.createdBy && (
                       <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-200">
                         By {product.createdBy}
                       </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between">
                      <span>Wood Used:</span>
                      <span className="text-gray-900 font-bold capitalize">{selectedWoodName}</span>
                    </div>
                    
                    {data.activeTemplate === 'door_frame' && (
                      <>
                        <div className="flex justify-between">
                          <span>Frame Size:</span>
                          <span className="text-gray-900 font-bold">{formatDimension(data.dfWidth, data.dfWidthUnit)} x {formatDimension(data.dfHeight, data.dfHeightUnit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Main Thickness:</span>
                          <span className="text-gray-900 font-bold">{data.dfThicknessOption === 'custom' ? `${data.dfCustomW}x${data.dfCustomT}` : data.dfThicknessOption}</span>
                        </div>
                        {data.hasBorder && (
                          <div className="flex justify-between text-blue-800">
                            <span>Border Thickness:</span>
                            <span className="font-bold">{data.borderThicknessOption === 'custom' ? `${data.borderCustomW}x${data.borderCustomT}` : data.borderThicknessOption}</span>
                          </div>
                        )}
                      </>
                    )}

                    {isCarving && (
                      <div className="flex justify-between text-amber-700 pt-1 mt-1 border-t border-gray-200">
                        <span>Total Carving Area:</span>
                        <span className="font-bold">{totalCarvingArea.toFixed(2)} sq.in</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Cost Split */}
                  <div className="mt-4 flex gap-1.5 w-full h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${(woodCost / totalCostNum) * 100}%` }} className="bg-emerald-500" title="Wood Cost"></div>
                    <div style={{ width: `${(totalLabour / totalCostNum) * 100}%` }} className="bg-blue-500" title="Labour Cost"></div>
                    {isCarving && <div style={{ width: `${(totalCarvingCost / totalCostNum) * 100}%` }} className="bg-amber-500" title="Carving Cost"></div>}
                    <div style={{ width: `${(profitMargin / totalCostNum) * 100}%` }} className="bg-purple-500" title="Margin"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold mt-1.5 uppercase tracking-wider">
                    <div className="text-emerald-600">Wood: ₹{woodCost.toFixed(0)}</div>
                    <div className="text-blue-600">Lab: ₹{totalLabour.toFixed(0)}</div>
                    {isCarving && <div className="text-amber-600">Carv: ₹{totalCarvingCost.toFixed(0)}</div>}
                    <div className="text-purple-600">Mrg: ₹{profitMargin.toFixed(0)}</div>
                  </div>

                </div>
                <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Estimate</span>
                    <span className="text-xl font-black text-gray-900">₹{totalCostNum.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDetailsProduct(product)}
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-900 bg-white border-2 border-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Estimate
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDetailsProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border-4 border-gray-900 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b-2 border-gray-100 bg-gray-50">
              <h2 className="font-black text-gray-900 text-lg uppercase tracking-wide">Detailed Estimate</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              {(() => {
                const { data } = selectedDetailsProduct;
                const estimate = calculateEstimate(data, woodTypes);
                const woodName = woodTypes.find(w => w.id === data.selectedWoodId)?.name || 'Unknown Wood';
                
                let mainW = 5, mainT = 3;
                if (data.dfThicknessOption === '6x4') { mainW = 6; mainT = 4; }
                else if (data.dfThicknessOption === 'custom') { 
                  mainW = parseFloat(data.dfCustomW) || 0; 
                  mainT = parseFloat(data.dfCustomT) || 0; 
                }
                const frontFace = data.mainCarvingFace === 'w' ? mainW : mainT;
                const activeCarvingRate = data.carvingRateOption === 'custom' ? data.carvingRate : data.carvingRateOption;

                const widthInInches = data.dfWidthUnit === 'ft' ? (parseFloat(data.dfWidth) || 0) * 12 : data.dfWidth;
                const heightInInches = data.dfHeightUnit === 'ft' ? (parseFloat(data.dfHeight) || 0) * 12 : data.dfHeight;

                return (
                  <>
                    {data.activeTemplate === 'door_frame' && (
                      <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Frame Dimensions</h3>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Outer Size:</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={widthInInches || ''} 
                                onChange={e => { updateDetailField('dfWidth', e.target.value); updateDetailField('dfWidthUnit', 'in'); }} 
                                className="w-14 text-center border-gray-300 rounded text-sm py-0.5 font-bold" 
                              />
                              <span className="text-xs text-gray-500 font-bold">in</span>
                              <span className="text-gray-400 mx-1">x</span>
                              <input 
                                type="number" 
                                value={heightInInches || ''} 
                                onChange={e => { updateDetailField('dfHeight', e.target.value); updateDetailField('dfHeightUnit', 'in'); }} 
                                className="w-14 text-center border-gray-300 rounded text-sm py-0.5 font-bold" 
                              />
                              <span className="text-xs text-gray-500 font-bold">in</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Frame Thickness:</span>
                            <div className="flex items-center gap-2">
                              {data.dfThicknessOption === 'custom' && (
                                <div className="flex items-center gap-1">
                                  <input type="number" value={data.dfCustomW || ''} onChange={e => updateDetailField('dfCustomW', e.target.value)} className="w-10 text-center border-gray-300 rounded text-sm py-0.5 font-bold" />
                                  <span className="text-gray-400">x</span>
                                  <input type="number" value={data.dfCustomT || ''} onChange={e => updateDetailField('dfCustomT', e.target.value)} className="w-10 text-center border-gray-300 rounded text-sm py-0.5 font-bold" />
                                </div>
                              )}
                              <select value={data.dfThicknessOption || '5x3'} onChange={e => updateDetailField('dfThicknessOption', e.target.value)} className="bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 py-0.5 outline-none">
                                <option value="5x3">5x3</option>
                                <option value="6x4">6x4</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Front Face:</span>
                            <div className="flex bg-gray-200 rounded p-0.5">
                              <button 
                                onClick={() => updateDetailField('mainCarvingFace', 'w')}
                                className={`px-2 py-0.5 text-xs font-bold rounded ${data.mainCarvingFace === 'w' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                              >
                                {mainW}in
                              </button>
                              <button 
                                onClick={() => updateDetailField('mainCarvingFace', 't')}
                                className={`px-2 py-0.5 text-xs font-bold rounded ${data.mainCarvingFace === 't' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                              >
                                {mainT}in
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Bottom Piece:</span>
                            <button 
                              onClick={() => updateDetailField('excludeBottomPiece', !data.excludeBottomPiece)}
                              className={`px-3 py-0.5 rounded text-xs font-bold transition-colors ${!data.excludeBottomPiece ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {!data.excludeBottomPiece ? 'Yes' : 'No'}
                            </button>
                          </div>
                          
                          {data.hasBorder && (
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                              <span className="text-gray-600">Border Thickness:</span>
                              <div className="flex items-center gap-2">
                                {data.borderThicknessOption === 'custom' && (
                                  <div className="flex items-center gap-1">
                                    <input type="number" value={data.borderCustomW || ''} onChange={e => updateDetailField('borderCustomW', e.target.value)} className="w-10 text-center border-gray-300 rounded text-sm py-0.5 font-bold" />
                                    <span className="text-gray-400">x</span>
                                    <input type="number" value={data.borderCustomT || ''} onChange={e => updateDetailField('borderCustomT', e.target.value)} className="w-10 text-center border-gray-300 rounded text-sm py-0.5 font-bold" />
                                  </div>
                                )}
                                <select value={data.borderThicknessOption || '3x1.5'} onChange={e => updateDetailField('borderThicknessOption', e.target.value)} className="bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 py-0.5 outline-none">
                                  <option value="4x1.5">4x1.5</option>
                                  <option value="3x1.5">3x1.5</option>
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {estimate.innerDimensions && (
                            <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 text-blue-800">
                              <span>Calculated Inner Size:</span>
                              <span className="font-bold">{formatDimension(estimate.innerDimensions.w, 'in')} x {formatDimension(estimate.innerDimensions.h, 'in')}</span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    <section>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Wood & Volume</h3>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700">Wood Type:</span>
                          <select 
                            value={data.selectedWoodId || ''} 
                            onChange={e => updateDetailField('selectedWoodId', e.target.value)}
                            className="bg-white border border-emerald-200 rounded text-sm font-bold text-emerald-900 py-0.5 px-2 outline-none capitalize max-w-[160px]"
                          >
                            {woodTypes.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-between"><span className="text-emerald-700">Total Volume:</span><span className="font-bold text-emerald-900">{estimate.totalVolumeCft.toFixed(3)} CFT</span></div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-emerald-200"><span className="text-emerald-700 font-bold">Total Wood Cost:</span><span className="font-black text-emerald-900">₹{estimate.totalWoodCost.toFixed(0)}</span></div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Labour & Lumpsum</h3>
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Fitting Labour:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-500 font-bold">₹</span>
                            <input 
                              type="number" 
                              value={data.fittingLabour || ''} 
                              onChange={e => updateDetailField('fittingLabour', e.target.value)} 
                              className="w-20 text-right bg-white border border-blue-200 rounded text-sm font-bold text-blue-900 py-0.5 px-2 outline-none" 
                            />
                          </div>
                        </div>
                        {estimate.finishingLabour > 0 && (
                          <div className="flex justify-between"><span className="text-blue-700">Finishing Labour (30% Carving):</span><span className="font-bold text-blue-900">₹{estimate.finishingLabour.toFixed(0)}</span></div>
                        )}
                        {estimate.customLumpsumTotal > 0 && (
                          <div className="flex justify-between"><span className="text-blue-700">Custom Lumpsums:</span><span className="font-bold text-blue-900">₹{estimate.customLumpsumTotal.toFixed(0)}</span></div>
                        )}
                        <div className="flex justify-between pt-1 mt-1 border-t border-blue-200"><span className="text-blue-700 font-bold">Total Labour Cost:</span><span className="font-black text-blue-900">₹{estimate.totalLabour.toFixed(0)}</span></div>
                      </div>
                    </section>

                    {data.hasCarving && (
                      <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Carving Details</h3>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-amber-700 font-bold">Carving Area:</span><span className="font-bold text-amber-900">{estimate.totalCarvingArea.toFixed(2)} sq.in</span></div>
                          <div className="flex justify-between items-center pt-2 mt-1 border-t border-amber-100">
                            <span className="text-amber-700">Rate per sq.in:</span>
                            <div className="flex items-center gap-2">
                              {data.carvingRateOption === 'custom' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-500 font-bold">₹</span>
                                  <input type="number" value={data.carvingRate || ''} onChange={e => updateDetailField('carvingRate', e.target.value)} className="w-16 text-right bg-white border border-amber-200 rounded text-sm font-bold text-amber-900 py-0.5 px-1 outline-none" />
                                </div>
                              )}
                              <select 
                                value={data.carvingRateOption || '3.5'} 
                                onChange={e => updateDetailField('carvingRateOption', e.target.value)} 
                                className="bg-white border border-amber-200 rounded text-sm font-bold text-amber-900 py-0.5 outline-none"
                              >
                                <option value="3.5">₹3.5</option>
                                <option value="5">₹5.0</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-between pt-1 mt-1 border-t border-amber-200"><span className="text-amber-700 font-bold">Carving Cost:</span><span className="font-black text-amber-900">₹{estimate.totalCarvingCost.toFixed(0)}</span></div>
                        </div>
                      </section>
                    )}
                  </>
                );
              })()}
            </div>
            
            <div className="p-4 border-t-2 border-gray-100 bg-gray-50 flex justify-end items-center">
               <div className="flex flex-col text-right">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Estimate</span>
                 <span className="text-xl font-black text-gray-900">
                   ₹{calculateEstimate(selectedDetailsProduct.data, woodTypes).finalCost.toLocaleString(undefined, {maximumFractionDigits:0})}
                 </span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
