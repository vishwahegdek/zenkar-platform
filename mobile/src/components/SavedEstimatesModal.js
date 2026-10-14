import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatEstimateSummary } from '../utils/shareUtils';
import { Share } from 'react-native';

export default function SavedEstimatesModal({
  visible,
  onClose,
  estimates = [],
  onLoadEstimate,
  onDeleteEstimate,
  isSaveMode = false,
  onSaveCurrent,
  currentEstimateName = '',
  totalCost = 0,
}) {
  const [saveName, setSaveName] = useState(currentEstimateName || 'New Door Estimate');

  const handleSave = () => {
    if (!saveName.trim()) {
      Alert.alert('Required', 'Please enter a name for this estimate');
      return;
    }
    onSaveCurrent(saveName.trim());
    onClose();
  };

  const handleShareSaved = async (item) => {
    try {
      const summary = `*ZENKAR ESTIMATE: ${item.name}*\nTotal: ${formatCurrency(item.totalCost)}\nDate: ${new Date(item.createdAt).toLocaleDateString('en-GB')}`;
      await Share.share({ message: summary });
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isSaveMode ? 'Save Estimate' : 'Saved Estimates'}
              </Text>
              <Text style={styles.subtitle}>
                {isSaveMode
                  ? 'Store quotation for quick access'
                  : `${estimates.length} quotes in offline library`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {isSaveMode ? (
            /* Save Form View */
            <View style={styles.saveForm}>
              <Text style={styles.inputLabel}>Estimate Name / Customer</Text>
              <TextInput
                style={styles.textInput}
                value={saveName}
                onChangeText={setSaveName}
                placeholder="e.g. Ramesh Villa - Main Door"
                placeholderTextColor="#64748b"
                autoFocus
              />

              <View style={styles.costPreviewRow}>
                <Text style={styles.costPreviewLabel}>Total Value:</Text>
                <Text style={styles.costPreviewValue}>{formatCurrency(totalCost)}</Text>
              </View>

              <TouchableOpacity
                style={styles.confirmSaveBtn}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.confirmSaveText}>Save to Library</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Saved List View */
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {estimates.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="folder-open-outline" size={48} color="#475569" />
                  <Text style={styles.emptyTitle}>No Saved Estimates</Text>
                  <Text style={styles.emptySub}>
                    Generate an estimate and tap Save to store it here.
                  </Text>
                </View>
              ) : (
                estimates.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <TouchableOpacity
                      style={styles.itemMain}
                      onPress={() => {
                        onLoadEstimate(item);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemTopRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemCost}>
                          {formatCurrency(item.totalCost)}
                        </Text>
                      </View>

                      <View style={styles.itemBottomRow}>
                        <Text style={styles.itemDate}>
                          {new Date(item.createdAt || item.updatedAt).toLocaleDateString('en-GB')}
                        </Text>
                        <Text style={styles.itemTemplate}>
                          {item.data?.activeTemplate === 'door_frame'
                            ? 'Door Frame'
                            : 'Custom Blocks'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleShareSaved(item)}
                      >
                        <Ionicons name="share-social-outline" size={16} color="#38bdf8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => {
                          Alert.alert(
                            'Delete Estimate',
                            `Are you sure you want to delete "${item.name}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => onDeleteEstimate(item.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
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
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
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
  saveForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  costPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  costPreviewLabel: {
    fontSize: 13,
    color: '#a7f3d0',
    fontWeight: '700',
  },
  costPreviewValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  confirmSaveBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  listScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 8,
  },
  itemCost: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34d399',
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDate: {
    fontSize: 11,
    color: '#64748b',
  },
  itemTemplate: {
    fontSize: 10,
    color: '#38bdf8',
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
