import fs from "fs";
import path from "path";
import ts from "typescript";
import { randomUUID } from "crypto";

type ParsedEntry = {
  idText?: string;
  enText: string;
  heTexts: string[];
};

type FileResult = {
  filePath: string;
  entries: ParsedEntry[];
  originalText: string;
};

const ROOT = path.resolve(__dirname, "..", "..");
const WORD_FILES = Array.from({ length: 10 }, (_, i) =>
  path.join(ROOT, `words_english_${i + 1}.ts`),
);
const REPORT_PATH = path.join(ROOT, "scripts", "assign_word_uuids_report.json");

function stripAssertions(expr: ts.Expression): ts.Expression {
  while (
    ts.isAsExpression(expr) ||
    ts.isSatisfiesExpression(expr) ||
    ts.isParenthesizedExpression(expr)
  ) {
    if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) {
      expr = expr.expression;
    } else {
      expr = expr.expression;
    }
  }
  return expr;
}

function findArrayLiteral(
  source: ts.SourceFile,
): ts.ArrayLiteralExpression | null {
  for (const stmt of source.statements) {
    if (ts.isExportAssignment(stmt)) {
      const expr = stripAssertions(stmt.expression);
      if (ts.isArrayLiteralExpression(expr)) return expr;
      if (ts.isIdentifier(expr)) {
        const target = resolveIdentifier(expr.text, source);
        if (target) return target;
      }
    }
  }
  return null;
}

function resolveIdentifier(
  name: string,
  source: ts.SourceFile,
): ts.ArrayLiteralExpression | null {
  for (const stmt of source.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name) {
        if (!decl.initializer) continue;
        const init = stripAssertions(decl.initializer);
        if (ts.isArrayLiteralExpression(init)) return init;
      }
    }
  }
  return null;
}

function assertStringLiteral(
  node: ts.Expression,
  context: string,
  source: ts.SourceFile,
): asserts node is ts.StringLiteralLike {
  if (!ts.isStringLiteralLike(node)) {
    throw new Error(
      `Expected string literal for ${context} in ${source.fileName}`,
    );
  }
}

function parseEntries(filePath: string): FileResult {
  const originalText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    originalText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const arrayLiteral = findArrayLiteral(source);
  if (!arrayLiteral) {
    throw new Error(`Could not find exported array literal in ${filePath}`);
  }

  const entries: ParsedEntry[] = [];

  for (const element of arrayLiteral.elements) {
    if (ts.isArrayLiteralExpression(element)) {
      const [enNode, ...heNodes] = element.elements;
      if (!enNode || heNodes.length === 0) {
        throw new Error(
          `Invalid row (missing english or translations) in ${filePath}`,
        );
      }
      assertStringLiteral(enNode, "english", source);
      heNodes.forEach((h) => assertStringLiteral(h, "hebrew", source));
      entries.push({
        enText: enNode.getText(source),
        heTexts: heNodes.map((h) => h.getText(source)),
      });
    } else if (ts.isObjectLiteralExpression(element)) {
      let idText: string | undefined;
      let enText: string | undefined;
      let heTexts: string[] | undefined;

      for (const prop of element.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name;
        const initializer = prop.initializer;
        const propName = ts.isIdentifier(name)
          ? name.text
          : ts.isStringLiteralLike(name)
            ? name.text
            : null;
        if (!propName) continue;
        if (propName === "id") {
          assertStringLiteral(initializer, "id", source);
          idText = initializer.getText(source);
        } else if (propName === "en") {
          assertStringLiteral(initializer, "en", source);
          enText = initializer.getText(source);
        } else if (propName === "he") {
          if (!ts.isArrayLiteralExpression(initializer)) {
            throw new Error(`Expected array literal for "he" in ${filePath}`);
          }
          initializer.elements.forEach((h) =>
            assertStringLiteral(h, "hebrew", source),
          );
          heTexts = initializer.elements.map((h) => h.getText(source));
        }
      }

      if (!enText || !heTexts || heTexts.length === 0) {
        throw new Error(`Missing en/he values in ${filePath}`);
      }

      entries.push({
        idText,
        enText,
        heTexts,
      });
    } else {
      throw new Error(`Unexpected array element kind in ${filePath}`);
    }
  }
  return { filePath, entries, originalText };
}

function buildFileText(entries: ParsedEntry[]) {
  const lines = entries.map((entry) => {
    const idText = entry.idText ?? JSON.stringify(randomUUID());
    const heArray = entry.heTexts.join(", ");
    return `  { id: ${idText}, en: ${entry.enText}, he: [${heArray}] }`;
  });

  // Avoid `as const`/`satisfies` here: the lists are large, and const assertions can make tsc
  // explode in memory by creating enormous literal types.
  return `export type RawWord = { id: string; en: string; he: readonly string[] };\n\nconst words: readonly RawWord[] = [\n${lines.join(
    ",\n",
  )}\n];\n\nexport default words;\n`;
}

function run() {
  const results = WORD_FILES.map(parseEntries);
  let idsAddedCount = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  const allIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const result of results) {
    totalBefore += result.entries.length;
    totalAfter += result.entries.length;
    for (const entry of result.entries) {
      if (!entry.idText) {
        entry.idText = JSON.stringify(randomUUID());
        idsAddedCount += 1;
      }
      const idValue = entry.idText.slice(1, -1);
      if (allIds.has(idValue)) duplicateIds.add(idValue);
      allIds.add(idValue);
    }
    const rewrittenText = buildFileText(result.entries);
    if (result.originalText !== rewrittenText) {
      fs.writeFileSync(result.filePath, rewrittenText, "utf8");
    }
  }

  const report = {
    total_before: totalBefore,
    total_after: totalAfter,
    ids_added_count: idsAddedCount,
    duplicate_ids: Array.from(duplicateIds),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`Total words: ${totalAfter}`);
  console.log(`IDs added: ${idsAddedCount}`);
  console.log(`Duplicate ids: ${report.duplicate_ids.length}`);
}

run();
