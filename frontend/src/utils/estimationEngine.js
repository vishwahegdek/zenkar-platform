export const ESTIMATION_ENGINE_VERSION = 1;

export const generateComputedBlocks = (data) => {
  if (data.activeTemplate !== 'door_frame') return { blocks: data.blocks || [], error: null };
  
  try {
    let w = 5, t = 3;
    let wu = 'in', tu = 'in';
    
    if (data.dfThicknessOption === '6x4') { 
      w = 6; t = 4; 
    }
    else if (data.dfThicknessOption === 'custom') { 
      w = parseFloat(data.dfCustomW) || 0; 
      wu = data.dfCustomWUnit || 'in';
      t = parseFloat(data.dfCustomT) || 0; 
      tu = data.dfCustomTUnit || 'in';
    }
    
    let hInput = parseFloat(data.dfHeight) || 0;
    if (data.dfHeightUnit === 'in') hInput /= 12;

    let wdInput = parseFloat(data.dfWidth) || 0;
    if (data.dfWidthUnit === 'in') wdInput /= 12;

    let bw = 4, bt = 1.5;
    let bwu = 'in', btu = 'in';
    
    if (data.borderThicknessOption === '3x1.5') { 
      bw = 3; bt = 1.5; 
    }
    else if (data.borderThicknessOption === 'custom') { 
      bw = parseFloat(data.borderCustomW) || 0; 
      bwu = data.borderCustomWUnit || 'in';
      bt = parseFloat(data.borderCustomT) || 0; 
      btu = data.borderCustomTUnit || 'in';
    }

    let borderLegWidthFt = bw;
    if (bwu === 'in') borderLegWidthFt /= 12;

    const INVENTORY = {
      mainLegs: [6.0, 6.5, 7.0],
      mainHeadBottom: [3.5, 4.0, 4.5],
      borderPieces: [4.0, 5.0, 6.0, 7.0, 7.5]
    };

    const matchInventory = (req, inv, name) => {
      const match = inv.find(s => s >= req);
      if (match === undefined) throw new Error(`${name} requires ${req.toFixed(2)}ft which exceeds available inventory (Max: ${Math.max(...inv)}ft).`);
      return match;
    };

    const legLengthFt = matchInventory(hInput, INVENTORY.mainLegs, "Main Frame Leg");
    
    let requiredMainWidthFt = 0;
    if (data.hasBorder) {
      requiredMainWidthFt = wdInput + (2 * borderLegWidthFt) + (1 / 12);
    } else {
      requiredMainWidthFt = wdInput + 0.5;
    }
    const headLengthFt = matchInventory(requiredMainWidthFt, INVENTORY.mainHeadBottom, "Main Frame Head/Bottom");

    const computed = [
      { id: 'df1', name: 'Main Leg 1', l: legLengthFt, lu: 'ft', w, wu, t, tu },
      { id: 'df2', name: 'Main Leg 2', l: legLengthFt, lu: 'ft', w, wu, t, tu },
      { id: 'df3', name: 'Main Head', l: headLengthFt, lu: 'ft', w, wu, t, tu },
    ];
    
    if (!data.excludeBottomPiece) {
      computed.push({ id: 'df4', name: 'Main Bottom', l: headLengthFt, lu: 'ft', w, wu, t, tu });
    }
    
    if (data.hasBorder) {
      const requiredBorderLegFt = hInput + borderLegWidthFt;
      const borderLegLengthFt = matchInventory(requiredBorderLegFt, INVENTORY.borderPieces, "Border Frame Leg");

      computed.push({ id: 'bf1', name: 'Border Leg 1', l: borderLegLengthFt, lu: 'ft', w: bw, wu: bwu, t: bt, tu: btu });
      computed.push({ id: 'bf2', name: 'Border Leg 2', l: borderLegLengthFt, lu: 'ft', w: bw, wu: bwu, t: bt, tu: btu });
      
      const requiredBorderHeadFt = wdInput + (2 * borderLegWidthFt);
      const borderHeadLengthFt = matchInventory(requiredBorderHeadFt, INVENTORY.borderPieces, "Border Frame Head");

      if (data.hasArch) {
        let aHeightInput = parseFloat(data.archHeight) || 0;
        computed.push({ id: 'b_arch', name: 'Border Arch', l: borderHeadLengthFt, lu: 'ft', w: aHeightInput, wu: data.archHeightUnit || 'in', t: bt, tu: btu });
      } else {
        computed.push({ id: 'bf3', name: 'Border Head', l: borderHeadLengthFt, lu: 'ft', w: bw, wu: bwu, t: bt, tu: btu });
      }
    }
    return { blocks: computed, error: null };
  } catch (err) {
    return { blocks: [], error: err.message };
  }
};

