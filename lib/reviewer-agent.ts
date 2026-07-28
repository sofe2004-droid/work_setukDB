/** 검토 에이전트: 금지·과장 표현을 관찰 기반 문체로 조정한다. */
const rules: Array<[RegExp, string, string]> = [
  [/최고(?:의|로)?/g, "", "순위·과장 표현 삭제"], [/최상(?:의|급)?/g, "", "순위·과장 표현 삭제"],
  [/(?:1등|상위\s*\d+%?)/g, "", "순위 표현 삭제"], [/(?:탁월|압도|월등|우수)함/g, "꾸준히 참여함", "평가성 표현 완화"],
  [/(?:반드시|확실히|완벽히|명백히)/g, "", "단정적 표현 삭제"], [/입증함/g, "설명함", "단정적 표현 완화"],
  [/(?:게으름|문제\s*학생)/g, "", "낙인 표현 삭제"],
];
export function reviewDraft({ subject: _subject, draft }: { subject: string; draft: string }) {
  let finalText = draft.trim(); const issues: string[] = [];
  for (const [pattern, replacement, note] of rules) {
    if (pattern.test(finalText)) { finalText = finalText.replace(pattern, replacement); issues.push(note); }
  }
  finalText = finalText.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
  return { finalText, issues: [...new Set(issues)] };
}
