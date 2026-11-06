import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { 
  X, 
  Ruler, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  Box, 
  Sparkles, 
  Layers, 
  Calculator,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateEstimate } from '../utils/estimationEngine';

export default function ProductEstimateModal({
  isOpen,
  onClose,
  product,
  onEstimateSaved,
}) {
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState('door_frame');
  const [woodTypes, setWoodTypes] = useState([]);
  const [isLoadingWoods, setIsLoadingWoods] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [updateDefaultPrice, setUpdateDefaultPrice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenWoodEstimator = () => {
    onClose();
    navigate('/wood-estimator', {
      state: {
        returnToProduct: {
          productId: product?.id || null,
          productName: product?.name || 'Product',
          product: product,
          returnUrl: '/products'
        },
        loadEstimate: (editingData || product?.estimateData) ? {
          name: product?.name || 'Product Estimate',
          data: editingData || product?.estimateData,
          id: product?.savedEstimateId || null
        } : null
      }
    });
  };

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
    carvingRateOption: '5',
    mainCarvingFace: 'w',
    notes: '',
    labourItems: [],
  });

  const getDefaultCustomData = (firstWoodId = '') => ({
    activeTemplate: 'custom',
    selectedWoodId: firstWoodId,
    blocks: [
      { id: '1', length: '7', lengthUnit: 'ft', width: '4', thickness: '1.5', quantity: '1', label: 'Main Plank' }
    ],
    labourItems: [],
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    fetchWoodTypes();

    if (product?.estimateData) {
      setEditingData({ ...product.estimateData });
      setActiveTemplate(product.estimateData.activeTemplate || 'door_frame');
      const existingQuote = product.estimateData.quotedAmount ?? (product.defaultUnitPrice ? Math.round(Number(product.defaultUnitPrice)) : '');
      setQuoteAmount(existingQuote ? String(existingQuote) : '');
    } else {
      setActiveTemplate('door_frame');
      setEditingData(null);
      setQuoteAmount(product?.defaultUnitPrice ? String(Math.round(Number(product.defaultUnitPrice))) : '');
    }
  }, [isOpen, product]);

  const fetchWoodTypes = async () => {
    setIsLoadingWoods(true);
    try {
      const woods = await api.get('/wood-types');
      setWoodTypes(woods || []);

      if (!product?.estimateData && woods?.length > 0) {
        setEditingData((prev) => prev || getDefaultDoorFrameData(woods[0].id));
      }
    } catch (err) {
      console.error('Failed to load wood types:', err);
    } finally {
      setIsLoadingWoods(false);
    }
  };

  const updateField = (field, val) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleTemplateSwitch = (tmpl) => {
    setActiveTemplate(tmpl);
    const firstWoodId = woodTypes[0]?.id || '';
    if (tmpl === 'door_frame') {
      setEditingData(getDefaultDoorFrameData(firstWoodId));
    } else {
      setEditingData(getDefaultCustomData(firstWoodId));
    }
  };

  // Live calculation
  let computed = null;
  if (editingData && woodTypes.length > 0) {
    try {
      computed = calculateEstimate(editingData, woodTypes);
    } catch (e) {
      console.error(e);
    }
  }

  const estimatedTotal = Math.round(computed?.finalCost || 0);
  const totalVolumeCft = computed?.totalVolumeCft ? Number(computed.totalVolumeCft).toFixed(2) : '0';

  const handleSave = async () => {
    if (!editingData) return;
    setIsSubmitting(true);

    try {
      const finalCost = estimatedTotal;
      const effectiveQuote = quoteAmount !== '' && !isNaN(Number(quoteAmount))
        ? Math.round(Number(quoteAmount))
        : finalCost;

      const payload = {
        estimateData: {
          ...editingData,
          activeTemplate,
          finalCost,
          quotedAmount: effectiveQuote,
          totalVolumeCft: computed?.totalVolumeCft || 0,
        },
        updateUnitPrice: updateDefaultPrice,
        unitPrice: effectiveQuote,
      };

      if (product?.id) {
        const updatedProduct = await api.patch(`/products/${product.id}/estimate`, payload);
        toast.success(`Estimate copy saved to ${product.name}`);
        if (onEstimateSaved) onEstimateSaved(updatedProduct);
      } else {
        // Return payload for new product form
        if (onEstimateSaved) onEstimateSaved(payload);
        toast.success('Estimate copy prepared');
      }

      onClose();
    } catch (err) {
      console.error('Failed to save estimate:', err);
      toast.error(err.response?.data?.message || 'Failed to save estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetach = async () => {
    if (!window.confirm('Remove the estimate copy from this product?')) return;
    setIsSubmitting(true);
    try {
      if (product?.id) {
        const updated = await api.patch(`/products/${product.id}/estimate`, {
          estimateData: null,
          savedEstimateId: null,
        });
        toast.success('Estimate copy detached');
        if (onEstimateSaved) onEstimateSaved(updated);
      } else {
        if (onEstimateSaved) onEstimateSaved({ estimateData: null });
      }
      onClose();
    } catch (err) {
      console.error('Failed to detach estimate:', err);
      toast.error('Failed to detach estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {product?.name ? `${product.name} - Estimate Copy` : 'Product Estimate Copy'}
              </h2>
              <p className="text-xs text-gray-500">
                Configure specifications, wood requirements & pricing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenWoodEstimator}
              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Open full Wood Estimator page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Wood Estimator</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Switcher Tabs */}
        <div className="p-3 bg-white border-b border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={() => handleTemplateSwitch('door_frame')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              activeTemplate === 'door_frame'
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Box className="w-4 h-4" />
            Door Frame
          </button>
          <button
            type="button"
            onClick={() => handleTemplateSwitch('custom')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              activeTemplate === 'custom'
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Custom Blocks
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingWoods ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading wood options...
            </div>
          ) : editingData ? (
            <>
              {/* Wood Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Wood Spec & Species <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {woodTypes.map((wood) => {
                    const isSelected = String(editingData.selectedWoodId) === String(wood.id);
                    return (
                      <button
                        key={wood.id}
                        type="button"
                        onClick={() => updateField('selectedWoodId', wood.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">{wood.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          ₹{Number(wood.price).toLocaleString()}/cft
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DOOR FRAME TEMPLATE INPUTS */}
              {activeTemplate === 'door_frame' && (
                <div className="space-y-4 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200/80">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Width
                      </label>
                      <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden shadow-xs">
                        <input
                          type="number"
                          step="0.1"
                          value={editingData.dfWidth}
                          onChange={(e) => updateField('dfWidth', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm focus:outline-none"
                          placeholder="3.5"
                        />
                        <select
                          value={editingData.dfWidthUnit || 'ft'}
                          onChange={(e) => updateField('dfWidthUnit', e.target.value)}
                          className="bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 border-l border-gray-300"
                        >
                          <option value="ft">ft</option>
                          <option value="in">in</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Height
                      </label>
                      <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden shadow-xs">
                        <input
                          type="number"
                          step="0.1"
                          value={editingData.dfHeight}
                          onChange={(e) => updateField('dfHeight', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm focus:outline-none"
                          placeholder="7"
                        />
                        <select
                          value={editingData.dfHeightUnit || 'ft'}
                          onChange={(e) => updateField('dfHeightUnit', e.target.value)}
                          className="bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 border-l border-gray-300"
                        >
                          <option value="ft">ft</option>
                          <option value="in">in</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Thickness (in × in)
                    </label>
                    <div className="flex gap-2">
                      {['5x3', '4x3', '6x3', '5x2.5'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField('dfThicknessOption', opt)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                            editingData.dfThicknessOption === opt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-gray-200/60">
                    <span className="text-xs font-medium text-gray-700">Bottom piece (Sill)</span>
                    <button
                      type="button"
                      onClick={() => updateField('excludeBottomPiece', !editingData.excludeBottomPiece)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                        editingData.excludeBottomPiece
                          ? 'bg-gray-200 text-gray-700 border-gray-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {editingData.excludeBottomPiece ? 'Excluded (3-piece)' : 'Included (4-piece)'}
                    </button>
                  </div>

                  {/* Border Options */}
                  <div className="space-y-2 border-t border-gray-200/60 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800">Border / Beading</span>
                      <input
                        type="checkbox"
                        checked={Boolean(editingData.hasBorder)}
                        onChange={(e) => updateField('hasBorder', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </div>
                    {editingData.hasBorder && (
                      <div className="flex gap-2">
                        {['4x1.5', '3x1.5', '5x1.5'].map((bOpt) => (
                          <button
                            key={bOpt}
                            type="button"
                            onClick={() => updateField('borderThicknessOption', bOpt)}
                            className={`flex-1 py-1 text-xs rounded border ${
                              editingData.borderThicknessOption === bOpt
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300'
                            }`}
                          >
                            {bOpt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Carving Section */}
                  <div className="space-y-2 border-t border-gray-200/60 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800">Carving Work</span>
                      <input
                        type="checkbox"
                        checked={Boolean(editingData.hasCarving)}
                        onChange={(e) => updateField('hasCarving', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </div>
                    {editingData.hasCarving && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-gray-600 block mb-1">Rate (₹/sq inch)</label>
                          <input
                            type="number"
                            value={editingData.carvingRateOption || '5'}
                            onChange={(e) => updateField('carvingRateOption', e.target.value)}
                            className="w-full px-2.5 py-1 rounded border border-gray-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 block mb-1">Carved Face</label>
                          <select
                            value={editingData.mainCarvingFace || 'w'}
                            onChange={(e) => updateField('mainCarvingFace', e.target.value)}
                            className="w-full px-2.5 py-1 rounded border border-gray-300 bg-white"
                          >
                            <option value="w">Width Face (Outer)</option>
                            <option value="t">Thickness Face</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fitting Labour */}
                  <div className="border-t border-gray-200/60 pt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800">Fitting Labour (₹)</span>
                    <input
                      type="number"
                      value={editingData.fittingLabour || ''}
                      onChange={(e) => updateField('fittingLabour', e.target.value)}
                      className="w-28 px-2.5 py-1 rounded border border-gray-300 bg-white text-right text-xs"
                      placeholder="1200"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOM BLOCKS TEMPLATE */}
              {activeTemplate === 'custom' && (
                <div className="space-y-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Timber Pieces & Blocks</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newBlocks = [
                          ...(editingData.blocks || []),
                          {
                            id: String(Date.now()),
                            length: '7',
                            lengthUnit: 'ft',
                            width: '4',
                            thickness: '1.5',
                            quantity: '1',
                            label: 'Piece',
                          },
                        ];
                        updateField('blocks', newBlocks);
                      }}
                      className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Piece
                    </button>
                  </div>

                  {(editingData.blocks || []).map((b, idx) => (
                    <div key={b.id || idx} className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <input
                          type="text"
                          value={b.label || ''}
                          onChange={(e) => {
                            const updated = [...editingData.blocks];
                            updated[idx].label = e.target.value;
                            updateField('blocks', updated);
                          }}
                          placeholder={`Piece #${idx + 1}`}
                          className="font-semibold text-gray-800 border-none p-0 focus:outline-none w-32"
                        />
                        {editingData.blocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingData.blocks.filter((_, i) => i !== idx);
                              updateField('blocks', updated);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <span className="text-[10px] text-gray-500 block">Length ({b.lengthUnit || 'ft'})</span>
                          <input
                            type="number"
                            step="0.1"
                            value={b.length}
                            onChange={(e) => {
                              const updated = [...editingData.blocks];
                              updated[idx].length = e.target.value;
                              updateField('blocks', updated);
                            }}
                            className="w-full p-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block">Width (in)</span>
                          <input
                            type="number"
                            step="0.1"
                            value={b.width}
                            onChange={(e) => {
                              const updated = [...editingData.blocks];
                              updated[idx].width = e.target.value;
                              updateField('blocks', updated);
                            }}
                            className="w-full p-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block">Thick (in)</span>
                          <input
                            type="number"
                            step="0.1"
                            value={b.thickness}
                            onChange={(e) => {
                              const updated = [...editingData.blocks];
                              updated[idx].thickness = e.target.value;
                              updateField('blocks', updated);
                            }}
                            className="w-full p-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block">Qty</span>
                          <input
                            type="number"
                            value={b.quantity}
                            onChange={(e) => {
                              const updated = [...editingData.blocks];
                              updated[idx].quantity = e.target.value;
                              updateField('blocks', updated);
                            }}
                            className="w-full p-1 border rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Estimate Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Estimate Specifications & Notes
                </label>
                <textarea
                  value={editingData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="e.g. Double rebate, teak finish, customer requested carving on top beam..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Sync Unit Price Option */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-900">
                    Sync Default Price with Customer Quote
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Automatically update product catalog price to match the customer quote
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={updateDefaultPrice}
                  onChange={(e) => setUpdateDefaultPrice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with Calculation & Actions */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-3">
          {/* Numbers Bar */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <div className="text-[11px] text-gray-500 font-medium">
                Volume: <span className="font-bold text-gray-700">{totalVolumeCft} CFT</span>
              </div>
              <div className="text-xs text-gray-600">
                Total Estimate: <span className="font-semibold text-gray-800">₹{estimatedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-right">
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">
                Customer Quote (₹)
              </label>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder={String(estimatedTotal)}
                className="w-32 px-3 py-1 bg-white border-2 border-blue-600 rounded-lg text-base font-bold text-blue-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {product?.estimateData && (
              <button
                type="button"
                onClick={handleDetach}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors mr-auto"
              >
                Detach
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || !editingData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Estimate Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
