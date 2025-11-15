import { test as base, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TestFixtures {
  seedData: void;
  cleanDatabase: void;
}

export const test = base.extend<TestFixtures>({
  // Fixture to seed the database with test data
  seedData: async ({}, use) => {
    console.log('Seeding database with test data...');
    try {
      await execAsync('cd backend && python manage.py seed_test_data --clear --count 50');
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
    
    await use();
  },

  // Fixture to clean the database
  cleanDatabase: async ({}, use) => {
    console.log('Cleaning database...');
    try {
      await execAsync('cd backend && python manage.py flush --noinput');
      console.log('Database cleaned successfully');
    } catch (error) {
      console.error('Failed to clean database:', error);
    }
    
    await use();
  },
});

export { expect };