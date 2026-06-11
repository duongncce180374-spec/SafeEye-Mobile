import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
  },
});

