# PostgreSQL Laravel-Style Query Builder

Complete documentation for the custom TypeScript PostgreSQL query builder defined in `query-builder.ts`.

This utility provides a chainable API inspired by Laravel's `DB::table()` query builder while using the Node.js `pg` package underneath.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Requirements](#requirements)
4. [Recommended File Structure](#recommended-file-structure)
5. [Database Pool Setup](#database-pool-setup)
6. [Importing the Query Builder](#importing-the-query-builder)
7. [Defining Row Types](#defining-row-types)
8. [Basic Usage](#basic-usage)
9. [How Query Execution Works](#how-query-execution-works)
10. [Selecting Data](#selecting-data)
11. [Where Conditions](#where-conditions)
12. [Null Conditions](#null-conditions)
13. [IN Conditions](#in-conditions)
14. [Joins](#joins)
15. [Ordering](#ordering)
16. [Limit and Offset](#limit-and-offset)
17. [Retrieving Results](#retrieving-results)
18. [Aggregate and Utility Methods](#aggregate-and-utility-methods)
19. [Insert Operations](#insert-operations)
20. [Update Operations](#update-operations)
21. [Delete Operations](#delete-operations)
22. [Soft Delete and Restore](#soft-delete-and-restore)
23. [Raw SQL Helpers](#raw-sql-helpers)
24. [Inspecting Generated SQL](#inspecting-generated-sql)
25. [Complete Model Examples](#complete-model-examples)
26. [Security](#security)
27. [Important Limitations](#important-limitations)
28. [Common Errors](#common-errors)
29. [Method Reference](#method-reference)
30. [Laravel Comparison](#laravel-comparison)

---

## Overview

The query builder allows you to write PostgreSQL queries using a readable, chainable TypeScript API.

Instead of writing:

```ts
const result = await pool.query(
  `
    SELECT *
    FROM academic_session
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `,
);

return result.rows;
```

You can write:

```ts
const sessions = await db
  .table<AcademicSession>("academic_session")
  .whereNull("deleted_at")
  .orderBy("id", "DESC")
  .get();
```

The builder:

- Quotes table and column identifiers.
- Uses PostgreSQL parameters such as `$1`, `$2`, and `$3` for values.
- Supports TypeScript row types.
- Returns plain arrays or row objects instead of the full `pg` result for builder methods.
- Supports raw SQL when the builder does not cover a query.

---

## Features

The final query builder supports:

- `db.table()`
- Table aliases
- `select()`
- `addSelect()`
- `selectAs()`
- `where()`
- `orWhere()`
- `whereNull()`
- `orWhereNull()`
- `whereNotNull()`
- `orWhereNotNull()`
- `whereIn()`
- `orWhereIn()`
- `whereNotIn()`
- `orWhereNotIn()`
- `join()`
- `innerJoin()`
- `leftJoin()`
- `rightJoin()`
- `fullJoin()`
- `crossJoin()`
- `orderBy()`
- `latest()`
- `oldest()`
- `limit()`
- `offset()`
- `take()`
- `skip()`
- `get()`
- `first()`
- `value()`
- `pluck()`
- `exists()`
- `count()`
- `insert()`
- `insertMany()`
- `update()`
- `delete()`
- `deleteReturning()`
- `softDelete()`
- `restore()`
- `toSql()`
- `db.raw()`
- `query()`
- `queryOne()`
- `queryValue()`

---

## Requirements

Install PostgreSQL support for Node.js:

```bash
npm install pg
npm install -D @types/pg
```

The utility expects:

- Node.js
- TypeScript
- PostgreSQL
- The `pg` package
- An exported PostgreSQL pool
- ESM-style imports in the current project

Because the project compiles TypeScript to JavaScript, local TypeScript imports should keep the `.js` extension:

```ts
import db from "../db/query-builder.js";
```

---

## Recommended File Structure

```text
server/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── db/
│   │   └── query-builder.ts
│   ├── models/
│   │   ├── academic-session.model.ts
│   │   └── teachers.model.ts
│   └── controllers/
│       ├── academic-session.controller.ts
│       └── teacher.controller.ts
├── package.json
└── tsconfig.json
```

---

## Database Pool Setup

The query builder imports the pool from:

```ts
import pool from "../config/database.js";
```

A compatible `database.ts` file can look like this:

```ts
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error,
  );
});

export default pool;
```

Example environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=school_management
```

---

## Importing the Query Builder

### Default import

```ts
import db from "../db/query-builder.js";
```

### Named import

```ts
import {
  db,
  query,
  queryOne,
  queryValue,
} from "../db/query-builder.js";
```

### Import exported types

```ts
import db, {
  DatabaseValue,
  JoinOperator,
  JoinType,
  OrderDirection,
  WhereOperator,
} from "../db/query-builder.js";
```

Use `import type` when only importing types:

```ts
import type {
  DatabaseValue,
  WhereOperator,
} from "../db/query-builder.js";
```

---

## Defining Row Types

The generic type passed to `db.table<T>()` must satisfy `QueryResultRow`.

Most ordinary interfaces work directly:

```ts
export interface AcademicSession {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  current_session: boolean;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
```

Usage:

```ts
const sessions = await db
  .table<AcademicSession>("academic_session")
  .get();
```

TypeScript now knows that `sessions` is:

```ts
AcademicSession[]
```

For joined queries, define the exact shape returned by the query:

```ts
interface TeacherWithDepartment {
  id: number;
  first_name: string;
  employee_code: string;
  department_name: string | null;
}
```

---

## Basic Usage

### Get every row

```ts
const sessions = await db
  .table<AcademicSession>("academic_session")
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "academic_session";
```

### Get all non-deleted rows

```ts
const sessions = await db
  .table<AcademicSession>("academic_session")
  .whereNull("deleted_at")
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "academic_session"
WHERE "deleted_at" IS NULL;
```

### Add ordering

```ts
const sessions = await db
  .table<AcademicSession>("academic_session")
  .whereNull("deleted_at")
  .orderBy("id", "DESC")
  .get();
```

---

## How Query Execution Works

Methods such as these only build a query:

```ts
.table()
.select()
.where()
.join()
.orderBy()
.limit()
```

They do not execute PostgreSQL immediately.

This does **not** return rows:

```ts
const builder = db
  .table("academic_session")
  .whereNull("deleted_at");
```

It returns a `QueryBuilder` instance.

Call an execution method at the end:

```ts
const rows = await builder.get();
```

Execution methods include:

```ts
.get()
.first()
.value()
.pluck()
.exists()
.count()
.insert()
.insertMany()
.update()
.delete()
.deleteReturning()
.softDelete()
.restore()
```

---

## Selecting Data

### `select(...columns)`

Select specific columns:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .select(
    "id",
    "first_name",
    "employee_code",
    "email",
  )
  .whereNull("deleted_at")
  .get();
```

Equivalent SQL:

```sql
SELECT
  "id",
  "first_name",
  "employee_code",
  "email"
FROM "teachers"
WHERE "deleted_at" IS NULL;
```

Calling `select()` replaces the existing selected-column list.

```ts
const builder = db
  .table("teachers")
  .select("id", "first_name");
```

### Select every column

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .select("*")
  .get();
```

Because `*` is already the default, this is also valid:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .get();
```

### Select qualified wildcards

```ts
const teachers = await db
  .table("teachers", "t")
  .select("t.*")
  .get();
```

### `addSelect(...columns)`

Add more selected columns without replacing the current selection:

```ts
const builder = db
  .table("teachers")
  .select("id", "first_name")
  .addSelect("email", "phone");
```

When `addSelect()` is called while the selection is still the default `*`, it removes `*` before adding the requested columns.

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .addSelect(
    "id",
    "first_name",
    "email",
  )
  .get();
```

### `selectAs(column, alias)`

Use a column alias:

```ts
const sessions = await db
  .table("academic_session", "a")
  .select("a.id", "a.name")
  .selectAs(
    "a.current_session",
    "is_current",
  )
  .get();
```

Equivalent SQL:

```sql
SELECT
  "a"."id",
  "a"."name",
  "a"."current_session" AS "is_current"
FROM "academic_session" AS "a";
```

`selectAs()` accepts only identifiers. It does not accept raw SQL expressions such as `COUNT(*)` or `CONCAT(...)`.

Use `db.raw()` for unsupported select expressions.

---

## Where Conditions

### `where(column, value)`

```ts
const activeTeachers = await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "teachers"
WHERE "status" = $1;
```

Parameters:

```ts
["active"]
```

### `where(column, operator, value)`

```ts
const experiencedTeachers = await db
  .table<Teacher>("teachers")
  .where(
    "experience_years",
    ">=",
    5,
  )
  .get();
```

Supported where operators:

```text
=
!=
<>
>
>=
<
<=
LIKE
ILIKE
```

### Multiple `where()` calls

Multiple `where()` calls are joined with `AND`:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .where(
    "experience_years",
    ">=",
    5,
  )
  .whereNull("deleted_at")
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "teachers"
WHERE "status" = $1
  AND "experience_years" >= $2
  AND "deleted_at" IS NULL;
```

### `orWhere()`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .orWhere("status", "inactive")
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "teachers"
WHERE "status" = $1
   OR "status" = $2;
```

### `LIKE`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where(
    "first_name",
    "LIKE",
    "Sou%",
  )
  .get();
```

`LIKE` is case-sensitive in PostgreSQL.

### `ILIKE`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where(
    "first_name",
    "ILIKE",
    "%sourav%",
  )
  .get();
```

`ILIKE` is case-insensitive in PostgreSQL.

### Qualified columns

Use qualified column names for joins:

```ts
const teachers = await db
  .table("teachers", "t")
  .where("t.status", "active")
  .whereNull("t.deleted_at")
  .get();
```

---

## Null Conditions

Do not use equality against a SQL `NULL` value manually. PostgreSQL requires `IS NULL` or `IS NOT NULL`.

The builder automatically converts a null where value:

```ts
const sessions = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .where("deleted_at", "=", null)
  .get();
```

Generated condition:

```sql
"deleted_at" IS NULL
```

The recommended, clearer form is:

```ts
.whereNull("deleted_at")
```

### `whereNull(column)`

```ts
const sessions = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .whereNull("deleted_at")
  .get();
```

### `orWhereNull(column)`

```ts
const users = await db
  .table<User>("users")
  .where("status", "active")
  .orWhereNull("status")
  .get();
```

### `whereNotNull(column)`

```ts
const deletedTeachers = await db
  .table<Teacher>("teachers")
  .whereNotNull("deleted_at")
  .get();
```

### `orWhereNotNull(column)`

```ts
const users = await db
  .table<User>("users")
  .where("status", "inactive")
  .orWhereNotNull("deleted_at")
  .get();
```

### Null with `!=` or `<>`

Both of these become `IS NOT NULL`:

```ts
.where("deleted_at", "!=", null)
```

```ts
.where("deleted_at", "<>", null)
```

The builder rejects operators such as `>`, `<`, and `LIKE` when the value is `null`.

---

## IN Conditions

### `whereIn(column, values)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .whereIn("status", [
    "active",
    "inactive",
  ])
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "teachers"
WHERE "status" IN ($1, $2);
```

### `orWhereIn(column, values)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where("gender", "female")
  .orWhereIn("status", [
    "active",
    "inactive",
  ])
  .get();
```

### `whereNotIn(column, values)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .whereNotIn("status", [
    "inactive",
    "resigned",
  ])
  .get();
```

### `orWhereNotIn(column, values)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .orWhereNotIn("gender", [
    "male",
  ])
  .get();
```

### Empty arrays

An empty `whereIn()` condition becomes `FALSE`, so the query returns no rows:

```ts
.whereIn("id", [])
```

An empty `whereNotIn()` condition becomes `TRUE`:

```ts
.whereNotIn("id", [])
```

---

## Joins

The builder supports:

```ts
.join()
.innerJoin()
.leftJoin()
.rightJoin()
.fullJoin()
.crossJoin()
```

`join()` behaves the same as `innerJoin()`.

Supported join operators:

```text
=
!=
<>
>
>=
<
<=
```

### Inner join

```ts
const teachers = await db
  .table("teachers")
  .join(
    "departments",
    "teachers.department_id",
    "=",
    "departments.id",
  )
  .get();
```

Equivalent SQL:

```sql
SELECT *
FROM "teachers"
INNER JOIN "departments"
  ON "teachers"."department_id" = "departments"."id";
```

### `innerJoin()`

```ts
const teachers = await db
  .table("teachers")
  .innerJoin(
    "departments",
    "teachers.department_id",
    "=",
    "departments.id",
  )
  .get();
```

### Left join

```ts
const teachers = await db
  .table("teachers")
  .leftJoin(
    "departments",
    "teachers.department_id",
    "=",
    "departments.id",
  )
  .get();
```

A left join returns every matching teacher and uses `NULL` for missing department data.

### Right join

```ts
const rows = await db
  .table("teachers")
  .rightJoin(
    "departments",
    "teachers.department_id",
    "=",
    "departments.id",
  )
  .get();
```

### Full join

```ts
const rows = await db
  .table("teachers")
  .fullJoin(
    "departments",
    "teachers.department_id",
    "=",
    "departments.id",
  )
  .get();
```

### Cross join

```ts
const combinations = await db
  .table("classes", "c")
  .crossJoin("sections", "s")
  .select(
    "c.id",
    "c.name",
    "s.id",
    "s.name",
  )
  .get();
```

A cross join has no `ON` condition and returns every possible combination.

### Join with table aliases

The final argument of join methods is the joined-table alias:

```ts
interface TeacherWithDepartment {
  id: number;
  first_name: string;
  employee_code: string;
  department_name: string | null;
}

const teachers = await db
  .table<TeacherWithDepartment>(
    "teachers",
    "t",
  )
  .select(
    "t.id",
    "t.first_name",
    "t.employee_code",
  )
  .selectAs(
    "d.name",
    "department_name",
  )
  .leftJoin(
    "departments",
    "t.department_id",
    "=",
    "d.id",
    "d",
  )
  .whereNull("t.deleted_at")
  .orderBy("t.id", "DESC")
  .get();
```

Equivalent SQL:

```sql
SELECT
  "t"."id",
  "t"."first_name",
  "t"."employee_code",
  "d"."name" AS "department_name"
FROM "teachers" AS "t"
LEFT JOIN "departments" AS "d"
  ON "t"."department_id" = "d"."id"
WHERE "t"."deleted_at" IS NULL
ORDER BY "t"."id" DESC;
```

### Multiple joins

```ts
const students = await db
  .table("students", "s")
  .select(
    "s.id",
    "s.first_name",
  )
  .selectAs(
    "c.name",
    "class_name",
  )
  .selectAs(
    "sec.name",
    "section_name",
  )
  .leftJoin(
    "student_class_relations",
    "s.id",
    "=",
    "scr.student_id",
    "scr",
  )
  .leftJoin(
    "classes",
    "scr.class_id",
    "=",
    "c.id",
    "c",
  )
  .leftJoin(
    "section",
    "scr.section_id",
    "=",
    "sec.id",
    "sec",
  )
  .whereNull("s.deleted_at")
  .get();
```

### Joined update and delete

The current builder intentionally rejects joined updates and joined deletes:

```text
Joined UPDATE queries are not supported
Joined DELETE queries are not supported
```

Use `db.raw()` for PostgreSQL `UPDATE ... FROM` or `DELETE ... USING` queries.

---

## Ordering

### `orderBy(column, direction)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .orderBy("first_name", "ASC")
  .get();
```

Direction can be:

```text
ASC
DESC
```

### Multiple ordering rules

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .orderBy("status", "ASC")
  .orderBy("first_name", "ASC")
  .get();
```

### `latest(column?)`

Defaults to `created_at DESC`:

```ts
const latestTeachers = await db
  .table<Teacher>("teachers")
  .latest()
  .get();
```

Custom date column:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .latest("joining_date")
  .get();
```

### `oldest(column?)`

Defaults to `created_at ASC`:

```ts
const oldestTeachers = await db
  .table<Teacher>("teachers")
  .oldest()
  .get();
```

---

## Limit and Offset

### `limit(number)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .limit(10)
  .get();
```

### `take(number)`

`take()` is an alias of `limit()`:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .take(10)
  .get();
```

### `offset(number)`

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .limit(10)
  .offset(20)
  .get();
```

### `skip(number)`

`skip()` is an alias of `offset()`:

```ts
const teachers = await db
  .table<Teacher>("teachers")
  .take(10)
  .skip(20)
  .get();
```

### Simple pagination

```ts
const page = 3;
const perPage = 10;
const offset = (page - 1) * perPage;

const teachers = await db
  .table<Teacher>("teachers")
  .whereNull("deleted_at")
  .orderBy("id", "DESC")
  .limit(perPage)
  .offset(offset)
  .get();
```

Get the total separately:

```ts
const total = await db
  .table<Teacher>("teachers")
  .whereNull("deleted_at")
  .count();
```

Return a pagination response:

```ts
return {
  data: teachers,
  pagination: {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  },
};
```

Limit and offset must be non-negative integers.

---

## Retrieving Results

### `get()`

Returns all matching rows:

```ts
const sessions = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .whereNull("deleted_at")
  .get();
```

Return type:

```ts
Promise<AcademicSession[]>
```

### `first()`

Returns the first matching row or `null`:

```ts
const session = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .where("id", 1)
  .whereNull("deleted_at")
  .first();
```

Return type:

```ts
Promise<AcademicSession | null>
```

`first()` internally applies `LIMIT 1`.

### `value(column)`

Returns one column from the first matching row:

```ts
const sessionName = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .where("id", 1)
  .value("name");
```

Return type:

```ts
Promise<string | null>
```

### `pluck(column)`

Returns one column from every matching row:

```ts
const teacherEmails = await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .whereNull("deleted_at")
  .pluck("email");
```

Possible return type:

```ts
Promise<Array<string | null | undefined>>
```

The exact type depends on the property definition in your interface.

### Builder mutation warning

`first()`, `value()`, and `pluck()` change builder state:

- `first()` adds `LIMIT 1`.
- `value()` replaces selected columns and adds `LIMIT 1`.
- `pluck()` replaces selected columns.

Create a new builder for unrelated queries instead of reusing a previously executed builder.

Recommended:

```ts
const firstTeacher = await db
  .table<Teacher>("teachers")
  .first();

const allTeachers = await db
  .table<Teacher>("teachers")
  .get();
```

Avoid:

```ts
const builder = db.table<Teacher>(
  "teachers",
);

const firstTeacher = await builder.first();
const allTeachers = await builder.get();
```

The second query still contains `LIMIT 1`.

---

## Aggregate and Utility Methods

### `exists()`

Check whether at least one row matches:

```ts
const exists = await db
  .table<Teacher>("teachers")
  .where(
    "email",
    "teacher@school.edu",
  )
  .whereNull("deleted_at")
  .exists();
```

Return type:

```ts
Promise<boolean>
```

This uses PostgreSQL `SELECT EXISTS (...)`.

### Duplicate check example

```ts
static async alreadyExists(
  field: "email" | "employee_code",
  value: string,
): Promise<boolean> {
  return db
    .table<Teacher>("teachers")
    .where(field, value)
    .whereNull("deleted_at")
    .exists();
}
```

Using a strict union for `field` is safer than accepting any request-controlled string.

### `count(column?)`

Count every matching row:

```ts
const totalTeachers = await db
  .table<Teacher>("teachers")
  .whereNull("deleted_at")
  .count();
```

Equivalent SQL:

```sql
SELECT COUNT(*)::int AS count
FROM "teachers"
WHERE "deleted_at" IS NULL;
```

Count non-null values in a column:

```ts
const totalEmails = await db
  .table<Teacher>("teachers")
  .count("email");
```

Be careful when counting joined queries. Joins may create multiple rows for one parent record.

For a distinct count, use raw SQL because the builder does not currently implement `COUNT(DISTINCT ...)`:

```ts
const total = await queryValue<number>(
  `
    SELECT COUNT(DISTINCT teacher_id)::int
    FROM teacher_subjects
  `,
);
```

---

## Insert Operations

### `insert(data)`

Insert one row and return it:

```ts
const session = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .insert({
    name: "2026-2027",
    start_date: new Date(
      "2026-04-01",
    ),
    end_date: new Date(
      "2027-03-31",
    ),
    status: "active",
    current_session: true,
    description:
      "Current academic session",
  });
```

The query uses `RETURNING *`, so the inserted row is returned.

### Undefined and null values

`undefined` properties are omitted from the insert:

```ts
await db
  .table("teachers")
  .insert({
    first_name: "Sourav",
    email: undefined,
  });
```

Generated insert includes only `first_name`.

`null` is explicitly inserted as SQL `NULL`:

```ts
await db
  .table("teachers")
  .insert({
    first_name: "Sourav",
    email: null,
  });
```

### Database defaults

Because `undefined` fields are omitted, PostgreSQL defaults can run normally.

Example:

```sql
ALTER TABLE teachers
ALTER COLUMN status
SET DEFAULT 'active';
```

Then:

```ts
await db
  .table<Teacher>("teachers")
  .insert({
    first_name: "Sourav",
  });
```

PostgreSQL supplies the default status.

### `insertMany(rows)`

Insert multiple rows:

```ts
const sessions = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .insertMany([
    {
      name: "2026-2027",
      start_date: new Date(
        "2026-04-01",
      ),
      end_date: new Date(
        "2027-03-31",
      ),
      status: "active",
      current_session: true,
    },
    {
      name: "2027-2028",
      start_date: new Date(
        "2027-04-01",
      ),
      end_date: new Date(
        "2028-03-31",
      ),
      status: "inactive",
      current_session: false,
    },
  ]);
```

`insertMany()` returns all inserted rows because it uses `RETURNING *`.

### Important `insertMany()` rule

The column list is created from the **first row only**.

All rows should use the same keys:

```ts
[
  {
    name: "One",
    status: "active",
  },
  {
    name: "Two",
    status: "inactive",
  },
]
```

Avoid inconsistent shapes:

```ts
[
  {
    name: "One",
  },
  {
    name: "Two",
    status: "active",
  },
]
```

In this case, the later `status` property is ignored because it was not present in the first row's column list.

A missing value for a selected first-row column becomes `NULL` in later rows.

---

## Update Operations

### `update(data)`

Update matching rows and return every updated row:

```ts
const updatedSessions = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .where("id", 1)
  .whereNull("deleted_at")
  .update({
    status: "inactive",
    current_session: false,
    updated_at: new Date(),
  });
```

Return type:

```ts
Promise<AcademicSession[]>
```

The method returns an array because a condition may match multiple rows.

### Update one row

```ts
const rows = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .where("id", 1)
  .update({
    status: "inactive",
    updated_at: new Date(),
  });

const updatedSession =
  rows[0] ?? null;
```

The current builder does not include a separate `updateOne()` method.

### Undefined and null values

Undefined fields are ignored:

```ts
await db
  .table("teachers")
  .where("id", 10)
  .update({
    first_name: "Updated name",
    email: undefined,
  });
```

`email` is not updated.

Null values are written as SQL `NULL`:

```ts
await db
  .table("teachers")
  .where("id", 10)
  .update({
    alternate_phone: null,
  });
```

### Critical safety warning

An update without a `where()` condition updates every row:

```ts
await db
  .table("teachers")
  .update({
    status: "inactive",
  });
```

Equivalent SQL:

```sql
UPDATE "teachers"
SET "status" = $1
RETURNING *;
```

Always add conditions unless intentionally updating the full table.

### Joined updates

Joined update queries are not supported by this builder.

Use raw PostgreSQL SQL:

```ts
const rows = await db.raw<Teacher>(
  `
    UPDATE teachers AS t
    SET status = $1
    FROM departments AS d
    WHERE t.department_id = d.id
      AND d.name = $2
    RETURNING t.*
  `,
  ["inactive", "Temporary"],
);
```

---

## Delete Operations

### `delete()`

Permanently delete matching rows and return the number of deleted rows:

```ts
const deletedCount = await db
  .table("teachers")
  .where("id", 10)
  .delete();
```

Return type:

```ts
Promise<number>
```

### `deleteReturning()`

Permanently delete matching rows and return the deleted records:

```ts
const deletedTeachers = await db
  .table<Teacher>("teachers")
  .where("status", "resigned")
  .deleteReturning();
```

Return type:

```ts
Promise<Teacher[]>
```

### Critical safety warning

A delete without a where condition deletes every row:

```ts
await db
  .table("teachers")
  .delete();
```

Equivalent SQL:

```sql
DELETE FROM "teachers";
```

Always add a condition unless intentionally clearing a table.

### Joined deletes

Joined delete queries are not supported.

Use raw PostgreSQL SQL with `USING` when necessary:

```ts
const deleted = await db.raw<Teacher>(
  `
    DELETE FROM teachers AS t
    USING departments AS d
    WHERE t.department_id = d.id
      AND d.name = $1
    RETURNING t.*
  `,
  ["Temporary"],
);
```

---

## Soft Delete and Restore

### Required columns

The provided methods expect both columns to exist:

```sql
deleted_at
updated_at
```

Recommended PostgreSQL definitions:

```sql
deleted_at TIMESTAMP NULL,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### `softDelete()`

```ts
const deletedTeachers = await db
  .table<Teacher>("teachers")
  .where("id", 10)
  .whereNull("deleted_at")
  .softDelete();
```

The method updates:

```ts
{
  deleted_at: new Date(),
  updated_at: new Date(),
}
```

It returns the updated rows.

### `restore()`

```ts
const restoredTeachers = await db
  .table<Teacher>("teachers")
  .where("id", 10)
  .whereNotNull("deleted_at")
  .restore();
```

The method updates:

```ts
{
  deleted_at: null,
  updated_at: new Date(),
}
```

### Soft-delete model example

```ts
static async delete(
  id: number,
): Promise<Teacher | null> {
  const rows = await db
    .table<Teacher>("teachers")
    .where("id", id)
    .whereNull("deleted_at")
    .softDelete();

  return rows[0] ?? null;
}
```

### Restore model example

```ts
static async restore(
  id: number,
): Promise<Teacher | null> {
  const rows = await db
    .table<Teacher>("teachers")
    .where("id", id)
    .whereNotNull("deleted_at")
    .restore();

  return rows[0] ?? null;
}
```

---

## Raw SQL Helpers

Use raw SQL when you need functionality that the builder does not support.

### `db.raw<T>()`

Returns only the rows:

```ts
const teachers = await db.raw<Teacher>(
  `
    SELECT *
    FROM teachers
    WHERE status = $1
      AND deleted_at IS NULL
  `,
  ["active"],
);
```

Return type:

```ts
Promise<Teacher[]>
```

### `query<T>()`

Returns the full `pg` `QueryResult`:

```ts
const result = await query<Teacher>(
  `
    SELECT *
    FROM teachers
    WHERE status = $1
  `,
  ["active"],
);

console.log(result.rows);
console.log(result.rowCount);
console.log(result.fields);
```

Return type:

```ts
Promise<QueryResult<Teacher>>
```

### `queryOne<T>()`

Returns the first row or `null`:

```ts
const teacher = await queryOne<Teacher>(
  `
    SELECT *
    FROM teachers
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
  `,
  [10],
);
```

### `queryValue<T>()`

Returns the first value from the first row:

```ts
const total = await queryValue<number>(
  `
    SELECT COUNT(*)::int
    FROM teachers
    WHERE deleted_at IS NULL
  `,
);
```

Another example:

```ts
const sessionName =
  await queryValue<string>(
    `
      SELECT name
      FROM academic_session
      WHERE current_session = TRUE
        AND deleted_at IS NULL
      LIMIT 1
    `,
  );
```

### Parameterized raw SQL

Always use PostgreSQL parameters:

```ts
await db.raw<Teacher>(
  `
    SELECT *
    FROM teachers
    WHERE email = $1
  `,
  [email],
);
```

Do not concatenate user input:

```ts
// Unsafe: do not do this.
await db.raw(
  `SELECT * FROM teachers WHERE email = '${email}'`,
);
```

---

## Inspecting Generated SQL

### `toSql()`

Build the query without running it:

```ts
const builder = db
  .table("teachers", "t")
  .select(
    "t.id",
    "t.first_name",
  )
  .leftJoin(
    "departments",
    "t.department_id",
    "=",
    "d.id",
    "d",
  )
  .where("t.status", "active")
  .whereNull("t.deleted_at")
  .orderBy("t.id", "DESC")
  .limit(10);

const { sql, params } =
  builder.toSql();

console.log(sql);
console.log(params);
```

Possible output:

```text
SELECT "t"."id", "t"."first_name"
FROM "teachers" AS "t"
LEFT JOIN "departments" AS "d"
ON "t"."department_id" = "d"."id"
WHERE "t"."status" = $1
AND "t"."deleted_at" IS NULL
ORDER BY "t"."id" DESC
LIMIT $2
```

Parameters:

```ts
["active", 10]
```

`toSql()` is useful for debugging query construction.

Do not log sensitive parameter values in production.

---

## Complete Model Examples

### Academic session model

```ts
import db from "../db/query-builder.js";

export interface AcademicSession {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  current_session: boolean;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateAcademicSession {
  name: string;
  start_date: Date;
  end_date: Date;
  status?: string;
  current_session?: boolean;
  description?: string | null;
}

export interface UpdateAcademicSession {
  name?: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  current_session?: boolean;
  description?: string | null;
}

const tableName =
  "academic_session";

export class AcademicSessionModel {
  static async findAll(): Promise<
    AcademicSession[]
  > {
    return db
      .table<AcademicSession>(
        tableName,
      )
      .whereNull("deleted_at")
      .orderBy("id", "DESC")
      .get();
  }

  static async findById(
    id: number,
  ): Promise<AcademicSession | null> {
    return db
      .table<AcademicSession>(
        tableName,
      )
      .where("id", id)
      .whereNull("deleted_at")
      .first();
  }

  static async findCurrent(): Promise<
    AcademicSession | null
  > {
    return db
      .table<AcademicSession>(
        tableName,
      )
      .where(
        "current_session",
        true,
      )
      .whereNull("deleted_at")
      .first();
  }

  static async create(
    data: CreateAcademicSession,
  ): Promise<AcademicSession> {
    return db
      .table<AcademicSession>(
        tableName,
      )
      .insert({
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status:
          data.status ?? "inactive",
        current_session:
          data.current_session ?? false,
        description:
          data.description ?? null,
      });
  }

  static async update(
    id: number,
    data: UpdateAcademicSession,
  ): Promise<AcademicSession | null> {
    const rows = await db
      .table<AcademicSession>(
        tableName,
      )
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        current_session:
          data.current_session,
        description:
          data.description,
        updated_at: new Date(),
      });

    return rows[0] ?? null;
  }

  static async delete(
    id: number,
  ): Promise<AcademicSession | null> {
    const rows = await db
      .table<AcademicSession>(
        tableName,
      )
      .where("id", id)
      .whereNull("deleted_at")
      .softDelete();

    return rows[0] ?? null;
  }

  static async restore(
    id: number,
  ): Promise<AcademicSession | null> {
    const rows = await db
      .table<AcademicSession>(
        tableName,
      )
      .where("id", id)
      .whereNotNull("deleted_at")
      .restore();

    return rows[0] ?? null;
  }

  static async hardDelete(
    id: number,
  ): Promise<boolean> {
    const deletedCount = await db
      .table(tableName)
      .where("id", id)
      .delete();

    return deletedCount > 0;
  }
}
```

### Teacher model examples

```ts
import db from "../db/query-builder.js";

const tableName = "teachers";

export class TeacherModel {
  static async findAll(): Promise<
    Teacher[]
  > {
    return db
      .table<Teacher>(tableName)
      .whereNull("deleted_at")
      .orderBy("id", "DESC")
      .get();
  }

  static async findById(
    id: number,
  ): Promise<Teacher | null> {
    return db
      .table<Teacher>(tableName)
      .where("id", id)
      .whereNull("deleted_at")
      .first();
  }

  static async alreadyExists(
    field:
      | "employee_code"
      | "email",
    value: string,
  ): Promise<boolean> {
    return db
      .table<Teacher>(tableName)
      .where(field, value)
      .whereNull("deleted_at")
      .exists();
  }

  static async create(
    data: TeacherPayload,
  ): Promise<Teacher> {
    return db
      .table<Teacher>(tableName)
      .insert({
        first_name:
          data.first_name,
        last_name:
          data.last_name,
        employee_code:
          data.employee_code,
        email: data.email,
        phone: data.phone,
        alternate_phone:
          data.alternate_phone,
        gender: data.gender,
        date_of_birth:
          data.date_of_birth,
        blood_group:
          data.blood_group,
        marital_status:
          data.marital_status,
        current_address:
          data.current_address,
        permanent_address:
          data.permanent_address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        qualification:
          data.qualification,
        specialization:
          data.specialization,
        experience_years:
          data.experience_years,
        joining_date:
          data.joining_date,
        employment_type:
          data.employment_type,
        status:
          data.status ?? "active",
        basic_salary:
          data.basic_salary,
        bank_name:
          data.bank_name,
        bank_account_number:
          data.bank_account_number,
        ifsc_code:
          data.ifsc_code,
        pan_number:
          data.pan_number,
        emergency_contact_name:
          data.emergency_contact_name,
        emergency_contact_phone:
          data.emergency_contact_phone,
        emergency_contact_relation:
          data.emergency_contact_relation,
        profile_image:
          data.profile_image,
        remarks: data.remarks,
      });
  }

  static async update(
    id: number,
    data: TeacherUpdatePayload,
  ): Promise<Teacher | null> {
    const rows = await db
      .table<Teacher>(tableName)
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...data,
        updated_at: new Date(),
      });

    return rows[0] ?? null;
  }

  static async delete(
    id: number,
  ): Promise<Teacher | null> {
    const rows = await db
      .table<Teacher>(tableName)
      .where("id", id)
      .whereNull("deleted_at")
      .softDelete();

    return rows[0] ?? null;
  }
}
```

### Joined teacher query

```ts
interface TeacherWithDepartment {
  id: number;
  employee_code: string;
  first_name: string;
  last_name?: string | null;
  department_name: string | null;
}

static async findAllWithDepartment(): Promise<
  TeacherWithDepartment[]
> {
  return db
    .table<TeacherWithDepartment>(
      "teachers",
      "t",
    )
    .select(
      "t.id",
      "t.employee_code",
      "t.first_name",
      "t.last_name",
    )
    .selectAs(
      "d.name",
      "department_name",
    )
    .leftJoin(
      "departments",
      "t.department_id",
      "=",
      "d.id",
      "d",
    )
    .whereNull("t.deleted_at")
    .orderBy("t.id", "DESC")
    .get();
}
```

---

## Security

### Parameterized values

The builder stores values separately from generated SQL:

```ts
.where("email", email)
```

Generated SQL:

```sql
WHERE "email" = $1
```

Parameters:

```ts
[email]
```

This protects query values against SQL injection.

### Identifier validation

Table names, aliases, and column names are validated with this pattern:

```text
^[A-Za-z_][A-Za-z0-9_]*$
```

Qualified identifiers are supported:

```text
teachers.id
t.id
public.users
```

The builder quotes identifiers:

```text
teachers.id
```

becomes:

```sql
"teachers"."id"
```

### Do not use request input as identifiers

Values can safely come from a request because they are parameterized:

```ts
.where("email", req.body.email)
```

Identifiers should come from trusted application code:

```ts
.where("email", value)
```

Avoid passing arbitrary request fields as columns:

```ts
// Avoid this unless field is validated against a whitelist.
.where(req.body.field, req.body.value)
```

Use a whitelist:

```ts
const allowedFields = [
  "email",
  "employee_code",
] as const;

type AllowedField =
  (typeof allowedFields)[number];

const isAllowedField = (
  field: string,
): field is AllowedField =>
  allowedFields.includes(
    field as AllowedField,
  );
```

### Database constraints remain required

Application checks do not replace database constraints.

For example, retain a unique constraint:

```sql
ALTER TABLE teachers
ADD CONSTRAINT teachers_employee_code_unique
UNIQUE (employee_code);
```

The database is the final protection against concurrent duplicate inserts.

---

## Important Limitations

The current query builder is intentionally lightweight. It is not a complete ORM.

### No nested condition groups

The builder does not currently support Laravel-style grouped callbacks:

```php
->where(function ($query) {
    $query->where(...)
          ->orWhere(...);
})
```

This query:

```ts
.where("status", "active")
.orWhere("status", "inactive")
.whereNull("deleted_at")
```

produces logical SQL without automatic parentheses:

```sql
status = $1
OR status = $2
AND deleted_at IS NULL
```

Because SQL evaluates `AND` before `OR`, this may not mean:

```sql
(status = $1 OR status = $2)
AND deleted_at IS NULL
```

For complex grouped conditions, use `db.raw()` until grouping support is added.

### No transactions API

The builder does not currently include `db.transaction()`.

Use the pool directly or add a transaction helper for multi-query atomic operations.

Example using the existing pool:

```ts
const client =
  await pool.connect();

try {
  await client.query("BEGIN");

  await client.query(
    `
      UPDATE academic_session
      SET current_session = FALSE
      WHERE current_session = TRUE
    `,
  );

  await client.query(
    `
      UPDATE academic_session
      SET current_session = TRUE
      WHERE id = $1
    `,
    [sessionId],
  );

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

### No `groupBy()` or `having()`

Use raw SQL for aggregation groups:

```ts
const rows = await db.raw<{
  status: string;
  total: number;
}>(
  `
    SELECT
      status,
      COUNT(*)::int AS total
    FROM teachers
    WHERE deleted_at IS NULL
    GROUP BY status
    HAVING COUNT(*) > $1
  `,
  [0],
);
```

### No `distinct()`

Use raw SQL:

```ts
const statuses = await db.raw<{
  status: string;
}>(
  `
    SELECT DISTINCT status
    FROM teachers
  `,
);
```

### No raw expressions in builder identifiers

These are rejected by identifier validation:

```ts
.select("COUNT(*)")
.select("CONCAT(first_name, last_name)")
.orderBy("LOWER(first_name)")
```

Use `db.raw()` for SQL expressions.

### No relationship or Eloquent model system

The builder does not implement:

- Model classes with automatic table resolution
- `hasMany`
- `belongsTo`
- Eager loading
- Attribute casts
- Accessors and mutators
- Model events
- Global scopes
- Migration generation
- Schema builder

### No joined update or delete

The builder rejects them. Use raw PostgreSQL SQL.

### No automatic soft-delete scope

The builder does not automatically add:

```sql
deleted_at IS NULL
```

You must explicitly use:

```ts
.whereNull("deleted_at")
```

### Reusing a builder can retain state

The builder is mutable. Calling methods changes the same instance.

Create a new builder for each independent query.

### `insertMany()` relies on the first row's columns

All inserted objects should use the same shape.

### Update and delete do not require a WHERE condition

This is flexible but dangerous. A missing condition affects every row.

---

## Common Errors

### Query builder logged instead of rows

Incorrect:

```ts
const result = await db
  .table("academic_session")
  .whereNull("deleted_at");

console.log(result);
```

This logs a `QueryBuilder` object.

Correct:

```ts
const result = await db
  .table<AcademicSession>(
    "academic_session",
  )
  .whereNull("deleted_at")
  .get();
```

### Invalid SQL identifier

Example error:

```text
Invalid SQL identifier: COUNT(*)
```

Cause:

```ts
.select("COUNT(*)")
```

Solution:

```ts
const total = await queryValue<number>(
  "SELECT COUNT(*)::int FROM teachers",
);
```

### Operator cannot be used with NULL

Incorrect:

```ts
.where("deleted_at", ">", null)
```

Correct:

```ts
.whereNull("deleted_at")
```

or:

```ts
.whereNotNull("deleted_at")
```

### Invalid order direction

Incorrect:

```ts
.orderBy("id", "descending" as never)
```

Correct:

```ts
.orderBy("id", "DESC")
```

### Joined update error

```text
Joined UPDATE queries are not supported
```

Use `db.raw()` with PostgreSQL `UPDATE ... FROM`.

### Joined delete error

```text
Joined DELETE queries are not supported
```

Use `db.raw()` with PostgreSQL `DELETE ... USING`.

### Insert data cannot be empty

This happens when all insert properties are `undefined` or no data was supplied.

```ts
await db
  .table("teachers")
  .insert({
    email: undefined,
  });
```

Supply at least one actual value.

### Update data cannot be empty

This happens when every update property is `undefined`.

```ts
await db
  .table("teachers")
  .where("id", 1)
  .update({
    email: undefined,
  });
```

### Date input error

`DatabaseValue` supports `Date`, but raw form strings may need validation before inserting.

```ts
const joiningDate =
  new Date(req.body.joining_date);

if (
  Number.isNaN(
    joiningDate.getTime(),
  )
) {
  throw new Error(
    "Invalid joining date",
  );
}
```

### Type does not satisfy `QueryResultRow`

Make sure the generic represents a row object, not an array or primitive.

Correct:

```ts
interface Teacher {
  id: number;
  first_name: string;
}

const teachers = await db
  .table<Teacher>("teachers")
  .get();
```

Incorrect:

```ts
const teachers = await db
  .table<string>("teachers")
  .get();
```

---

## Method Reference

### Database entry methods

| Method | Description | Returns |
|---|---|---|
| `db.table<T>(table, alias?)` | Starts a chainable table query | `QueryBuilder<T>` |
| `db.raw<T>(sql, params?)` | Executes raw SQL and returns rows | `Promise<T[]>` |
| `db.query<T>(sql, params?)` | Executes raw SQL and returns `QueryResult` | `Promise<QueryResult<T>>` |
| `db.queryOne<T>(sql, params?)` | Returns the first row | `Promise<T \| null>` |
| `db.queryValue<T>(sql, params?)` | Returns first value from first row | `Promise<T \| null>` |

### Selection methods

| Method | Description | Returns |
|---|---|---|
| `select(...columns)` | Replaces selected columns | `this` |
| `addSelect(...columns)` | Adds selected columns | `this` |
| `selectAs(column, alias)` | Adds an aliased column | `this` |

### Condition methods

| Method | Description | Returns |
|---|---|---|
| `where(column, value)` | Adds an `AND column = value` condition | `this` |
| `where(column, operator, value)` | Adds an `AND` comparison | `this` |
| `orWhere(column, value)` | Adds an `OR column = value` condition | `this` |
| `orWhere(column, operator, value)` | Adds an `OR` comparison | `this` |
| `whereNull(column)` | Adds `AND column IS NULL` | `this` |
| `orWhereNull(column)` | Adds `OR column IS NULL` | `this` |
| `whereNotNull(column)` | Adds `AND column IS NOT NULL` | `this` |
| `orWhereNotNull(column)` | Adds `OR column IS NOT NULL` | `this` |
| `whereIn(column, values)` | Adds `AND column IN (...)` | `this` |
| `orWhereIn(column, values)` | Adds `OR column IN (...)` | `this` |
| `whereNotIn(column, values)` | Adds `AND column NOT IN (...)` | `this` |
| `orWhereNotIn(column, values)` | Adds `OR column NOT IN (...)` | `this` |

### Join methods

| Method | Description | Returns |
|---|---|---|
| `join(...)` | Adds an inner join | `this` |
| `innerJoin(...)` | Adds an inner join | `this` |
| `leftJoin(...)` | Adds a left join | `this` |
| `rightJoin(...)` | Adds a right join | `this` |
| `fullJoin(...)` | Adds a full join | `this` |
| `crossJoin(table, alias?)` | Adds a cross join | `this` |

Standard join signature:

```ts
join(
  table,
  firstColumn,
  operator,
  secondColumn,
  alias?,
)
```

### Ordering and pagination methods

| Method | Description | Returns |
|---|---|---|
| `orderBy(column, direction?)` | Adds an order rule | `this` |
| `latest(column?)` | Orders descending; defaults to `created_at` | `this` |
| `oldest(column?)` | Orders ascending; defaults to `created_at` | `this` |
| `limit(number)` | Sets a row limit | `this` |
| `take(number)` | Alias of `limit()` | `this` |
| `offset(number)` | Sets row offset | `this` |
| `skip(number)` | Alias of `offset()` | `this` |

### Read execution methods

| Method | Description | Returns |
|---|---|---|
| `get()` | Returns all rows | `Promise<T[]>` |
| `first()` | Returns first row | `Promise<T \| null>` |
| `value(column)` | Returns one value from first row | `Promise<T[K] \| null>` |
| `pluck(column)` | Returns one value from each row | `Promise<T[K][]>` |
| `exists()` | Checks whether rows exist | `Promise<boolean>` |
| `count(column?)` | Counts rows or non-null column values | `Promise<number>` |
| `toSql()` | Returns generated SQL and parameters without execution | `{ sql, params }` |

### Write methods

| Method | Description | Returns |
|---|---|---|
| `insert(data)` | Inserts one row and returns it | `Promise<T>` |
| `insertMany(rows)` | Inserts multiple rows and returns them | `Promise<T[]>` |
| `update(data)` | Updates matching rows and returns them | `Promise<T[]>` |
| `delete()` | Deletes matching rows and returns count | `Promise<number>` |
| `deleteReturning()` | Deletes and returns matching rows | `Promise<T[]>` |
| `softDelete()` | Sets `deleted_at` and `updated_at` | `Promise<T[]>` |
| `restore()` | Clears `deleted_at` and updates `updated_at` | `Promise<T[]>` |

---

## Laravel Comparison

### Get all rows

Laravel:

```php
DB::table('teachers')->get();
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .get();
```

### Where condition

Laravel:

```php
DB::table('teachers')
    ->where('status', 'active')
    ->get();
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .where("status", "active")
  .get();
```

### First row

Laravel:

```php
DB::table('teachers')
    ->where('id', 1)
    ->first();
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .where("id", 1)
  .first();
```

### Join

Laravel:

```php
DB::table('teachers as t')
    ->leftJoin(
        'departments as d',
        't.department_id',
        '=',
        'd.id'
    )
    ->get();
```

TypeScript:

```ts
await db
  .table("teachers", "t")
  .leftJoin(
    "departments",
    "t.department_id",
    "=",
    "d.id",
    "d",
  )
  .get();
```

### Insert

Laravel:

```php
DB::table('teachers')->insert([
    'first_name' => 'Sourav',
]);
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .insert({
    first_name: "Sourav",
  });
```

The TypeScript builder returns the inserted row because it uses `RETURNING *`.

### Update

Laravel:

```php
DB::table('teachers')
    ->where('id', 1)
    ->update([
        'status' => 'inactive'
    ]);
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .where("id", 1)
  .update({
    status: "inactive",
  });
```

The TypeScript builder returns updated rows rather than only an affected-row count.

### Delete

Laravel:

```php
DB::table('teachers')
    ->where('id', 1)
    ->delete();
```

TypeScript:

```ts
await db
  .table("teachers")
  .where("id", 1)
  .delete();
```

### Exists

Laravel:

```php
DB::table('teachers')
    ->where('email', $email)
    ->exists();
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .where("email", email)
  .exists();
```

### Count

Laravel:

```php
DB::table('teachers')->count();
```

TypeScript:

```ts
await db
  .table<Teacher>("teachers")
  .count();
```

---

## Recommended Usage Rules

1. Create a new builder for each independent query.
2. Always use `whereNull("deleted_at")` for active soft-delete records.
3. Always add a `where()` condition before `update()` and `delete()` unless a full-table operation is intentional.
4. Use table aliases in multi-table queries.
5. Use `selectAs()` to prevent conflicting joined-column names.
6. Use `db.raw()` for grouped conditions, aggregate expressions, transactions, `GROUP BY`, `HAVING`, `DISTINCT`, joined writes, and other unsupported SQL.
7. Keep unique, foreign-key, check, and not-null constraints in PostgreSQL.
8. Validate request-controlled column names against a whitelist.
9. Avoid logging sensitive query parameters in production.
10. Run the project type check after changes:

```bash
npx tsc --noEmit
```

---

## Final Quick Reference

```ts
import db from "../db/query-builder.js";

const rows = await db
  .table<RowType>("table_name", "t")
  .select(
    "t.id",
    "t.name",
  )
  .selectAs(
    "other.name",
    "other_name",
  )
  .leftJoin(
    "other_table",
    "t.other_id",
    "=",
    "other.id",
    "other",
  )
  .where("t.status", "active")
  .whereNull("t.deleted_at")
  .whereIn("t.type", [
    "one",
    "two",
  ])
  .orderBy("t.id", "DESC")
  .limit(10)
  .offset(0)
  .get();
```

This utility offers a practical Laravel-inspired query API while retaining direct access to PostgreSQL and raw parameterized SQL when necessary.
