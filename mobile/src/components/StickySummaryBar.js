import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/shareUtils';

export default function StickySummaryBar({
  estimateData,
  selectedWood,
  onOpenDetails,
  onOpenSave,
}) {
  const finalCost = estimateData?.finalCost || 0;
  const totalVolume = estimateData?.totalVolumeCft || 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.summaryClickArea}
        onPress={onOpenDetails}
        activeOpacity={0.8}
      >
        <View style={styles.infoCol}>
          <View style={styles.cftRow}>
            <Text style={styles.cftText}>{totalVolume.toFixed(3)} CFT</Text>
            {selectedWood && (
              <Text style={styles.woodPill} numberOfLines={1}>
                {selectedWood.name}
              </Text>
            )}
          </View>
          <View style={styles.breakdownHint}>
            <Text style={styles.tapToView}>Tap to view breakdown</Text>
            <Ionicons name="chevron-up" size={13} color="#38bdf8" />
          </View>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>ESTIMATE TOTAL</Text>
          <Text style={styles.grandPrice}>{formatCurrency(finalCost)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveActionBtn}
        onPress={onOpenSave}
        activeOpacity={0.7}
      >
        <Ionicons name="save-outline" size={18} color="#ffffff" />
        <Text style={styles.saveActionText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 12,
  },
  summaryClickArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoCol: {
    flex: 1,
  },
  cftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cftText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
  },
  woodPill: {
    fontSize: 11,
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    maxWidth: 100,
  },
  breakdownHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  tapToView: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: '600',
  },
  priceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  grandPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  saveActionBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  saveActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
