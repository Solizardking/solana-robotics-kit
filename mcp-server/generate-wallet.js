#!/usr/bin/env node
/**
 * Generate a new Solana wallet keypair.
 * Outputs the public key (address) and private key in JSON format for .env file.
 */

const { Keypair } = require('@solana/web3.js');

function generateWallet() {
    // Generate a new keypair
    const keypair = Keypair.generate();
    
    // Get the private key as an array
    const privateKey = Array.from(keypair.secretKey);
    
    // Get the public key
    const publicKey = keypair.publicKey.toBase58();
    
    console.log('='.repeat(60));
    console.log('NEW SOLANA WALLET GENERATED');
    console.log('='.repeat(60));
    console.log(`\n📍 Public Key (Address):`);
    console.log(`   ${publicKey}`);
    console.log(`\n🔐 Private Key (JSON format for .env):`);
    console.log(`   ${JSON.stringify(privateKey)}`);
    console.log(`\n📝 For .env file, use:`);
    console.log(`   SOLANA_PRIVATE_KEY=${JSON.stringify(privateKey)}`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  SECURITY WARNING:');
    console.log('  • Save this private key securely');
    console.log('  • NEVER share it or commit it to version control');
    console.log('  • Add it to your .env file (which is gitignored)');
    console.log('  • For testing, use devnet: https://faucet.solana.com/');
    console.log('='.repeat(60));
    
    return { publicKey, privateKey };
}

try {
    generateWallet();
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
