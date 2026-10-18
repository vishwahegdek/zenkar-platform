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
  const cat = (item.category?.name || item.category || '').trim().toLowerCase();
  return (
    cat === 'doors & frames' ||
    cat === 'door - door frames' ||
    cat === 'door frames' ||
    (cat.includes('door') && cat.includes('frame'))
  );
};

export const isFurnitureCategory = (item) => {
  if (!item) return false;
  const cat = (item.category?.name || item.category || '').trim().toLowerCase();
  return cat === 'furniture' || cat === 'furnitures';
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
  if (cost !== undefined && cost !== null && Number(cost) > 0) {
    parts.push(`₹${Math.round(Number(cost)).toLocaleString()}`);
  }

  return parts.join(' · ') || 'Estimate Attached';
};
