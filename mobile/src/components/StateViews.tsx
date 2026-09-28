import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../theme/theme';

export function LoadingView({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} variant="secondary" style={styles.retryButton} /> : null}
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>{title}</Text>
      {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  label: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  errorTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  errorMessage: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  retryButton: { marginTop: spacing.lg, minWidth: 140 },
});
