import type {
  QueryResult,
  QueryResultRow,
} from "pg";

import pool from "../config/database.js";

export type DatabaseValue =
  | string
  | number
  | boolean
  | Date
  | null;

export type WhereOperator =
  | "="
  | "!="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<="
  | "LIKE"
  | "ILIKE";

export type JoinOperator =
  | "="
  | "!="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<=";

export type OrderDirection =
  | "ASC"
  | "DESC";

export type JoinType =
  | "INNER"
  | "LEFT"
  | "RIGHT"
  | "FULL"
  | "CROSS";

type WhereCondition =
  | {
      type: "basic";
      boolean: "AND" | "OR";
      column: string;
      operator: WhereOperator;
      value: Exclude<
        DatabaseValue,
        null
      >;
    }
  | {
      type: "null";
      boolean: "AND" | "OR";
      column: string;
      not: boolean;
    }
  | {
      type: "in";
      boolean: "AND" | "OR";
      column: string;
      values: DatabaseValue[];
      not: boolean;
    };

type JoinCondition =
  | {
      type: Exclude<
        JoinType,
        "CROSS"
      >;
      table: string;
      alias?: string;
      firstColumn: string;
      operator: JoinOperator;
      secondColumn: string;
    }
  | {
      type: "CROSS";
      table: string;
      alias?: string;
    };

type SelectedAlias = {
  column: string;
  alias: string;
};

type OrderCondition = {
  column: string;
  direction: OrderDirection;
};

const ALLOWED_WHERE_OPERATORS =
  new Set<WhereOperator>([
    "=",
    "!=",
    "<>",
    ">",
    ">=",
    "<",
    "<=",
    "LIKE",
    "ILIKE",
  ]);

const ALLOWED_JOIN_OPERATORS =
  new Set<JoinOperator>([
    "=",
    "!=",
    "<>",
    ">",
    ">=",
    "<",
    "<=",
  ]);

const validateIdentifierPart = (
  identifier: string,
): void => {
  const pattern =
    /^[A-Za-z_][A-Za-z0-9_]*$/;

  if (!pattern.test(identifier)) {
    throw new Error(
      `Invalid SQL identifier: ${identifier}`,
    );
  }
};

const validateIdentifier = (
  identifier: string,
  allowWildcard = false,
): void => {
  if (
    allowWildcard &&
    identifier === "*"
  ) {
    return;
  }

  const parts = identifier.split(".");

  if (parts.length === 0) {
    throw new Error(
      "SQL identifier cannot be empty",
    );
  }

  parts.forEach((part, index) => {
    const isLastPart =
      index === parts.length - 1;

    if (
      allowWildcard &&
      isLastPart &&
      part === "*"
    ) {
      return;
    }

    validateIdentifierPart(part);
  });
};

const quoteIdentifier = (
  identifier: string,
  allowWildcard = false,
): string => {
  validateIdentifier(
    identifier,
    allowWildcard,
  );

  if (identifier === "*") {
    return "*";
  }

  return identifier
    .split(".")
    .map((part, index, parts) => {
      const isLastPart =
        index === parts.length - 1;

      if (
        allowWildcard &&
        isLastPart &&
        part === "*"
      ) {
        return "*";
      }

      return `"${part}"`;
    })
    .join(".");
};

const quoteTable = (
  table: string,
  alias?: string,
): string => {
  const quotedTable =
    quoteIdentifier(table);

  if (!alias) {
    return quotedTable;
  }

  return `${quotedTable} AS ${quoteIdentifier(
    alias,
  )}`;
};

