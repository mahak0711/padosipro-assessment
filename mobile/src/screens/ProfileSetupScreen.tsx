import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { profileApi } from '../api/profile';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme/theme';

const MOBILE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

export default function ProfileSetupScreen() {
  const { token, refreshStatus } = useAuth();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e: { name?: string; mobileNumber?: string; address?: string } = {};
    if (name && name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (mobileNumber && !MOBILE_REGEX.test(mobileNumber.trim())) {
      e.mobileNumber = 'Enter a valid 10-digit Indian mobile number';
    }
    if (address && address.trim().length < 5) e.address = 'Address must be at least 5 characters';
    return e;
  }, [name, mobileNumber, address]);

  const canSubmit =
    name.trim().length >= 2 &&
    MOBILE_REGEX.test(mobileNumber.trim()) &&
    address.trim().length >= 5 &&
    !errors.name &&
    !errors.mobileNumber &&
    !errors.address;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await profileApi.update(token, {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        businessName: businessName.trim() || undefined,
      });
      await refreshStatus();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>This helps your Lifestyle Manager get things right the first time.</Text>

        <TextField label="Full name" placeholder="Jane Doe" value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label="Mobile number"
          placeholder="98765 43210"
          value={mobileNumber}
          onChangeText={(t) => setMobileNumber(t.replace(/[^0-9+]/g, ''))}
          error={errors.mobileNumber}
          keyboardType="phone-pad"
          maxLength={13}
        />
        <TextField
          label="Address"
          placeholder="Flat / House no., street, city"
          value={address}
          onChangeText={setAddress}
          error={errors.address}
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />
        <TextField
          label="Business name (optional)"
          placeholder="If you're registering on behalf of a business"
          value={businessName}
          onChangeText={setBusinessName}
        />

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        <Button title="Continue" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} style={styles.submitButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  submitButton: { marginTop: spacing.sm },
});
