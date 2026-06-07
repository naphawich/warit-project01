// Shared helper: recompute lessons.global_index for a course so the numbers
// stay contiguous after a lesson or chapter is deleted. 1-based to match the
// create convention in /api/admin/lessons (global_index = lastGlobal + 1).
//
// Note: this only renumbers the DB column used for display/ordering. It does
// NOT touch video_storage_key, so existing R2 videos keep playing.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function repackGlobalIndex(
  admin: SupabaseClient,
  courseId: number
): Promise<void> {
  const { data: all } = await admin
    .from("lessons")
    .select("id, chapter_index, lesson_index")
    .eq("course_id", courseId)
    .order("chapter_index", { ascending: true })
    .order("lesson_index", { ascending: true });

  let gi = 1;
  for (const l of all ?? []) {
    await admin.from("lessons").update({ global_index: gi }).eq("id", l.id);
    gi += 1;
  }
}
