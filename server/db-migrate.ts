import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../shared/schema";

// For migrations
async function main() {
  console.log("Starting database migration...");
  
  try {
    // Create a PostgreSQL client for migrations
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(migrationClient, { schema });
    
    console.log("Pushing schema to database...");
    
    // This will create all tables and relationships
    await migrate(db, { migrationsFolder: "drizzle" });
    
    console.log("Migration completed successfully!");
    
    // Close the connection
    await migrationClient.end();
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();