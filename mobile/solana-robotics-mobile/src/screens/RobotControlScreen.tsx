/**
 * Robot Control Screen
 * Interface for controlling connected physical robots with NVIDIA AI
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';

import { useRobot, useRobotActions } from '../hooks/useStore';
import { robotService } from '../services/RobotService';
import { PerceptionResult, RobotAction } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'RobotControl'>;

// =============================================================================
// ROBOT CONTROL SCREEN COMPONENT
// =============================================================================

export default function RobotControlScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const robotState = useRobot();
  const { disconnectRobot } = useRobotActions();

  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [perception, setPerception] = useState<PerceptionResult | null>(null);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Robot connection state
  const robot = robotState.robot;
  const connected = robotState.connected;

  // Subscribe to robot events
  useEffect(() => {
    const handleStatus = (data: any) => {
      addLog(`Status: ${data.status}`);
    };

    const handlePerception = (data: PerceptionResult) => {
      setPerception(data);
      addLog(`Perception: ${data.objects.length} objects detected`);
    };

    const handleError = (error: any) => {
      addLog(`Error: ${error.message || error}`);
    };

    robotService.on('status', handleStatus);
    robotService.on('perception', handlePerception);
    robotService.on('error', handleError);

    return () => {
      robotService.off('status', handleStatus);
      robotService.off('perception', handlePerception);
      robotService.off('error', handleError);
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // ==================== Control Functions ====================

  const handleMove = async (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    if (!connected) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      let result;
      switch (direction) {
        case 'forward':
          result = await robotService.move(0.5, 0, 0, 1000);
          break;
        case 'backward':
          result = await robotService.move(-0.5, 0, 0, 1000);
          break;
        case 'left':
          result = await robotService.move(0, 0, 0.5, 1000);
          break;
        case 'right':
          result = await robotService.move(0, 0, -0.5, 1000);
          break;
        case 'stop':
          result = await robotService.stop();
          break;
      }

      if (result?.success) {
        addLog(`Move ${direction}: Success (${result.executionTime}ms)`);
      } else {
        addLog(`Move ${direction}: Failed - ${result?.error}`);
      }
    } catch (error: any) {
      addLog(`Move ${direction}: Error - ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeak = async () => {
    if (!connected || !voiceCommand.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);

    try {
      const result = await robotService.speak(voiceCommand);
      if (result.success) {
        addLog(`Speak: "${voiceCommand}"`);
        setVoiceCommand('');
      } else {
        addLog(`Speak failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`Speak error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScan = async () => {
    if (!connected) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);

    try {
      addLog('Scanning environment...');
      const result = await robotService.getPerception();
      if (result) {
        setPerception(result);
        addLog(`Scan complete: ${result.objects.length} objects, scene: ${result.scene}`);
      } else {
        addLog('Scan failed');
      }
    } catch (error: any) {
      addLog(`Scan error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutonomousTask = async (task: string) => {
    if (!connected) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Execute Autonomous Task',
      `Are you sure you want to execute: "${task}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            addLog(`Starting autonomous task: ${task}`);

            try {
              const success = await robotService.executeAutonomousTask(task);
              if (success) {
                addLog('Autonomous task completed successfully');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                addLog('Autonomous task failed');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            } catch (error: any) {
              addLog(`Task error: ${error.message}`);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDisconnect = async () => {
    await robotService.disconnect();
    disconnectRobot();
    navigation.goBack();
  };

  // ==================== Render ====================

  if (!connected || !robot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedText}>No robot connected</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Robot Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.robotIdentity}>
            <Text style={styles.robotName}>{robot.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: robot.status === 'active' ? '#14F195' : '#6B7280' }]}>
              <Text style={styles.statusText}>{robot.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.robotMeta}>
            <Text style={styles.metaText}>Latency: {robotState.latency}ms</Text>
            <Text style={styles.metaText}>Battery: {robot.batteryLevel || '--'}%</Text>
          </View>
        </View>

        {/* Movement Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movement Control</Text>
          <View style={styles.controlPad}>
            <View style={styles.controlRow}>
              <View style={styles.spacer} />
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleMove('forward')}
                disabled={isProcessing}
              >
                <Text style={styles.controlIcon}>↑</Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleMove('left')}
                disabled={isProcessing}
              >
                <Text style={styles.controlIcon}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={() => handleMove('stop')}
                disabled={isProcessing}
              >
                <Text style={styles.controlIcon}>⏹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleMove('right')}
                disabled={isProcessing}
              >
                <Text style={styles.controlIcon}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <View style={styles.spacer} />
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleMove('backward')}
                disabled={isProcessing}
              >
                <Text style={styles.controlIcon}>↓</Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
            </View>
          </View>
        </View>

        {/* Voice Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Command</Text>
          <View style={styles.voiceInput}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter text for robot to speak..."
              placeholderTextColor="#6B7280"
              value={voiceCommand}
              onChangeText={setVoiceCommand}
              editable={!isProcessing}
            />
            <TouchableOpacity
              style={[styles.speakButton, !voiceCommand && styles.buttonDisabled]}
              onPress={handleSpeak}
              disabled={!voiceCommand || isProcessing}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NVIDIA AI Actions</Text>
          <View style={styles.aiButtons}>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={handleScan}
              disabled={isProcessing}
            >
              <Text style={styles.aiButtonIcon}>👁</Text>
              <Text style={styles.aiButtonText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => handleAutonomousTask('Navigate to the nearest object')}
              disabled={isProcessing}
            >
              <Text style={styles.aiButtonIcon}>🧠</Text>
              <Text style={styles.aiButtonText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => handleAutonomousTask('Explore the environment')}
              disabled={isProcessing}
            >
              <Text style={styles.aiButtonIcon}>🗺</Text>
              <Text style={styles.aiButtonText}>Explore</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Perception Results */}
        {perception && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Perception</Text>
            <View style={styles.perceptionCard}>
              <Text style={styles.perceptionScene}>Scene: {perception.scene}</Text>
              <Text style={styles.perceptionMeta}>
                Confidence: {(perception.confidence * 100).toFixed(1)}% •
                Time: {perception.processingTime}ms
              </Text>
              <Text style={styles.objectsTitle}>Detected Objects:</Text>
              {perception.objects.map((obj, idx) => (
                <View key={idx} style={styles.objectItem}>
                  <Text style={styles.objectLabel}>{obj.label}</Text>
                  <Text style={styles.objectConfidence}>
                    {(obj.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Log</Text>
          <View style={styles.logContainer}>
            {actionLog.length === 0 ? (
              <Text style={styles.logEmpty}>No actions yet</Text>
            ) : (
              actionLog.map((log, idx) => (
                <Text key={idx} style={styles.logEntry}>{log}</Text>
              ))
            )}
          </View>
        </View>

        {/* Disconnect Button */}
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Text style={styles.disconnectButtonText}>Disconnect Robot</Text>
        </TouchableOpacity>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#9945FF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectedText: {
    color: '#8B949E',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusHeader: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  robotIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  robotName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  robotMeta: {
    flexDirection: 'row',
  },
  metaText: {
    color: '#8B949E',
    fontSize: 14,
    marginRight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  controlPad: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 4,
  },
  controlButton: {
    width: 64,
    height: 64,
    backgroundColor: '#161B22',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  stopButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
  },
  controlIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  spacer: {
    width: 64,
    marginHorizontal: 8,
  },
  voiceInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  speakButton: {
    width: 48,
    height: 48,
    backgroundColor: '#9945FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  speakButtonText: {
    fontSize: 20,
  },
  aiButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiButton: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#14F195',
  },
  aiButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  aiButtonText: {
    color: '#14F195',
    fontSize: 12,
    fontWeight: '600',
  },
  perceptionCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
  },
  perceptionScene: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  perceptionMeta: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  objectsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  objectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  objectLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  objectConfidence: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  logEmpty: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  logEntry: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'monospace',
    paddingVertical: 2,
  },
  disconnectButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  disconnectButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
});
