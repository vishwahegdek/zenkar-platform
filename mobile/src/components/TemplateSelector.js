import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TEMPLATES = [
  { id: 'door_frame', name: 'Smart Frame', icon: 'door' },
  { id: 'custom', name: 'Custom Blocks', icon: 'view-grid-plus' },
  { id: 'standard_door', name: 'Standard Door', icon: 'door-closed' },
  { id: 'window_frame', name: 'Window Frame', icon: 'window-closed-variant' },
];

export default function TemplateSelector({ activeTemplate, onSelectTemplate }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TEMPLATES.map((tpl) => {
          const isActive = activeTemplate === tpl.id;
          return (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.pill, isActive && styles.activePill]}
              onPress={() => onSelectTemplate(tpl.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tpl.icon}
                size={16}
                color={isActive ? '#ffffff' : '#94a3b8'}
                style={styles.icon}
              />
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {tpl.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activePillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
