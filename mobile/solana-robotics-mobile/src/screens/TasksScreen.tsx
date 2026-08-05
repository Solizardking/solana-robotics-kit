/**
 * Tasks Screen
 * Browse and manage robot tasks from the marketplace
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks, useRobot } from '../hooks/useStore';
import { robotService } from '../services/RobotService';
import { RobotTask } from '../types';

export default function TasksScreen() {
  const tasks = useTasks();
  const robot = useRobot();
  const [isLoading, setIsLoading] = useState(false);
  const store = require('../hooks/useStore').useStore;

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await robotService.getAvailableTasks();
      store.getState().setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const renderTask = ({ item }: { item: RobotTask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#F59E0B' : '#14F195' }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.taskMeta}>
        <Text style={styles.reward}>{item.reward} $KIT</Text>
        <Text style={styles.capabilities}>
          {item.requiredCapabilities.join(', ')}
        </Text>
      </View>
      {robot.connected && item.status === 'pending' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => robotService.acceptTask(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTasks} tintColor="#9945FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Tasks Available</Text>
            <Text style={styles.emptySubtitle}>Pull to refresh or check back later</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  listContent: { padding: 16 },
  taskCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  taskTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  reward: { color: '#14F195', fontSize: 14, fontWeight: 'bold' },
  capabilities: { color: '#8B949E', fontSize: 12 },
  acceptButton: {
    backgroundColor: '#9945FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { color: '#8B949E', fontSize: 14, marginTop: 8 },
});