export const calculateWoodVolume = (blocks) => {
  return blocks.reduce((sum, block) => {
    let l = parseFloat(block.l) || 0;
    if (block.lu === 'in') l /= 12;
    
    let w = parseFloat(block.w) || 0;
    if (block.wu === 'in') w /= 12;
    
    let t = parseFloat(block.t) || 0;
    if (block.tu === 'in') t /= 12;

    return sum + (l * w * t);
  }, 0);
};

export const calculateCarving = (data) => {
  if (!data.hasCarving) {
    return {
      totalCarvingArea: 0,
      totalCarvingCost: 0,
      innerDimensions: null,
      computedCarvingBlocks: []
    };
  }

  let totalArea = 0;
  let innerHeightInches = 0;
  let innerWidthInches = 0;
  const computedCarvingBlocks = [];

  if (data.activeTemplate !== 'door_frame') {
    const carvings = data.carvings || [];
    totalArea = carvings.reduce((sum, c) => {
      let l = parseFloat(c.l) || 0;
      if (c.lu === 'ft') l *= 12;
      let cw = parseFloat(c.w) || 0;
      if (c.wu === 'ft') cw *= 12;
      return sum + (l * cw);
    }, 0);
  } else {
    // Door frame carving logic
    let w = 5, t = 3;
    if (data.dfThicknessOption === '6x4') { w = 6; t = 4; }
    else if (data.dfThicknessOption === 'custom') { 
      w = parseFloat(data.dfCustomW) || 0; 
      t = parseFloat(data.dfCustomT) || 0; 
    }

    let hInput = parseFloat(data.dfHeight) || 0;
    if (data.dfHeightUnit === 'in') hInput /= 12;

    let wdInput = parseFloat(data.dfWidth) || 0;
    if (data.dfWidthUnit === 'in') wdInput /= 12;

    const mainFrontDim = data.mainCarvingFace === 'w' ? w : t;
    const mainCarvingWidth = Math.max(0, mainFrontDim - 0.5);
    const bottomFrontDim = Math.min(w, t);
    
    const legCarvingLengthInches = Math.max(0, (hInput * 12) - bottomFrontDim - 4);
    if (legCarvingLengthInches > 0) {
      computedCarvingBlocks.push({
        name: 'Main Frame Legs (x2)',
        l: legCarvingLengthInches,
        w: mainCarvingWidth,
        area: legCarvingLengthInches * mainCarvingWidth * 2
      });
    }
    
    innerWidthInches = Math.max(0, (wdInput * 12) - (2 * mainFrontDim));
    if (innerWidthInches > 0) {
      computedCarvingBlocks.push({
        name: 'Main Frame Top',
        l: innerWidthInches,
        w: mainCarvingWidth,
        area: innerWidthInches * mainCarvingWidth
      });
    }

    innerHeightInches = Math.max(0, (hInput * 12) - mainFrontDim - bottomFrontDim);
    totalArea = (legCarvingLengthInches * mainCarvingWidth * 2) + (innerWidthInches * mainCarvingWidth);

    if (data.hasBorder) {
      let bw = 4, bt = 1.5;
      if (data.borderThicknessOption === '3x1.5') { bw = 3; bt = 1.5; }
      else if (data.borderThicknessOption === 'custom') {
        bw = parseFloat(data.borderCustomW) || 0;
        bt = parseFloat(data.borderCustomT) || 0;
      }
      
      const borderFrontDim = bw; // Always width as front face for border frame
      const borderCarvingWidth = Math.max(0, borderFrontDim - 0.5);

      const borderLegLengthInches = hInput * 12;
      computedCarvingBlocks.push({
        name: 'Border Frame Legs (x2)',
        l: borderLegLengthInches,
        w: borderCarvingWidth,
        area: borderLegLengthInches * borderCarvingWidth * 2
      });

      const borderTopLengthInches = wdInput * 12;
      computedCarvingBlocks.push({
        name: 'Border Frame Top',
        l: borderTopLengthInches,
        w: borderCarvingWidth,
        area: borderTopLengthInches * borderCarvingWidth
      });

      totalArea += (borderLegLengthInches * borderCarvingWidth * 2) + (borderTopLengthInches * borderCarvingWidth);
    }
  }

  const activeCarvingRate = data.carvingRateOption === 'custom' ? data.carvingRate : data.carvingRateOption;
  const totalCarvingCost = totalArea * (parseFloat(activeCarvingRate) || 0);

  return {
    totalCarvingArea: totalArea,
    totalCarvingCost,
    innerDimensions: data.activeTemplate === 'door_frame' ? { h: innerHeightInches, w: innerWidthInches } : null,
    computedCarvingBlocks
  };
};

