import test from "node:test";
import assert from "node:assert/strict";
import type { QueryResult } from "pg";

import pool from "../../config/database.js";
import { db } from "../query-builder.js";
import {
  getCurrentAcademicYearId,
  runWithAcademicYear,
} from "../../context/academic-year-context.js";
import {
  __resetAcademicYearRegistryForTesting,
  __setAcademicYearTablesForTesting,
} from "../academic-year-registry.js";

type Captured = { sql: string; params: unknown[] };

/**
 * Swaps pool.query for a spy that returns `rows` and records every call,
 * so these tests exercise the real QueryBuilder SQL-building logic without
 * needing a live PostgreSQL connection. Restores the original afterwards.
 */
const withMockedPool = async (
  rows: unknown[],
  fn: (calls: Captured[]) => Promise<void>,
): Promise<void> => {
  const calls: Captured[] = [];
  const original = pool.query.bind(pool);

  // @ts-expect-error -- narrowing pg's overloaded signature for a test spy
  pool.query = async (
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<any>> => {
    calls.push({ sql, params });
    return {
      rows,
      rowCount: rows.length,
      command: "",
      oid: 0,
      fields: [],
    } as unknown as QueryResult<any>;
  };

  try {
    await fn(calls);
  } finally {
    pool.query = original;
  }
};

test.beforeEach(() => {
  __resetAcademicYearRegistryForTesting();
});

test("insert auto-injects academic_year_id and ignores a spoofed value", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  await withMockedPool(
    [{ id: 1, name: "x", academic_year_id: 5 }],
    async (calls) => {
      await runWithAcademicYear(5, async () => {
        await db
          .table("scoped_table")
          .insert({ name: "x", academic_year_id: 999 });
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0].sql, /INSERT INTO "scoped_table"/);
      // The client-supplied 999 must never reach the database.
      assert.ok(calls[0].params.includes(5));
      assert.ok(!calls[0].params.includes(999));
    },
  );
});

test("insert leaves unscoped tables untouched", async () => {
  __setAcademicYearTablesForTesting([]); // no table has the column

  await withMockedPool(
    [{ id: 1, name: "x" }],
    async (calls) => {
      await runWithAcademicYear(5, async () => {
        await db.table("plain_table").insert({ name: "x" });
      });

      assert.equal(calls[0].params.length, 1);
      assert.equal(calls[0].params[0], "x");
    },
  );
});

test("select queries are filtered by a qualified academic_year_id", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  await withMockedPool([], async (calls) => {
    await runWithAcademicYear(7, async () => {
      await db
        .table("scoped_table")
        .where("status", "active")
        .get();
    });

    const { sql, params } = calls[0];
    assert.match(sql, /"scoped_table"\."academic_year_id" = \$1/);
    assert.match(sql, /"status" = \$2/);
    assert.deepEqual(params, [7, "active"]);
  });
});

test("withoutAcademicYearScope() bypasses filtering for one query", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  await withMockedPool([], async (calls) => {
    await runWithAcademicYear(7, async () => {
      await db
        .table("scoped_table")
        .withoutAcademicYearScope()
        .get();
    });

    assert.doesNotMatch(calls[0].sql, /academic_year_id/);
  });
});

test("throws for a scoped table with no academic year in context", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  await assert.rejects(
    () => db.table("scoped_table").get(),
    /academic-year scoped, but no academic year is available/,
  );
});

test("db.withoutAcademicYearScope() bypasses an entire callback", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  await withMockedPool([{ id: 1, name: "x" }], async (calls) => {
    await runWithAcademicYear(7, async () => {
      await db.withoutAcademicYearScope(async () => {
        await db.table("scoped_table").get();
        await db.table("scoped_table").insert({ name: "x" });
      });
    });

    assert.doesNotMatch(calls[0].sql, /academic_year_id/);
    assert.doesNotMatch(calls[1].sql, /academic_year_id/);
  });
});

