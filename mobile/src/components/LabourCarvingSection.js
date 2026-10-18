import React from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/shareUtils';
import UnitInput from './UnitInput';

const CARVING_RATES = [
  { id: '5', label: '₹5.0', desc: 'Standard / Heavy' },
  { id: '3.5', label: '₹3.5', desc: 'Floral / Light' },
  { id: 'custom', label: 'Custom', desc: 'Manual Rate' },
];

const FITTING_PRESETS = [
  { value: '1200', label: '₹1,200 (Std)' },
  { value: '2000', label: '₹2,000 (Border)' },
  { value: '2500', label: '₹2,500' },
];

export default function LabourCarvingSection({
  formData,
  updateFormData,
  carvingData,
  finishingLabour = 0,
  totalLabour = 0,
}) {
  const {
    hasCarving = false,
    carvingRateOption = '5',
    carvingRate = '',
    fittingLabour = '1200',
    labourItems = [],
  } = formData;

  const addLabourItem = () => {
    updateFormData({
      labourItems: [
        ...labourItems,
        { id: `l-${Date.now()}`, name: '', amount: '' },
      ],
    });
  };

  const updateLabourItem = (index, updates) => {
    const updated = [...labourItems];
    updated[index] = { ...updated[index], ...updates };
    updateFormData({ labourItems: updated });
  };

  const removeLabourItem = (index) => {
    const updated = labourItems.filter((_, i) => i !== index);
    updateFormData({ labourItems: updated });
  };

  return (
    <View style={styles.container}>
      {/* 1. Carving Toggle Card */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <View style={styles.titleWithIcon}>
              <MaterialCommunityIcons name="flower" size={17} color="#f59e0b" />
              <Text style={styles.cardTitle}>Wood Carving</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              CNC or Hand floral carving on front face
            </Text>
          </View>
          <Switch
            value={hasCarving}
            onValueChange={(val) => updateFormData({ hasCarving: val })}
            thumbColor={hasCarving ? '#f59e0b' : '#64748b'}
            trackColor={{ false: '#334155', true: '#78350f' }}
          />
        </View>

        {hasCarving && (
          <View style={styles.carvingOptions}>
            <Text style={styles.subOptionLabel}>Carving Rate per sq. inch</Text>
            <View style={styles.rateRow}>
              {CARVING_RATES.map((r) => {
                const isSelected = carvingRateOption === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rateBtn, isSelected && styles.activeRateBtn]}
                    onPress={() => updateFormData({ carvingRateOption: r.id })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rateBtnText,
                        isSelected && styles.activeRateBtnText,
                      ]}
                    >
                      {r.label}
                    </Text>
                    <Text
                      style={[
                        styles.rateBtnSub,
                        isSelected && styles.activeRateBtnSub,
                      ]}
                    >
                      {r.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {carvingRateOption === 'custom' && (
              <View style={{ marginTop: 10 }}>
                <UnitInput
                  label="Custom Carving Rate (₹ / sq.in)"
                  value={carvingRate}
                  onChangeText={(val) => updateFormData({ carvingRate: val })}
                  placeholder="e.g. 4.5"
                />
              </View>
            )}

            {/* Carving Result Pill */}
            {carvingData && (
              <View style={styles.carvingStatsCard}>
                <View style={styles.carvingStat}>
                  <Text style={styles.carvingStatLabel}>Total Carved Area</Text>
                  <Text style={styles.carvingStatVal}>
                    {(carvingData.totalCarvingArea || 0).toFixed(1)} sq.in
                  </Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.carvingStat}>
                  <Text style={styles.carvingStatLabel}>Carving Cost</Text>
                  <Text style={styles.carvingStatValHighlight}>
                    {formatCurrency(carvingData.totalCarvingCost)}
                  </Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.carvingStat}>
                  <Text style={styles.carvingStatLabel}>Finishing (30%)</Text>
                  <Text style={styles.carvingStatVal}>
                    {formatCurrency(finishingLabour)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 2. Fitting & Labour Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="hammer-wrench" size={17} color="#38bdf8" />
          <Text style={styles.cardTitle}>Carpentry & Fitting Labour</Text>
        </View>

        <View style={styles.presetRow}>
          {FITTING_PRESETS.map((p) => {
            const isSelected = fittingLabour === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[styles.presetBtn, isSelected && styles.activePresetBtn]}
                onPress={() => updateFormData({ fittingLabour: p.value })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    isSelected && styles.activePresetBtnText,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: 10 }}>
          <UnitInput
            label="Fitting Labour Charge (₹)"
            value={fittingLabour}
            onChangeText={(val) => updateFormData({ fittingLabour: val })}
            placeholder="1200"
          />
        </View>

        {/* Extra Custom Labour Items */}
        <View style={styles.extraSection}>
          <View style={styles.extraHeader}>
            <Text style={styles.extraTitle}>Additional Labour / Charges</Text>
            <TouchableOpacity
              style={styles.addExtraBtn}
              onPress={addLabourItem}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={14} color="#38bdf8" />
              <Text style={styles.addExtraBtnText}>Add Charge</Text>
            </TouchableOpacity>
          </View>

          {labourItems.map((item, index) => (
            <View key={item.id || index} style={styles.extraRow}>
              <TextInput
                style={[styles.extraInput, { flex: 2 }]}
                value={item.name}
                onChangeText={(val) => updateLabourItem(index, { name: val })}
                placeholder="Description (e.g. Polish)"
                placeholderTextColor="#64748b"
              />
              <TextInput
                style={[styles.extraInput, { flex: 1 }]}
                value={String(item.amount || '')}
                onChangeText={(val) => updateLabourItem(index, { amount: val })}
                placeholder="₹ Amount"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.removeExtraBtn}
                onPress={() => removeLabourItem(index)}
              >
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Labour Summary Bar */}
        <View style={styles.labourSummaryRow}>
          <Text style={styles.labourSummaryText}>Total Labour</Text>
          <Text style={styles.labourSummaryValue}>
            {formatCurrency(totalLabour)}
          </Text>
        </View>
      </View>
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
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
  carvingOptions: {
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
  rateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  activeRateBtn: {
    borderColor: '#f59e0b',
    backgroundColor: '#78350f30',
  },
  rateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  activeRateBtnText: {
    color: '#fbbf24',
  },
  rateBtnSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  activeRateBtnSub: {
    color: '#fde68a',
  },
  carvingStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  carvingStat: {
    flex: 1,
    alignItems: 'center',
  },
  carvingStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
  },
  carvingStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  carvingStatValHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePresetBtn: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  activePresetBtnText: {
    color: '#ffffff',
  },
  extraSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  extraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  extraTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  addExtraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addExtraBtnText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  extraInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 13,
  },
  removeExtraBtn: {
    padding: 2,
  },
  labourSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  labourSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  labourSummaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
});
