import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { Button } from '../components/Button';
import { LoadingView, ErrorView, EmptyView } from '../components/StateViews';
import { tasksApi, Task } from '../api/tasks';
import { profileApi, Profile } from '../api/profile';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { token, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [{ tasks: selected }, profileData] = await Promise.all([tasksApi.selected(token), profileApi.get(token)]);
        setTasks(selected);
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load your tasks. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingView label="Loading your tasks..." />;
  if (error) return <ErrorView message={error} onRetry={() => load()} />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}</Text>
          <Text style={styles.subtitle}>Here's what you've asked us to handle.</Text>
        </View>
        <Button title="Logout" onPress={signOut} variant="text" />
      </View>

      {!tasks || tasks.length === 0 ? (
        <EmptyView title="No tasks selected yet" message="Select tasks to get started." />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button title="Edit selected tasks" onPress={() => navigation.navigate('TaskSelection')} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  greeting: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardIcon: { marginRight: spacing.sm, marginTop: 2 },
  cardBody: { flex: 1 },
  cardCategory: { ...typography.small, color: colors.primary, marginBottom: 2, textTransform: 'uppercase' },
  cardTitle: { ...typography.h3, fontSize: 15, color: colors.text, marginBottom: 2 },
  cardDescription: { ...typography.small, color: colors.textMuted },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
});
