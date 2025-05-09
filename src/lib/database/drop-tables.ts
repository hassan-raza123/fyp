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
const config = {
  host: process.env.DB_HOST || defaultConfig.host,
  port: parseInt(process.env.DB_PORT || defaultConfig.port.toString()),
  username: process.env.DB_USER || defaultConfig.username,
  password: process.env.DB_PASSWORD || defaultConfig.password,
  database: process.env.DB_NAME || defaultConfig.database,
};

const dropAndRecreateDatabase = async () => {
  console.log('Database Configuration:', {
    ...config,
    password: config.password ? '****' : 'empty',
  });
  console.log('Starting database recreation script...');

  // First connect to MySQL without specifying a database
  const tempDataSource = new DataSource({
    ...config,
    database: undefined,
    type: 'mysql',
    synchronize: false,
    logging: true,
  });

  try {
    await tempDataSource.initialize();
    console.log('Connected to MySQL server');

    // Drop the database if it exists
    await tempDataSource.query(`DROP DATABASE IF EXISTS ${config.database}`);
    console.log('Dropped database if it existed');

    // Create the database
    await tempDataSource.query(`CREATE DATABASE ${config.database}`);
    console.log('Created fresh database');
  } catch (error) {
    console.error('Error recreating database:', error);
    throw error;
  } finally {
    if (tempDataSource.isInitialized) {
      await tempDataSource.destroy();
    }
  }
};

dropAndRecreateDatabase()
  .then(() => {
    console.log('Database recreation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database recreation failed:', error);
    process.exit(1);
  });
