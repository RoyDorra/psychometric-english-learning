import {
  PrivateAssociation,
  PublicAssociation,
  PublicAssociationView,
} from "../domain/types";
import { supabase } from "../services/supabase";

type PublicAssociationRow = {
  id: string;
  word_id: string;
  text_he: string;
  created_by_user_id: string;
  like_count: number;
  created_at: string;
  updated_at: string;
};

type PrivateAssociationRow = {
  id: string;
  user_id: string;
  word_id: string;
  text_he: string;
  created_at: string;
  updated_at: string;
};

type AssociationFlagRow = {
  association_id: string;
};

function normalizeAssociationText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toPublicAssociation(row: PublicAssociationRow): PublicAssociation {
  return {
    id: row.id,
    wordId: row.word_id,
    textHe: row.text_he,
    createdByUserId: row.created_by_user_id,
    likeCount: row.like_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPrivateAssociation(row: PrivateAssociationRow): PrivateAssociation {
  return {
    id: row.id,
    userId: row.user_id,
    wordId: row.word_id,
    textHe: row.text_he,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFlagMap(rows: AssociationFlagRow[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  rows.forEach((row) => {
    map[row.association_id] = true;
  });
  return map;
}

function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

async function fetchLikeFlags(
  userId: string,
  associationIds: string[],
): Promise<Record<string, boolean>> {
  if (!associationIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("public_association_likes")
    .select("association_id")
    .eq("user_id", userId)
    .in("association_id", associationIds);

  if (error) {
    throw error;
  }

  return toFlagMap((data ?? []) as AssociationFlagRow[]);
}

async function fetchSaveFlags(
  userId: string,
  associationIds: string[],
): Promise<Record<string, boolean>> {
  if (!associationIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("public_association_saves")
    .select("association_id")
    .eq("user_id", userId)
    .in("association_id", associationIds);

  if (error) {
    throw error;
  }

  return toFlagMap((data ?? []) as AssociationFlagRow[]);
}

export async function listPublicByWord(
  wordId: string,
  userId: string,
): Promise<PublicAssociationView[]> {
  const { data, error } = await supabase
    .from("public_associations")
    .select(
      "id, word_id, text_he, created_by_user_id, like_count, created_at, updated_at",
    )
    .eq("word_id", wordId)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as PublicAssociationRow[];
  const ids = rows.map((row) => row.id);

  const [likes, saves] = await Promise.all([
    fetchLikeFlags(userId, ids),
    fetchSaveFlags(userId, ids),
  ]);

  return rows.map((row) => {
    const association = toPublicAssociation(row);
    return {
      ...association,
      isLikedByMe: Boolean(likes[row.id]),
      isSavedByMe: Boolean(saves[row.id]),
    };
  });
}

export async function listSavedByWord(
  wordId: string,
  userId: string,
): Promise<PublicAssociationView[]> {
  const { data: saveRows, error: savesError } = await supabase
    .from("public_association_saves")
    .select("association_id")
    .eq("user_id", userId);

  if (savesError) {
    throw savesError;
  }

  const savedIds = (saveRows ?? []).map((row) => row.association_id as string);
  if (!savedIds.length) {
    return [];
  }

  const { data: publicRows, error: publicError } = await supabase
    .from("public_associations")
    .select(
      "id, word_id, text_he, created_by_user_id, like_count, created_at, updated_at",
    )
    .eq("word_id", wordId)
    .in("id", savedIds)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (publicError) {
    throw publicError;
  }

  const rows = (publicRows ?? []) as PublicAssociationRow[];
  const ids = rows.map((row) => row.id);
  const likes = await fetchLikeFlags(userId, ids);

  return rows.map((row) => {
    const association = toPublicAssociation(row);
    return {
      ...association,
      isLikedByMe: Boolean(likes[row.id]),
      isSavedByMe: true,
    };
  });
}

export async function listPrivateByWord(
  wordId: string,
  userId: string,
): Promise<PrivateAssociation[]> {
  const { data, error } = await supabase
    .from("private_associations")
    .select("id, user_id, word_id, text_he, created_at, updated_at")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PrivateAssociationRow[]).map(toPrivateAssociation);
}

export async function createPublicAssociation(
  wordId: string,
  textHe: string,
  userId: string,
): Promise<void> {
  const normalizedText = normalizeAssociationText(textHe);
  if (!normalizedText) {
    throw new Error("Association text cannot be empty");
  }

  const { error } = await supabase.from("public_associations").insert({
    word_id: wordId,
    text_he: normalizedText,
    created_by_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function createPrivateAssociation(
  wordId: string,
  textHe: string,
  userId: string,
): Promise<void> {
  const normalizedText = normalizeAssociationText(textHe);
  if (!normalizedText) {
    throw new Error("Association text cannot be empty");
  }

  const { error } = await supabase.from("private_associations").insert({
    user_id: userId,
    word_id: wordId,
    text_he: normalizedText,
  });

  if (error) {
    throw error;
  }
}

export async function toggleLike(associationId: string, userId: string) {
  const { error } = await supabase.from("public_association_likes").insert({
    user_id: userId,
    association_id: associationId,
  });

  if (!error) {
    return;
  }

  if (!isUniqueViolation(error)) {
    throw error;
  }

  const { error: deleteError } = await supabase
    .from("public_association_likes")
    .delete()
    .eq("user_id", userId)
    .eq("association_id", associationId);

  if (deleteError) {
    throw deleteError;
  }
}

export async function toggleSave(associationId: string, userId: string) {
  const { error } = await supabase.from("public_association_saves").insert({
    user_id: userId,
    association_id: associationId,
  });

  if (!error) {
    return;
  }

  if (!isUniqueViolation(error)) {
    throw error;
  }

  const { error: deleteError } = await supabase
    .from("public_association_saves")
    .delete()
    .eq("user_id", userId)
    .eq("association_id", associationId);

  if (deleteError) {
    throw deleteError;
  }
}

export async function deletePrivateAssociation(
  associationId: string,
  wordId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("private_associations")
    .delete()
    .eq("id", associationId)
    .eq("word_id", wordId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function updatePrivateAssociation(
  associationId: string,
  wordId: string,
  userId: string,
  textHe: string,
): Promise<void> {
  const normalizedText = normalizeAssociationText(textHe);
  if (!normalizedText) {
    throw new Error("Association text cannot be empty");
  }

  const { error } = await supabase
    .from("private_associations")
    .update({ text_he: normalizedText })
    .eq("id", associationId)
    .eq("word_id", wordId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
