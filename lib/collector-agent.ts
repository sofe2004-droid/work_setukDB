/** 수집 에이전트: 관찰 내용을 사실 단위로 정리한다. */
export function collectActivity({ subject, observation }: { subject: string; observation: string }) {
  const facts = observation.replace(/\r\n?/g, "\n").split(/[\n;]+/)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).slice(0, 12);
  if (!facts.length) throw new Error("학생 활동 키워드 또는 관찰 내용을 입력하세요.");
  return `과목 맥락: ${subject}\n${facts.map((fact) => `- ${fact}`).join("\n")}`;
}
