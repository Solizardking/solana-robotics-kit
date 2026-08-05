/**
 * Wallet Screen
 * Connect and manage Solana wallet with Mobile Wallet Adapter
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useWallet, useWalletActions, useApp, useAppActions } from '../hooks/useStore';
import { solanaService } from '../services/SolanaService';
import { KIT_TOKEN, STAKING_TIERS, StakingTier } from '../config/constants';

export default function WalletScreen() {
  const wallet = useWallet();
  const { setWallet, disconnectWallet, updateBalance } = useWalletActions();
  const app = useApp();
  const { setLoading, setError, setNetwork } = useAppActions();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const walletState = await solanaService.connectWallet();
      setWallet(walletState);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await solanaService.disconnectWallet();
            disconnectWallet();
          },
        },
      ]
    );
  };

  const handleRefreshBalance = async () => {
    if (!wallet.address) return;

    setLoading(true);
    try {
      const sol = await solanaService.getSolBalance(wallet.address);
      const kit = await solanaService.getKitTokenBalance(wallet.address);
      updateBalance(sol, kit);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAirdrop = async () => {
    if (!wallet.address || app.network !== 'devnet') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      await solanaService.requestAirdrop(wallet.address, 1);
      await handleRefreshBalance();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Airdropped 1 SOL to your wallet');
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Airdrop Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={styles.section}>
          <View style={[styles.statusCard, wallet.connected && styles.statusCardConnected]}>
            <View style={[styles.statusDot, wallet.connected && styles.statusDotConnected]} />
            <Text style={styles.statusText}>
              {wallet.connected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>

        {!wallet.connected ? (
          /* Connect Wallet Section */
          <View style={styles.connectSection}>
            <Text style={styles.connectTitle}>Connect Your Wallet</Text>
            <Text style={styles.connectSubtitle}>
              Use Mobile Wallet Adapter to connect your Solana wallet
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectButtonText}>Connect Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Wallet Details */
          <>
            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet Address</Text>
              <View style={styles.addressCard}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {wallet.address}
                </Text>
              </View>
            </View>

            {/* Balances */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Balances</Text>
                <TouchableOpacity onPress={handleRefreshBalance}>
                  <Text style={styles.refreshButton}>↻ Refresh</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.balanceRow}>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceValue}>{wallet.balance.toFixed(4)}</Text>
                  <Text style={styles.balanceLabel}>SOL</Text>
                </View>
                <View style={styles.balanceCard}>
                  <Text style={[styles.balanceValue, { color: '#14F195' }]}>
                    {wallet.kitBalance.toFixed(2)}
                  </Text>
                  <Text style={styles.balanceLabel}>$CLAWD</Text>
                </View>
              </View>

              {/* Devnet Airdrop */}
              {app.network === 'devnet' && (
                <TouchableOpacity style={styles.airdropButton} onPress={handleAirdrop}>
                  <Text style={styles.airdropButtonText}>Request Devnet Airdrop</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Staking Tiers Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Staking Tiers</Text>
              {Object.entries(STAKING_TIERS).map(([tier, info]) => (
                <View
                  key={tier}
                  style={[
                    styles.tierCard,
                    wallet.kitBalance >= info.stake && styles.tierCardActive,
                  ]}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{info.name}</Text>
                    <Text style={styles.tierStake}>{info.stake} $CLAWD</Text>
                  </View>
                  <Text style={styles.tierCapabilities}>
                    {info.capabilities.join(' • ')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Token Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>$CLAWD Token</Text>
              <View style={styles.tokenCard}>
                <Text style={styles.tokenLabel}>Mint Address</Text>
                <Text style={styles.tokenValue}>{KIT_TOKEN.mint.toBase58()}</Text>
              </View>
            </View>

            {/* Disconnect */}
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Network Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.networkRow}>
            {(['devnet', 'mainnet-beta'] as const).map((network) => (
              <TouchableOpacity
                key={network}
                style={[
                  styles.networkButton,
                  app.network === network && styles.networkButtonActive,
                ]}
                onPress={() => {
                  setNetwork(network);
                  solanaService.setNetwork(network);
                }}
              >
                <Text
                  style={[
                    styles.networkButtonText,
                    app.network === network && styles.networkButtonTextActive,
                  ]}
                >
                  {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  refreshButton: {
    color: '#9945FF',
    fontSize: 14,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statusCardConnected: {
    borderColor: '#14F195',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B7280',
    marginRight: 12,
  },
  statusDotConnected: {
    backgroundColor: '#14F195',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  connectTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectSubtitle: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  connectButton: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  balanceRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#161B22',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: '#8B949E',
    fontSize: 14,
    marginTop: 4,
  },
  airdropButton: {
    backgroundColor: '#14F19520',
    borderColor: '#14F195',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  airdropButtonText: {
    color: '#14F195',
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  tierCardActive: {
    borderColor: '#14F195',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierStake: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  tierCapabilities: {
    color: '#8B949E',
    fontSize: 12,
  },
  tokenCard: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  tokenLabel: {
    color: '#8B949E',
    fontSize: 12,
    marginBottom: 4,
  },
  tokenValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  disconnectButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  disconnectButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  networkRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  networkButton: {
    flex: 1,
    backgroundColor: '#161B22',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  networkButtonActive: {
    borderColor: '#9945FF',
    backgroundColor: '#9945FF20',
  },
  networkButtonText: {
    color: '#8B949E',
    fontWeight: '600',
  },
  networkButtonTextActive: {
    color: '#9945FF',
  },
});
