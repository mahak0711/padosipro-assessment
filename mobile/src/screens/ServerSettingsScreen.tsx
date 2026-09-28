import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { getApiUrl, setApiUrl, DEFAULT_API_URL } from '../api/serverConfig';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ServerSettings'>;

export default function ServerSettingsScreen({ navigation }: Props) {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    getApiUrl().then(setUrl);
  }, []);

  const handleSave = async () => {
    if (!url.trim()) return;
    await setApiUrl(url);
    setSaved('Saved. This app will now talk to that address.');
  };

  const handleReset = async () => {
    await setApiUrl(DEFAULT_API_URL);
    setUrl(DEFAULT_API_URL);
    setSaved('Reset to the default address.');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Backend server address</Text>
        <Text style={styles.subtitle}>
          This app needs to know where the PadosiPro backend API is running. If you're the one running it
          locally, point this at that computer's address.
        </Text>

        <TextField
          label="API URL"
          placeholder="http://10.0.2.2:4000"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        {saved ? <Text style={styles.saved}>{saved}</Text> : null}

        <Button title="Save" onPress={handleSave} disabled={!url.trim()} style={styles.button} />
        <Button title="Reset to default" onPress={handleReset} variant="text" />

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Common values</Text>
          <Text style={styles.hint}>• Android emulator, backend on this same PC: http://10.0.2.2:PORT</Text>
          <Text style={styles.hint}>• iOS simulator, backend on this same Mac: http://localhost:PORT</Text>
          <Text style={styles.hint}>• Physical phone: http://&lt;computer's LAN IP&gt;:PORT (same Wi-Fi)</Text>
          <Text style={styles.hint}>• Backend deployed somewhere public: its https:// URL</Text>
        </View>

        <Button title="Back" onPress={() => navigation.goBack()} variant="text" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  saved: { ...typography.small, color: colors.success, marginBottom: spacing.md, textAlign: 'center' },
  button: { marginBottom: spacing.sm },
  hintBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  hintTitle: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.xs },
  hint: { ...typography.small, color: colors.primaryDark, marginBottom: 2 },
});
