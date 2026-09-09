/**
 * Test Script for Chrome Extension Wallet
 *
 * Run this in the browser console when the extension is loaded
 * to verify wallet functionality
 */

// Test 1: Create a new user wallet
console.log('Test 1: Creating user wallet...');
chrome.runtime.sendMessage({
  type: 'create_wallet',
  options: {
    label: 'Test User Wallet',
    isAgentWallet: false,
    notes: 'Testing wallet creation',
    tags: ['test', 'user']
  }
}, (response) => {
  console.log('User Wallet Created:', response);
  if (response.success) {
    console.log('✅ Test 1 PASSED');
    console.log('Address:', response.wallet.address);
    console.log('Label:', response.wallet.label);

    // Store address for next test
    window.testWalletAddress = response.wallet.address;

    // Test 2: Get all managed wallets
    console.log('\nTest 2: Getting all managed wallets...');
    chrome.runtime.sendMessage({
      type: 'get_managed_wallets'
    }, (response2) => {
      console.log('All Wallets:', response2);
      if (response2.success && response2.wallets.length > 0) {
        console.log('✅ Test 2 PASSED');
        console.log('Total wallets:', response2.wallets.length);
      } else {
        console.log('❌ Test 2 FAILED');
      }
    });
  } else {
    console.log('❌ Test 1 FAILED:', response.error);
  }
});

// Test 3: Create an agent wallet
console.log('\nTest 3: Creating agent wallet...');
setTimeout(() => {
  chrome.runtime.sendMessage({
    type: 'create_agent_wallet',
    options: {
      label: 'Test Agent Wallet',
      notes: 'Testing agent wallet creation',
      tags: ['test', 'agent', 'automated']
    }
  }, (response) => {
    console.log('Agent Wallet Created:', response);
    if (response.success && response.wallet.isAgentWallet) {
      console.log('✅ Test 3 PASSED');
      console.log('Agent Address:', response.wallet.address);

      // Test 4: Get only agent wallets
      console.log('\nTest 4: Getting agent wallets...');
      chrome.runtime.sendMessage({
        type: 'get_agent_wallets'
      }, (response2) => {
        console.log('Agent Wallets:', response2);
        if (response2.success && response2.wallets.length > 0) {
          console.log('✅ Test 4 PASSED');
          console.log('Total agent wallets:', response2.wallets.length);
        } else {
          console.log('❌ Test 4 FAILED');
        }
      });
    } else {
      console.log('❌ Test 3 FAILED:', response.error);
    }
  });
}, 1000);

// Test 5: Sign a message
console.log('\nTest 5: Signing a test message...');
setTimeout(() => {
  if (window.testWalletAddress) {
    const testMessage = new TextEncoder().encode('Hello GR00T Wallet!');

    chrome.runtime.sendMessage({
      type: 'sign_message',
      address: window.testWalletAddress,
      message: Array.from(testMessage) // Convert to array for JSON
    }, (response) => {
      console.log('Message Signature:', response);
      if (response.success && response.signature) {
        console.log('✅ Test 5 PASSED');
        console.log('Signature length:', response.signature.length);
      } else {
        console.log('❌ Test 5 FAILED:', response.error);
      }
    });
  } else {
    console.log('⏭️ Test 5 SKIPPED (no wallet address)');
  }
}, 2000);

// Test 6: Get wallet namespaces
console.log('\nTest 6: Getting wallet namespaces...');
setTimeout(() => {
  chrome.runtime.sendMessage({
    type: 'get_wallet_namespaces'
  }, (response) => {
    console.log('Wallet Namespaces:', response);
    if (response.success && response.namespaces) {
      console.log('✅ Test 6 PASSED');
      console.log('Total namespaces:', response.namespaces.length);
      response.namespaces.forEach((ns, i) => {
        console.log(`  ${i + 1}. ${ns.name} - ${ns.address} ${ns.isActive ? '(Active)' : ''}`);
      });
    } else {
      console.log('❌ Test 6 FAILED');
    }
  });
}, 3000);

// Summary
setTimeout(() => {
  console.log('\n========================================');
  console.log('Wallet Test Suite Complete!');
  console.log('========================================');
  console.log('Check the results above for PASSED/FAILED tests.');
  console.log('\nTo view your wallets in the UI:');
  console.log('1. Click the GR00T extension icon');
  console.log('2. Open the side panel');
  console.log('3. Navigate to Wallet → Tokens');
}, 4000);
