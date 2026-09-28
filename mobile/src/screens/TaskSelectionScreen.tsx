import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { LoadingView, ErrorView, EmptyView } from '../components/StateViews';
import { tasksApi, Task } from '../api/tasks';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme/theme';

interface Section {
  title: string;
  data: Task[];
}

export default function TaskSelectionScreen() {
  const { token, refreshStatus } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [{ tasks: allTasks }, { tasks: selected }] = await Promise.all([
        tasksApi.list(token),
        tasksApi.selected(token),
      ]);
      setTasks(allTasks);
      setSelectedIds(new Set(selected.map((t) => t.id)));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const sections: Section[] = useMemo(() => {
    if (!tasks) return [];
    const query = search.trim().toLowerCase();
    const filtered = query
      ? tasks.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
        )
      : tasks;

    const byCategory = new Map<string, Task[]>();
    for (const task of filtered) {
      const list = byCategory.get(task.category) ?? [];
      list.push(task);
      byCategory.set(task.category, list);
    }
    return Array.from(byCategory.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [tasks, search]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!token || selectedIds.size === 0) return;
    setSaveError(null);
    setSaving(true);
    try {
      await tasksApi.saveSelected(token, Array.from(selectedIds));
      await refreshStatus();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save your selection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView label="Loading tasks..." />;
  if (loadError) return <ErrorView message={loadError} onRetry={load} />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>What do you need help with?</Text>
        <Text style={styles.subtitle}>Select as many tasks as you like. You can change this later.</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks (e.g. cleaning, plumbing...)"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      {sections.length === 0 ? (
        <EmptyView title="No tasks match your search" message="Try a different keyword." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable style={[styles.row, isSelected && styles.rowSelected]} onPress={() => toggle(item.id)}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowDescription}>{item.description}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isSelected ? colors.primary : colors.border}
                />
              </Pressable>
            );
          }}
        />
      )}

      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

      <View style={styles.footer}>
        <Button
          title={`Confirm selection (${selectedIds.size})`}
          onPress={handleConfirm}
          loading={saving}
          disabled={selectedIds.size === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.text, ...typography.body },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  sectionHeader: { ...typography.label, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rowText: { flex: 1, marginRight: spacing.sm },
  rowTitle: { ...typography.h3, fontSize: 15, color: colors.text, marginBottom: 2 },
  rowDescription: { ...typography.small, color: colors.textMuted },
  saveError: { ...typography.small, color: colors.danger, textAlign: 'center', marginBottom: spacing.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
});
