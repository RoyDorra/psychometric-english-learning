# Step 06b - Docs canonical/archive split

## Objective
Establish a single entrypoint for canonical docs, move conflicting/older docs to an archive with clear warnings, and avoid touching runtime code or skills.

## What moved to archive (from -> to)
- docs/architecture/supabase-plan.md -> docs/_archive/supabase-plan.md
- docs/codex/project-review-stop-before-supabase.md -> docs/_archive/project-review-stop-before-supabase.md
- docs/codex/step-05-supabase-associations-schema.md -> docs/_archive/step-05-supabase-associations-schema.md

## Canonical docs list
- docs/architecture/supabase-roadmap.md
- docs/architecture/ci.md
- docs/codex/README.md
- docs/codex/_last_run_summary.md
- docs/codex/step-06-supabase-foundation-and-order.md
- docs/README.md

## Commands + outputs
### git status -sb
```bash
## supabase
 D docs/architecture/supabase-plan.md
?? docs/README.md
?? docs/_archive/
?? docs/architecture/supabase-roadmap.md
?? supabase/
```

### git diff --stat
```bash
docs/architecture/supabase-plan.md | 19 -------------------
1 file changed, 19 deletions(-)
```

## Focused diff excerpts
### docs/README.md
```diff
diff --git a/docs/README.md b/docs/README.md
new file mode 100644
--- /dev/null
+++ b/docs/README.md
@@ -0,0 +1,20 @@
+# Documentation Index
+
+## Canonical docs (source of truth)
+- docs/architecture/supabase-roadmap.md
+- docs/architecture/ci.md
+- docs/codex/README.md
+- docs/codex/_last_run_summary.md
+- docs/codex/step-06-supabase-foundation-and-order.md
+
+## Archive (historical, non-authoritative)
+- docs/_archive/supabase-plan.md
+- docs/_archive/project-review-stop-before-supabase.md
+- docs/_archive/step-05-supabase-associations-schema.md
+
+Archived docs are kept for context only and must not drive implementation decisions.
+
+## Skills pointer (do not modify skills here)
+- Supabase Postgres best practices: .agents/skills/supabase-postgres-best-practices/SKILL.md
+- React Native best practices: .agents/skills/react-native-best-practices/SKILL.md
+- Testing best practices: .agents/skills/testing-best-practices/SKILL.md
+
+Future Supabase/RN/testing changes should consult the relevant skill files above.
```

### docs/_archive/supabase-plan.md (header example)
```diff
diff --git a/docs/_archive/supabase-plan.md b/docs/_archive/supabase-plan.md
@@
+# ARCHIVED: Not canonical. Kept for historical context only.
```

## Notes / TODOs
- Archived files retain full content for reference; only a short header was added.
- Skills under .agents/skills/ and .codex/skills/ were untouched.
- No runtime code changes under src/ or app/.
