import { WordStatus } from "./types";

export const STATUS_LABELS: Record<WordStatus, string> = {
  UNMARKED: "לא סווג",
  DONT_KNOW: "לא יודע",
  PARTIAL: "לא בטוח",
  KNOW: "יודע",
};

export const STATUS_COLORS: Record<WordStatus, string> = {
  UNMARKED: "#cbd5e1",
  DONT_KNOW: "#ef4444",
  PARTIAL: "#fbbf24",
  KNOW: "#22c55e",
};

export const STATUS_ORDER: WordStatus[] = [
  "UNMARKED",
  "DONT_KNOW",
  "PARTIAL",
  "KNOW",
];

export const DEFAULT_STUDY_STATUSES: WordStatus[] = [
  "UNMARKED",
  "DONT_KNOW",
  "PARTIAL",
];

export const DEFAULT_REVIEW_STATUSES: WordStatus[] = [
  "UNMARKED",
  "DONT_KNOW",
  "PARTIAL",
  "KNOW",
];

export function getStatusColor(status: WordStatus) {
  return STATUS_COLORS[status];
}

export function getStatusLabel(status: WordStatus) {
  return STATUS_LABELS[status];
}
