// Update admin password to work with PBKDF2 system
const crypto = require('crypto');

async function generatePBKDF2Hash(password) {
  // Generate salt
  const saltArray = new Uint8Array(32);
  crypto.getRandomValues(saltArray);
  const salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Generate hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const saltData = encoder.encode(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, salt };
}

// Generate hash for 'demo123'
generatePBKDF2Hash('demo123').then(result => {
  console.log('Password: demo123');
  console.log('Hash:', result.hash);
  console.log('Salt:', result.salt);
  console.log('');
  console.log('SQL Update command:');
  console.log(`UPDATE users SET password_hash = '${result.hash}', salt = '${result.salt}' WHERE username = 'admin';`);
}).catch(console.error);