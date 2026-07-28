/** 작성 에이전트: 정리된 관찰 근거만 사용해 Gemini 초안을 생성한다. */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
export async function generateWriterDraft({ subject, collected, apiKey, model }: { subject: string; collected: string; apiKey: string; model?: string }) {
  const prompt = `당신은 고등학교 ${subject} 과목 세부능력 및 특기사항 초안을 작성한다. 아래 수집 내용을 근거로만 사용해 2~4문장의 교사 관찰 문체 한국어 문구를 작성하라. 추측, 성적·순위·비교, 인성 낙인, 단정적 표현, 학생 식별값을 넣지 말라. 제목·목록·마크다운 없이 문구만 반환하라.\n\n수집 내용:\n${collected}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.45, maxOutputTokens: 700 } }) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message || "Gemini 초안 생성에 실패했습니다.");
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
  if (!text) throw new Error("Gemini가 비어 있는 결과를 반환했습니다.");
  return text.replace(/^```(?:text|markdown)?\s*/i, "").replace(/\s*```$/, "").trim();
}
