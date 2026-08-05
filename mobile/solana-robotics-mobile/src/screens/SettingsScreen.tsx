/**
 * Settings Screen
 * App configuration and network settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useAppActions, useStore } from '../hooks/useStore';
import { solanaService } from '../services/SolanaService';
import { APP_CONFIG, NETWORKS, NetworkType } from '../config/constants';

export default function SettingsScreen() {
  const app = useApp();
  const { setNetwork } = useAppActions();
  const reset = useStore((state) => state.reset);

  const handleNetworkChange = (network: NetworkType) => {
    setNetwork(network);
    solanaService.setNetwork(network);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will clear all data including wallet connections and settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            Alert.alert('Success', 'App has been reset');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Network Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          {(['devnet', 'mainnet-beta'] as NetworkType[]).map((network) => (
            <TouchableOpacity
              key={network}
              style={[styles.optionRow, app.network === network && styles.optionRowActive]}
              onPress={() => handleNetworkChange(network)}
            >
              <View>
                <Text style={styles.optionTitle}>
                  {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
                </Text>
                <Text style={styles.optionSubtitle}>{NETWORKS[network].rpcUrl}</Text>
              </View>
              <View style={[styles.radio, app.network === network && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>{APP_CONFIG.version}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>{APP_CONFIG.buildNumber}</Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink(APP_CONFIG.websiteUrl)}
          >
            <Text style={styles.linkText}>Website</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink(APP_CONFIG.githubUrl)}
          >
            <Text style={styles.linkText}>GitHub</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink(APP_CONFIG.discordUrl)}
          >
            <Text style={styles.linkText}>Discord</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink(APP_CONFIG.twitterUrl)}
          >
            <Text style={styles.linkText}>Twitter</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink(`mailto:${APP_CONFIG.supportEmail}`)}
          >
            <Text style={styles.linkText}>Contact Support</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleResetApp}>
            <Text style={styles.dangerButtonText}>Reset App Data</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Solana Robotics Kit</Text>
          <Text style={styles.footerSubtext}>
            Control AI Robots with Your Solana Wallet
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scrollView: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionRow: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  optionRowActive: {
    borderColor: '#9945FF',
  },
  optionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  optionSubtitle: { color: '#8B949E', fontSize: 12, marginTop: 4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#30363D',
  },
  radioActive: {
    borderColor: '#9945FF',
    backgroundColor: '#9945FF',
  },
  infoCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { color: '#8B949E', fontSize: 14 },
  infoValue: { color: '#FFFFFF', fontSize: 14 },
  linkRow: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  linkText: { color: '#FFFFFF', fontSize: 16 },
  linkArrow: { color: '#8B949E', fontSize: 16 },
  dangerButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#EF4444', fontWeight: 'bold' },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  footerText: { color: '#8B949E', fontSize: 14 },
  footerSubtext: { color: '#6B7280', fontSize: 12, marginTop: 4 },
});
