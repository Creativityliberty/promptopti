import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import { AppError } from "@/lib/errors"
import * as schema from "./schema"

let database: ReturnType<typeof createDatabase> | undefined

function createDatabase() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new AppError(
      "La base Postgres n’est pas configurée.",
      503,
      "DATABASE_NOT_CONFIGURED",
    )
  }
  return drizzle(neon(url), { schema })
}

export function getDatabase() {
  database ??= createDatabase()
  return database
}

