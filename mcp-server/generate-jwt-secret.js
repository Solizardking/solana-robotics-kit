#!/usr/bin/env node
/**
 * Generate a secure JWT secret key.
 * Outputs a random string suitable for use in JWT_SECRET environment variable.
 */

const crypto = require('crypto');

function generateJWTSecret(length = 64) {
    // Generate random bytes and convert to hex string
    const secret = crypto.randomBytes(length).toString('hex');
    return secret;
}

function generateBase64Secret(length = 64) {
    // Generate random bytes and convert to base64 (URL-safe)
    const secret = crypto.randomBytes(length).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return secret;
}

try {
    console.log('='.repeat(60));
    console.log('JWT SECRET GENERATOR');
    console.log('='.repeat(60));
    
    // Generate hex format (most common)
    const hexSecret = generateJWTSecret(64);
    console.log(`\n🔐 JWT Secret (Hex format - 128 chars):`);
    console.log(`   ${hexSecret}`);
    
    // Generate base64 format (alternative)
    const base64Secret = generateBase64Secret(64);
    console.log(`\n🔐 JWT Secret (Base64 format - URL-safe):`);
    console.log(`   ${base64Secret}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 For .env file, add:');
    console.log(`   JWT_SECRET=${hexSecret}`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  SECURITY NOTES:');
    console.log('  • Keep this secret secure and private');
    console.log('  • Use a different secret for each environment (dev/staging/prod)');
    console.log('  • Never commit this to version control');
    console.log('  • Store it in your .env file (which is gitignored)');
    console.log('  • Recommended length: 64 bytes (128 hex chars or ~86 base64 chars)');
    console.log('='.repeat(60));
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
