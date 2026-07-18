const { PrismaClient } = require('@prisma/client');
console.log("Testing PrismaClient instantiation:");
try {
  const prisma = new PrismaClient();
  console.log("✅ Initialized with empty constructor");
} catch (e) {
  console.log("❌ Empty constructor failed:", e.message);
}
try {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  console.log("✅ Initialized with datasources config");
} catch (e) {
  console.log("❌ Datasources config failed:", e.message);
}
try {
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  console.log("✅ Initialized with datasourceUrl option");
} catch (e) {
  console.log("❌ DatasourceUrl option failed:", e.message);
}
