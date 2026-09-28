import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>('We sent a 6-digit code to ' + email);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError(null);
    setInfo(null);
    setVerifying(true);
    try {
      await authApi.verifyOtp(email, code);
      navigation.replace('Login', { verifiedEmail: email });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setError(null);
    setResending(true);
    try {
      await authApi.resendOtp(email);
      setInfo('A new code has been sent to ' + email);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your email</Text>
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TextField
          label="6-digit code"
          placeholder="123456"
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Verify" onPress={handleVerify} loading={verifying} disabled={code.length !== 6} />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get a code?</Text>
          <Button
            title={secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            onPress={handleResend}
            variant="text"
            disabled={secondsLeft > 0}
            loading={resending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  info: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.md },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  resendText: { ...typography.body, color: colors.textMuted },
});
