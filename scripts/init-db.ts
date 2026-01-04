import { getDb, closeDb } from '../src/lib/db';
import { defaultCategories } from '../src/lib/db/schema';
import { categoriesRepository } from '../src/lib/repositories/categories';

async function main() {
  console.log('Initializing database...');

  // Initialize database (creates tables if they don\'t exist)
  const db = getDb();

  // Check if categories are empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (categoryCount.count === 0) {
    console.log('Seeding default categories...');
    categoriesRepository.seedDefaults(defaultCategories);
    console.log(`Created ${defaultCategories.length} default categories`);
  } else {
    console.log(`Database already has ${categoryCount.count} categories`);
  }

  // Close database
  closeDb();

  console.log('Database initialization complete!');
}

main().catch((error) => {
  console.error('Error initializing database:', error);
  process.exit(1);
});
