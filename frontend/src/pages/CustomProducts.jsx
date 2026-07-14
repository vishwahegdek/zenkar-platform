import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Loader2, Plus, Box, Trash2, ArrowRight } from 'lucide-react';

export default function CustomProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/saved-estimates');
      setProducts(data);
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

  const formatTemplateName = (id) => {
    const map = {
      'door_frame': 'Door Frame',
      'custom': 'Custom Blocks',
      'standard_door': 'Standard Door',
      'window_frame': 'Window Frame',
    };
    return map[id] || 'Product';
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
            
            const totalLabour = (data.labourItems || []).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
            
            const totalCarvingArea = (data.carvings || []).reduce((sum, c) => {
              let l = parseFloat(c.l) || 0;
              if (c.lu === 'ft') l *= 12;
              let w = parseFloat(c.w) || 0;
              if (c.wu === 'ft') w *= 12;
              return sum + (l * w);
            }, 0);
            const activeCarvingRate = data.carvingRateOption === 'custom' ? data.carvingRate : data.carvingRateOption;
            const totalCarvingCost = isCarving ? totalCarvingArea * (parseFloat(activeCarvingRate) || 0) : 0;
            
            const totalCostNum = parseFloat(product.totalCost) || 0;
            // new logic: finalCost = (woodCost * 1.15) + (2 * totalLabour) + totalCarvingCost
            const calculatedWoodCost = (totalCostNum - totalCarvingCost - (2 * totalLabour)) / 1.15;
            const woodCost = Math.max(0, calculatedWoodCost);
            const profitMargin = (woodCost * 0.15) + totalLabour;

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
                      <span className="text-gray-900 font-bold capitalize">{data.selectedWoodId ? data.selectedWoodId.replace(/_/g, ' ') : 'N/A'}</span>
                    </div>
                    
                    {data.activeTemplate === 'door_frame' && (
                      <>
                        <div className="flex justify-between">
                          <span>Frame Size:</span>
                          <span className="text-gray-900 font-bold">{data.dfWidth}{data.dfWidthUnit} x {data.dfHeight}{data.dfHeightUnit}</span>
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
                    onClick={() => navigate('/wood-estimator', { state: { loadEstimate: product } })}
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
    </div>
  );
}
