import { NextRequest, NextResponse } from "next/server";
import { collectActivity } from "@/lib/collector-agent";
import { generateWriterDraft } from "@/lib/writer-agent";
import { reviewDraft } from "@/lib/reviewer-agent";
import type { DraftInput, SubjectResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as DraftInput;
    if (!input.grade || !input.observation?.trim() || !input.subjects?.length) {
      return NextResponse.json({ error: "학년, 과목, 활동 내용을 입력하세요." }, { status: 400 });
    }
    const apiKey = input.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "개인 설정에서 Gemini API 키를 입력하세요." }, { status: 400 });
    const results: SubjectResult[] = [];
    const outputCount = Math.max(1, Math.min(3, Number(input.outputCount) || 1));
    for (const subject of input.subjects) {
      const collected = collectActivity({ subject, observation: input.observation });
      for (let index = 0; index < outputCount; index += 1) {
        const draft = await generateWriterDraft({ subject, collected, apiKey, model: input.model });
        const reviewed = reviewDraft({ subject, draft });
        results.push({ subject: outputCount > 1 ? `${subject} · 초안 ${index + 1}` : subject, collected, draft, reviewed: reviewed.finalText, notes: reviewed.issues });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
