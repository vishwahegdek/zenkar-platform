import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/shareUtils';

export default function WoodTypeSelector({
  woodTypes,
  selectedWood,
  onSelectWood,
  onOpenWoodManager
}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <MaterialCommunityIcons name="forest" size={16} color="#10b981" />
          <Text style={styles.sectionTitle}>Wood Species & Rate</Text>
        </View>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={onOpenWoodManager}
          activeOpacity={0.7}
        >
          <Text style={styles.manageBtnText}>Edit Rates</Text>
          <Ionicons name="chevron-forward" size={13} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {woodTypes.map((wood) => {
          const isSelected = selectedWood?.id === wood.id;
          const isHalasu = wood.name?.toLowerCase().includes('halasu');

          return (
            <TouchableOpacity
              key={wood.id}
              style={[styles.woodCard, isSelected && styles.activeWoodCard]}
              onPress={() => onSelectWood(wood)}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Text
                  style={[styles.woodName, isSelected && styles.activeWoodName]}
                  numberOfLines={1}
                >
                  {wood.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                )}
              </View>

              <Text style={[styles.woodPrice, isSelected && styles.activeWoodPrice]}>
                {formatCurrency(wood.price)}
                <Text style={styles.cftUnit}> / CFT</Text>
              </Text>

              {isHalasu && (
                <View style={styles.halasuBadge}>
                  <Text style={styles.halasuText}>Kindal bottom rule</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCard}
          onPress={onOpenWoodManager}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#94a3b8" />
          <Text style={styles.addText}>New Wood</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b1329',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageBtnText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  woodCard: {
    minWidth: 130,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  activeWoodCard: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 4,
  },
  woodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
  },
  activeWoodName: {
    color: '#ffffff',
  },
  woodPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38bdf8',
  },
  activeWoodPrice: {
    color: '#34d399',
  },
  cftUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  halasuBadge: {
    marginTop: 4,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  halasuText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f59e0b',
  },
  addCard: {
    minWidth: 100,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
