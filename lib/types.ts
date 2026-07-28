export type DraftInput = { studentId: string; grade: string; subjects: string[]; observation: string; model: string; apiKey?: string; outputCount?: number };
export type SubjectResult = { subject: string; collected: string; draft: string; reviewed: string; notes: string[] };
export type SavedDraft = { id: string; student_id: string; grade: string; subject: string; source_observation: string; collected_notes: string; draft_text: string; reviewed_text: string; review_notes: string[]; created_at: string };
