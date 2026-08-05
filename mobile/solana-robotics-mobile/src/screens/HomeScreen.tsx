/**
 * Home Screen
 * Main dashboard for Solana Robotics Mobile
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { useWallet, useRobot, useDeveloper } from '../hooks/useStore';
import { KIT_TOKEN } from '../config/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// =============================================================================
// MENU ITEMS
// =============================================================================

const menuItems = [
  {
    id: 'wallet',
    title: 'Wallet',
    subtitle: 'Connect & manage SOL + $KIT',
    icon: '💎',
    screen: 'Wallet' as keyof RootStackParamList,
    color: '#9945FF',
  },
  {
    id: 'robots',
    title: 'Robots',
    subtitle: 'Discover & connect to robots',
    icon: '🤖',
    screen: 'RobotDiscovery' as keyof RootStackParamList,
    color: '#14F195',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    subtitle: 'Browse & assign robot tasks',
    icon: '📋',
    screen: 'Tasks' as keyof RootStackParamList,
    color: '#00D4FF',
  },
  {
    id: 'vibe',
    title: 'Vibe to Earn',
    subtitle: 'Earn $KIT for contributions',
    icon: '🎵',
    screen: 'VibeToEarn' as keyof RootStackParamList,
    color: '#FF6B6B',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Network & app configuration',
    icon: '⚙️',
    screen: 'Settings' as keyof RootStackParamList,
    color: '#6B7280',
  },
];

// =============================================================================
// HOME SCREEN COMPONENT
// =============================================================================

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const wallet = useWallet();
  const robot = useRobot();
  const developer = useDeveloper();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.header}>
          <Text style={styles.logo}>SOLANA ROBOTICS</Text>
          <Text style={styles.subtitle}>Control AI Robots with Your Wallet</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {wallet.connected ? wallet.balance.toFixed(4) : '--'}
            </Text>
            <Text style={styles.statLabel}>SOL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {wallet.connected ? wallet.kitBalance.toFixed(2) : '--'}
            </Text>
            <Text style={styles.statLabel}>$KIT</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {robot.connected ? '🟢' : '⚪'}
            </Text>
            <Text style={styles.statLabel}>Robot</Text>
          </View>
        </View>

        {/* Connection Status Banner */}
        {!wallet.connected && (
          <TouchableOpacity
            style={styles.connectBanner}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.connectBannerText}>
              👋 Connect your wallet to get started
            </Text>
          </TouchableOpacity>
        )}

        {/* Connected Robot */}
        {robot.connected && robot.robot && (
          <TouchableOpacity
            style={styles.robotBanner}
            onPress={() => navigation.navigate('RobotControl', { robotId: robot.robot!.id })}
          >
            <View style={styles.robotInfo}>
              <Text style={styles.robotName}>{robot.robot.name}</Text>
              <Text style={styles.robotStatus}>
                {robot.robot.status.toUpperCase()} • {robot.latency}ms
              </Text>
            </View>
            <Text style={styles.robotArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { borderColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Developer Stats (if registered) */}
        {developer && (
          <View style={styles.developerCard}>
            <Text style={styles.sectionTitle}>Vibe to Earn</Text>
            <View style={styles.developerStats}>
              <View style={styles.devStatItem}>
                <Text style={styles.devStatValue}>{developer.totalRewards.toFixed(2)}</Text>
                <Text style={styles.devStatLabel}>$KIT Earned</Text>
              </View>
              <View style={styles.devStatItem}>
                <Text style={styles.devStatValue}>{developer.streakDays}</Text>
                <Text style={styles.devStatLabel}>Day Streak</Text>
              </View>
              <View style={styles.devStatItem}>
                <Text style={styles.devStatValue}>{developer.tier}</Text>
                <Text style={styles.devStatLabel}>Tier</Text>
              </View>
            </View>
          </View>
        )}

        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenTitle}>$KIT Token</Text>
          <Text style={styles.tokenAddress}>{KIT_TOKEN.mint.toBase58().slice(0, 16)}...</Text>
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  connectBanner: {
    backgroundColor: '#9945FF20',
    borderColor: '#9945FF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  connectBannerText: {
    color: '#9945FF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  robotBanner: {
    backgroundColor: '#14F19520',
    borderColor: '#14F195',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  robotInfo: {
    flex: 1,
  },
  robotName: {
    color: '#14F195',
    fontSize: 16,
    fontWeight: 'bold',
  },
  robotStatus: {
    color: '#14F19580',
    fontSize: 12,
    marginTop: 4,
  },
  robotArrow: {
    color: '#14F195',
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    borderWidth: 1,
  },
  menuIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#8B949E',
  },
  developerCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  developerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  devStatItem: {
    alignItems: 'center',
  },
  devStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14F195',
  },
  devStatLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  tokenInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B949E',
  },
  tokenAddress: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
