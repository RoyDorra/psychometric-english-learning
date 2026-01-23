import { Group, Word } from "../domain/types";

export const DEMO_GROUPS: Group[] = Array.from({ length: 10 }, (_, idx) => {
  const id = idx + 1;
  return { id, name: `קבוצה ${id}` };
});

export const DEMO_WORDS: Word[] = [
  {
    id: "w1",
    groupId: 1,
    english: "abandon",
    hebrewTranslations: ["לנטוש", "להפקיר"],
  },
  {
    id: "w2",
    groupId: 1,
    english: "ability",
    hebrewTranslations: ["יכולת"],
  },
  {
    id: "w3",
    groupId: 1,
    english: "abstract",
    hebrewTranslations: ["מופשט", "תקציר"],
  },
  {
    id: "w4",
    groupId: 1,
    english: "acquire",
    hebrewTranslations: ["להשיג", "לרכוש"],
  },
  {
    id: "w5",
    groupId: 2,
    english: "balance",
    hebrewTranslations: ["איזון", "לאזן"],
  },
  {
    id: "w6",
    groupId: 2,
    english: "barely",
    hebrewTranslations: ["בקושי"],
  },
  {
    id: "w7",
    groupId: 2,
    english: "bargain",
    hebrewTranslations: ["מציאה", "עסקה"],
  },
  {
    id: "w8",
    groupId: 2,
    english: "benefit",
    hebrewTranslations: ["תועלת", "להועיל"],
  },
  {
    id: "w9",
    groupId: 3,
    english: "calculate",
    hebrewTranslations: ["לחשב"],
  },
  {
    id: "w10",
    groupId: 3,
    english: "candidate",
    hebrewTranslations: ["מועמד"],
  },
  {
    id: "w11",
    groupId: 3,
    english: "capacity",
    hebrewTranslations: ["קיבולת", "יכולת"],
  },
  {
    id: "w12",
    groupId: 3,
    english: "casual",
    hebrewTranslations: ["לא רשמי", "יומיומי"],
  },
  {
    id: "w13",
    groupId: 4,
    english: "daring",
    hebrewTranslations: ["נועז", "אומץ"],
  },
  {
    id: "w14",
    groupId: 4,
    english: "debate",
    hebrewTranslations: ["עימות", "ויכוח"],
  },
  {
    id: "w15",
    groupId: 4,
    english: "decline",
    hebrewTranslations: ["ירידה", "לדחות"],
  },
  {
    id: "w16",
    groupId: 4,
    english: "dense",
    hebrewTranslations: ["צפוף", "סמיך"],
  },
  {
    id: "w17",
    groupId: 5,
    english: "eager",
    hebrewTranslations: ["להוט", "חפץ"],
  },
  {
    id: "w18",
    groupId: 5,
    english: "economy",
    hebrewTranslations: ["כלכלה", "חסכון"],
  },
  {
    id: "w19",
    groupId: 5,
    english: "effort",
    hebrewTranslations: ["מאמץ"],
  },
  {
    id: "w20",
    groupId: 5,
    english: "emerge",
    hebrewTranslations: ["להופיע", "לעלות"],
  },
  {
    id: "w21",
    groupId: 6,
    english: "facilitate",
    hebrewTranslations: ["להקל", "לאפשר"],
  },
  {
    id: "w22",
    groupId: 6,
    english: "faint",
    hebrewTranslations: ["מעורפל", "להתעלף"],
  },
  {
    id: "w23",
    groupId: 6,
    english: "feature",
    hebrewTranslations: ["תכונה", "מאפיין"],
  },
  {
    id: "w24",
    groupId: 6,
    english: "flaw",
    hebrewTranslations: ["פגם", "ליקוי"],
  },
  {
    id: "w25",
    groupId: 7,
    english: "genuine",
    hebrewTranslations: ["אמיתי", "מקורי"],
  },
  {
    id: "w26",
    groupId: 7,
    english: "glance",
    hebrewTranslations: ["להציץ", "מבט"],
  },
  {
    id: "w27",
    groupId: 7,
    english: "grant",
    hebrewTranslations: ["להעניק", "מענק"],
  },
  {
    id: "w28",
    groupId: 7,
    english: "guard",
    hebrewTranslations: ["שומר", "להגן"],
  },
  {
    id: "w29",
    groupId: 8,
    english: "harsh",
    hebrewTranslations: ["קשה", "מחמיר"],
  },
  {
    id: "w30",
    groupId: 8,
    english: "heritage",
    hebrewTranslations: ["מורשת"],
  },
  {
    id: "w31",
    groupId: 8,
    english: "hollow",
    hebrewTranslations: ["חלול"],
  },
  {
    id: "w32",
    groupId: 8,
    english: "humble",
    hebrewTranslations: ["צנוע", "להשפיל"],
  },
  {
    id: "w33",
    groupId: 9,
    english: "impact",
    hebrewTranslations: ["השפעה", "להשפיע"],
  },
  {
    id: "w34",
    groupId: 9,
    english: "imply",
    hebrewTranslations: ["לרמוז"],
  },
  {
    id: "w35",
    groupId: 9,
    english: "infant",
    hebrewTranslations: ["תינוק"],
  },
  {
    id: "w36",
    groupId: 9,
    english: "insight",
    hebrewTranslations: ["תובנה"],
  },
  {
    id: "w37",
    groupId: 10,
    english: "justice",
    hebrewTranslations: ["צדק", "מערכת המשפט"],
  },
  {
    id: "w38",
    groupId: 10,
    english: "justify",
    hebrewTranslations: ["להצדיק"],
  },
  {
    id: "w39",
    groupId: 10,
    english: "keen",
    hebrewTranslations: ["נלהב", "חד"],
  },
  {
    id: "w40",
    groupId: 10,
    english: "kin",
    hebrewTranslations: ["קרובי משפחה"],
  },
];
