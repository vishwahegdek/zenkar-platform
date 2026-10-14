import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRIORITY_CONFIG } from './taskStorage';

export default function QuickInput({ categories = [], onAddTask, onAddCategory }) {
  const [title, setTitle] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(1); // Default to P1 Red
  const [selectedCategory, setSelectedCategory] = useState('Inbox'); // Default: leave for later

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      priority: selectedPriority,
      category: selectedCategory,
    });
    setTitle('');
  };

  return (
    <View style={styles.container}>
      {/* 1. Main Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New task... (Type & press ↵)"
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: PRIORITY_CONFIG[selectedPriority].color },
            !title.trim() && styles.addBtnDisabled,
          ]}
          onPress={handleAdd}
          disabled={!title.trim()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-up" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 2. Priority Selector Pills: 1 (Red), 2 (Orange), 3 (Yellow), 4 (Green) */}
      <View style={styles.optionsRow}>
        <View style={styles.priorityGroup}>
          <Text style={styles.optionLabel}>PRIORITY:</Text>
          {[1, 2, 3, 4].map((pNum) => {
            const cfg = PRIORITY_CONFIG[pNum];
            const isSelected = selectedPriority === pNum;
            return (
              <TouchableOpacity
                key={pNum}
                style={[
                  styles.priorityPill,
                  { borderColor: cfg.color },
                  isSelected && { backgroundColor: cfg.color },
                ]}
                onPress={() => setSelectedPriority(pNum)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.priorityPillText,
                    { color: isSelected ? '#ffffff' : cfg.color },
                  ]}
                >
                  {cfg.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Category Selector - Compact horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.activeCategoryPill]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.activeCategoryPillText,
                  ]}
                >
                  {cat === 'Inbox' ? '📥 Later' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  priorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 2,
    letterSpacing: 0.5,
  },
  priorityPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  categoryScroll: {
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCategoryPill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeCategoryPillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
