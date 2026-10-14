import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({
  activeTab,
  onSelectTab,
  p1Count = 0,
}) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'estimator' && styles.tabBtnActive]}
        onPress={() => onSelectTab('estimator')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="calculator-variant"
          size={20}
          color={activeTab === 'estimator' ? '#10b981' : '#64748b'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'estimator' && styles.tabLabelEstimatorActive,
          ]}
        >
          Wood Estimator
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'ceo_tasks' && styles.tabBtnActive]}
        onPress={() => onSelectTab('ceo_tasks')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name="flash"
            size={19}
            color={activeTab === 'ceo_tasks' ? '#38bdf8' : '#64748b'}
          />
          {p1Count > 0 && (
            <View style={styles.p1Badge}>
              <Text style={styles.p1BadgeText}>{p1Count}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'ceo_tasks' && styles.tabLabelCeoActive,
          ]}
        >
          CEO Tasks
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#0b1329',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabBtnActive: {
    backgroundColor: '#111c3850',
  },
  iconWrapper: {
    position: 'relative',
  },
  p1Badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  p1BadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelEstimatorActive: {
    color: '#34d399',
    fontWeight: '800',
  },
  tabLabelCeoActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
});
