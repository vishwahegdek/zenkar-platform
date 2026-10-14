import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/shareUtils';

export default function SummaryDetailModal({
  visible,
  onClose,
  estimateData,
  formData,
  selectedWood,
  onShare,
  onOpenSave,
}) {
  if (!estimateData) return null;

  const isHalasu = selectedWood?.name?.toLowerCase().includes('halasu');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Cost Breakdown</Text>
              <Text style={styles.sheetSubtitle}>
                Itemized calculation report
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Timber Volume & Cost Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="tree" size={16} color="#10b981" />
                <Text style={styles.sectionHeading}>Timber Material</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.rowLabel}>Selected Species</Text>
                <Text style={styles.rowValue}>
                  {selectedWood?.name || 'Standard Wood'}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.rowLabel}>Rate per CFT</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(selectedWood?.price || 0)}/CFT
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.rowLabel}>Total Wood Volume</Text>
                <Text style={styles.rowValueHighlightGreen}>
                  {(estimateData.totalVolumeCft || 0).toFixed(3)} CFT
                </Text>
              </View>

              {isHalasu && (
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle" size={14} color="#f59e0b" />
                  <Text style={styles.infoBannerText}>
                    Halasu Rule applied: Bottom threshold piece priced with Kindal wood.
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Timber Subtotal</Text>
                <Text style={styles.totalRowValue}>
                  {formatCurrency(estimateData.totalWoodCost)}
                </Text>
              </View>
            </View>

            {/* 2. Carving Card (if active) */}
            {formData.hasCarving && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="flower" size={16} color="#f59e0b" />
                  <Text style={styles.sectionHeading}>Wood Carving</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.rowLabel}>Total Carved Area</Text>
                  <Text style={styles.rowValue}>
                    {(estimateData.totalCarvingArea || 0).toFixed(1)} sq.in
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.rowLabel}>Rate Applied</Text>
                  <Text style={styles.rowValue}>
                    ₹
                    {formData.carvingRateOption === 'custom'
                      ? formData.carvingRate
                      : formData.carvingRateOption}
                    /sq.in
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalRowLabel}>Carving Subtotal</Text>
                  <Text style={styles.totalRowValue}>
                    {formatCurrency(estimateData.totalCarvingCost)}
                  </Text>
                </View>
              </View>
            )}

            {/* 3. Labour Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="hammer-wrench" size={16} color="#38bdf8" />
                <Text style={styles.sectionHeading}>Labour Charges</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.rowLabel}>Carpentry & Fitting</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(estimateData.fittingLabour)}
                </Text>
              </View>

              {estimateData.finishingLabour > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.rowLabel}>Finishing Labour (30% Carving)</Text>
                  <Text style={styles.rowValue}>
                    {formatCurrency(estimateData.finishingLabour)}
                  </Text>
                </View>
              )}

              {(formData.labourItems || []).map((item, idx) => (
                <View key={item.id || idx} style={styles.breakdownRow}>
                  <Text style={styles.rowLabel}>{item.name || `Extra Charge #${idx + 1}`}</Text>
                  <Text style={styles.rowValue}>
                    {formatCurrency(item.amount || 0)}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Labour Subtotal</Text>
                <Text style={styles.totalRowValue}>
                  {formatCurrency(estimateData.totalLabour)}
                </Text>
              </View>
            </View>

            {/* 4. Profit Margin */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="trending-up" size={16} color="#a855f7" />
                <Text style={styles.sectionHeading}>Margin & Workshop Overhead</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.rowLabel}>15% Timber + Labour Margin</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(estimateData.profitMargin)}
                </Text>
              </View>
            </View>

            {/* 5. Grand Total Banner */}
            <View style={styles.grandTotalCard}>
              <Text style={styles.grandTotalLabel}>TOTAL ESTIMATE AMOUNT</Text>
              <Text style={styles.grandTotalAmount}>
                {formatCurrency(estimateData.finalCost)}
              </Text>
            </View>
          </ScrollView>

          {/* Modal Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => {
                onClose();
                onShare();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Share Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                onClose();
                onOpenSave();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="save-outline" size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  rowValueHighlightGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b15',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#fbbf24',
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  totalRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
  grandTotalCard: {
    backgroundColor: '#064e3b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  grandTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 6,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
