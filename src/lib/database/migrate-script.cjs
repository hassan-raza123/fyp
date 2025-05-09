require('ts-node/register');
require('tsconfig-paths/register');

const { AppDataSource } = require('./dataSource');

async function runMigrations() {
  try {
    console.log('Starting migration process...');
    console.log('Initializing data source...');

    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Data Source has been initialized successfully!');

    // Run migrations
    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    console.log('Migrations completed!');
    console.log('Executed migrations:', migrations);

    // Close the connection
    await AppDataSource.destroy();
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
