import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UnitInput from './UnitInput';

export default function CustomBlocksForm({ blocks = [], onChangeBlocks }) {
  const addBlock = () => {
    const newBlock = {
      id: `b-${Date.now()}`,
      pcs: '1',
      l: '',
      lu: 'ft',
      w: '',
      wu: 'in',
      t: '',
      tu: 'in',
    };
    onChangeBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index, updates) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...updates };
    onChangeBlocks(updated);
  };

  const removeBlock = (index) => {
    if (blocks.length <= 1) return;
    const updated = blocks.filter((_, i) => i !== index);
    onChangeBlocks(updated);
  };

  const getBlockCft = (b) => {
    let l = parseFloat(b.l) || 0;
    if (b.lu === 'in') l /= 12;
    let w = parseFloat(b.w) || 0;
    if (b.wu === 'in') w /= 12;
    let t = parseFloat(b.t) || 0;
    if (b.tu === 'in') t /= 12;
    const pcs = b.pcs !== undefined && b.pcs !== '' ? (parseFloat(b.pcs) || 0) : 1;
    return (l * w * t * pcs).toFixed(3);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Timber Pieces ({blocks.length})</Text>
        <TouchableOpacity
          style={styles.addBtnSmall}
          onPress={addBlock}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addBtnSmallText}>Add Piece</Text>
        </TouchableOpacity>
      </View>

      {/* Column Headers */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.columnHeaderText, { flex: 1.1 }]}>Length</Text>
        <Text style={[styles.columnHeaderText, { flex: 1.1 }]}>Width</Text>
        <Text style={[styles.columnHeaderText, { flex: 1.1 }]}>Thick</Text>
        <Text style={[styles.columnHeaderText, { flex: 0.8, textAlign: 'center' }]}>Pcs</Text>
        {blocks.length > 1 && <View style={{ width: 28 }} />}
      </View>

      {blocks.map((block, index) => (
        <View key={block.id || index} style={styles.inputsRow}>
          <UnitInput
            value={block.l}
            onChangeText={(val) => updateBlock(index, { l: val })}
            unit={block.lu}
            onUnitToggle={() =>
              updateBlock(index, { lu: block.lu === 'ft' ? 'in' : 'ft' })
            }
            placeholder="0"
            containerStyle={{ flex: 1.1 }}
          />
          <UnitInput
            value={block.w}
            onChangeText={(val) => updateBlock(index, { w: val })}
            unit={block.wu}
            onUnitToggle={() =>
              updateBlock(index, { wu: block.wu === 'in' ? 'ft' : 'in' })
            }
            placeholder="0"
            containerStyle={{ flex: 1.1 }}
          />
          <UnitInput
            value={block.t}
            onChangeText={(val) => updateBlock(index, { t: val })}
            unit={block.tu}
            onUnitToggle={() =>
              updateBlock(index, { tu: block.tu === 'in' ? 'ft' : 'in' })
            }
            placeholder="0"
            containerStyle={{ flex: 1.1 }}
          />
          <UnitInput
            value={block.pcs !== undefined ? block.pcs : '1'}
            onChangeText={(val) => updateBlock(index, { pcs: val })}
            placeholder="1"
            containerStyle={{ flex: 0.8 }}
          />
          {blocks.length > 1 && (
            <TouchableOpacity
              style={styles.deleteBtnInline}
              onPress={() => removeBlock(index)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={styles.addBigBtn}
        onPress={addBlock}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={20} color="#38bdf8" />
        <Text style={styles.addBigBtnText}>Add Another Timber Piece</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addBtnSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  columnHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  deleteBtnInline: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284c7',
    gap: 8,
  },
  addBigBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
});