const validateNonNegativeInteger = (
  value: number,
  fieldName: string,
): void => {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative integer`,
    );
  }
};

export class QueryBuilder<
  T extends QueryResultRow =
    QueryResultRow,
> {
  private readonly tableName: string;
  private readonly tableAlias?: string;

  private selectedColumns: string[] = [
    "*",
  ];

  private selectedAliases:
    SelectedAlias[] = [];

  private whereConditions:
    WhereCondition[] = [];

  private joinConditions:
    JoinCondition[] = [];

  private orderConditions:
    OrderCondition[] = [];

  private limitValue?: number;
  private offsetValue?: number;

  constructor(
    table: string,
    alias?: string,
  ) {
    validateIdentifier(table);

    if (alias) {
      validateIdentifier(alias);
    }

    this.tableName = table;
    this.tableAlias = alias;
  }

  select(...columns: string[]): this {
    if (columns.length === 0) {
      this.selectedColumns = ["*"];
      return this;
    }

    columns.forEach((column) =>
      validateIdentifier(
        column,
        true,
      ),
    );

    this.selectedColumns = columns;

    return this;
  }

  addSelect(...columns: string[]): this {
    columns.forEach((column) => {
      validateIdentifier(
        column,
        true,
      );

      if (
        this.selectedColumns.length ===
          1 &&
        this.selectedColumns[0] === "*"
      ) {
        this.selectedColumns = [];
      }

      this.selectedColumns.push(column);
    });

    return this;
  }

  selectAs(
    column: string,
    alias: string,
  ): this {
    validateIdentifier(column);
    validateIdentifier(alias);

    this.selectedAliases.push({
      column,
      alias,
    });

    return this;
  }

  where(
    column: string,
    value: DatabaseValue,
  ): this;

  where(
    column: string,
    operator: WhereOperator,
    value: DatabaseValue,
  ): this;

  where(
    column: string,
    operatorOrValue:
      | WhereOperator
      | DatabaseValue,
    possibleValue?: DatabaseValue,
  ): this {
    return this.addWhere(
      "AND",
      column,
      operatorOrValue,
      possibleValue,
    );
  }

  orWhere(
    column: string,
    value: DatabaseValue,
  ): this;

  orWhere(
    column: string,
    operator: WhereOperator,
    value: DatabaseValue,
  ): this;

  orWhere(
    column: string,
    operatorOrValue:
      | WhereOperator
      | DatabaseValue,
    possibleValue?: DatabaseValue,
  ): this {
    return this.addWhere(
      "OR",
      column,
      operatorOrValue,
      possibleValue,
    );
  }

  private addWhere(
    boolean: "AND" | "OR",
    column: string,
    operatorOrValue:
      | WhereOperator
      | DatabaseValue,
    possibleValue?: DatabaseValue,
  ): this {
    validateIdentifier(column);

    let operator: WhereOperator;
    let value: DatabaseValue;

    if (possibleValue === undefined) {
      operator = "=";
      value =
        operatorOrValue as DatabaseValue;
    } else {
      operator =
        operatorOrValue as WhereOperator;
      value = possibleValue;
    }

    if (
      !ALLOWED_WHERE_OPERATORS.has(
        operator,
      )
    ) {
      throw new Error(
        `Invalid WHERE operator: ${operator}`,
      );
    }

    if (value === null) {
      if (
        operator !== "=" &&
        operator !== "!=" &&
        operator !== "<>"
      ) {
        throw new Error(
          `Operator ${operator} cannot be used with NULL`,
        );
      }

      this.whereConditions.push({
        type: "null",
        boolean,
        column,
        not:
          operator === "!=" ||
          operator === "<>",
      });

      return this;
    }

    this.whereConditions.push({
      type: "basic",
      boolean,
      column,
      operator,
      value,
    });

    return this;
  }

  whereNull(column: string): this {
    validateIdentifier(column);

    this.whereConditions.push({
      type: "null",
      boolean: "AND",
      column,
      not: false,
    });

    return this;
  }

  orWhereNull(column: string): this {
    validateIdentifier(column);

    this.whereConditions.push({
      type: "null",
      boolean: "OR",
      column,
      not: false,
    });

    return this;
  }

  whereNotNull(column: string): this {
    validateIdentifier(column);

    this.whereConditions.push({
      type: "null",
      boolean: "AND",
      column,
      not: true,
    });

    return this;
  }

  orWhereNotNull(
    column: string,
  ): this {
    validateIdentifier(column);

    this.whereConditions.push({
      type: "null",
      boolean: "OR",
      column,
      not: true,
    });

    return this;
  }

  whereIn(
    column: string,
    values: DatabaseValue[],
  ): this {
    return this.addWhereIn(
      "AND",
      column,
      values,
      false,
    );
  }

  orWhereIn(
    column: string,
    values: DatabaseValue[],
  ): this {
    return this.addWhereIn(
      "OR",
      column,
      values,
      false,
    );
  }

  whereNotIn(
    column: string,
    values: DatabaseValue[],
  ): this {
    return this.addWhereIn(
      "AND",
      column,
      values,
      true,
    );
  }

  orWhereNotIn(
    column: string,
    values: DatabaseValue[],
  ): this {
    return this.addWhereIn(
      "OR",
      column,
      values,
      true,
    );
  }

  private addWhereIn(
    boolean: "AND" | "OR",
    column: string,
    values: DatabaseValue[],
    not: boolean,
  ): this {
    validateIdentifier(column);

    this.whereConditions.push({
      type: "in",
      boolean,
      column,
      values,
      not,
    });

    return this;
  }

  private addJoin(
    type: Exclude<
      JoinType,
      "CROSS"
    >,
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    validateIdentifier(table);
    validateIdentifier(firstColumn);
    validateIdentifier(secondColumn);

    if (alias) {
      validateIdentifier(alias);
    }

    if (
      !ALLOWED_JOIN_OPERATORS.has(
        operator,
      )
    ) {
      throw new Error(
        `Invalid JOIN operator: ${operator}`,
      );
    }

    this.joinConditions.push({
      type,
      table,
      alias,
      firstColumn,
      operator,
      secondColumn,
    });

    return this;
  }

  join(
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    return this.addJoin(
      "INNER",
      table,
      firstColumn,
      operator,
      secondColumn,
      alias,
    );
  }

  innerJoin(
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    return this.addJoin(
      "INNER",
      table,
      firstColumn,
      operator,
      secondColumn,
      alias,
    );
  }

  leftJoin(
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    return this.addJoin(
      "LEFT",
      table,
      firstColumn,
      operator,
      secondColumn,
      alias,
    );
  }

  rightJoin(
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    return this.addJoin(
      "RIGHT",
      table,
      firstColumn,
      operator,
      secondColumn,
      alias,
    );
  }

  fullJoin(
    table: string,
    firstColumn: string,
    operator: JoinOperator,
    secondColumn: string,
    alias?: string,
  ): this {
    return this.addJoin(
      "FULL",
      table,
      firstColumn,
      operator,
      secondColumn,
      alias,
    );
  }

  crossJoin(
    table: string,
    alias?: string,
  ): this {
    validateIdentifier(table);

    if (alias) {
      validateIdentifier(alias);
    }

    this.joinConditions.push({
      type: "CROSS",
      table,
      alias,
    });

    return this;
  }

  orderBy(
    column: string,
    direction:
      OrderDirection = "ASC",
  ): this {
    validateIdentifier(column);

    const normalizedDirection =
      direction.toUpperCase() as
        OrderDirection;

    if (
      normalizedDirection !== "ASC" &&
      normalizedDirection !== "DESC"
    ) {
      throw new Error(
        "Order direction must be ASC or DESC",
      );
    }

    this.orderConditions.push({
      column,
      direction:
        normalizedDirection,
    });

    return this;
  }

  latest(
    column = "created_at",
  ): this {
    return this.orderBy(
      column,
      "DESC",
    );
  }

  oldest(
    column = "created_at",
  ): this {
    return this.orderBy(
      column,
      "ASC",
    );
  }

  limit(limit: number): this {
    validateNonNegativeInteger(
      limit,
      "Limit",
    );

    this.limitValue = limit;

    return this;
  }

  offset(offset: number): this {
    validateNonNegativeInteger(
      offset,
      "Offset",
    );

    this.offsetValue = offset;

    return this;
  }

  skip(offset: number): this {
    return this.offset(offset);
  }

  take(limit: number): this {
    return this.limit(limit);
  }

  private buildSelectedColumns(): string {
    const normalColumns =
      this.selectedColumns.map(
        (column) =>
          quoteIdentifier(
            column,
            true,
          ),
      );

    const aliasColumns =
      this.selectedAliases.map(
        ({ column, alias }) =>
          `${quoteIdentifier(
            column,
          )} AS ${quoteIdentifier(
            alias,
          )}`,
      );

    const selected = [
      ...normalColumns,
      ...aliasColumns,
    ];

    return selected.length > 0
      ? selected.join(", ")
      : "*";
  }

  private buildJoinClause(): string {
    if (
      this.joinConditions.length === 0
    ) {
      return "";
    }

    return this.joinConditions
      .map((condition) => {
        const table = quoteTable(
          condition.table,
          condition.alias,
        );

        if (
          condition.type === "CROSS"
        ) {
          return ` CROSS JOIN ${table}`;
        }

        return (
          ` ${condition.type} JOIN ${table}` +
          ` ON ${quoteIdentifier(
            condition.firstColumn,
          )}` +
          ` ${condition.operator}` +
          ` ${quoteIdentifier(
            condition.secondColumn,
          )}`
        );
      })
      .join("");
  }

  private buildWhereClause(
    params: unknown[],
  ): string {
    if (
      this.whereConditions.length === 0
    ) {
      return "";
    }

    const clauses =
      this.whereConditions.map(
        (condition, index) => {
          const booleanPrefix =
            index === 0
              ? ""
              : ` ${condition.boolean} `;

          const column =
            quoteIdentifier(
              condition.column,
            );

          if (
            condition.type === "null"
          ) {
            return (
              booleanPrefix +
              `${column} IS ${
                condition.not
                  ? "NOT "
                  : ""
              }NULL`
            );
          }

          if (
            condition.type === "in"
          ) {
            if (
              condition.values.length ===
              0
            ) {
              return (
                booleanPrefix +
                (condition.not
                  ? "TRUE"
                  : "FALSE")
              );
            }

            const placeholders =
              condition.values.map(
                (value) => {
                  params.push(value);

                  return `$${params.length}`;
                },
              );

            return (
              booleanPrefix +
              `${column} ${
                condition.not
                  ? "NOT "
                  : ""
              }IN (${placeholders.join(
                ", ",
              )})`
            );
          }

          params.push(
            condition.value,
          );

          return (
            booleanPrefix +
            `${column} ${
              condition.operator
            } $${params.length}`
          );
        },
      );

    return ` WHERE ${clauses.join("")}`;
  }

  private buildOrderClause(): string {
    if (
      this.orderConditions.length === 0
    ) {
      return "";
    }

    const orders =
      this.orderConditions
        .map(
          ({ column, direction }) =>
            `${quoteIdentifier(
              column,
            )} ${direction}`,
        )
        .join(", ");

    return ` ORDER BY ${orders}`;
  }

  private buildLimitOffsetClause(
    params: unknown[],
  ): string {
    let sql = "";

    if (
      this.limitValue !== undefined
    ) {
      params.push(this.limitValue);

      sql += ` LIMIT $${params.length}`;
    }

    if (
      this.offsetValue !== undefined
    ) {
      params.push(this.offsetValue);

      sql += ` OFFSET $${params.length}`;
    }

    return sql;
  }

  private buildSelectQuery(): {
    sql: string;
    params: unknown[];
  } {
    const params: unknown[] = [];

    let sql =
      `SELECT ${this.buildSelectedColumns()}` +
      ` FROM ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}`;

    sql += this.buildJoinClause();
    sql += this.buildWhereClause(params);
    sql += this.buildOrderClause();
    sql +=
      this.buildLimitOffsetClause(
        params,
      );

    return {
      sql,
      params,
    };
  }

  toSql(): {
    sql: string;
    params: unknown[];
  } {
    return this.buildSelectQuery();
  }

  async get(): Promise<T[]> {
    const { sql, params } =
      this.buildSelectQuery();

    const result =
      await pool.query<T>(
        sql,
        params,
      );

    return result.rows;
  }

  async first(): Promise<T | null> {
    this.limit(1);

    const rows = await this.get();

    return rows[0] ?? null;
  }

  async value<K extends keyof T>(
    column: K,
  ): Promise<T[K] | null> {
    this.select(String(column));
    this.limit(1);

    const row = await this.first();

    if (!row) {
      return null;
    }

    return row[column];
  }

  async pluck<K extends keyof T>(
    column: K,
  ): Promise<T[K][]> {
    this.select(String(column));

    const rows = await this.get();

    return rows.map(
      (row) => row[column],
    );
  }

  async exists(): Promise<boolean> {
    const params: unknown[] = [];

    let sql =
      `SELECT EXISTS (` +
      `SELECT 1 FROM ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}`;

    sql += this.buildJoinClause();
    sql += this.buildWhereClause(params);
    sql += ") AS exists";

    const result =
      await pool.query<{
        exists: boolean;
      }>(
        sql,
        params,
      );

    return (
      result.rows[0]?.exists ??
      false
    );
  }

  async count(
    column = "*",
  ): Promise<number> {
    const params: unknown[] = [];

    const countColumn =
      column === "*"
        ? "*"
        : quoteIdentifier(column);

    let sql =
      `SELECT COUNT(${countColumn})::int AS count` +
      ` FROM ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}`;

    sql += this.buildJoinClause();
    sql += this.buildWhereClause(params);

    const result =
      await pool.query<{
        count: number;
      }>(
        sql,
        params,
      );

    return result.rows[0]?.count ?? 0;
  }

  async insert(
    data: Record<
      string,
      DatabaseValue | undefined
    >,
  ): Promise<T> {
    const entries =
      Object.entries(data).filter(
        (
          entry,
        ): entry is [
          string,
          DatabaseValue,
        ] => entry[1] !== undefined,
      );

    if (entries.length === 0) {
      throw new Error(
        "Insert data cannot be empty",
      );
    }

    const columns =
      entries.map(([column]) =>
        quoteIdentifier(column),
      );

    const values =
      entries.map(
        ([, value]) => value,
      );

    const placeholders =
      values.map(
        (_, index) =>
          `$${index + 1}`,
      );

    const sql =
      `INSERT INTO ${quoteIdentifier(
        this.tableName,
      )}` +
      ` (${columns.join(", ")})` +
      ` VALUES (${placeholders.join(
        ", ",
      )})` +
      " RETURNING *";

    const result =
      await pool.query<T>(
        sql,
        values,
      );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "Insert failed to return a row",
      );
    }

    return row;
  }

  async insertMany(
    rows: Array<
      Record<
        string,
        DatabaseValue | undefined
      >
    >,
  ): Promise<T[]> {
    if (rows.length === 0) {
      return [];
    }

    const columns =
      Object.keys(rows[0]).filter(
        (column) =>
          rows[0][column] !==
          undefined,
      );

    if (columns.length === 0) {
      throw new Error(
        "Insert data cannot be empty",
      );
    }

    columns.forEach(
      (column) => validateIdentifier(column),
    );

    const params: unknown[] = [];

    const valueGroups = rows.map(
      (row) => {
        const placeholders =
          columns.map((column) => {
            params.push(
              row[column] ?? null,
            );

            return `$${params.length}`;
          });

        return `(${placeholders.join(
          ", ",
        )})`;
      },
    );

    const sql =
      `INSERT INTO ${quoteIdentifier(
        this.tableName,
      )}` +
      ` (${columns
        .map((column) =>
          quoteIdentifier(column),
        )
        .join(", ")})` +
      ` VALUES ${valueGroups.join(
        ", ",
      )}` +
      " RETURNING *";

    const result =
      await pool.query<T>(
        sql,
        params,
      );

    return result.rows;
  }

  async update(
    data: Record<
      string,
      DatabaseValue | undefined
    >,
  ): Promise<T[]> {
    if (
      this.joinConditions.length > 0
    ) {
      throw new Error(
        "Joined UPDATE queries are not supported",
      );
    }

    const entries =
      Object.entries(data).filter(
        (
          entry,
        ): entry is [
          string,
          DatabaseValue,
        ] => entry[1] !== undefined,
      );

    if (entries.length === 0) {
      throw new Error(
        "Update data cannot be empty",
      );
    }

    const params: unknown[] = [];

    const setClauses =
      entries.map(
        ([column, value]) => {
          params.push(value);

          return `${quoteIdentifier(
            column,
          )} = $${params.length}`;
        },
      );

    let sql =
      `UPDATE ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}` +
      ` SET ${setClauses.join(
        ", ",
      )}`;

    sql += this.buildWhereClause(params);
    sql += " RETURNING *";

    const result =
      await pool.query<T>(
        sql,
        params,
      );

    return result.rows;
  }

  async delete(): Promise<number> {
    if (
      this.joinConditions.length > 0
    ) {
      throw new Error(
        "Joined DELETE queries are not supported",
      );
    }

    const params: unknown[] = [];

    let sql =
      `DELETE FROM ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}`;

    sql += this.buildWhereClause(params);

    const result =
      await pool.query(
        sql,
        params,
      );

    return result.rowCount ?? 0;
  }

  async deleteReturning(): Promise<T[]> {
    if (
      this.joinConditions.length > 0
    ) {
      throw new Error(
        "Joined DELETE queries are not supported",
      );
    }

    const params: unknown[] = [];

    let sql =
      `DELETE FROM ${quoteTable(
        this.tableName,
        this.tableAlias,
      )}`;

    sql += this.buildWhereClause(params);
    sql += " RETURNING *";

    const result =
      await pool.query<T>(
        sql,
        params,
      );

    return result.rows;
  }

  async softDelete(): Promise<T[]> {
    return this.update({
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }

  async restore(): Promise<T[]> {
    return this.update({
      deleted_at: null,
      updated_at: new Date(),
    });
  }
}

export const query = async <
  T extends QueryResultRow =
    QueryResultRow,
>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  return pool.query<T>(
    text,
    params,
  );
};

export const queryOne = async <
  T extends QueryResultRow =
    QueryResultRow,
>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> => {
  const result =
    await pool.query<T>(
      text,
      params,
    );

  return result.rows[0] ?? null;
};

export const queryValue = async <
  TValue,
>(
  text: string,
  params: unknown[] = [],
): Promise<TValue | null> => {
  const result =
    await pool.query<QueryResultRow>(
      text,
      params,
    );

  const firstRow =
    result.rows[0];

  if (!firstRow) {
    return null;
  }

  const firstValue =
    Object.values(firstRow)[0];

  return firstValue === undefined
    ? null
    : (firstValue as TValue);
};

export const db = {
  table<
    T extends QueryResultRow =
      QueryResultRow,
  >(
    tableName: string,
    alias?: string,
  ): QueryBuilder<T> {
    return new QueryBuilder<T>(
      tableName,
      alias,
    );
  },

  async raw<
    T extends QueryResultRow =
      QueryResultRow,
  >(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result =
      await pool.query<T>(
        text,
        params,
      );

    return result.rows;
  },

  query,
  queryOne,
  queryValue,
};

export default db;