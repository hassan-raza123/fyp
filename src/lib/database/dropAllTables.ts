import { DataSource } from 'typeorm';

// Default database configuration
const defaultConfig = {
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'fyp_db',
};

// Get environment variables with fallbacks
const dbConfig = {
  host: process.env.DB_HOST || defaultConfig.host,
  port: parseInt(process.env.DB_PORT || defaultConfig.port.toString()),
  username: process.env.DB_USER || defaultConfig.username,
  password: process.env.DB_PASSWORD || defaultConfig.password,
  database: process.env.DB_NAME || defaultConfig.database,
};

async function dropAllTables() {
  const dataSource = new DataSource({
    type: 'mysql',
    ...dbConfig,
    synchronize: false,
    migrationsRun: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Get all table names
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${dbConfig.database}'
    `);

    // Drop all tables
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      if (tableName !== 'migrations') {
        console.log(`Dropping table: ${tableName}`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
    }

    console.log('All tables dropped successfully');
    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  }
}

dropAllTables();
