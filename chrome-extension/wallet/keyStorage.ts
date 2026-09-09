// wallet/keyStorage.ts
/**
 * Secure key storage for Solana wallet private keys
 * Uses browser storage with encryption
 */

import { Keypair } from "@solana/web3.js";
import { Address, getAddressEncoder } from "@solana/addresses";
import { storage } from "#imports";

const KEYS_STORAGE_KEY = "local:wallet_keys";
const ENCRYPTION_KEY_STORAGE_KEY = "local:encryption_key";

interface StoredKey {
  address: Address;
  encryptedSecretKey: string;
  isAgentWallet: boolean;
  createdAt: number;
}

/**
 * Simple encryption using Web Crypto API
 * In production, use a more robust encryption scheme
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const stored = await storage.getItem<string>(ENCRYPTION_KEY_STORAGE_KEY);
  
  if (stored) {
    // Import existing key
    const keyData = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } else {
    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exported = await crypto.subtle.exportKey("raw", key);
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)));
    await storage.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyString);
    
    return key;
  }
}

async function encryptSecretKey(secretKey: Uint8Array): Promise<string> {
  const encryptionKey = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    secretKey
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptSecretKey(encryptedData: string): Promise<Uint8Array> {
  const encryptionKey = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    encrypted
  );
  
  return new Uint8Array(decrypted);
}

export async function storeWalletKey(
  keypair: Keypair,
  isAgentWallet: boolean = false
): Promise<Address> {
  const addressEncoder = getAddressEncoder();
  const address = addressEncoder.encode(keypair.publicKey.toBytes()) as Address;
  
  const encryptedSecretKey = await encryptSecretKey(keypair.secretKey);
  
  const storedKeys = await getStoredKeys();
  
  const newKey: StoredKey = {
    address,
    encryptedSecretKey,
    isAgentWallet,
    createdAt: Date.now(),
  };
  
  storedKeys.push(newKey);
  await saveStoredKeys(storedKeys);
  
  return address;
}

export async function getWalletKeypair(address: Address): Promise<Keypair | null> {
  const storedKeys = await getStoredKeys();
  const storedKey = storedKeys.find((k) => k.address === address);
  
  if (!storedKey) {
    return null;
  }
  
  try {
    const secretKey = await decryptSecretKey(storedKey.encryptedSecretKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error("Error decrypting key:", error);
    return null;
  }
}

export async function deleteWalletKey(address: Address): Promise<void> {
  const storedKeys = await getStoredKeys();
  const updated = storedKeys.filter((k) => k.address !== address);
  await saveStoredKeys(updated);
}

export async function hasWalletKey(address: Address): Promise<boolean> {
  const storedKeys = await getStoredKeys();
  return storedKeys.some((k) => k.address === address);
}

export async function isAgentWallet(address: Address): Promise<boolean> {
  const storedKeys = await getStoredKeys();
  const storedKey = storedKeys.find((k) => k.address === address);
  return storedKey?.isAgentWallet ?? false;
}

export async function getAllWalletAddresses(): Promise<Address[]> {
  const storedKeys = await getStoredKeys();
  return storedKeys.map((k) => k.address);
}

export async function getAgentWalletAddresses(): Promise<Address[]> {
  const storedKeys = await getStoredKeys();
  return storedKeys
    .filter((k) => k.isAgentWallet)
    .map((k) => k.address);
}

async function getStoredKeys(): Promise<StoredKey[]> {
  const keysAsJsonOrNull = await storage.getItem<string>(KEYS_STORAGE_KEY);
  return keysAsJsonOrNull ? JSON.parse(keysAsJsonOrNull) : [];
}

async function saveStoredKeys(keys: StoredKey[]): Promise<void> {
  await storage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
}
