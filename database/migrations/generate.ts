import * as dotenv from "dotenv";
import { exec } from "child_process";
import path from "path";
import * as fs from "fs";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const schema = path.resolve("./src/db/schema.ts");
const outDir = path.resolve("./src/migrations");

// Ensure the migrations directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Command to generate migrations
const command = `npx drizzle-kit generate:pg --schema=${schema} --out=${outDir} --driver=pg`;

console.log("Running migration generation...");
console.log(command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }

  console.log(`Migration files generated: \n${stdout}`);
});
