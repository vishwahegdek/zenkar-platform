import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function UnitInput({
  label,
  value,
  onChangeText,
  unit,
  onUnitToggle,
  placeholder = '0',
  keyboardType = 'numeric',
  containerStyle
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {unit && onUnitToggle ? (
          <TouchableOpacity
            style={styles.unitBadge}
            onPress={onUnitToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  unitBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  unitText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
