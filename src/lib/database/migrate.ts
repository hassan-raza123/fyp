import { AppDataSource } from './dataSource';
import { DataSource } from 'typeorm';

async function runMigrations() {
  try {
    console.log('Starting migration process...');
    console.log('Initializing data source...');

    // Initialize the data source with synchronize option
    const dataSource = new DataSource({
      ...AppDataSource.options,
      synchronize: false,
      migrationsRun: true,
      migrations: AppDataSource.options.migrations,
    });

    await dataSource.initialize();
    console.log('Data Source has been initialized successfully!');

    // Run migrations
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    console.log('Migrations completed!');
    console.log('Executed migrations:', migrations);

    // Close the connection
    await dataSource.destroy();
    console.log('Data Source has been closed.');
  } catch (error) {
    console.error('Error during migration:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

console.log('Starting migration script...');
runMigrations();
