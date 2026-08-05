/**
 * Vibe to Earn Screen
 * Developer rewards tracking and claiming
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeveloper, useWallet } from '../hooks/useStore';
import { API_CONFIG } from '../config/constants';
import { LeaderboardEntry, Contribution } from '../types';

export default function VibeToEarnScreen() {
  const developer = useDeveloper();
  const wallet = useWallet();
  const store = require('../hooks/useStore').useStore;

  const [githubUsername, setGithubUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    loadLeaderboard();
    if (developer) {
      loadContributions();
    }
  }, [developer]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_CONFIG.vibeApiUrl}/leaderboard?limit=10`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadContributions = async () => {
    if (!developer) return;
    try {
      const response = await fetch(`${API_CONFIG.vibeApiUrl}/contributions/${developer.githubUsername}?limit=10`);
      const data = await response.json();
      setContributions(data);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    }
  };

  const handleRegister = async () => {
    if (!githubUsername.trim()) {
      Alert.alert('Error', 'Please enter your GitHub username');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch(`${API_CONFIG.vibeApiUrl}/developers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_username: githubUsername,
          wallet_address: wallet.address,
        }),
      });
      const data = await response.json();
      store.getState().setDeveloper(data);
      Alert.alert('Success', 'You are now registered for Vibe to Earn!');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!developer) return;

    setIsClaiming(true);
    try {
      const response = await fetch(`${API_CONFIG.vibeApiUrl}/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_username: developer.githubUsername }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Claimed ${data.amount} $KIT!`);
      } else {
        Alert.alert('Claim Failed', data.error);
      }
    } catch (error: any) {
      Alert.alert('Claim Failed', error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vibe to Earn</Text>
          <Text style={styles.headerSubtitle}>Earn $KIT by contributing to the repo</Text>
        </View>

        {!developer ? (
          /* Registration */
          <View style={styles.registerSection}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <TextInput
              style={styles.input}
              placeholder="Your GitHub username"
              placeholderTextColor="#6B7280"
              value={githubUsername}
              onChangeText={setGithubUsername}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Developer Stats */
          <>
            <View style={styles.statsCard}>
              <Text style={styles.username}>@{developer.githubUsername}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{developer.tier.toUpperCase()}</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{developer.totalRewards.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Total $KIT</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#14F195' }]}>
                    {developer.pendingRewards.toFixed(2)}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{developer.streakDays}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
              {developer.pendingRewards > 0 && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={handleClaimRewards}
                  disabled={isClaiming}
                >
                  {isClaiming ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.claimButtonText}>
                      Claim {developer.pendingRewards.toFixed(2)} $KIT
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Recent Contributions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Contributions</Text>
              {contributions.length === 0 ? (
                <Text style={styles.emptyText}>No contributions yet</Text>
              ) : (
                contributions.map((c) => (
                  <View key={c.id} style={styles.contributionItem}>
                    <Text style={styles.contributionType}>{c.type}</Text>
                    <Text style={styles.contributionReward}>+{c.rewardAmount} $KIT</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Contributors</Text>
          {leaderboard.map((entry, idx) => (
            <View key={idx} style={styles.leaderboardItem}>
              <Text style={styles.rank}>#{entry.rank}</Text>
              <Text style={styles.leaderName}>{entry.developer}</Text>
              <Text style={styles.leaderReward}>{entry.totalRewards.toFixed(0)} $KIT</Text>
            </View>
          ))}
        </View>

        {/* Reward Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Rates</Text>
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Commit</Text>
              <Text style={styles.rateValue}>1 $KIT</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Pull Request</Text>
              <Text style={styles.rateValue}>10 $KIT</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Bug Fix</Text>
              <Text style={styles.rateValue}>15 $KIT</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Feature</Text>
              <Text style={styles.rateValue}>25 $KIT</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Security Fix</Text>
              <Text style={styles.rateValue}>50 $KIT</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scrollView: { flex: 1, padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#8B949E', fontSize: 14, marginTop: 4 },
  registerSection: { marginBottom: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#9945FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  statsCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
  },
  username: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  tierBadge: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  tierText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', marginTop: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#8B949E', fontSize: 12, marginTop: 4 },
  claimButton: {
    backgroundColor: '#14F195',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  claimButtonText: { color: '#000000', fontWeight: 'bold' },
  section: { marginBottom: 24 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  contributionItem: {
    backgroundColor: '#161B22',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionType: { color: '#FFFFFF', fontSize: 14 },
  contributionReward: { color: '#14F195', fontSize: 14, fontWeight: '600' },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rank: { color: '#9945FF', fontSize: 16, fontWeight: 'bold', width: 40 },
  leaderName: { color: '#FFFFFF', fontSize: 14, flex: 1 },
  leaderReward: { color: '#14F195', fontSize: 14, fontWeight: '600' },
  rateCard: { backgroundColor: '#161B22', borderRadius: 12, padding: 16 },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  rateLabel: { color: '#FFFFFF', fontSize: 14 },
  rateValue: { color: '#14F195', fontSize: 14, fontWeight: '600' },
});
