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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DEFAULT_WOOD_TYPES } from '../utils/storage';

export default function WoodTypesModal({
  visible,
  onClose,
  woodTypes = [],
  onSaveWoodTypes,
}) {
  const [types, setTypes] = useState(woodTypes);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Synchronize when modal opens
  React.useEffect(() => {
    if (visible) {
      setTypes(woodTypes);
    }
  }, [visible, woodTypes]);

  const handleUpdatePrice = (index, priceVal) => {
    const updated = [...types];
    updated[index] = { ...updated[index], price: parseFloat(priceVal) || 0 };
    setTypes(updated);
  };

  const handleAddNew = () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter a wood species name');
      return;
    }
    const priceNum = parseFloat(newPrice) || 0;
    const newEntry = {
      id: `wood-${Date.now()}`,
      name: newName.trim(),
      price: priceNum,
    };
    const updated = [...types, newEntry];
    setTypes(updated);
    setNewName('');
    setNewPrice('');
  };

  const handleDelete = (id) => {
    if (types.length <= 1) {
      Alert.alert('Error', 'Must keep at least 1 wood species');
      return;
    }
    setTypes(types.filter((w) => w.id !== id));
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Defaults',
      'Reset all wood types and prices to default catalogue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setTypes(DEFAULT_WOOD_TYPES),
        },
      ]
    );
  };

  const handleSaveAndClose = () => {
    onSaveWoodTypes(types);
    onClose();
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
              <Text style={styles.title}>Wood Species & Rates</Text>
              <Text style={styles.subtitle}>
                Configure rates per cubic foot (CFT)
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* List of existing woods */}
            {types.map((wood, index) => (
              <View key={wood.id} style={styles.woodRow}>
                <View style={styles.woodInfo}>
                  <Text style={styles.woodName}>{wood.name}</Text>
                  <Text style={styles.woodSub}>Per CFT rate</Text>
                </View>

                <View style={styles.rateInputWrapper}>
                  <Text style={styles.rupeePrefix}>₹</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={String(wood.price)}
                    onChangeText={(val) => handleUpdatePrice(index, val)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(wood.id)}
                >
                  <Ionicons name="trash-outline" size={17} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add New Section */}
            <View style={styles.addNewCard}>
              <Text style={styles.addNewTitle}>Add New Species</Text>
              <View style={styles.addNewInputs}>
                <TextInput
                  style={[styles.textInput, { flex: 2 }]}
                  placeholder="Wood Name (e.g. Acacia)"
                  placeholderTextColor="#64748b"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="₹/CFT"
                  placeholderTextColor="#64748b"
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAddNew}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetDefaults}
              activeOpacity={0.7}
            >
              <Text style={styles.resetText}>Defaults</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAndClose}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Apply Rates</Text>
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
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  woodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  woodInfo: {
    flex: 1,
  },
  woodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  woodSub: {
    fontSize: 11,
    color: '#64748b',
  },
  rateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    height: 38,
    width: 95,
    marginRight: 10,
  },
  rupeePrefix: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
    marginRight: 2,
  },
  rateInput: {
    flex: 1,
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
  },
  deleteBtn: {
    padding: 6,
  },
  addNewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addNewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  addNewInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: '#0284c7',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