test("concurrent requests never leak academic_year_id across each other", async () => {
  const observed: Array<{ label: string; year: number | null }> = [];

  const simulateRequest = (
    label: string,
    year: number,
  ) =>
    runWithAcademicYear(year, async () => {
      // Force interleaving with the other "request" via a macrotask tick.
      await new Promise((resolve) => setTimeout(resolve, 0));
      observed.push({
        label,
        year: getCurrentAcademicYearId(),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      observed.push({
        label,
        year: getCurrentAcademicYearId(),
      });
    });

  await Promise.all([
    simulateRequest("A", 1),
    simulateRequest("B", 2),
  ]);

  const aObservations = observed.filter((o) => o.label === "A");
  const bObservations = observed.filter((o) => o.label === "B");

  assert.equal(aObservations.length, 2);
  assert.equal(bObservations.length, 2);
  assert.ok(aObservations.every((o) => o.year === 1));
  assert.ok(bObservations.every((o) => o.year === 2));
});

test("db.transaction() routes every query through one client and commits", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  const clientCalls: Captured[] = [];
  const fakeClient = {
    query: async (
      sql: string,
      params: unknown[] = [],
    ) => {
      clientCalls.push({ sql, params });
      return {
        rows: [{ id: 1 }],
        rowCount: 1,
      } as unknown as QueryResult<any>;
    },
    release: () => {},
  };

  const originalConnect = pool.connect.bind(pool);
  // @ts-expect-error -- test spy for pg's Pool#connect
  pool.connect = async () => fakeClient;

  const originalQuery = pool.query.bind(pool);
  pool.query = (async () => {
    throw new Error("pool.query should not be called inside a transaction");
  }) as typeof pool.query;

  try {
    await runWithAcademicYear(9, async () => {
      await db.transaction(async () => {
        await db.table("scoped_table").insert({ name: "x" });
      });
    });

    assert.equal(clientCalls[0].sql, "BEGIN");
    assert.match(clientCalls[1].sql, /INSERT INTO "scoped_table"/);
    assert.ok(clientCalls[1].params.includes(9));
    assert.equal(clientCalls[2].sql, "COMMIT");
  } finally {
    pool.connect = originalConnect;
    pool.query = originalQuery;
  }
});

test("nested db.transaction() joins the outer transaction instead of opening a second connection", async () => {
  __setAcademicYearTablesForTesting(["scoped_table"]);

  const clientCalls: Captured[] = [];
  const fakeClient = {
    query: async (sql: string, params: unknown[] = []) => {
      clientCalls.push({ sql, params });
      return { rows: [{ id: 1 }], rowCount: 1 } as unknown as QueryResult<any>;
    },
    release: () => {},
  };

  let connectCallCount = 0;
  const originalConnect = pool.connect.bind(pool);
  // @ts-expect-error -- test spy for pg's Pool#connect
  pool.connect = async () => {
    connectCallCount += 1;
    return fakeClient;
  };

  try {
    await runWithAcademicYear(9, async () => {
      // Simulates one model calling another that also wraps itself in
      // db.transaction() — e.g. StudentModel.create() calling
      // StudentClassRelationModel.create() while already inside its own
      // db.transaction(). A rollback thrown by the outer call must undo
      // everything the inner call did, which is only possible if they
      // share one connection/one BEGIN..COMMIT block.
      await assert.rejects(
        () =>
          db.transaction(async () => {
            await db.transaction(async () => {
              await db.table("scoped_table").insert({ name: "inner" });
            });

            throw new Error("outer rollback");
          }),
        /outer rollback/,
      );
    });

    // Exactly one connection acquired, one BEGIN, one INSERT, one ROLLBACK —
    // proof the inner call joined the outer transaction rather than
    // running (and committing) independently on a second connection.
    assert.equal(connectCallCount, 1);
    assert.equal(clientCalls.length, 3);
    assert.equal(clientCalls[0].sql, "BEGIN");
    assert.match(clientCalls[1].sql, /INSERT INTO "scoped_table"/);
    assert.equal(clientCalls[2].sql, "ROLLBACK");
  } finally {
    pool.connect = originalConnect;
  }
});

test("db.transaction() rolls back when the callback throws", async () => {
  __setAcademicYearTablesForTesting([]);

  const clientCalls: string[] = [];
  const fakeClient = {
    query: async (sql: string) => {
      clientCalls.push(sql);
      return { rows: [], rowCount: 0 } as unknown as QueryResult<any>;
    },
    release: () => {},
  };

  const originalConnect = pool.connect.bind(pool);
  // @ts-expect-error -- test spy for pg's Pool#connect
  pool.connect = async () => fakeClient;

  try {
    await assert.rejects(
      () =>
        db.transaction(async () => {
          throw new Error("boom");
        }),
      /boom/,
    );

    assert.deepEqual(clientCalls, ["BEGIN", "ROLLBACK"]);
  } finally {
    pool.connect = originalConnect;
  }
});
