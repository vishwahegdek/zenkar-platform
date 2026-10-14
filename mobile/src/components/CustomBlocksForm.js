import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UnitInput from './UnitInput';

export default function CustomBlocksForm({ blocks = [], onChangeBlocks }) {
  const addBlock = () => {
    const newBlock = {
      id: `b-${Date.now()}`,
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
    return (l * w * t).toFixed(3);
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

      {blocks.map((block, index) => {
        const cft = getBlockCft(block);
        return (
          <View key={block.id || index} style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <View style={styles.blockBadge}>
                <Text style={styles.blockBadgeText}>Piece #{index + 1}</Text>
              </View>

              <View style={styles.blockHeaderRight}>
                <Text style={styles.cftBadge}>{cft} CFT</Text>
                {blocks.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeBlock(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputsRow}>
              <UnitInput
                label="Length"
                value={block.l}
                onChangeText={(val) => updateBlock(index, { l: val })}
                unit={block.lu}
                onUnitToggle={() =>
                  updateBlock(index, { lu: block.lu === 'ft' ? 'in' : 'ft' })
                }
                placeholder="0"
              />
              <UnitInput
                label="Width"
                value={block.w}
                onChangeText={(val) => updateBlock(index, { w: val })}
                unit={block.wu}
                onUnitToggle={() =>
                  updateBlock(index, { wu: block.wu === 'in' ? 'ft' : 'in' })
                }
                placeholder="0"
              />
              <UnitInput
                label="Thick"
                value={block.t}
                onChangeText={(val) => updateBlock(index, { t: val })}
                unit={block.tu}
                onUnitToggle={() =>
                  updateBlock(index, { tu: block.tu === 'in' ? 'ft' : 'in' })
                }
                placeholder="0"
              />
            </View>
          </View>
        );
      })}

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
  blockCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  blockBadgeText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  blockHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cftBadge: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 8,
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
