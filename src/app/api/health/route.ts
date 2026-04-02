import { constants as fsConstants } from "node:fs"
import { access, stat } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type HealthCheckResult = {
  ok: boolean
  reason?: string
}

function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    return null
  }

  const rawPath = databaseUrl.slice("file:".length)
  if (!rawPath) {
    return null
  }

  return rawPath.startsWith("/") ? rawPath : null
}

async function checkStorage(databaseUrl: string): Promise<HealthCheckResult> {
  const dbPath = resolveSqlitePath(databaseUrl)

  if (!dbPath) {
    return { ok: true, reason: "relative_database_url_skipped" }
  }

  const parentDir = path.dirname(dbPath)

  try {
    await access(parentDir, fsConstants.W_OK)
  } catch {
    return { ok: false, reason: "database_directory_not_writable" }
  }

  try {
    const dbStat = await stat(dbPath)

    if (!dbStat.isFile()) {
      return { ok: false, reason: "database_path_not_file" }
    }

    await access(dbPath, fsConstants.W_OK)
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : null
    if (code !== "ENOENT") {
      return { ok: false, reason: "database_file_not_writable" }
    }
  }

  return { ok: true }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    await prisma.setting.findFirst({
      select: { key: true },
    })

    return { ok: true }
  } catch {
    return { ok: false, reason: "database_query_failed" }
  }
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        database: { ok: false, reason: "missing_database_url" },
        storage: { ok: false, reason: "missing_database_url" },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  const [database, storage] = await Promise.all([checkDatabase(), checkStorage(databaseUrl)])
  const ok = database.ok && storage.ok

  return NextResponse.json(
    {
      ok,
      database,
      storage,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}
