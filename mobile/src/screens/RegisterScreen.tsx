import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e: { email?: string; password?: string; confirmPassword?: string } = {};
    if (email && !EMAIL_REGEX.test(email)) e.email = 'Enter a valid email address';
    if (password && password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password && !/[A-Za-z]/.test(password)) e.password = 'Password must include at least one letter';
    if (password && !/[0-9]/.test(password)) e.password = 'Password must include at least one number';
    if (confirmPassword && confirmPassword !== password) e.confirmPassword = 'Passwords do not match';
    return e;
  }, [email, password, confirmPassword]);

  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await authApi.register(email.trim().toLowerCase(), password);
      navigation.replace('VerifyOtp', { email: res.email });
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>PadosiPro handles your household tasks, so you don't have to.</Text>

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextField
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <Button title="Sign up" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} style={styles.submitButton} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Button title="Log in" onPress={() => navigation.replace('Login')} variant="text" />
        </View>

        <Button title="Server settings" onPress={() => navigation.navigate('ServerSettings')} variant="text" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  submitError: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  submitButton: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textMuted },
});
