// wallet/walletManager.ts
/**
 * Wallet Manager for creating and managing Solana wallets
 * Supports both user wallets and agent wallets
 */

import { Keypair } from "@solana/web3.js";
import { Address, getAddressEncoder } from "@solana/addresses";
import {
  storeWalletKey,
  getWalletKeypair,
  deleteWalletKey,
  hasWalletKey,
  isAgentWallet,
  getAllWalletAddresses,
  getAgentWalletAddresses,
} from "./keyStorage";
import { saveNewAccount, getSavedAccounts } from "../accounts/storage";
import type { SavedAccount } from "../accounts/savedAccount";

export interface CreateWalletOptions {
  label?: string;
  isAgentWallet?: boolean;
  notes?: string;
  tags?: string[];
}

export interface WalletInfo {
  address: Address;
  label: string;
  isAgentWallet: boolean;
  hasPrivateKey: boolean;
  createdAt: number;
}

/**
 * Create a new Solana wallet
 */
export async function createWallet(
  options: CreateWalletOptions = {}
): Promise<WalletInfo> {
  const keypair = Keypair.generate();
  const addressEncoder = getAddressEncoder();
  const address = addressEncoder.encode(keypair.publicKey.toBytes()) as Address;
  
  const isAgent = options.isAgentWallet ?? false;
  
  // Store the private key securely
  await storeWalletKey(keypair, isAgent);
  
  // Generate a default label if not provided
  const accounts = await getSavedAccounts();
  const defaultLabel = options.label || 
    (isAgent 
      ? `Agent Wallet ${accounts.filter(a => a.tags.includes("agent-wallet")).length + 1}`
      : `Wallet ${accounts.length + 1}`);
  
  // Create account entry
  const account: SavedAccount = {
    address,
    label: defaultLabel,
    notes: options.notes || "",
    tags: [
      ...(options.tags || []),
      ...(isAgent ? ["agent-wallet", "automated"] : ["user-wallet"]),
    ],
  };
  
  await saveNewAccount(account);
  
  return {
    address,
    label: account.label,
    isAgentWallet: isAgent,
    hasPrivateKey: true,
    createdAt: Date.now(),
  };
}

/**
 * Create an agent wallet (for automated operations)
 */
export async function createAgentWallet(
  options: Omit<CreateWalletOptions, "isAgentWallet"> = {}
): Promise<WalletInfo> {
  return createWallet({
    ...options,
    isAgentWallet: true,
  });
}

/**
 * Get wallet keypair for signing transactions
 */
export async function getWalletKeypairForAddress(
  address: Address
): Promise<Keypair | null> {
  return getWalletKeypair(address);
}

/**
 * Check if an address has a stored private key (is a managed wallet)
 */
export async function isManagedWallet(address: Address): Promise<boolean> {
  return hasWalletKey(address);
}

/**
 * Delete a wallet and its private key
 */
export async function deleteWallet(address: Address): Promise<void> {
  await deleteWalletKey(address);
  // Note: Account entry should be deleted separately via accounts/storage
}

/**
 * Get all managed wallets
 */
export async function getAllManagedWallets(): Promise<WalletInfo[]> {
  const addresses = await getAllWalletAddresses();
  const accounts = await getSavedAccounts();
  
  const walletMap = new Map<Address, SavedAccount>();
  accounts.forEach((acc) => walletMap.set(acc.address, acc));
  
  const wallets: WalletInfo[] = [];
  
  for (const address of addresses) {
    const account = walletMap.get(address);
    const isAgent = await isAgentWallet(address);
    
    wallets.push({
      address,
      label: account?.label || "Unknown",
      isAgentWallet: isAgent,
      hasPrivateKey: true,
      createdAt: account ? Date.now() : 0, // Could store creation time in keyStorage
    });
  }
  
  return wallets;
}

/**
 * Get all agent wallets
 */
export async function getAgentWallets(): Promise<WalletInfo[]> {
  const addresses = await getAgentWalletAddresses();
  const accounts = await getSavedAccounts();
  
  const walletMap = new Map<Address, SavedAccount>();
  accounts.forEach((acc) => walletMap.set(acc.address, acc));
  
  const wallets: WalletInfo[] = [];
  
  for (const address of addresses) {
    const account = walletMap.get(address);
    
    wallets.push({
      address,
      label: account?.label || "Unknown Agent",
      isAgentWallet: true,
      hasPrivateKey: true,
      createdAt: account ? Date.now() : 0,
    });
  }
  
  return wallets;
}

/**
 * Sign a message with a wallet's private key
 */
export async function signMessage(
  address: Address,
  message: Uint8Array
): Promise<Uint8Array> {
  const keypair = await getWalletKeypair(address);
  if (!keypair) {
    throw new Error(`No private key found for address: ${address}`);
  }
  
  // Sign the message
  const signature = keypair.sign(message);
  return signature.signature;
}

/**
 * Sign a transaction with a wallet's private key
 */
export async function signTransaction(
  address: Address,
  transaction: Uint8Array
): Promise<Uint8Array> {
  const keypair = await getWalletKeypair(address);
  if (!keypair) {
    throw new Error(`No private key found for address: ${address}`);
  }
  
  // For Solana transactions, you'd typically use @solana/web3.js Transaction class
  // This is a simplified version - actual implementation depends on transaction format
  const signature = keypair.sign(transaction);
  return signature.signature;
}
