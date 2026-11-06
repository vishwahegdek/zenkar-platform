/**
 * Helper utilities for Doors & Frames and Furniture products with estimates
 */

export const isDoorFrameProduct = (item) => {
  if (!item) return false;
  const name = (item.name || item.productName || '').trim().toLowerCase();
  // Fixed template strictly applies to "Door Frame" (not "Door Frame with attached window")
  return name === 'door frame' || name === 'door frame (smart form)';
};

export const isDoorsAndFramesCategory = (item) => {
  if (!item) return false;
  const cat = (
    item.name ||
    item.category?.name ||
    item.category ||
    (typeof item === 'string' ? item : '')
  )
    .trim()
    .toLowerCase();
  return (
    cat === 'doors & frames' ||
    cat === 'door - door frames' ||
    cat === 'door frames' ||
    cat === 'doors' ||
    (cat.includes('door') && cat.includes('frame')) ||
    cat.includes('door')
  );
};

export const isFurnitureCategory = (item) => {
  if (!item) return false;
  const cat = (
    item.name ||
    item.category?.name ||
    item.category ||
    (typeof item === 'string' ? item : '')
  )
    .trim()
    .toLowerCase();
  return cat === 'furniture' || cat === 'furnitures' || cat.includes('furniture');
};

export const getCategoryPriority = (cat) => {
  if (isDoorsAndFramesCategory(cat)) return 1;
  if (isFurnitureCategory(cat)) return 2;
  return 3;
};

export const sortCategoriesWithPriority = (categories = []) => {
  if (!Array.isArray(categories)) return [];
  return [...categories].sort((a, b) => {
    const pA = getCategoryPriority(a);
    const pB = getCategoryPriority(b);
    if (pA !== pB) return pA - pB;
    return (a.name || '').localeCompare(b.name || '');
  });
};


export const isEstimateCategoryOrProduct = (item) => {
  if (!item) return false;
  if (isDoorsAndFramesCategory(item) || isFurnitureCategory(item)) return true;

  const name = (item.name || item.productName || '').trim().toLowerCase();
  const seedNames = [
    'door frame',
    'single door',
    'double door',
    'window frame',
    'window shutters',
    'door frame with attached window'
  ];
  return seedNames.some(s => name === s || name.startsWith(s));
};

export const formatEstimateBadge = (estimateData) => {
  if (!estimateData) return '';
  const parts = [];
  if (estimateData.activeTemplate === 'door_frame') {
    parts.push('Door Frame');
    if (estimateData.dfWidth && estimateData.dfHeight) {
      const wUnit = estimateData.dfWidthUnit || 'ft';
      const hUnit = estimateData.dfHeightUnit || 'ft';
      parts.push(`${estimateData.dfWidth}${wUnit} × ${estimateData.dfHeight}${hUnit}`);
    }
  } else if (estimateData.activeTemplate) {
    parts.push('Custom');
  }

  if (estimateData.totalVolumeCft) {
    parts.push(`${Number(estimateData.totalVolumeCft).toFixed(1)} CFT`);
  }

  const cost = estimateData.finalCost ?? estimateData.totalCost;
  const quote = estimateData.quotedAmount;
  if (cost !== undefined && cost !== null && Number(cost) > 0) {
    if (quote !== undefined && quote !== null && Number(quote) > 0 && Math.round(Number(quote)) !== Math.round(Number(cost))) {
      parts.push(`Est: ₹${Math.round(Number(cost)).toLocaleString()}`);
      parts.push(`Quote: ₹${Math.round(Number(quote)).toLocaleString()}`);
    } else {
      parts.push(`₹${Math.round(Number(cost)).toLocaleString()}`);
    }
  } else if (quote !== undefined && quote !== null && Number(quote) > 0) {
    parts.push(`Quote: ₹${Math.round(Number(quote)).toLocaleString()}`);
  }

  return parts.join(' · ') || 'Estimate Attached';
};