export const calculateEstimate = (data, woodTypes = []) => {
  // Defensive fallbacks
  const safeData = data || {};
  
  // 1. Generate Computed Blocks
  const { blocks, error: inventoryError } = generateComputedBlocks(safeData);

  // 2. Wood Calculation
  const totalVolumeCft = calculateWoodVolume(blocks);
  const selectedWood = woodTypes.find(w => w.id === safeData.selectedWoodId);
  
  const isHalasu = selectedWood?.name?.toLowerCase().includes('halasu');
  const kindalWood = woodTypes.find(w => w.name?.toLowerCase().includes('kindal'));
  const kindalPrice = kindalWood ? (parseFloat(kindalWood.price) || 0) : 1500;
  const defaultPrice = selectedWood ? parseFloat(selectedWood.price) : 0;
  
  let totalWoodCost = 0;
  blocks.forEach(block => {
    let l = parseFloat(block.l) || 0;
    if (block.lu === 'in') l /= 12;
    let w = parseFloat(block.w) || 0;
    if (block.wu === 'in') w /= 12;
    let t = parseFloat(block.t) || 0;
    if (block.tu === 'in') t /= 12;
    
    const cft = l * w * t;
    
    // Local tradition: If Halasu is selected, the bottom piece (df4) uses Kindal pricing
    if (isHalasu && block.id === 'df4') {
      totalWoodCost += (cft * kindalPrice);
    } else {
      totalWoodCost += (cft * defaultPrice);
    }
  });

  // 2. Carving Calculation
  const carvingData = calculateCarving(safeData);
  const { totalCarvingArea, totalCarvingCost, innerDimensions, computedCarvingBlocks } = carvingData;

  // 3. Labour Calculation
  const parsedFittingLabour = parseFloat(safeData.fittingLabour) || 0;
  const finishingLabour = safeData.hasCarving ? (totalCarvingCost * 0.3) : 0;
  
  const customLumpsumTotal = (safeData.labourItems || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalLabour = parsedFittingLabour + finishingLabour + customLumpsumTotal;

  // 4. Margin & Final Cost
  const profitMargin = (totalWoodCost * 0.15) + parsedFittingLabour + finishingLabour;
  const finalCost = totalWoodCost + totalLabour + totalCarvingCost + profitMargin;

  return {
    computedBlocks: blocks,
    inventoryError,
    totalVolumeCft,
    totalWoodCost,
    totalCarvingArea,
    totalCarvingCost,
    innerDimensions,
    computedCarvingBlocks,
    fittingLabour: parsedFittingLabour,
    finishingLabour,
    customLumpsumTotal,
    totalLabour,
    profitMargin,
    finalCost
  };
};
