import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import UnitInput from './UnitInput';

const THICKNESS_PRESETS = [
  { id: '5x3', label: '5" × 3"', desc: 'Standard' },
  { id: '6x4', label: '6" × 4"', desc: 'Heavy / Main' },
  { id: 'custom', label: 'Custom', desc: 'Manual' },
];

const BORDER_THICKNESS_PRESETS = [
  { id: '4x1.5', label: '4" × 1.5"' },
  { id: '3x1.5', label: '3" × 1.5"' },
  { id: 'custom', label: 'Custom' },
];

export default function DoorFrameForm({
  formData,
  updateFormData,
  computedBlocks = [],
  inventoryError = null,
  innerDimensions = null,
}) {
  const {
    dfThicknessOption = '5x3',
    dfCustomW = '',
    dfCustomWUnit = 'in',
    dfCustomT = '',
    dfCustomTUnit = 'in',
    dfHeight = '7',
    dfHeightUnit = 'ft',
    dfWidth = '3.5',
    dfWidthUnit = 'ft',
    excludeBottomPiece = false,
    hasBorder = false,
    borderThicknessOption = '4x1.5',
    borderCustomW = '',
    borderCustomWUnit = 'in',
    borderCustomT = '',
    borderCustomTUnit = 'in',
    hasArch = false,
    archHeight = '1',
    archHeightUnit = 'ft',
  } = formData;

  return (
    <View style={styles.container}>
      {/* 1. Main Thickness Selection */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="ruler-square" size={16} color="#38bdf8" />
          <Text style={styles.cardTitle}>Main Frame Thickness</Text>
        </View>

        <View style={styles.segmentRow}>
          {THICKNESS_PRESETS.map((preset) => {
            const isSelected = dfThicknessOption === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.segmentBtn, isSelected && styles.activeSegmentBtn]}
                onPress={() => updateFormData({ dfThicknessOption: preset.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.segmentBtnText, isSelected && styles.activeSegmentBtnText]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[styles.segmentBtnSub, isSelected && styles.activeSegmentBtnSub]}
                >
                  {preset.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {dfThicknessOption === 'custom' && (
          <View style={styles.customRow}>
            <UnitInput
              label="Width (Face)"
              value={dfCustomW}
              onChangeText={(val) => updateFormData({ dfCustomW: val })}
              unit={dfCustomWUnit}
              onUnitToggle={() =>
                updateFormData({ dfCustomWUnit: dfCustomWUnit === 'in' ? 'ft' : 'in' })
              }
              placeholder="e.g. 5"
            />
            <UnitInput
              label="Thickness (Depth)"
              value={dfCustomT}
              onChangeText={(val) => updateFormData({ dfCustomT: val })}
              unit={dfCustomTUnit}
              onUnitToggle={() =>
                updateFormData({ dfCustomTUnit: dfCustomTUnit === 'in' ? 'ft' : 'in' })
              }
              placeholder="e.g. 3"
            />
          </View>
        )}
      </View>

      {/* 2. Outer Dimensions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#38bdf8" />
          <Text style={styles.cardTitle}>Frame Dimensions</Text>
        </View>

        <View style={styles.inputsRow}>
          <UnitInput
            label="Height"
            value={dfHeight}
            onChangeText={(val) => updateFormData({ dfHeight: val })}
            unit={dfHeightUnit}
            onUnitToggle={() =>
              updateFormData({ dfHeightUnit: dfHeightUnit === 'ft' ? 'in' : 'ft' })
            }
            placeholder="7"
          />
          <UnitInput
            label="Width"
            value={dfWidth}
            onChangeText={(val) => updateFormData({ dfWidth: val })}
            unit={dfWidthUnit}
            onUnitToggle={() =>
              updateFormData({ dfWidthUnit: dfWidthUnit === 'ft' ? 'in' : 'ft' })
            }
            placeholder="3.5"
          />
        </View>

        {/* Clear Inner Opening Calculation Pill */}
        {innerDimensions && (
          <View style={styles.innerOpeningPill}>
            <Ionicons name="information-circle-outline" size={15} color="#38bdf8" />
            <Text style={styles.innerOpeningText}>
              Inner Clear Opening:{' '}
              <Text style={styles.innerOpeningHighlight}>
                {(innerDimensions.h / 12).toFixed(2)}ft (
                {innerDimensions.h.toFixed(1)}") H ×{' '}
                {(innerDimensions.w / 12).toFixed(2)}ft (
                {innerDimensions.w.toFixed(1)}") W
              </Text>
            </Text>
          </View>
        )}
      </View>

      {/* 3. Bottom Threshold Toggle */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>Exclude Bottom Piece</Text>
          <Text style={styles.toggleSubtitle}>
            3-sided frame without bottom sill/threshold
          </Text>
        </View>
        <Switch
          value={excludeBottomPiece}
          onValueChange={(val) => updateFormData({ excludeBottomPiece: val })}
          thumbColor={excludeBottomPiece ? '#38bdf8' : '#64748b'}
          trackColor={{ false: '#334155', true: '#0369a1' }}
        />
      </View>

      {/* 4. Border Frame (Patti) & Arch */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Border Frame (Patti / Architrave)</Text>
            <Text style={styles.toggleSubtitle}>
              Adds 3-piece outer decorative border
            </Text>
          </View>
          <Switch
            value={hasBorder}
            onValueChange={(val) => updateFormData({ hasBorder: val })}
            thumbColor={hasBorder ? '#10b981' : '#64748b'}
            trackColor={{ false: '#334155', true: '#064e3b' }}
          />
        </View>

        {hasBorder && (
          <View style={styles.borderOptions}>
            <Text style={styles.subOptionLabel}>Border Thickness</Text>
            <View style={styles.segmentRow}>
              {BORDER_THICKNESS_PRESETS.map((preset) => {
                const isSelected = borderThicknessOption === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.smallSegmentBtn, isSelected && styles.activeSegmentBtn]}
                    onPress={() => updateFormData({ borderThicknessOption: preset.id })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        isSelected && styles.activeSegmentBtnText,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {borderThicknessOption === 'custom' && (
              <View style={[styles.customRow, { marginTop: 10 }]}>
                <UnitInput
                  label="Border W"
                  value={borderCustomW}
                  onChangeText={(val) => updateFormData({ borderCustomW: val })}
                  unit={borderCustomWUnit}
                  onUnitToggle={() =>
                    updateFormData({
                      borderCustomWUnit: borderCustomWUnit === 'in' ? 'ft' : 'in',
                    })
                  }
                  placeholder="4"
                />
                <UnitInput
                  label="Border T"
                  value={borderCustomT}
                  onChangeText={(val) => updateFormData({ borderCustomT: val })}
                  unit={borderCustomTUnit}
                  onUnitToggle={() =>
                    updateFormData({
                      borderCustomTUnit: borderCustomTUnit === 'in' ? 'ft' : 'in',
                    })
                  }
                  placeholder="1.5"
                />
              </View>
            )}

            {/* Arch Toggle */}
            <View style={[styles.toggleRow, { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' }]}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Border Top Arch</Text>
                <Text style={styles.toggleSubtitle}>Curved top arch profile</Text>
              </View>
              <Switch
                value={hasArch}
                onValueChange={(val) => updateFormData({ hasArch: val })}
                thumbColor={hasArch ? '#38bdf8' : '#64748b'}
                trackColor={{ false: '#334155', true: '#0369a1' }}
              />
            </View>

            {hasArch && (
              <View style={{ marginTop: 10 }}>
                <UnitInput
                  label="Arch Rise Height"
                  value={archHeight}
                  onChangeText={(val) => updateFormData({ archHeight: val })}
                  unit={archHeightUnit}
                  onUnitToggle={() =>
                    updateFormData({
                      archHeightUnit: archHeightUnit === 'ft' ? 'in' : 'ft',
                    })
                  }
                  placeholder="1"
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* 5. Inventory Warning or Sawmill Cut-List */}
      {inventoryError ? (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{inventoryError}</Text>
        </View>
      ) : (
        <View style={styles.cutListCard}>
          <View style={styles.cutListHeader}>
            <MaterialCommunityIcons name="saw-blade" size={16} color="#10b981" />
            <Text style={styles.cutListTitle}>Sawmill Stock Assignment</Text>
            <Text style={styles.cutListBadge}>{computedBlocks.length} Pieces</Text>
          </View>

          <View style={styles.cutListTable}>
            {computedBlocks.map((b) => (
              <View key={b.id} style={styles.cutListRow}>
                <View style={styles.pieceInfo}>
                  <Text style={styles.pieceName}>{b.name}</Text>
                  <Text style={styles.pieceCrossSection}>
                    {b.w}" × {b.t}" section
                  </Text>
                </View>
                <View style={styles.pieceStockBadge}>
                  <Text style={styles.pieceStockText}>
                    {b.l} {b.lu.toUpperCase()} Stock
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  activeSegmentBtn: {
    borderColor: '#0284c7',
    backgroundColor: '#0c4a6e',
  },
  segmentBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  activeSegmentBtnText: {
    color: '#ffffff',
  },
  segmentBtnSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  activeSegmentBtnSub: {
    color: '#bae6fd',
  },
  smallSegmentBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  innerOpeningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c4a6e40',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#0284c750',
  },
  innerOpeningText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  innerOpeningHighlight: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  toggleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  borderOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  subOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  errorCard: {
    backgroundColor: '#ef444415',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef444450',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cutListCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cutListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cutListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
    marginLeft: 6,
  },
  cutListBadge: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cutListTable: {
    gap: 6,
  },
  cutListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pieceInfo: {
    gap: 2,
  },
  pieceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  pieceCrossSection: {
    fontSize: 11,
    color: '#64748b',
  },
  pieceStockBadge: {
    backgroundColor: '#0369a120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  pieceStockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
