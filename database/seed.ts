// Script untuk seed database dengan user awal
// Jalankan dengan: npx ts-node database/seed.ts

import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  console.log('='.repeat(50));
  console.log('Password Hash Generator');
  console.log('='.repeat(50));
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('');
  console.log('SQL untuk insert user:');
  console.log('');
  console.log(`INSERT INTO users (name, username, password, role)`);
  console.log(`VALUES ('Admin', 'admin', '${hash}', 'admin');`);
  console.log('='.repeat(50));
}

generateHash().catch(console.error);
