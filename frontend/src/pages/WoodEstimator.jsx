import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Pencil, Plus, Trash2, X, Settings2, Save, Download, Loader2 } from 'lucide-react';
import { calculateEstimate, ESTIMATION_ENGINE_VERSION } from '../utils/estimationEngine';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const PRODUCT_TEMPLATES = [
  { id: 'door_frame', name: 'Smart Door Frame' },
  { id: 'custom', name: 'Custom Blocks' },
  { id: 'standard_door', name: 'Standard Door' },
  { id: 'window_frame', name: 'Window Frame' },
];

const STANDARD_BLOCKS = {
  custom: [{ id: 'b1', l: '', lu: 'ft', w: '', wu: 'in', t: '', tu: 'in' }],
  standard_door: [{ id: 'b1', l: '7', lu: 'ft', w: '3', wu: 'ft', t: '1.5', tu: 'in' }],
  window_frame: [
     { id: 'b1', l: '4', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' }, 
     { id: 'b2', l: '4', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' }, 
     { id: 'b3', l: '5', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
     { id: 'b4', l: '5', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
  ]
};

const UnitInput = ({ label, value, onChange, unit, onUnitChange, placeholder, className = '' }) => {
  return (
    <div className={`flex-1 ${className}`}>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <div className="relative">
        <input 
          type="number" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="input-field pr-10" 
          placeholder={placeholder}
        />
        <button 
          type="button"
          onClick={() => onUnitChange(unit === 'ft' ? 'in' : 'ft')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-1.5 py-1 rounded transition-colors select-none"
        >
          {unit}
        </button>
      </div>
    </div>
  );
};

const TEMPLATES = [
  { id: 'door_frame', name: 'Door Frame (Smart Form)' },
  { id: 'custom', name: 'Custom Blocks (Blank)' },
  { id: 'standard_door', name: 'Standard Door' },
  { id: 'window_frame', name: 'Window Frame' },
];

export default function WoodEstimator() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTemplate, setActiveTemplate] = useState('door_frame');

  const [woodTypes, setWoodTypes] = useState([]);
  const [selectedWood, setSelectedWood] = useState(null);

  useEffect(() => {
    api.get('/wood-types')
      .then(data => {
        if (data && data.length > 0) {
          setWoodTypes(data);
          const savedSelection = localStorage.getItem('zenkar_selected_wood');
          if (savedSelection) {
            try {
              const parsed = JSON.parse(savedSelection);
              const exists = data.find(w => w.id === parsed.id);
              setSelectedWood(exists || data[0] || null);
            } catch (e) {
              setSelectedWood(data[0] || null);
            }
          } else {
            setSelectedWood(data[0] || null);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedWood) {
      localStorage.setItem('zenkar_selected_wood', JSON.stringify(selectedWood));
    }
  }, [selectedWood]);

  const [isWoodModalVisible, setWoodModalVisible] = useState(false);

  // General Block State
  const [blocks, setBlocks] = useState(STANDARD_BLOCKS.custom);

  // Door Frame Specific State
  const [dfThicknessOption, setDfThicknessOption] = useState('5x3'); 
  const [dfCustomW, setDfCustomW] = useState('');
  const [dfCustomWUnit, setDfCustomWUnit] = useState('in');
  const [dfCustomT, setDfCustomT] = useState('');
  const [dfCustomTUnit, setDfCustomTUnit] = useState('in');
  
  const [dfHeight, setDfHeight] = useState('7');
  const [dfHeightUnit, setDfHeightUnit] = useState('ft');
  const [dfWidth, setDfWidth] = useState('3.5');
  const [dfWidthUnit, setDfWidthUnit] = useState('ft');
  const [excludeBottomPiece, setExcludeBottomPiece] = useState(false);

  const [hasBorder, setHasBorder] = useState(false);
  const [borderThicknessOption, setBorderThicknessOption] = useState('4x1.5');
  const [borderCustomW, setBorderCustomW] = useState('');
  const [borderCustomWUnit, setBorderCustomWUnit] = useState('in');
  const [borderCustomT, setBorderCustomT] = useState('');
  const [borderCustomTUnit, setBorderCustomTUnit] = useState('in');
  
  const [borderHeight, setBorderHeight] = useState('7.5');
  const [borderHeightUnit, setBorderHeightUnit] = useState('ft');
  const [borderWidth, setBorderWidth] = useState('4.5');
  const [borderWidthUnit, setBorderWidthUnit] = useState('ft');

  const [hasArch, setHasArch] = useState(false);
  const [archHeight, setArchHeight] = useState('1');
  const [archHeightUnit, setArchHeightUnit] = useState('ft');

  // Labour and Carving State
  const [labourItems, setLabourItems] = useState([]);
  const [hasCarving, setHasCarving] = useState(false);
  const [carvings, setCarvings] = useState([{ id: 'c1', l: '', lu: 'in', w: '', wu: 'in' }]);
  const [carvingRateOption, setCarvingRateOption] = useState('3.5');
  const [carvingRate, setCarvingRate] = useState('');
  const [mainCarvingFace, setMainCarvingFace] = useState('w');
  const [fittingLabour, setFittingLabour] = useState('1200');

  useEffect(() => {
    if (activeTemplate === 'door_frame') {
      if (hasBorder) {
        setFittingLabour('2000');
        setHasCarving(true);
      } else {
        setFittingLabour('1200');
      }
    }
  }, [hasBorder, activeTemplate]);

  // Wood Types Management
  const addWoodType = async () => {
    try {
      const data = await api.post('/wood-types', { name: 'New Wood', price: 0 });
      setWoodTypes([...woodTypes, data]);
    } catch (e) {
      console.error(e);
    }
  };

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveEstimateName, setSaveEstimateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [savedEstimates, setSavedEstimates] = useState([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);

  const saveEstimate = async () => {
    if (!saveEstimateName.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        activeTemplate,
        selectedWoodId: selectedWood?.id,
        blocks,
        dfThicknessOption, dfCustomW, dfCustomWUnit, dfCustomT, dfCustomTUnit,
        dfHeight, dfHeightUnit, dfWidth, dfWidthUnit, excludeBottomPiece,
        hasBorder, borderThicknessOption, borderCustomW, borderCustomWUnit, borderCustomT, borderCustomTUnit,
        hasArch, archHeight, archHeightUnit,
        labourItems, hasCarving, carvings, carvingRateOption, carvingRate, mainCarvingFace, fittingLabour,
        version: ESTIMATION_ENGINE_VERSION
      };
      await api.post('/saved-estimates', {
        name: saveEstimateName,
        data,
        totalCost: estimateData.finalCost,
        createdBy: user?.name || user?.username || 'admin'
      });
      setSaveModalVisible(false);
      setSaveEstimateName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (loadModalVisible) {
      setIsLoadingEstimates(true);
      api.get('/saved-estimates')
        .then(data => setSavedEstimates(data))
        .catch(console.error)
        .finally(() => setIsLoadingEstimates(false));
    }
  }, [loadModalVisible]);

  const loadEstimate = (estimate) => {
    const { data } = estimate;
    setActiveTemplate(data.activeTemplate || 'door_frame');
    if (data.selectedWoodId) {
      const wood = woodTypes.find(w => w.id === data.selectedWoodId);
      if (wood) setSelectedWood(wood);
    }
    setBlocks(data.blocks || STANDARD_BLOCKS.custom);
    
    setDfThicknessOption(data.dfThicknessOption || '5x3');
    setDfCustomW(data.dfCustomW || ''); setDfCustomWUnit(data.dfCustomWUnit || 'in');
    setDfCustomT(data.dfCustomT || ''); setDfCustomTUnit(data.dfCustomTUnit || 'in');
    setDfHeight(data.dfHeight || '7'); setDfHeightUnit(data.dfHeightUnit || 'ft');
    setDfWidth(data.dfWidth || '3.5'); setDfWidthUnit(data.dfWidthUnit || 'ft');
    setExcludeBottomPiece(!!data.excludeBottomPiece);
    
    setHasBorder(!!data.hasBorder);
    setBorderThicknessOption(data.borderThicknessOption || '4x1.5');
    setBorderCustomW(data.borderCustomW || ''); setBorderCustomWUnit(data.borderCustomWUnit || 'in');
    setBorderCustomT(data.borderCustomT || ''); setBorderCustomTUnit(data.borderCustomTUnit || 'in');
    
    setHasArch(!!data.hasArch);
    setArchHeight(data.archHeight || data.archWidth || '1');
    setArchHeightUnit(data.archHeightUnit || data.archWidthUnit || 'ft');
    
    setLabourItems(data.labourItems || []);
    setHasCarving(!!data.hasCarving);
    setCarvings(data.carvings || [{ id: 'c1', l: '', lu: 'in', w: '', wu: 'in' }]);
    setCarvingRateOption(data.carvingRateOption || '3.5');
    setCarvingRate(data.carvingRate || '');
    setMainCarvingFace(data.mainCarvingFace || 'w');
    setFittingLabour(data.fittingLabour || '1200');
    
    setLoadModalVisible(false);
  };

  useEffect(() => {
    if (location.state?.loadEstimate && woodTypes.length > 0) {
      loadEstimate(location.state.loadEstimate);
      window.history.replaceState({}, document.title)
    }
  }, [location.state, woodTypes]);

  const deleteSavedEstimate = async (id) => {
    try {
      await api.delete(`/saved-estimates/${id}`);
      setSavedEstimates(savedEstimates.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateWoodTypeLocal = (id, field, value) => {
    setWoodTypes(woodTypes.map(w => w.id === id ? { ...w, [field]: value } : w));
    if (selectedWood?.id === id) {
      setSelectedWood(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveWoodType = async (id) => {
    const wood = woodTypes.find(w => w.id === id);
    if (!wood) return;
    try {
      await api.put(`/wood-types/${id}`, { name: wood.name, price: parseFloat(wood.price) || 0 });
    } catch (e) { console.error(e); }
  };

  const applyTemplate = (templateId) => {
    setActiveTemplate(templateId);
    if (STANDARD_BLOCKS[templateId]) {
      setBlocks(STANDARD_BLOCKS[templateId].map(b => ({ ...b, id: Date.now().toString() + Math.random() })));
    }
    
    if (templateId === 'door_frame') {
      setLabourItems([
        { id: 'l1', desc: 'Fitting', amount: '2000' },
        { id: 'l2', desc: 'Finishing', amount: '2000' }
      ]);
    } else {
      setLabourItems([{ id: '1', desc: 'Making Charges', amount: '' }]);
    }
  };

  const addBlock = () => setBlocks([...blocks, { id: Date.now().toString(), l: '', lu: 'ft', w: '', wu: 'in', t: '', tu: 'in' }]);
  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));
  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addLabourItem = () => setLabourItems([...labourItems, { id: Date.now().toString(), desc: '', amount: '' }]);
  const removeLabourItem = (id) => setLabourItems(labourItems.filter(l => l.id !== id));
  const updateLabourItem = (id, field, value) => {
    setLabourItems(labourItems.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addCarving = () => setCarvings([...carvings, { id: Date.now().toString(), l: '', lu: 'in', w: '', wu: 'in' }]);
  const removeCarving = (id) => setCarvings(carvings.filter(c => c.id !== id));
  const updateCarving = (id, field, value) => {
    setCarvings(carvings.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const currentStateData = {
    activeTemplate, selectedWoodId: selectedWood?.id, blocks,
    dfThicknessOption, dfCustomW, dfCustomWUnit, dfCustomT, dfCustomTUnit,
    dfHeight, dfHeightUnit, dfWidth, dfWidthUnit, excludeBottomPiece,
    hasBorder, borderThicknessOption, borderCustomW, borderCustomWUnit, borderCustomT, borderCustomTUnit,
    hasArch, archHeight, archHeightUnit,
    labourItems, hasCarving, carvings, carvingRateOption, carvingRate, mainCarvingFace, fittingLabour
  };

  const estimateData = useMemo(() => calculateEstimate(currentStateData, woodTypes), [
    currentStateData, woodTypes
  ]);

  const {
    computedBlocks,
    totalVolumeCft: totalCft,
    totalWoodCost: woodCost,
    totalCarvingArea,
    totalCarvingCost,
    innerDimensions,
    computedCarvingBlocks,
    finishingLabour,
    totalLabour,
    profitMargin,
    finalCost,
    inventoryError
  } = estimateData;

  return (
    <div className="flex flex-col min-h-full bg-white pb-24">
      <div className="p-4 md:p-6 bg-white border-b-8 border-gray-900 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Estimation</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setLoadModalVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-900 border-2 border-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Load</span>
          </button>
          <button 
            onClick={() => setSaveModalVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col">
        <section className="bg-white p-3 md:p-4 border-b-4 border-gray-900">
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">1. Choose Product</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.id)}
                className={`flex-shrink-0 w-auto px-3 py-1.5 rounded-md border-2 text-xs text-left transition-all snap-start whitespace-nowrap ${
                  activeTemplate === template.id 
                    ? 'border-gray-900 bg-gray-900 text-white font-semibold shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 font-medium'
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-3 md:p-4 border-b-4 border-gray-900">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Select Wood Type</h2>
            <button 
              onClick={() => setWoodModalVisible(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold text-gray-900 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {woodTypes.map(wood => (
              <button
                key={wood.id}
                onClick={() => setSelectedWood(wood)}
                className={`flex-shrink-0 w-32 p-2 rounded-md border-2 text-left transition-all snap-start ${
                  selectedWood?.id === wood.id 
                    ? 'border-gray-900 bg-gray-900 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`text-xs font-bold ${selectedWood?.id === wood.id ? 'text-white' : 'text-gray-700'}`}>
                  {wood.name}
                </div>
                <div className={`text-[10px] mt-0.5 ${selectedWood?.id === wood.id ? 'text-gray-300' : 'text-gray-500'}`}>
                  ₹{wood.price}/cft
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-3 md:p-4 border-b-4 border-gray-900">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Customize Dimensions</h2>
          </div>
          
          {activeTemplate === 'door_frame' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 md:p-5 rounded-xl border-2 border-gray-900 space-y-4 shadow-sm">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-gray-900" />
                  Main Frame Specs
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Thickness (W x T)</label>
                    <div className="flex gap-2 flex-wrap">
                      {['5x3', '6x4', 'custom'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setDfThicknessOption(opt)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                            dfThicknessOption === opt 
                              ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {opt === 'custom' ? 'Custom' : opt}
                        </button>
                      ))}
                    </div>
                    {dfThicknessOption === 'custom' && (
                      <div className="flex gap-2 mt-3">
                        <UnitInput 
                          value={dfCustomW} 
                          onChange={setDfCustomW} 
                          unit={dfCustomWUnit} 
                          onUnitChange={setDfCustomWUnit} 
                          placeholder="W" 
                        />
                        <span className="self-center text-gray-400 font-bold">x</span>
                        <UnitInput 
                          value={dfCustomT} 
                          onChange={setDfCustomT} 
                          unit={dfCustomTUnit} 
                          onUnitChange={setDfCustomTUnit} 
                          placeholder="T" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <UnitInput 
                      label="Height" 
                      value={dfHeight} 
                      onChange={setDfHeight} 
                      unit={dfHeightUnit} 
                      onUnitChange={setDfHeightUnit} 
                      placeholder="7" 
                    />
                    <UnitInput 
                      label="Width" 
                      value={dfWidth} 
                      onChange={setDfWidth} 
                      unit={dfWidthUnit} 
                      onUnitChange={setDfWidthUnit} 
                      placeholder="3.5" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Front Face (Carving Side)</label>
                    {(() => {
                      let w = 5, t = 3;
                      if (dfThicknessOption === '6x4') { w = 6; t = 4; }
                      else if (dfThicknessOption === 'custom') { 
                        w = parseFloat(dfCustomW) || 0; 
                        t = parseFloat(dfCustomT) || 0; 
                      }
                      return (
                        <div className="flex gap-2">
                          <button onClick={() => setMainCarvingFace('w')} className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${mainCarvingFace === 'w' ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>Width ({w}")</button>
                          <button onClick={() => setMainCarvingFace('t')} className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${mainCarvingFace === 't' ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>Thickness ({t}")</button>
                        </div>
                      );
                    })()}
                  </div>

                  {innerDimensions && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Calculated Inner Dimensions</div>
                      <div className="text-xl font-black text-blue-900">
                        {Math.floor(innerDimensions.h / 12)}ft {Math.round(innerDimensions.h % 12)}in 
                        <span className="mx-2 text-blue-400 font-medium">×</span> 
                        {Math.floor(innerDimensions.w / 12)}ft {Math.round(innerDimensions.w % 12)}in
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <h4 className="font-bold text-gray-800 text-sm">Exclude Bottom Piece?</h4>
                    <button 
                      onClick={() => setExcludeBottomPiece(!excludeBottomPiece)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${excludeBottomPiece ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${excludeBottomPiece ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 md:p-5 rounded-xl border-2 border-gray-900 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-gray-900" />
                    Border Frame
                  </h3>
                  <button 
                    onClick={() => setHasBorder(!hasBorder)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors border-2 ${hasBorder ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${hasBorder ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                {hasBorder && (
                  <div className="space-y-5 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Thickness (W x T)</label>
                        <div className="flex gap-2 flex-wrap">
                          {['4x1.5', '3x1.5', 'custom'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => setBorderThicknessOption(opt)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                                borderThicknessOption === opt 
                                  ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {opt === 'custom' ? 'Custom' : opt}
                            </button>
                          ))}
                        </div>
                        {borderThicknessOption === 'custom' && (
                          <div className="flex gap-2 mt-3">
                            <UnitInput 
                              value={borderCustomW} 
                              onChange={setBorderCustomW} 
                              unit={borderCustomWUnit} 
                              onUnitChange={setBorderCustomWUnit} 
                              placeholder="W" 
                            />
                            <span className="self-center text-gray-400 font-bold">x</span>
                            <UnitInput 
                              value={borderCustomT} 
                              onChange={setBorderCustomT} 
                              unit={borderCustomTUnit} 
                              onUnitChange={setBorderCustomTUnit} 
                              placeholder="T" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-800 text-sm">Replace Head with Arch?</h4>
                        <button 
                          onClick={() => setHasArch(!hasArch)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${hasArch ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasArch ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      
                      {hasArch && (
                        <div className="grid grid-cols-1 gap-3">
                          <UnitInput 
                            label="Arch Height" 
                            value={archHeight} 
                            onChange={setArchHeight} 
                            unit={archHeightUnit} 
                            onUnitChange={setArchHeightUnit} 
                            placeholder="1" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-900 px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wide border-b-2 border-gray-900">
                  Computed Blocks Breakdown
                </div>
                {inventoryError ? (
                  <div className="px-4 py-4 text-sm font-bold text-red-600 bg-red-50 text-center border-b border-red-100">
                    ⚠ {inventoryError}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 bg-white">
                    {computedBlocks.map(b => (
                       <div key={b.id} className="px-4 py-3 flex justify-between text-sm">
                         <span className="text-gray-600 font-medium">{b.name}</span>
                         <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded">
                           {b.l}{b.lu} x {b.w}{b.wu} x {b.t}{b.tu}
                         </span>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div key={block.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-700">Block {index + 1}</span>
                    <button onClick={() => removeBlock(block.id)} className="text-gray-400 hover:text-red-600 p-1 bg-white rounded-md border border-gray-200 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <UnitInput 
                      label="Length" 
                      value={block.l} 
                      onChange={(v) => updateBlock(block.id, 'l', v)} 
                      unit={block.lu} 
                      onUnitChange={(u) => updateBlock(block.id, 'lu', u)} 
                    />
                    <UnitInput 
                      label="Width" 
                      value={block.w} 
                      onChange={(v) => updateBlock(block.id, 'w', v)} 
                      unit={block.wu} 
                      onUnitChange={(u) => updateBlock(block.id, 'wu', u)} 
                    />
                    <UnitInput 
                      label="Thickness" 
                      value={block.t} 
                      onChange={(v) => updateBlock(block.id, 't', v)} 
                      unit={block.tu} 
                      onUnitChange={(u) => updateBlock(block.id, 'tu', u)} 
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addBlock}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-bold text-gray-500 border-2 border-dashed border-gray-300 hover:border-gray-900 hover:text-gray-900 rounded-xl transition-colors uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>
          )}
          
          <div className="mt-5 bg-gray-900 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-medium text-gray-300">Total Volume:</span>
            <span className="font-black text-xl">{totalCft.toFixed(2)} CFT</span>
          </div>
        </section>

        <section className="bg-white p-4 md:p-6 border-b-[8px] border-gray-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">4. Lumpsum</h2>
            <button 
              onClick={addLabourItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Row
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-2 md:gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Description</label>
                <div className="text-sm font-bold text-gray-800">Fitting Labour</div>
              </div>
              <div className="w-24 md:w-32">
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Amount (₹)</label>
                <input 
                  type="number" 
                  value={fittingLabour} 
                  onChange={(e) => setFittingLabour(e.target.value)}
                  className="input-field text-sm" 
                />
              </div>
              <div className="w-10"></div>
            </div>

            {hasCarving && (
              <div className="flex gap-2 md:gap-4 items-center bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-wide">Description</label>
                  <div className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    Finishing Labour 
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full hidden md:inline-block">30% of Carving</span>
                  </div>
                </div>
                <div className="w-24 md:w-32">
                  <label className="block text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-wide">Amount (₹)</label>
                  <div className="text-sm font-bold text-blue-900 px-2 py-1.5">{finishingLabour.toFixed(2)}</div>
                </div>
                <div className="w-10"></div>
              </div>
            )}

            {labourItems.map((item, index) => (
              <div key={item.id} className="flex gap-2 md:gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Description</label>
                  <input 
                    type="text" 
                    value={item.desc} 
                    onChange={(e) => updateLabourItem(item.id, 'desc', e.target.value)}
                    className="input-field text-sm" 
                    placeholder="e.g. Making..."
                  />
                </div>
                <div className="w-24 md:w-32">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={item.amount} 
                    onChange={(e) => updateLabourItem(item.id, 'amount', e.target.value)}
                    className="input-field text-sm" 
                    placeholder="0"
                  />
                </div>
                <button 
                  onClick={() => removeLabourItem(item.id)} 
                  className="mt-5 text-gray-400 hover:text-red-600 p-2 bg-white rounded-md border border-gray-200 shadow-sm"
                  title="Remove Split"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end items-center text-sm text-gray-600 font-bold px-2">
            Total Lumpsum: <span className="ml-3 font-black text-xl text-gray-900">₹{totalLabour.toFixed(2)}</span>
          </div>
        </section>

        <section className="bg-white p-4 md:p-6 border-b-[8px] border-gray-900 last:border-b-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-4">
              5. Carving Area
              <button 
                onClick={() => {
                  if (!hasBorder) setHasCarving(!hasCarving);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasBorder ? 'opacity-50 cursor-not-allowed ' : ''}${hasCarving ? 'bg-gray-900' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasCarving ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </h2>
          </div>

          {hasCarving && (
            <>
              <div className="mb-6 bg-gray-50 p-4 md:p-5 rounded-xl border-2 border-gray-900 shadow-sm">
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Carving Rate per sq.in</label>
                <div className="flex gap-2 flex-wrap">
                  {['3.5', '5', 'custom'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setCarvingRateOption(opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                        carvingRateOption === opt 
                          ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {opt === 'custom' ? 'Custom' : `₹${opt}`}
                    </button>
                  ))}
                </div>
                {carvingRateOption === 'custom' && (
                  <input 
                    type="number" 
                    value={carvingRate} 
                    onChange={(e) => setCarvingRate(e.target.value)}
                    className="input-field max-w-[200px] mt-4" 
                    placeholder="Enter rate (₹)"
                  />
                )}
              </div>

              <div className="space-y-4">
                {activeTemplate === 'door_frame' ? (
                  <div className="bg-gray-50 p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Computed Carving Blocks</h3>
                    <div className="space-y-2">
                      {computedCarvingBlocks.map((block, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <span className="text-gray-700 font-bold">{block.name}</span>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{block.l.toFixed(1)}" L × {block.w.toFixed(1)}" W</div>
                            <div className="font-black text-gray-900">{block.area.toFixed(0)} sq.in</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-600">Total Calculated Area</span>
                      <span className="font-black text-gray-900 text-lg">{totalCarvingArea.toFixed(0)} sq.in</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {carvings.map((carving, index) => (
                      <div key={carving.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-gray-700">Area {index + 1}</span>
                          <button onClick={() => removeCarving(carving.id)} className="text-gray-400 hover:text-red-600 p-1.5 bg-white rounded-md border border-gray-200 shadow-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <UnitInput 
                            label="Length" 
                            value={carving.l} 
                            onChange={(v) => updateCarving(carving.id, 'l', v)} 
                            unit={carving.lu} 
                            onUnitChange={(u) => updateCarving(carving.id, 'lu', u)} 
                          />
                          <UnitInput 
                            label="Width" 
                            value={carving.w} 
                            onChange={(v) => updateCarving(carving.id, 'w', v)} 
                            unit={carving.wu} 
                            onUnitChange={(u) => updateCarving(carving.id, 'wu', u)} 
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={addCarving}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-bold text-gray-500 border-2 border-dashed border-gray-300 hover:border-gray-900 hover:text-gray-900 rounded-xl transition-colors uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" />
                      Add Area
                    </button>
                  </>
                )}
              </div>

              {(activeTemplate === 'door_frame' || carvings.length > 0) && (
                <div className="mt-5 bg-gray-100 p-4 rounded-xl flex flex-col gap-2 border border-gray-200">
                  <div className="flex justify-between items-center text-gray-600 font-medium text-sm">
                    <span>Total Carving Area:</span>
                    <span className="text-gray-900 font-bold">{totalCarvingArea.toFixed(0)} sq.in</span>
                  </div>
                  {totalCarvingCost > 0 && (
                    <div className="flex justify-between items-center text-gray-900 font-bold pt-2 border-t border-gray-200">
                      <span>Carving Cost:</span>
                      <span className="text-lg">₹{totalCarvingCost.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-gray-900 border-t-2 border-black p-2.5 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 px-2 sm:px-4 md:px-0">
          <div className="flex gap-3 overflow-x-auto text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            <div className="flex flex-col">
              <span>Wood</span>
              <span className="font-bold text-white text-xs">₹{woodCost.toFixed(0)}</span>
            </div>
            <div className="flex flex-col border-l border-gray-700 pl-3">
              <span>Labour</span>
              <span className="font-bold text-white text-xs">₹{totalLabour.toFixed(0)}</span>
            </div>
            {totalCarvingCost > 0 && (
              <div className="flex flex-col border-l border-gray-700 pl-3">
                <span>Carve</span>
                <span className="font-bold text-white text-xs">₹{totalCarvingCost.toFixed(0)}</span>
              </div>
            )}
            <div className="flex flex-col border-l border-gray-700 pl-3">
              <span>Margin</span>
              <span className="font-bold text-amber-400 text-xs">₹{profitMargin.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">Estimate</span>
            <span className="text-xl md:text-2xl font-black text-white leading-none">₹{finalCost.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {isWoodModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border-4 border-gray-900">
            <div className="flex justify-between items-center p-5 border-b-4 border-gray-900 bg-gray-50">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider">Manage Wood Types</h3>
              <button onClick={() => setWoodModalVisible(false)} className="text-gray-500 hover:text-black bg-white p-1 rounded border border-gray-300 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex text-xs font-black text-gray-500 mb-3 px-1 uppercase tracking-widest">
                <div className="flex-[2]">WOOD NAME</div>
                <div className="flex-[1.5] ml-2">PRICE/CFT</div>
                <div className="w-10"></div>
              </div>
              
              <div className="space-y-3">
                {woodTypes.map(wood => (
                  <div key={wood.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <input 
                      className={`input-field flex-[2] text-sm font-bold ${wood.isSeeded ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                      value={wood.name}
                      onChange={(e) => updateWoodTypeLocal(wood.id, 'name', e.target.value)}
                      onBlur={() => saveWoodType(wood.id)}
                      placeholder="Name"
                      disabled={wood.isSeeded}
                    />
                    <input 
                      className="input-field flex-[1.5] text-sm font-bold"
                      type="number"
                      value={wood.price}
                      onChange={(e) => updateWoodTypeLocal(wood.id, 'price', e.target.value)}
                      onBlur={() => saveWoodType(wood.id)}
                      placeholder="Price"
                    />
                    <div className="w-10 flex items-center justify-center">
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={addWoodType}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 border-4 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-gray-900 hover:text-gray-900 transition-colors uppercase tracking-wider"
              >
                <Plus className="w-5 h-5" />
                Add New Wood Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalVisible && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border-4 border-gray-900 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b-2 border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">Save Estimate</h3>
              <button onClick={() => setSaveModalVisible(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Estimate Name</label>
                <input 
                  type="text" 
                  value={saveEstimateName} 
                  onChange={(e) => setSaveEstimateName(e.target.value)}
                  className="input-field w-full text-base" 
                  placeholder="e.g. Master Bedroom Door"
                  autoFocus
                />
              </div>
              <button 
                onClick={saveEstimate}
                disabled={!saveEstimateName.trim() || isSaving}
                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {loadModalVisible && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-4 border-gray-900 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b-2 border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">Load Saved Estimate</h3>
              <button onClick={() => setLoadModalVisible(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
              {isLoadingEstimates ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="font-medium">Loading saved estimates...</p>
                </div>
              ) : savedEstimates.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-medium">
                  No saved estimates found.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedEstimates.map(est => (
                    <div key={est.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 flex justify-between items-center hover:border-gray-900 transition-colors cursor-pointer group" onClick={() => loadEstimate(est)}>
                      <div>
                        <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{est.name}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">₹{est.totalCost}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSavedEstimate(est.id); }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-100 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete saved estimate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
