type Row = Record<string, unknown>;

type MockDb = {
  words_catalog: Row[];
  user_learning_state: Row[];
  public_associations: Row[];
  private_associations: Row[];
  public_association_likes: Row[];
  public_association_saves: Row[];
};

type Filter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "in"; column: string; values: unknown[] };

type OrderBy = {
  column: string;
  ascending: boolean;
};

type QueryResult = Promise<{ data: any; error: any }>;
type MockOperation = "select" | "insert" | "update" | "delete" | "upsert";

const db: MockDb = {
  words_catalog: [],
  user_learning_state: [],
  public_associations: [],
  private_associations: [],
  public_association_likes: [],
  public_association_saves: [],
};

let idCounter = 0;
const forcedErrors: Array<{
  table: keyof MockDb;
  operation: MockOperation;
  error: any;
}> = [];

function nowIso() {
  return new Date().toISOString();
}

function nextId() {
  return `mock-${++idCounter}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function asRows(values: Row | Row[]): Row[] {
  return Array.isArray(values) ? values : [values];
}

function parseColumns(columns: string | undefined): string[] | null {
  if (!columns || columns.trim() === "*" || columns.includes("*")) {
    return null;
  }
  return columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function projectRow(row: Row, columns: string[] | null) {
  if (!columns) return clone(row);
  const projected: Row = {};
  columns.forEach((column) => {
    projected[column] = row[column];
  });
  return projected;
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((filter) => {
      if (filter.kind === "eq") {
        return row[filter.column] === filter.value;
      }
      return filter.values.includes(row[filter.column]);
    }),
  );
}

function applyOrder(rows: Row[], orders: OrderBy[]): Row[] {
  if (!orders.length) return rows;
  const sorted = [...rows];
  sorted.sort((a, b) => {
    for (const order of orders) {
      const left = a[order.column];
      const right = b[order.column];
      if (left === right) continue;

      let compared = 0;
      if (typeof left === "number" && typeof right === "number") {
        compared = left - right;
      } else {
        compared = String(left).localeCompare(String(right));
      }
      if (compared !== 0) {
        return order.ascending ? compared : -compared;
      }
    }
    return 0;
  });
  return sorted;
}

function getTable(table: keyof MockDb): Row[] {
  return db[table];
}

function setTable(table: keyof MockDb, nextRows: Row[]) {
  db[table] = nextRows;
}

function bumpPublicAssociationLikeCount(associationId: string, delta: number) {
  const rows = getTable("public_associations").map((row) => {
    if (row.id !== associationId) return row;
    const currentLikeCount =
      typeof row.like_count === "number" ? row.like_count : 0;
    const nextLikeCount = Math.max(0, currentLikeCount + delta);
    return {
      ...row,
      like_count: nextLikeCount,
      updated_at: nowIso(),
    };
  });
  setTable("public_associations", rows);
}

function duplicateError(message: string) {
  return {
    code: "23505",
    message,
    details: "",
    hint: "",
  };
}

function popForcedError(table: keyof MockDb, operation: MockOperation) {
  const index = forcedErrors.findIndex(
    (entry) => entry.table === table && entry.operation === operation,
  );
  if (index < 0) return null;
  const [entry] = forcedErrors.splice(index, 1);
  return entry.error;
}

class QueryBuilder {
  private table: keyof MockDb;
  private mode: "select" | "update" | "delete" = "select";
  private selectedColumns: string[] | null = null;
  private updateValues: Row = {};
  private filters: Filter[] = [];
  private orders: OrderBy[] = [];
  private limitCount: number | null = null;

  constructor(table: keyof MockDb) {
    this.table = table;
  }

  select(columns?: string) {
    this.mode = "select";
    this.selectedColumns = parseColumns(columns);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ kind: "in", column, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  update(values: Row) {
    this.mode = "update";
    this.updateValues = values;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  async maybeSingle() {
    const result = await this.executeSelect();
    if (result.error) return result;
    const rows = result.data as Row[];
    return {
      data: rows.length ? rows[0] : null,
      error: null,
    };
  }

  async insert(values: Row | Row[]): QueryResult {
    const forcedError = popForcedError(this.table, "insert");
    if (forcedError) {
      return { data: null, error: forcedError };
    }

    const rows = asRows(values).map(clone);
    if (this.table === "public_association_likes") {
      const existing = getTable(this.table);
      for (const row of rows) {
        const duplicate = existing.some(
          (item) =>
            item.user_id === row.user_id &&
            item.association_id === row.association_id,
        );
        if (duplicate) {
          return { data: null, error: duplicateError("duplicate like") };
        }
      }

      const withTimestamps: Row[] = rows.map((row) => ({
        ...row,
        created_at: row.created_at ?? nowIso(),
      }));
      setTable(this.table, [...existing, ...withTimestamps]);
      withTimestamps.forEach((row) => {
        const associationId = row["association_id"];
        bumpPublicAssociationLikeCount(String(associationId), 1);
      });
      return { data: null, error: null };
    }

    if (this.table === "public_association_saves") {
      const existing = getTable(this.table);
      for (const row of rows) {
        const duplicate = existing.some(
          (item) =>
            item.user_id === row.user_id &&
            item.association_id === row.association_id,
        );
        if (duplicate) {
          return { data: null, error: duplicateError("duplicate save") };
        }
      }

      const withTimestamps = rows.map((row) => ({
        ...row,
        created_at: row.created_at ?? nowIso(),
      }));
      setTable(this.table, [...existing, ...withTimestamps]);
      return { data: null, error: null };
    }

    if (this.table === "public_associations") {
      const existing = getTable(this.table);
      for (const row of rows) {
        const duplicate = existing.some(
          (item) =>
            item.word_id === row.word_id &&
            item.created_by_user_id === row.created_by_user_id &&
            item.text_he === row.text_he,
        );
        if (duplicate) {
          return {
            data: null,
            error: duplicateError("duplicate public association"),
          };
        }
      }

      const normalized = rows.map((row) => ({
        ...row,
        id: row.id ?? nextId(),
        like_count:
          typeof row.like_count === "number" ? row.like_count : 0,
        created_at: row.created_at ?? nowIso(),
        updated_at: row.updated_at ?? nowIso(),
      }));
      setTable(this.table, [...existing, ...normalized]);
      return { data: null, error: null };
    }

    if (this.table === "private_associations") {
      const existing = getTable(this.table);
      const normalized = rows.map((row) => ({
        ...row,
        id: row.id ?? nextId(),
        created_at: row.created_at ?? nowIso(),
        updated_at: row.updated_at ?? nowIso(),
      }));
      setTable(this.table, [...existing, ...normalized]);
      return { data: null, error: null };
    }

    const existing = getTable(this.table);
    setTable(this.table, [...existing, ...rows]);
    return { data: null, error: null };
  }

  async upsert(values: Row | Row[], options?: { onConflict?: string }) {
    const forcedError = popForcedError(this.table, "upsert");
    if (forcedError) {
      return { data: null, error: forcedError };
    }

    const rows = asRows(values).map(clone);
    const conflictColumns = options?.onConflict
      ? options.onConflict.split(",").map((column) => column.trim())
      : [];

    const existing = [...getTable(this.table)];
    rows.forEach((row) => {
      const index = existing.findIndex((item) =>
        conflictColumns.every((column) => item[column] === row[column]),
      );
      if (index >= 0) {
        existing[index] = {
          ...existing[index],
          ...row,
        };
      } else {
        existing.push(row);
      }
    });
    setTable(this.table, existing);
    return { data: null, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    if (this.mode === "update") {
      return this.executeUpdate();
    }
    if (this.mode === "delete") {
      return this.executeDelete();
    }
    return this.executeSelect();
  }

  private async executeSelect() {
    const forcedError = popForcedError(this.table, "select");
    if (forcedError) {
      return { data: null, error: forcedError };
    }

    const filtered = applyFilters(getTable(this.table), this.filters);
    const ordered = applyOrder(filtered, this.orders);
    const limited =
      this.limitCount == null ? ordered : ordered.slice(0, this.limitCount);
    return {
      data: limited.map((row) => projectRow(row, this.selectedColumns)),
      error: null,
    };
  }

  private async executeUpdate() {
    const forcedError = popForcedError(this.table, "update");
    if (forcedError) {
      return { data: null, error: forcedError };
    }

    const rows = getTable(this.table);
    const nextRows = rows.map((row) => {
      const matches = this.filters.every((filter) => {
        if (filter.kind === "eq") return row[filter.column] === filter.value;
        return filter.values.includes(row[filter.column]);
      });
      if (!matches) return row;
      const nextRow = { ...row, ...this.updateValues };
      if ("updated_at" in row) {
        nextRow.updated_at = nowIso();
      }
      return nextRow;
    });
    setTable(this.table, nextRows);
    return { data: null, error: null };
  }

  private async executeDelete() {
    const forcedError = popForcedError(this.table, "delete");
    if (forcedError) {
      return { data: null, error: forcedError };
    }

    const rows = getTable(this.table);
    const toDelete = applyFilters(rows, this.filters);
    const toDeleteSet = new Set(toDelete);
    const nextRows = rows.filter((row) => !toDeleteSet.has(row));
    setTable(this.table, nextRows);

    if (this.table === "public_association_likes") {
      toDelete.forEach((row) =>
        bumpPublicAssociationLikeCount(String(row.association_id), -1),
      );
    }

    return { data: null, error: null };
  }
}

export const mockSupabase = {
  from(table: keyof MockDb) {
    return new QueryBuilder(table);
  },
};

export function resetMockSupabase() {
  db.words_catalog = [];
  db.user_learning_state = [];
  db.public_associations = [];
  db.private_associations = [];
  db.public_association_likes = [];
  db.public_association_saves = [];
  idCounter = 0;
  forcedErrors.length = 0;
}

export function readMockTable<T extends Row>(table: keyof MockDb): T[] {
  return clone(db[table]) as T[];
}

export function writeMockTable<T extends Row>(table: keyof MockDb, rows: T[]) {
  db[table] = clone(rows) as Row[];
}

export function queueMockError(
  table: keyof MockDb,
  operation: MockOperation,
  error: any,
) {
  forcedErrors.push({ table, operation, error });
}
