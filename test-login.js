const bcrypt = require('bcryptjs');

async function testLogin() {
  const url = 'https://report-2-h16grnc44-rahel0303s-projects.vercel.app/api/auth/login';

  console.log('Testing login endpoint...');
  console.log('URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'user1',
      password: '123456',
    }),
  });

  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  // Test password hash
  const hashedPassword = await bcrypt.hash('123456', 10);
  console.log('\nPassword hash test:');
  console.log('Original: 123456');
  console.log('Hashed:', hashedPassword);
  console.log('Verify:', await bcrypt.compare('123456', hashedPassword));
}

testLogin().catch(console.error);
