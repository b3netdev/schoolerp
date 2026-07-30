import { AsyncLocalStorage } from "node:async_hooks";
import type { PoolClient } from "pg";

/**
 * Everything that must travel with a single request (or a manually-created
 * scope) so the query builder can auto-scope queries by academic year and,
 * inside a transaction, route every query through the same client.
 */
export interface AcademicYearStore {
  academicYearId: number | null;
  bypass: boolean;
  client?: PoolClient;
}

// One instance for the whole process. AsyncLocalStorage guarantees each
// concurrent call stack (e.g. each Express request) sees its own store, so
// two requests running at the same time for different academic years never
// observe each other's value, no matter how their async work interleaves.
const storage = new AsyncLocalStorage<AcademicYearStore>();

/**
 * Entry point for request middleware: establishes the store for the
 * lifetime of `fn` (normally the rest of the Express middleware chain).
 */
export const runWithAcademicYear = <R>(
  academicYearId: number | null,
  fn: () => R,
): R => {
  // Preserve an already-active transaction client, if any, instead of
  // silently dropping it — e.g. a script that starts a transaction and
  // then establishes an academic year scope inside it.
  const existingStore = storage.getStore();

  return storage.run(
    { ...existingStore, academicYearId, bypass: false },
    fn,
  );
};

export const getAcademicYearStore = ():
  | AcademicYearStore
  | undefined => storage.getStore();

/**
 * The trusted academic year for the current call stack, or `null` when
 * there is none (no request context, or scope has been bypassed).
 */
export const getCurrentAcademicYearId = ():
  | number
  | null => {
  const store = storage.getStore();

  if (!store || store.bypass) {
    return null;
  }

  return store.academicYearId;
};

export const isScopeBypassed = (): boolean => {
  return storage.getStore()?.bypass ?? false;
};

/**
 * Explicit escape hatch for authorized cross-year reports/admin tooling.
 * Every `db.table()` query builder call made inside `fn` (directly, or via
 * any model/service it calls) skips academic-year filtering and stops
 * auto-injecting academic_year_id on insert.
 */
export const withoutAcademicYearScope = async <R>(
  fn: () => Promise<R>,
): Promise<R> => {
  const store = storage.getStore();

  const nextStore: AcademicYearStore = store
    ? { ...store, bypass: true }
    : { academicYearId: null, bypass: true };

  return storage.run(nextStore, fn);
};

export const getActiveDbClient = ():
  | PoolClient
  | undefined => storage.getStore()?.client;

/**
 * Used by db.transaction(): re-enters the current store with a bound
 * PoolClient so every query issued inside the callback runs on the same
 * transactional connection, while preserving the academic year / bypass
 * state already in effect.
 */
export const runInTransactionContext = <R>(
  client: PoolClient,
  fn: () => Promise<R>,
): Promise<R> => {
  const store = storage.getStore();

  const nextStore: AcademicYearStore = store
    ? { ...store, client }
    : { academicYearId: null, bypass: false, client };

  return storage.run(nextStore, fn);
};
