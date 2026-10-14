import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function Header({
  onOpenSaved,
  onOpenWoodManager,
  onReset,
  onShare,
  savedCount = 0
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="tree" size={20} color="#10b981" />
        </View>
        <View>
          <Text style={styles.brandTitle}>Zenkar Wood</Text>
          <Text style={styles.brandSubtitle}>Sawmill & Carpentry Estimator</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onReset}
          activeOpacity={0.7}
          accessibilityLabel="Reset Form"
        >
          <Ionicons name="refresh" size={19} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onOpenWoodManager}
          activeOpacity={0.7}
          accessibilityLabel="Wood Species Manager"
        >
          <MaterialCommunityIcons name="tune" size={19} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.savedBtn]}
          onPress={onOpenSaved}
          activeOpacity={0.7}
          accessibilityLabel="Saved Estimates"
        >
          <Ionicons name="folder-outline" size={18} color="#38bdf8" />
          {savedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{savedCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={onShare}
          activeOpacity={0.7}
          accessibilityLabel="Share Estimate"
        >
          <Ionicons name="share-social-outline" size={19} color="#10b981" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  savedBtn: {
    borderColor: '#0284c7',
    position: 'relative',
  },
  shareBtn: {
    borderColor: '#059669',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#38bdf8',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '800',
  },
});
