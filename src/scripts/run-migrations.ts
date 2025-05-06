import 'reflect-metadata';
import { AppDataSource } from '../lib/database/dataSource';

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully');
  } catch (error: any) {
    console.error('Error during migration:', error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nDatabase Access Error:');
      console.error('1. Make sure MySQL server is running');
      console.error('2. Verify your database credentials in .env.local file');
      console.error(
        '3. Check if the database exists: CREATE DATABASE unitrack365;'
      );
      console.error('4. Make sure the user has proper permissions');
    }
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

runMigrations();
