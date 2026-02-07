import fs from "fs";
import path from "path";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

type ParsedWord = {
  id: string;
};

function hasRequiredRepoFiles(root: string): boolean {
  if (!fs.existsSync(path.join(root, "package.json"))) {
    return false;
  }
  for (let i = 1; i <= 10; i += 1) {
    if (!fs.existsSync(path.join(root, `words_english_${i}.ts`))) {
      return false;
    }
  }
  return true;
}

function findRepoRoot(): string {
  const checked = new Set<string>();
  const candidates = [
    process.cwd(),
    path.resolve(__dirname, ".."),
    path.resolve(__dirname, "..", ".."),
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    checked.add(resolved);
    if (hasRequiredRepoFiles(resolved)) {
      return resolved;
    }
  }

  let current = path.resolve(process.cwd());
  let previous: string | null = null;
  while (current !== previous) {
    checked.add(current);
    if (hasRequiredRepoFiles(current)) {
      return current;
    }
    previous = current;
    current = path.dirname(current);
  }

  throw new Error(
    `Could not find repository root containing package.json and words_english_1..10.ts. Checked: ${Array.from(checked).join(", ")}`,
  );
}

const ROOT = findRepoRoot();
const WORD_FILES = Array.from({ length: 10 }, (_, index) =>
  path.join(ROOT, `words_english_${index + 1}.ts`),
);
const EXPECTED_TOTAL_ROWS = 4520;
const DEFAULT_BATCH_SIZE = 500;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireEnv(primary: string, fallbacks: string[] = []): string {
  const candidates = [primary, ...fallbacks];
  for (const name of candidates) {
    const value = process.env[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  throw new Error(
    `${primary} is required (accepted env names: ${candidates.join(", ")})`,
  );
}

function maskSecret(secret: string): string {
  const prefixLength = Math.min(12, secret.length);
  return `${secret.slice(0, prefixLength)}***`;
}

function parseBatchSize(): number {
  const raw = process.env.SEED_DB_BATCH_SIZE;
  if (!raw) return DEFAULT_BATCH_SIZE;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_BATCH_SIZE;
  }
  return parsed;
}

function stripAssertions(expression: ts.Expression): ts.Expression {
  while (
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

function resolveIdentifier(
  name: string,
  sourceFile: ts.SourceFile,
): ts.ArrayLiteralExpression | null {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name) {
        continue;
      }
      if (!declaration.initializer) continue;
      const initializer = stripAssertions(declaration.initializer);
      if (ts.isArrayLiteralExpression(initializer)) return initializer;
    }
  }
  return null;
}

function findArrayLiteral(sourceFile: ts.SourceFile): ts.ArrayLiteralExpression {
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      const expression = stripAssertions(statement.expression);
      if (ts.isArrayLiteralExpression(expression)) {
        return expression;
      }
      if (ts.isIdentifier(expression)) {
        const resolved = resolveIdentifier(expression.text, sourceFile);
        if (resolved) return resolved;
      }
    }
  }
  throw new Error(`Could not find exported words array in ${sourceFile.fileName}`);
}

function getPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteralLike(name)) return name.text;
  return null;
}

function parseWordFile(filePath: string): ParsedWord[] {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const wordsArray = findArrayLiteral(sourceFile);
  const words: ParsedWord[] = [];

  for (const item of wordsArray.elements) {
    if (!ts.isObjectLiteralExpression(item)) {
      throw new Error(`Unexpected non-object item in ${filePath}`);
    }

    let id: string | null = null;

    for (const property of item.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const propertyName = getPropertyName(property.name);
      if (propertyName !== "id") continue;
      if (!ts.isStringLiteralLike(property.initializer)) {
        throw new Error(`Expected string literal id in ${filePath}`);
      }
      id = property.initializer.text;
    }

    if (!id) {
      throw new Error(`Missing id in ${filePath}`);
    }
    words.push({ id });
  }

  return words;
}

function parseWordsCatalogRows() {
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  const rows: Array<{ id: string; group_no: number; ordinal: number }> = [];

  WORD_FILES.forEach((filePath, index) => {
    const groupNo = index + 1;
    const words = parseWordFile(filePath);
    words.forEach((word, ordinal) => {
      if (!UUID_REGEX.test(word.id)) {
        throw new Error(`Invalid UUID id '${word.id}' in ${filePath}`);
      }
      if (seenIds.has(word.id)) {
        duplicateIds.add(word.id);
      }
      seenIds.add(word.id);
      rows.push({ id: word.id, group_no: groupNo, ordinal });
    });
  });

  if (duplicateIds.size > 0) {
    throw new Error(
      `Duplicate UUID ids detected (${duplicateIds.size}): ${Array.from(duplicateIds).slice(0, 5).join(", ")}`,
    );
  }

  if (rows.length !== EXPECTED_TOTAL_ROWS) {
    throw new Error(
      `Unexpected words_catalog row count. expected=${EXPECTED_TOTAL_ROWS} got=${rows.length}`,
    );
  }

  return rows;
}

async function run() {
  const supabaseUrl = requireEnv("SUPABASE_URL", ["API_URL"]);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", [
    "SERVICE_ROLE_KEY",
  ]);
  const batchSize = parseBatchSize();
  const rows = parseWordsCatalogRows();

  console.log(`Using repository root: ${ROOT}`);
  console.log(`Using SUPABASE_URL: ${supabaseUrl}`);
  console.log(
    `Using SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(serviceRoleKey)}`,
  );

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`Preparing to upsert ${rows.length} rows into public.words_catalog`);

  let processed = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("words_catalog")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      throw new Error(
        `Upsert failed at rows ${i}-${i + batch.length}: ${error.message}`,
      );
    }

    processed += batch.length;
    console.log(`Upserted ${processed}/${rows.length}`);
  }

  console.log("words_catalog seed upsert completed successfully");
}

run().catch((error) => {
  console.error("Failed to seed words_catalog", error);
  process.exit(1);
});
