#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const projectRoot = process.cwd();
const schemaPath = path.join(projectRoot, 'prisma', 'schema.dev.prisma');

function readProvider() {
  if (!fs.existsSync(schemaPath)) {
    return null;
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const match = schema.match(/datasource\s+\w+\s+{[^}]*provider\s*=\s*"([^"]+)"/s);
  return match ? match[1]?.trim() ?? null : null;
}

function resolveDatabaseUrl() {
  const envFiles = ['.env', '.env.development'];

  for (const file of envFiles) {
    const envPath = path.join(projectRoot, file);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }

  return process.env.DATABASE_URL ?? '';
}

const provider = readProvider();
const databaseUrl = resolveDatabaseUrl() || 'file:./dev.db';
const additionalArgs = process.argv.slice(2).join(' ');
process.env.DATABASE_URL = databaseUrl;

const isSQLite = provider === 'sqlite' || databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:');

const command = isSQLite
  ? `npx prisma db push --schema="${schemaPath}" ${additionalArgs}`.trim()
  : `npx prisma migrate dev --schema="${schemaPath}" ${additionalArgs}`.trim();

console.log(`Running ${isSQLite ? 'prisma db push' : 'prisma migrate dev'} for development database...`);

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error('\nFailed to run development migration command.');
  console.error(`Attempted command: ${command}`);
  if (error?.stderr) {
    console.error(error.stderr.toString());
  }
  process.exit(1);
}
