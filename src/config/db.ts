import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("Connected successfully to PostgreSQL");
  } catch (error) {
    console.error("Connection failed to PostgreSQL", error);
    process.exit(1);
  }
};

export { prisma, connectDB };