import { Share } from 'react-native';

export const formatCurrency = (amount) => {
  const num = Math.round(parseFloat(amount) || 0);
  return '₹' + num.toLocaleString('en-IN');
};

export const formatEstimateSummary = (estimateData, formData, selectedWood) => {
  const templateName = {
    door_frame: 'Smart Door Frame',
    custom: 'Custom Blocks',
    standard_door: 'Standard Door',
    window_frame: 'Window Frame'
  }[formData.activeTemplate] || 'Wood Estimate';

  let lines = [];
  lines.push(`🪵 *ZENKAR WOOD ESTIMATOR QUOTE*`);
  lines.push(`📅 Date: ${new Date().toLocaleDateString('en-GB')}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📦 *Item:* ${templateName}`);
  if (selectedWood) {
    lines.push(`🌲 *Wood Type:* ${selectedWood.name} (${formatCurrency(selectedWood.price)}/CFT)`);
  }

  if (formData.activeTemplate === 'door_frame') {
    lines.push(`📐 *Frame Size:* ${formData.dfHeight}${formData.dfHeightUnit} (H) × ${formData.dfWidth}${formData.dfWidthUnit} (W)`);
    lines.push(`📏 *Thickness:* ${formData.dfThicknessOption === 'custom' ? `${formData.dfCustomW}x${formData.dfCustomT}` : formData.dfThicknessOption} in`);
    if (formData.hasBorder) {
      lines.push(`🖼️ *Border Frame:* Included (${formData.borderThicknessOption || '4x1.5'} in)`);
      if (formData.hasArch) lines.push(`🏛️ *Border Arch:* Included (${formData.archHeight}${formData.archHeightUnit})`);
    }
    if (formData.excludeBottomPiece) {
      lines.push(`🚫 *Bottom Piece:* Excluded (3-sided frame)`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📊 *BREAKDOWN*`);
  lines.push(`• Total Volume: *${(estimateData.totalVolumeCft || 0).toFixed(3)} CFT*`);
  lines.push(`• Timber Cost: *${formatCurrency(estimateData.totalWoodCost)}*`);

  if (formData.hasCarving && estimateData.totalCarvingArea > 0) {
    lines.push(`• Carving: ${(estimateData.totalCarvingArea || 0).toFixed(1)} sq.in → *${formatCurrency(estimateData.totalCarvingCost)}*`);
  }

  lines.push(`• Fitting Labour: *${formatCurrency(estimateData.fittingLabour)}*`);
  if (estimateData.finishingLabour > 0) {
    lines.push(`• Finishing Labour: *${formatCurrency(estimateData.finishingLabour)}*`);
  }
  if (estimateData.customLumpsumTotal > 0) {
    lines.push(`• Extra Labour: *${formatCurrency(estimateData.customLumpsumTotal)}*`);
  }
  lines.push(`• Total Labour: *${formatCurrency(estimateData.totalLabour)}*`);
  lines.push(`• Margin & Polish: *${formatCurrency(estimateData.profitMargin)}*`);

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *GRAND TOTAL: ${formatCurrency(estimateData.finalCost)}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Generated via Zenkar Wood Estimator`);

  return lines.join('\n');
};

export const shareEstimate = async (estimateData, formData, selectedWood, estimateName = 'Estimate') => {
  const message = formatEstimateSummary(estimateData, formData, selectedWood);
  try {
    const result = await Share.share({
      title: `Zenkar Estimate - ${estimateName}`,
      message: message
    });
    return result;
  } catch (error) {
    console.warn('Error sharing estimate:', error.message);
  }
};
