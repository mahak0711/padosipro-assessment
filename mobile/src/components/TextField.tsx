import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, style, onBlur, ...rest }: TextFieldProps) {
  const [touched, setTouched] = useState(false);
  const showError = touched && !!error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, showError && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        onBlur={(e) => {
          setTouched(true);
          onBlur?.(e);
        }}
        {...rest}
      />
      {showError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
});
