/**
 * Robot Discovery Screen
 * Discover and connect to physical robots on the network
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';

import { useRobotActions, useAvailableRobots } from '../hooks/useStore';
import { robotService } from '../services/RobotService';
import { RobotInfo, RobotStatus } from '../types';
import { ROBOT_STATUS_COLORS } from '../config/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Use store hook
const useAvailableRobots = () => {
  const store = require('../hooks/useStore').useStore;
  return store((state: any) => state.availableRobots);
};

export default function RobotDiscoveryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const availableRobots = useAvailableRobots();
  const { setAvailableRobots, connectRobot, setRobot } = useRobotActions();

  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  useEffect(() => {
    scanForRobots();
  }, []);

  const scanForRobots = async () => {
    setIsScanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const robots = await robotService.discoverRobots();
      setAvailableRobots(robots);
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (robot: RobotInfo) => {
    setIsConnecting(robot.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const connectionState = await robotService.connect(robot, 'wifi');
      setRobot(connectionState);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('RobotControl', { robotId: robot.id });
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Failed', error.message);
    } finally {
      setIsConnecting(null);
    }
  };

  const getStatusColor = (status: RobotStatus) => {
    return ROBOT_STATUS_COLORS[status] || '#6B7280';
  };

  const renderRobot = ({ item }: { item: RobotInfo }) => (
    <TouchableOpacity
      style={styles.robotCard}
      onPress={() => handleConnect(item)}
      disabled={isConnecting !== null}
    >
      <View style={styles.robotHeader}>
        <View style={styles.robotIdentity}>
          <Text style={styles.robotIcon}>🤖</Text>
          <View>
            <Text style={styles.robotName}>{item.name}</Text>
            <Text style={styles.robotId}>{item.id}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.robotMeta}>
        <Text style={styles.metaLabel}>Capabilities:</Text>
        <View style={styles.capabilitiesRow}>
          {item.capabilities.map((cap) => (
            <View key={cap} style={styles.capabilityBadge}>
              <Text style={styles.capabilityText}>{cap}</Text>
            </View>
          ))}
        </View>
      </View>

      {item.ipAddress && (
        <Text style={styles.ipAddress}>IP: {item.ipAddress}</Text>
      )}

      {isConnecting === item.id && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator color="#9945FF" />
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Robots</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={scanForRobots}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#9945FF" />
          ) : (
            <Text style={styles.scanButtonText}>↻ Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {availableRobots.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>No Robots Found</Text>
          <Text style={styles.emptySubtitle}>
            Make sure your robot is powered on and connected to the same network
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={scanForRobots}>
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={availableRobots}
          renderItem={renderRobot}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isScanning}
              onRefresh={scanForRobots}
              tintColor="#9945FF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  scanButtonText: {
    color: '#9945FF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  robotCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  robotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  robotIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  robotIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  robotName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  robotId: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  robotMeta: {
    marginBottom: 8,
  },
  metaLabel: {
    color: '#8B949E',
    fontSize: 12,
    marginBottom: 4,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  capabilityBadge: {
    backgroundColor: '#14F19520',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  capabilityText: {
    color: '#14F195',
    fontSize: 10,
    fontWeight: '600',
  },
  ipAddress: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  connectingText: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
