import 'reflect-metadata';
import { AppDataSource } from './dataSource';

let initialized = false;

export async function initializeDatabase() {
  if (initialized) {
    return AppDataSource;
  }

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      initialized = true;
      console.log('Database connection established');
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    throw error;
  }
}

export async function getDatabaseConnection() {
  if (!AppDataSource.isInitialized) {
    await initializeDatabase();
  }
  return AppDataSource;
}

export async function getRepository<T>(entity: new () => T) {
  const dataSource = await getDatabaseConnection();
  return dataSource.getRepository(entity);
}
