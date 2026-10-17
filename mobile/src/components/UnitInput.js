import React, { useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text> : null}
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {unit && onUnitToggle ? (
          <TouchableOpacity
            style={[styles.unitBadge, isFocused && styles.unitBadgeFocused]}
            onPress={onUnitToggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitText, isFocused && styles.unitTextFocused]}>{unit.toUpperCase()}</Text>
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
  labelFocused: {
    color: '#38bdf8',
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
  inputWrapperFocused: {
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    backgroundColor: '#0c4a6e40',
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  inputFocused: {
    color: '#ffffff',
  },
  unitBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  unitBadgeFocused: {
    backgroundColor: '#38bdf8',
  },
  unitText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  unitTextFocused: {
    color: '#0f172a',
  },
});
