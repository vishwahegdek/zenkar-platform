import React, { useState, useMemo, useEffect } from 'react';
import { Pencil, Plus, Trash2, X, Settings2 } from 'lucide-react';
import { api } from '../api';

const TEMPLATES = [
  { id: 'door_frame', name: 'Door Frame (Smart Form)' },
  { id: 'custom', name: 'Custom Blocks (Blank)' },
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

export default function WoodEstimator() {
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
  const [archLength, setArchLength] = useState('5');
  const [archLengthUnit, setArchLengthUnit] = useState('ft');
  const [archWidth, setArchWidth] = useState('6');
  const [archWidthUnit, setArchWidthUnit] = useState('in');
  const [archThickness, setArchThickness] = useState('1.5');
  const [archThicknessUnit, setArchThicknessUnit] = useState('in');

  // Labour and Carving State
  const [labourItems, setLabourItems] = useState([
    { id: 'l1', desc: 'Fitting', amount: '2000' },
    { id: 'l2', desc: 'Finishing', amount: '2000' }
  ]);
  const [hasCarving, setHasCarving] = useState(false);
  const [carvings, setCarvings] = useState([{ id: 'c1', l: '', lu: 'in', w: '', wu: 'in' }]);
  const [carvingRateOption, setCarvingRateOption] = useState('3.5');
  const [carvingRate, setCarvingRate] = useState('');

  // Wood Types Management
  const addWoodType = async () => {
    try {
      const data = await api.post('/wood-types', { name: 'New Wood', price: 0 });
      setWoodTypes([...woodTypes, data]);
    } catch (e) {
      console.error(e);
    }
  };

  const removeWoodType = async (id) => {
    const wood = woodTypes.find(w => w.id === id);
    if (wood?.isSeeded) return;
    
    const updated = woodTypes.filter(w => w.id !== id);
    setWoodTypes(updated);
    if (selectedWood?.id === id && updated.length > 0) {
      setSelectedWood(updated[0]);
    }
    try {
      await api.delete(`/wood-types/${id}`);
    } catch (e) { console.error(e); }
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

  // Block Management
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

  // Labour Management
  const addLabourItem = () => setLabourItems([...labourItems, { id: Date.now().toString(), desc: '', amount: '' }]);
  const removeLabourItem = (id) => setLabourItems(labourItems.filter(l => l.id !== id));
  const updateLabourItem = (id, field, value) => {
    setLabourItems(labourItems.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  // Carving Management
  const addCarving = () => setCarvings([...carvings, { id: Date.now().toString(), l: '', lu: 'in', w: '', wu: 'in' }]);
  const removeCarving = (id) => setCarvings(carvings.filter(c => c.id !== id));
  const updateCarving = (id, field, value) => {
    setCarvings(carvings.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Door Frame Block Calculation
  const doorFrameBlocks = useMemo(() => {
    if (activeTemplate !== 'door_frame') return [];
    
    let w = 5, t = 3;
    let wu = 'in', tu = 'in';
    
    if (dfThicknessOption === '6x4') { 
      w = 6; t = 4; 
    }
    else if (dfThicknessOption === 'custom') { 
      w = parseFloat(dfCustomW) || 0; 
      wu = dfCustomWUnit;
      t = parseFloat(dfCustomT) || 0; 
      tu = dfCustomTUnit;
    }
    
    let h = parseFloat(dfHeight) || 0;
    let wd = parseFloat(dfWidth) || 0;
    
    const computed = [
      { id: 'df1', name: 'Main Leg 1', l: h, lu: dfHeightUnit, w, wu, t, tu },
      { id: 'df2', name: 'Main Leg 2', l: h, lu: dfHeightUnit, w, wu, t, tu },
      { id: 'df3', name: 'Main Head', l: wd, lu: dfWidthUnit, w, wu, t, tu },
    ];
    
    if (!excludeBottomPiece) {
      computed.push({ id: 'df4', name: 'Main Bottom', l: wd, lu: dfWidthUnit, w, wu, t, tu });
    }
    
    if (hasBorder) {
      let bw = 4, bt = 1.5;
      let bwu = 'in', btu = 'in';
      
      if (borderThicknessOption === '3x1.5') { 
        bw = 3; bt = 1.5; 
      }
      else if (borderThicknessOption === 'custom') { 
        bw = parseFloat(borderCustomW) || 0; 
        bwu = borderCustomWUnit;
        bt = parseFloat(borderCustomT) || 0; 
        btu = borderCustomTUnit;
      }
      
      let bh = parseFloat(borderHeight) || 0;
      let bwd = parseFloat(borderWidth) || 0;
      
      computed.push({ id: 'bf1', name: 'Border Leg 1', l: bh, lu: borderHeightUnit, w: bw, wu: bwu, t: bt, tu: btu });
      computed.push({ id: 'bf2', name: 'Border Leg 2', l: bh, lu: borderHeightUnit, w: bw, wu: bwu, t: bt, tu: btu });
      
      if (hasArch) {
        let al = parseFloat(archLength) || 0;
        let aw = parseFloat(archWidth) || 0;
        let at = parseFloat(archThickness) || 0;
        computed.push({ id: 'b_arch', name: 'Border Arch', l: al, lu: archLengthUnit, w: aw, wu: archWidthUnit, t: at, tu: archThicknessUnit });
      } else {
        computed.push({ id: 'bf3', name: 'Border Head', l: bwd, lu: borderWidthUnit, w: bw, wu: bwu, t: bt, tu: btu });
      }
    }
    return computed;
  }, [
    activeTemplate, dfThicknessOption, dfCustomW, dfCustomWUnit, dfCustomT, dfCustomTUnit, 
    dfHeight, dfHeightUnit, dfWidth, dfWidthUnit, excludeBottomPiece,
    hasBorder, borderThicknessOption, borderCustomW, borderCustomWUnit, borderCustomT, borderCustomTUnit, 
    borderHeight, borderHeightUnit, borderWidth, borderWidthUnit,
    hasArch, archLength, archLengthUnit, archWidth, archWidthUnit, archThickness, archThicknessUnit
  ]);

  // Global Calculations
  const computedBlocks = activeTemplate === 'door_frame' ? doorFrameBlocks : blocks;

  const totalCft = useMemo(() => {
    return computedBlocks.reduce((sum, b) => {
      let l = parseFloat(b.l) || 0;
      if (b.lu === 'ft') l *= 12;
      
      let w = parseFloat(b.w) || 0;
      if (b.wu === 'ft') w *= 12;
      
      let t = parseFloat(b.t) || 0;
      if (b.tu === 'ft') t *= 12;
      
      return sum + ((l * w * t) / 1728);
    }, 0);
  }, [computedBlocks]);

  const woodCost = useMemo(() => {
    const isHalasu = selectedWood?.name?.toLowerCase().includes('halasu');
    const kindalWood = woodTypes.find(w => w.name?.toLowerCase().includes('kindal'));
    const kindalPrice = kindalWood ? (parseFloat(kindalWood.price) || 0) : 1500;
    const defaultPrice = parseFloat(selectedWood?.price) || 0;

    return computedBlocks.reduce((sum, b) => {
      let l = parseFloat(b.l) || 0;
      if (b.lu === 'ft') l *= 12;
      
      let w = parseFloat(b.w) || 0;
      if (b.wu === 'ft') w *= 12;
      
      let t = parseFloat(b.t) || 0;
      if (b.tu === 'ft') t *= 12;
      
      const cft = (l * w * t) / 1728;
      
      // Local tradition: If Halasu is selected, the bottom piece (df4) uses Kindal pricing
      if (isHalasu && b.id === 'df4') {
        return sum + (cft * kindalPrice);
      }
      
      return sum + (cft * defaultPrice);
    }, 0);
  }, [computedBlocks, selectedWood, woodTypes]);

  const totalCarvingArea = useMemo(() => {
    return carvings.reduce((sum, c) => {
      let l = parseFloat(c.l) || 0;
      if (c.lu === 'ft') l *= 12;
      
      let w = parseFloat(c.w) || 0;
      if (c.wu === 'ft') w *= 12;
      
      return sum + (l * w);
    }, 0);
  }, [carvings]);

  const totalLabour = useMemo(() => {
    return labourItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [labourItems]);

  const activeCarvingRate = carvingRateOption === 'custom' ? carvingRate : carvingRateOption;
  const totalCarvingCost = hasCarving ? (totalCarvingArea * (parseFloat(activeCarvingRate) || 0)) : 0;
  const finalCost = woodCost + totalLabour + totalCarvingCost;

  return (
    <div className="flex flex-col min-h-full bg-white pb-24">
      <div className="p-4 md:p-6 bg-white border-b-8 border-gray-900">
        <h1 className="text-2xl font-bold text-gray-900">Product Estimation</h1>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col">
        
        {/* 1. Choose Product */}
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

        {/* 2. Select Wood Type */}
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

        {/* 3. Customize Dimensions */}
        <section className="bg-white p-3 md:p-4 border-b-4 border-gray-900">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Customize Dimensions</h2>
          </div>
          
          {activeTemplate === 'door_frame' ? (
            <div className="space-y-6">
              {/* Main Frame Configurations */}
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

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
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

              {/* Border Frame Configurations */}
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

                      <div className="flex gap-3">
                        <UnitInput 
                          label="Border Height" 
                          value={borderHeight} 
                          onChange={setBorderHeight} 
                          unit={borderHeightUnit} 
                          onUnitChange={setBorderHeightUnit} 
                          placeholder="7.5" 
                        />
                        {!hasArch && (
                          <UnitInput 
                            label="Border Width" 
                            value={borderWidth} 
                            onChange={setBorderWidth} 
                            unit={borderWidthUnit} 
                            onUnitChange={setBorderWidthUnit} 
                            placeholder="4.5" 
                          />
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
                        <div className="grid grid-cols-3 gap-3">
                          <UnitInput 
                            label="Arch Length" 
                            value={archLength} 
                            onChange={setArchLength} 
                            unit={archLengthUnit} 
                            onUnitChange={setArchLengthUnit} 
                            placeholder="5" 
                          />
                          <UnitInput 
                            label="Arch Width" 
                            value={archWidth} 
                            onChange={setArchWidth} 
                            unit={archWidthUnit} 
                            onUnitChange={setArchWidthUnit} 
                            placeholder="6" 
                          />
                          <UnitInput 
                            label="Arch Thick" 
                            value={archThickness} 
                            onChange={setArchThickness} 
                            unit={archThicknessUnit} 
                            onUnitChange={setArchThicknessUnit} 
                            placeholder="1.5" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Computed Blocks Display for Door Frame */}
              <div className="mt-4 border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-900 px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wide border-b-2 border-gray-900">
                  Computed Blocks Breakdown
                </div>
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
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generic Block Builder for Custom / Other Templates */}
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

        {/* 4. Lumpsum (Splits) */}
        <section className="bg-white p-4 md:p-6 border-b-[8px] border-gray-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">4. Lumpsum</h2>
            <button 
              onClick={addLabourItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Split
            </button>
          </div>
          
          <div className="space-y-3">
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

        {/* 5. Carving Details */}
        <section className="bg-white p-4 md:p-6 border-b-[8px] border-gray-900 last:border-b-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-4">
              5. Carving Area
              <button 
                onClick={() => setHasCarving(!hasCarving)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasCarving ? 'bg-gray-900' : 'bg-gray-300'}`}
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
              </div>
              
              <button 
                onClick={addCarving}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-bold text-gray-500 border-2 border-dashed border-gray-300 hover:border-gray-900 hover:text-gray-900 rounded-xl transition-colors uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                Add Area
              </button>

              {carvings.length > 0 && (
                <div className="mt-5 bg-gray-100 p-4 rounded-xl flex flex-col gap-2 border border-gray-200">
                  <div className="flex justify-between items-center text-gray-600 font-medium text-sm">
                    <span>Total Area:</span>
                    <span className="font-bold text-gray-900">{totalCarvingArea.toFixed(2)} sq.in</span>
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

      {/* Footer Breakdown */}
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
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">Estimate</span>
            <span className="text-xl md:text-2xl font-black text-white leading-none">₹{finalCost.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Wood Types Modal */}
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
                      placeholder="Rate"
                    />
                    <button 
                      onClick={() => removeWoodType(wood.id)}
                      disabled={wood.isSeeded}
                      className={`w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm ${wood.isSeeded ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  );
}
