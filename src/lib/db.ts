import { PrismaClient } from '@prisma/client'
import { resolve, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  // Handle file: protocol with relative path
  if (rawUrl.startsWith('file:')) {
    const relativePath = rawUrl.replace('file:', '')
    const dbPath = resolve(process.cwd(), relativePath)
    const dir = dirname(dbPath)

    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o755 })
    }

    // Return path with connection_limit=1 for SQLite safety
    return `file:${dbPath}?connection_limit=1&pool_timeout=0`
  }

  return rawUrl
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasourceUrl: getDatabaseUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
