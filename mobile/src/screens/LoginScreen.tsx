import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.verifiedEmail) {
      setEmail(route.params.verifiedEmail);
      setInfo('Email verified. You can now log in.');
    }
  }, [route.params?.verifiedEmail]);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      await signIn(res.token, res.user.profileComplete);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          navigation.replace('VerifyOtp', { email: email.trim().toLowerCase() });
          return;
        }
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your household tasks.</Text>

        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Log in" onPress={handleSubmit} loading={submitting} disabled={!email || !password} style={styles.submitButton} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here?</Text>
          <Button title="Create an account" onPress={() => navigation.replace('Register')} variant="text" />
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
  info: { ...typography.small, color: colors.success, marginBottom: spacing.md, textAlign: 'center' },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  submitButton: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textMuted },
});
