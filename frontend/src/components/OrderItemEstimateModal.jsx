import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { 
  X, 
  Ruler, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Check, 
  Loader2, 
  Box, 
  Sparkles, 
  Layers, 
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateEstimate } from '../utils/estimationEngine';
import { isDoorFrameProduct } from '../utils/productEstimateHelpers';

export default function OrderItemEstimateModal({ 
  isOpen, 
  onClose, 
  item, 
  orderId, 
  initialTemplate,
  onEstimateUpdated 
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('view'); // 'view' or 'select'
  const [savedEstimates, setSavedEstimates] = useState([]);
  const [woodTypes, setWoodTypes] = useState([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [updateUnitPrice, setUpdateUnitPrice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getDefaultDoorFrameData = (firstWoodId = '') => ({
    activeTemplate: 'door_frame',
    dfThicknessOption: '5x3',
    dfWidth: '3.5',
    dfWidthUnit: 'ft',
    dfHeight: '7',
    dfHeightUnit: 'ft',
    excludeBottomPiece: false,
    hasBorder: false,
    borderThicknessOption: '4x1.5',
    selectedWoodId: firstWoodId,
    fittingLabour: '1200',
    hasCarving: false,
    carvingRateOption: '3.5',
    mainCarvingFace: 'w',
    labourItems: []
  });

  useEffect(() => {
    if (!isOpen || !item) return;
    
    const isDf = initialTemplate === 'door_frame' || isDoorFrameProduct(item);

    // Default to view mode if estimateData exists
    if (item.estimateData) {
      setMode('view');
      setEditingData({ ...item.estimateData });
    } else if (isDf) {
      // Direct fixed Door Frame template - no custom estimation required!
      setMode('view');
      setEditingData(getDefaultDoorFrameData(woodTypes[0]?.id || ''));
    } else {
      setMode('select');
      setEditingData(null);
    }
    
    fetchEstimatesAndWoods(isDf);
  }, [isOpen, item]);

  const fetchEstimatesAndWoods = async (isDf = false) => {
    setIsLoadingEstimates(true);
    try {
      const [estimatesData, woodsData] = await Promise.all([
        api.get('/saved-estimates'),
        api.get('/wood-types')
      ]);
      setSavedEstimates(estimatesData || []);
      setWoodTypes(woodsData || []);

      if (isDf && woodsData?.length > 0) {
        setEditingData(prev => {
          if (!prev) return getDefaultDoorFrameData(woodsData[0].id);
          if (!prev.selectedWoodId) return { ...prev, selectedWoodId: woodsData[0].id };
          return prev;
        });
      }
    } catch (e) {
      console.error('Failed to load estimates or wood types:', e);
    } finally {
      setIsLoadingEstimates(false);
    }
  };

  const formatDimension = (value, unit) => {
    let totalInches = parseFloat(value) || 0;
    if (unit === 'ft') {
      totalInches = totalInches * 12;
    }
    totalInches = Math.round(totalInches * 100) / 100;
    const ft = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    let result = '';
    if (ft > 0) result += `${ft}ft `;
    if (inches > 0 || ft === 0) {
      const displayInches = Number.isInteger(inches) ? inches : inches.toFixed(1).replace(/\.0$/, '');
      result += `${displayInches}in`;
    }
    return result.trim();
  };

  const updateDetailField = (field, val) => {
    setEditingData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: val
      };
    });
  };

  const updateDetailFields = (fieldsObj) => {
    setEditingData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...fieldsObj
      };
    });
  };

  if (!isOpen || !item) return null;

  // Helper to calculate or extract estimate figures
  const getComputedDetails = (estimateData) => {
    if (!estimateData) return null;
    try {
      const result = calculateEstimate(estimateData, woodTypes);
      const selectedWood = woodTypes.find(w => w.id === estimateData.selectedWoodId);
      return {
        ...result,
        woodName: selectedWood?.name || 'Selected Wood',
        woodPrice: selectedWood?.price || 0,
      };
    } catch (err) {
      return {
        finalCost: estimateData.finalCost || estimateData.totalCost || 0,
        totalVolumeCft: estimateData.totalVolumeCft || 0,
        woodName: 'Wood',
      };
    }
  };

  const handleSaveDoorFrameEstimate = async () => {
    if (!editingData) return;
    setIsSubmitting(true);
    try {
      const computed = calculateEstimate(editingData, woodTypes);
      const finalCost = Math.round(computed?.finalCost || 0);

      const payload = {
        estimateData: {
          ...editingData,
          finalCost,
          totalVolumeCft: computed?.totalVolumeCft || 0,
        },
        savedEstimateId: selectedEstimate?.id || item.savedEstimateId || null,
        updateLinePrice: updateUnitPrice,
        unitPrice: updateUnitPrice ? finalCost : (item.unitPrice || 0)
      };

      const hasValidItemId = item?.id && typeof item.id === 'number' && !isNaN(item.id);
      if (hasValidItemId) {
        await api.patch(`/orders/items/${item.id}/estimate`, payload);
      }
      toast.success(updateUnitPrice 
        ? `Door Frame estimate saved & price updated to ₹${finalCost.toLocaleString()}`
        : 'Door Frame estimate saved successfully'
      );
      if (onEstimateUpdated) onEstimateUpdated(payload);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save estimate: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewDoorFrame = () => {
    const defaultDoorFrameData = getDefaultDoorFrameData(woodTypes[0]?.id || '');
    setEditingData(defaultDoorFrameData);
    setMode('view');
  };

  const handleAttachEstimate = async (estimateToAttach) => {
    if (!estimateToAttach) return;
    setIsSubmitting(true);
    try {
      const payloadData = estimateToAttach.data || estimateToAttach;
      const computed = getComputedDetails(payloadData);
      const finalCost = Math.round(computed?.finalCost || estimateToAttach.totalCost || 0);

      const payload = {
        estimateData: {
          ...payloadData,
          finalCost
        },
        savedEstimateId: estimateToAttach.id || null,
        updateLinePrice: updateUnitPrice,
        unitPrice: updateUnitPrice ? finalCost : (item.unitPrice || 0)
      };

      const hasValidItemId = item?.id && typeof item.id === 'number' && !isNaN(item.id);
      if (hasValidItemId) {
        await api.patch(`/orders/items/${item.id}/estimate`, payload);
      }
      toast.success(updateUnitPrice 
        ? `Estimate attached & price updated to ₹${finalCost.toLocaleString()}`
        : 'Estimate attached successfully'
      );
      if (onEstimateUpdated) onEstimateUpdated(payload);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to attach estimate: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetachEstimate = async () => {
    if (!window.confirm('Are you sure you want to remove the estimate from this item?')) return;
    setIsSubmitting(true);
    try {
      const hasValidItemId = item?.id && typeof item.id === 'number' && !isNaN(item.id);
      if (hasValidItemId) {
        await api.patch(`/orders/items/${item.id}/estimate`, {
          estimateData: null,
          savedEstimateId: null,
          updateLinePrice: false
        });
      }
      toast.success('Estimate detached from item');
      if (onEstimateUpdated) onEstimateUpdated({ 
        estimateData: null, 
        savedEstimateId: null, 
        updateLinePrice: false,
        unitPrice: item.unitPrice || 0
      });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to detach estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInEstimator = (prefillEstimate = null) => {
    onClose();
    navigate('/wood-estimator', {
      state: {
        returnToOrder: {
          orderId: orderId || null,
          itemId: item.id || null,
          rowIndex: item.rowIndex !== undefined ? item.rowIndex : undefined,
          productName: item.productName,
          isOrderForm: !orderId || !item.id,
          returnUrl: orderId ? `/orders/${orderId}` : '/orders/new'
        },
        loadEstimate: prefillEstimate ? {
          name: item.productName,
          data: prefillEstimate.data || prefillEstimate,
          id: prefillEstimate.id || null
        } : null
      }
    });
  };

  const filteredSavedEstimates = savedEstimates.filter(est => 
    est.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentComputed = editingData ? getComputedDetails(editingData) : (item.estimateData ? getComputedDetails(item.estimateData) : null);
  const isDoorFrame = editingData?.activeTemplate === 'door_frame';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-900 text-white flex justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-gray-900">
                <Ruler className="w-3 h-3" />
                {isDoorFrame ? 'Door Frame Estimate' : 'Estimate Module'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1.5 truncate">
              {item.productName}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher if item already has estimate */}
        {item.estimateData && (
          <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2">
            <button
              onClick={() => setMode('view')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                mode === 'view' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Current Estimate Details
            </button>
            <button
              onClick={() => setMode('select')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                mode === 'select' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Replace with Saved Template
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {mode === 'view' && editingData ? (
            isDoorFrame ? (
              /* Exact Door Frame Estimate UI from Custom Products */
              <div className="space-y-4">
                {(() => {
                  const data = editingData;
                  const estimate = calculateEstimate(data, woodTypes);
                  
                  let mainW = 5, mainT = 3;
                  if (data.dfThicknessOption === '6x4') { mainW = 6; mainT = 4; }
                  else if (data.dfThicknessOption === 'custom') { 
                    mainW = parseFloat(data.dfCustomW) || 0; 
                    mainT = parseFloat(data.dfCustomT) || 0; 
                  }
                  
                  const widthInInches = data.dfWidthUnit === 'ft' 
                    ? ((parseFloat(data.dfWidth) || 0) * 12) 
                    : (data.dfWidth ?? '');
                  const heightInInches = data.dfHeightUnit === 'ft' 
                    ? ((parseFloat(data.dfHeight) || 0) * 12) 
                    : (data.dfHeight ?? '');

                  return (
                    <>
                      {/* Inventory / Dimension Warning if any */}
                      {estimate.inventoryError && (
                        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                          {estimate.inventoryError}
                        </div>
                      )}

                      {/* Frame Dimensions */}
                      <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1 flex items-center justify-between">
                          <span>Frame Dimensions</span>
                          <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">Door Frame System</span>
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Outer Size:</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={widthInInches} 
                                onChange={e => updateDetailFields({ dfWidth: e.target.value, dfWidthUnit: 'in' })} 
                                className="w-14 text-center border border-gray-300 bg-white rounded text-sm py-1 font-bold focus:border-blue-600 focus:outline-none" 
                              />
                              <span className="text-xs text-gray-500 font-bold">in</span>
                              <span className="text-gray-400 mx-1">x</span>
                              <input 
                                type="number" 
                                value={heightInInches} 
                                onChange={e => updateDetailFields({ dfHeight: e.target.value, dfHeightUnit: 'in' })} 
                                className="w-14 text-center border border-gray-300 bg-white rounded text-sm py-1 font-bold focus:border-blue-600 focus:outline-none" 
                              />
                              <span className="text-xs text-gray-500 font-bold">in</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Frame Thickness:</span>
                            <div className="flex items-center gap-2">
                              {data.dfThicknessOption === 'custom' && (
                                <div className="flex items-center gap-1">
                                  <input type="number" value={data.dfCustomW || ''} onChange={e => updateDetailField('dfCustomW', e.target.value)} className="w-10 text-center border border-gray-300 bg-white rounded text-sm py-0.5 font-bold focus:border-blue-600 focus:outline-none" />
                                  <span className="text-gray-400">x</span>
                                  <input type="number" value={data.dfCustomT || ''} onChange={e => updateDetailField('dfCustomT', e.target.value)} className="w-10 text-center border border-gray-300 bg-white rounded text-sm py-0.5 font-bold focus:border-blue-600 focus:outline-none" />
                                </div>
                              )}
                              <select 
                                value={data.dfThicknessOption || '5x3'} 
                                onChange={e => updateDetailField('dfThicknessOption', e.target.value)} 
                                className="bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 py-1 px-2 outline-none"
                              >
                                <option value="5x3">5x3</option>
                                <option value="6x4">6x4</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Front Face:</span>
                            <div className="flex bg-gray-200 rounded p-0.5">
                              <button 
                                type="button"
                                onClick={() => updateDetailField('mainCarvingFace', 'w')}
                                className={`px-2.5 py-0.5 text-xs font-bold rounded transition-colors ${data.mainCarvingFace === 'w' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                              >
                                {mainW}in
                              </button>
                              <button 
                                type="button"
                                onClick={() => updateDetailField('mainCarvingFace', 't')}
                                className={`px-2.5 py-0.5 text-xs font-bold rounded transition-colors ${data.mainCarvingFace === 't' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                              >
                                {mainT}in
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Bottom Piece:</span>
                            <button 
                              type="button"
                              onClick={() => updateDetailField('excludeBottomPiece', !data.excludeBottomPiece)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${!data.excludeBottomPiece ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {!data.excludeBottomPiece ? 'Yes' : 'No'}
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="text-gray-600 font-medium">Border Frame:</span>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newVal = !data.hasBorder;
                                  updateDetailField('hasBorder', newVal);
                                  if (newVal) updateDetailField('hasCarving', true);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${data.hasBorder ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}
                              >
                                {data.hasBorder ? 'Yes' : 'No'}
                              </button>
                              
                              {data.hasBorder && (
                                <>
                                  {data.borderThicknessOption === 'custom' && (
                                    <div className="flex items-center gap-1">
                                      <input type="number" value={data.borderCustomW || ''} onChange={e => updateDetailField('borderCustomW', e.target.value)} className="w-10 text-center border border-gray-300 bg-white rounded text-sm py-0.5 font-bold focus:border-blue-600 focus:outline-none" />
                                      <span className="text-gray-400">x</span>
                                      <input type="number" value={data.borderCustomT || ''} onChange={e => updateDetailField('borderCustomT', e.target.value)} className="w-10 text-center border border-gray-300 bg-white rounded text-sm py-0.5 font-bold focus:border-blue-600 focus:outline-none" />
                                    </div>
                                  )}
                                  <select 
                                    value={data.borderThicknessOption || '4x1.5'} 
                                    onChange={e => updateDetailField('borderThicknessOption', e.target.value)} 
                                    className="bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 py-1 px-2 outline-none"
                                  >
                                    <option value="4x1.5">4x1.5</option>
                                    <option value="3x1.5">3x1.5</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                </>
                              )}
                            </div>
                          </div>

                          {estimate.innerDimensions && (
                            <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 text-blue-800 text-xs">
                              <span className="font-medium">Calculated Inner Size:</span>
                              <span className="font-bold">{formatDimension(estimate.innerDimensions.w, 'in')} x {formatDimension(estimate.innerDimensions.h, 'in')}</span>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Wood & Volume */}
                      <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Wood & Volume</h3>
                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-700 font-medium">Wood Type:</span>
                            <select 
                              value={data.selectedWoodId || ''} 
                              onChange={e => updateDetailField('selectedWoodId', e.target.value)}
                              className="bg-white border border-emerald-200 rounded text-sm font-bold text-emerald-900 py-1 px-2 outline-none capitalize max-w-[160px]"
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

                      {/* Labour & Lumpsum */}
                      <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Labour & Lumpsum</h3>
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Fitting Labour:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500 font-bold">₹</span>
                              <input 
                                type="number" 
                                value={data.fittingLabour || ''} 
                                onChange={e => updateDetailField('fittingLabour', e.target.value)} 
                                className="w-24 text-right bg-white border border-blue-200 rounded text-sm font-bold text-blue-900 py-1 px-2 outline-none focus:border-blue-600" 
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

                      {/* Carving Details */}
                      <section>
                        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-1">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Carving Details</h3>
                          <button 
                            type="button"
                            onClick={() => updateDetailField('hasCarving', !data.hasCarving)}
                            className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${data.hasCarving ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'}`}
                          >
                            {data.hasCarving ? 'Yes' : 'No'}
                          </button>
                        </div>
                        {data.hasCarving ? (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-amber-700 font-bold">Carving Area:</span><span className="font-bold text-amber-900">{estimate.totalCarvingArea.toFixed(2)} sq.in</span></div>
                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-amber-100">
                              <span className="text-amber-700 font-medium">Rate per sq.in:</span>
                              <div className="flex items-center gap-2">
                                {data.carvingRateOption === 'custom' && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-500 font-bold">₹</span>
                                    <input type="number" value={data.carvingRate || ''} onChange={e => updateDetailField('carvingRate', e.target.value)} className="w-16 text-right bg-white border border-amber-200 rounded text-sm font-bold text-amber-900 py-1 px-1 outline-none" />
                                  </div>
                                )}
                                <select 
                                  value={data.carvingRateOption || '3.5'} 
                                  onChange={e => updateDetailField('carvingRateOption', e.target.value)} 
                                  className="bg-white border border-amber-200 rounded text-sm font-bold text-amber-900 py-1 px-2 outline-none"
                                >
                                  <option value="3.5">₹3.5</option>
                                  <option value="5">₹5.0</option>
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-between pt-1 mt-1 border-t border-amber-200"><span className="text-amber-700 font-bold">Carving Cost:</span><span className="font-black text-amber-900">₹{estimate.totalCarvingCost.toFixed(0)}</span></div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                            <span>No carving configured on this door frame.</span>
                            <button 
                              type="button" 
                              onClick={() => updateDetailField('hasCarving', true)}
                              className="text-xs font-bold text-amber-700 hover:text-amber-800"
                            >
                              + Enable Carving
                            </button>
                          </div>
                        )}
                      </section>

                      {/* Door Frame Estimate Total & Direct Order Save Action */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Door Frame Estimate</div>
                          <div className="text-2xl font-black text-gray-900">₹{Math.round(estimate.finalCost).toLocaleString()}</div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200">
                          <input
                            type="checkbox"
                            checked={updateUnitPrice}
                            onChange={(e) => setUpdateUnitPrice(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-xs font-bold text-gray-800">
                            Update item unit price to estimate total (₹{Math.round(estimate.finalCost).toLocaleString()})
                          </span>
                        </label>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
                          {item.estimateData && (
                            <button
                              type="button"
                              onClick={handleDetachEstimate}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Detach</span>
                            </button>
                          )}
                          
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => setMode('select')}
                              className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Templates</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={handleSaveDoorFrameEstimate}
                              className="px-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>{item.estimateData ? 'Save Changes to Item' : 'Attach to Item'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Non-Door Frame (e.g. Custom Blocks) Summary with Edit in Wood Estimator */
              <div className="space-y-4">
                {/* Top Highlights Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Est. Final Cost</span>
                    <span className="text-lg sm:text-xl font-black text-amber-950">
                      ₹{Math.round(currentComputed?.finalCost || editingData.finalCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Total Volume</span>
                    <span className="text-lg sm:text-xl font-black text-blue-950">
                      {(currentComputed?.totalVolumeCft || 0).toFixed(2)} <span className="text-xs font-semibold">CFT</span>
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Wood Type</span>
                    <span className="text-sm sm:text-base font-black text-emerald-950 truncate block">
                      {currentComputed?.woodName || 'Standard'}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Template</span>
                    <span className="text-sm sm:text-base font-black text-purple-950 capitalize truncate block">
                      {editingData.activeTemplate === 'door_frame' ? 'Door Frame' : 'Custom'}
                    </span>
                  </div>
                </div>

                {/* Specification Breakdown Card */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-700" />
                    Dimensional & Structural Specifications
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">Blocks Count:</span>
                      <strong className="text-gray-900 font-bold">
                        {editingData.blocks?.reduce((acc, b) => acc + (parseFloat(b.pcs) || 1), 0) || editingData.blocks?.length || 0} pieces
                      </strong>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 block">Carving Work:</span>
                      <strong className="text-gray-900 font-bold">
                        {editingData.hasCarving ? `Yes (₹${Math.round(currentComputed?.totalCarvingCost || 0)})` : 'None'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 block">Total Labour:</span>
                      <strong className="text-gray-900 font-bold">
                        ₹{Math.round(currentComputed?.totalLabour || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Non-Door-Frame View Mode */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleDetachEstimate}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Detach Estimate</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('select')}
                      className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenInEstimator(editingData)}
                      className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Edit in Wood Estimator</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Option Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Select a Saved Template or Build New
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNewDoorFrame}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ New Door Frame</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenInEstimator(null)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Wood Estimator</span>
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search saved custom products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none"
                />
              </div>

              {/* List of Saved Estimates */}
              {isLoadingEstimates ? (
                <div className="flex justify-center items-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredSavedEstimates.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Box className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No saved custom products found</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    You can configure this order item directly in the Wood Estimator.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenInEstimator(null)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <span>Launch Wood Estimator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredSavedEstimates.map((est) => {
                    const isSelected = selectedEstimate?.id === est.id;
                    const computed = getComputedDetails(est.data);
                    const costNum = Math.round(computed?.finalCost || est.totalCost || 0);

                    return (
                      <div
                        key={est.id}
                        onClick={() => setSelectedEstimate(est)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="font-bold text-sm text-gray-900 truncate pr-2">
                            {est.name}
                          </h4>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-gray-400">
                              {est.data?.activeTemplate === 'door_frame' ? 'Door Frame' : 'Custom'}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-end text-xs">
                          <span className="text-gray-500">
                            {(computed?.totalVolumeCft || 0).toFixed(2)} CFT · {computed?.woodName || 'Wood'}
                          </span>
                          <span className="font-black text-gray-900 text-sm">
                            ₹{costNum.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Update Option & Confirm Button */}
              {selectedEstimate && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateUnitPrice}
                      onChange={(e) => setUpdateUnitPrice(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      Update item unit price to estimate total (₹{Math.round(getComputedDetails(selectedEstimate.data)?.finalCost || selectedEstimate.totalCost || 0).toLocaleString()})
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedEstimate(null)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                    {selectedEstimate.data?.activeTemplate === 'door_frame' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingData({ ...selectedEstimate.data });
                          setMode('view');
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Customize in Door Frame UI</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAttachEstimate(selectedEstimate)}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Attach to Item</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
