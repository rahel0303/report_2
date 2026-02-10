const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'db.idohuhfpbwotbbqbnazf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Masadepan0.',
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    console.log('Seeding Supabase database...\n');

    // Insert agency
    console.log('Creating agency...');
    const agencyResult = await pool.query(`
      INSERT INTO agencies (name, slug)
      VALUES ('Demo Agency', 'demo-agency')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const agencyId = agencyResult.rows[0].id;
    console.log(`✅ Agency created (ID: ${agencyId})`);

    // Create users
    console.log('\nCreating users...');
    const users = [
      {
        username: 'user1',
        password: '123456',
        name: 'User Demo 1',
        role: 'user',
        agency_id: agencyId,
      },
      { username: 'admin', password: 'admin123', name: 'Admin', role: 'admin', agency_id: null },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        `
        INSERT INTO users (username, password, name, role, agency_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (username) DO UPDATE 
        SET password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            agency_id = EXCLUDED.agency_id
      `,
        [user.username, hashedPassword, user.name, user.role, user.agency_id],
      );
      console.log(`✅ User created: ${user.username} (password: ${user.password})`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: user1  | Password: 123456');
    console.log('  Username: admin  | Password: admin123');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
