import pool from "../config/database.js";

/**
 * Cache of every base table in the `public` schema that has an
 * `academic_year_id` column. Populated once at server startup so the query
 * builder never has to hit information_schema per-query.
 */
const tablesWithAcademicYear = new Set<string>();

let initialized = false;
let initPromise: Promise<void> | null = null;

const loadFromDatabase = async (): Promise<void> => {
  const result = await pool.query<{ table_name: string }>(
    `SELECT c.table_name
       FROM information_schema.columns c
       JOIN information_schema.tables t
         ON t.table_schema = c.table_schema
        AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'academic_year_id'
        AND t.table_type = 'BASE TABLE'`,
  );

  tablesWithAcademicYear.clear();

  for (const row of result.rows) {
    tablesWithAcademicYear.add(row.table_name);
  }

  initialized = true;
};

/**
 * Call once during server startup, before the process accepts traffic.
 * Safe to call multiple times concurrently; only issues one query.
 */
export const initAcademicYearTableRegistry =
  (): Promise<void> => {
    if (!initPromise) {
      initPromise = loadFromDatabase().catch(
        (error) => {
          // allow a later call to retry instead of caching a rejected promise forever
          initPromise = null;
          throw error;
        },
      );
    }

    return initPromise;
  };

/**
 * Re-reads information_schema. Use after running a migration that adds or
 * removes an `academic_year_id` column on a live process (no restart), not
 * on a per-request basis.
 */
export const refreshAcademicYearTableRegistry =
  (): Promise<void> => {
    initPromise = null;
    return initAcademicYearTableRegistry();
  };

export const isAcademicYearRegistryInitialized =
  (): boolean => initialized;

/**
 * Synchronous by design: the query builder calls this on every query, so it
 * must never touch the database. Throws if the registry was never
 * initialized so misconfiguration fails loudly at first use instead of
 * silently skipping the scope.
 */
export const tableHasAcademicYearColumn = (
  table: string,
): boolean => {
  if (!initialized) {
    throw new Error(
      "Academic year table registry has not been initialized. " +
        "Call initAcademicYearTableRegistry() during server startup " +
        `before handling requests (attempted to check table "${table}").`,
    );
  }

  return tablesWithAcademicYear.has(table);
};

/** Test-only: seed the cache without touching the database. */
export const __setAcademicYearTablesForTesting = (
  tables: string[],
): void => {
  tablesWithAcademicYear.clear();
  tables.forEach((table) =>
    tablesWithAcademicYear.add(table),
  );
  initialized = true;
};

/** Test-only: reset to the uninitialized state. */
export const __resetAcademicYearRegistryForTesting =
  (): void => {
    tablesWithAcademicYear.clear();
    initialized = false;
    initPromise = null;
  };
