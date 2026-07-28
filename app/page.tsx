"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedDraft, SubjectResult } from "@/lib/types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const quickSubjects = ["국어", "수학", "영어", "과학"];
type Stage = "idle" | "collect" | "write" | "review" | "done";

export default function Home() {
  const [grade, setGrade] = useState("1학년");
  const [studentId, setStudentId] = useState("");
  const [subjectsText, setSubjectsText] = useState("과학");
  const [observation, setObservation] = useState("생태계 평형 탐구에서 외래종 유입 사례를 조사하고, 먹이그물 자료를 바탕으로 개체 수 변화의 원인을 설명함. 모둠 토의에서 다른 의견의 근거를 비교하며 자신의 주장을 보완함.");
  const [apiKey, setApiKey] = useState(""); const [model, setModel] = useState(DEFAULT_MODEL);
  const [stage, setStage] = useState<Stage>("idle"); const [results, setResults] = useState<SubjectResult[]>([]);
  const [message, setMessage] = useState(""); const [history, setHistory] = useState<SavedDraft[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => { setApiKey(localStorage.getItem("gemini_api_key") || ""); setModel(localStorage.getItem("gemini_model") || DEFAULT_MODEL); }, []);
  const subjects = subjectsText.split(",").map((x) => x.trim()).filter(Boolean);
  const busy = stage !== "idle" && stage !== "done";
  const stageLabel = (target: Stage) => stage === target ? "진행 중" : stage === "done" || ["collect", "write", "review"].indexOf(stage) > ["collect", "write", "review"].indexOf(target) ? "완료" : "대기 중";
  function chooseSubject(subject: string) { setSubjectsText((old) => old.split(",").map((x) => x.trim()).includes(subject) ? old : old ? `${old}, ${subject}` : subject); }
  function persistSettings() { localStorage.setItem("gemini_api_key", apiKey); localStorage.setItem("gemini_model", model || DEFAULT_MODEL); }
  async function generate() {
    if (!subjects.length) return setMessage("과목을 한 개 이상 입력하세요.");
    persistSettings(); setResults([]); setMessage(""); setStage("collect");
    window.setTimeout(() => setStage("write"), 700); window.setTimeout(() => setStage("review"), 1400);
    try { const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, grade, subjects, observation, model, apiKey }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setResults(data.results); setStage("done"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "생성에 실패했습니다."); setStage("idle"); }
  }
  async function saveAll() { if (!supabase) return setMessage("Supabase 환경 변수를 설정한 뒤 저장할 수 있습니다."); if (!studentId.trim()) return setMessage("저장할 학생 식별값을 입력하세요."); const { error } = await supabase.from("setuk_drafts").insert(results.map((r) => ({ student_id: studentId, grade, subject: r.subject, source_observation: observation, collected_notes: r.collected, draft_text: r.draft, reviewed_text: r.reviewed, review_notes: r.notes }))); setMessage(error ? `저장 실패: ${error.message}` : "Supabase에 저장했습니다."); }
  async function loadHistory() { setShowHistory(true); if (!supabase) return setMessage("Supabase 환경 변수를 설정하세요."); const { data, error } = await supabase.from("setuk_drafts").select("*").order("created_at", { ascending: false }).limit(50); if (error) setMessage(`조회 실패: ${error.message}`); else setHistory((data || []) as SavedDraft[]); }
  function download() { const text = results.map((r) => `[${r.subject}]\n${r.reviewed}`).join("\n\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); link.download = "세특_초안.txt"; link.click(); URL.revokeObjectURL(link.href); }
  const agents = [{ id: "collect" as Stage, icon: "⌁", title: "수집 에이전트", detail: "활동 키워드와 관찰 내용을 교과 맥락으로 정리합니다." }, { id: "write" as Stage, icon: "✎", title: "작성 에이전트", detail: "정리된 사실을 바탕으로 과목별 세특 초안을 작성합니다." }, { id: "review" as Stage, icon: "✓", title: "검토 에이전트", detail: "단정·순위 등 부적절한 표현을 살피고 다듬습니다." }];
  return <main className="studio"><header className="brand"><div className="brand-mark">✦</div><b>세특 스튜디오</b><button className="history-link" onClick={loadHistory}>저장 내역</button><span>3-AGENT WORKFLOW</span></header><section className="hero"><h1>관찰을 정리하고,<br />교과 세특 초안으로.</h1><p>수집 · 작성 · 검토 에이전트가 순서대로 협업합니다. 교사의 최종 확인을 위한 초안 도구입니다.</p></section>
    <section className="settings-bar"><label>Gemini API Key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza... (브라우저에 저장하지 않습니다)" /></label><label>선호 모델<input value={model} onChange={(e) => setModel(e.target.value)} placeholder={DEFAULT_MODEL} /></label><p>API 키는 요청 시 Google Gemini에만 전송됩니다.<br />모델명은 콘솔에서 활성화된 정확한 ID로 바꿔주세요.</p></section>
    {message && <p className="notice">{message}</p>}<section className="workspace"><section className="card input-card"><h2>학생 활동 입력</h2><div className="dual"><label>학년<select value={grade} onChange={(e) => setGrade(e.target.value)}><option>1학년</option><option>2학년</option><option>3학년</option></select></label><label>결과물 개수<select disabled><option>{subjects.length || 1}개</option></select></label></div><label>과목 <small>쉼표로 여러 과목 입력 가능</small><input value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} placeholder="예: 국어, 과학" /></label><div className="quick-subjects">{quickSubjects.map((subject) => <button key={subject} onClick={() => chooseSubject(subject)}>{subject}</button>)}</div><label>학생 활동 키워드 또는 관찰 내용<textarea rows={7} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="수업에서 관찰한 활동, 과정, 질문, 산출물을 구체적으로 입력하세요." /></label><button className="generate" disabled={busy} onClick={generate}>{busy ? "에이전트가 작성 중입니다…" : "3개 에이전트로 초안 만들기 →"}</button></section>
      <aside className="card progress-card"><h2>에이전트 진행 상태</h2>{agents.map((agent) => <div className="agent" key={agent.id}><i>{agent.icon}</i><div><strong>{agent.title}</strong><p>{agent.detail}</p></div><em className={stageLabel(agent.id) === "진행 중" ? "active" : ""}>{stageLabel(agent.id)}</em></div>)}<p className="review-rule">검토 기준 · ‘최고’, ‘유일’, ‘반드시’ 같은 과도한 단정 및 순위 표현을 피하고, 관찰 가능한 행동과 학습 과정을 중심으로 서술합니다.</p></aside></section>
    {results.length > 0 && <section className="results"><div><p className="kicker">REVIEWED RESULTS</p><h2>과목별 세특 문구</h2></div><p><button onClick={download}>텍스트 다운로드</button><button className="save" onClick={saveAll}>Supabase에 저장</button></p>{results.map((result) => <article key={result.subject}><h3>{result.subject}</h3><p>{result.reviewed}</p><details><summary>처리 과정 보기</summary><p>수집: {result.collected}</p><p>초안: {result.draft}</p></details></article>)}</section>}
    {showHistory && <section className="results"><h2>저장 내역</h2>{history.length ? history.map((row) => <article key={row.id}><h3>{row.subject} <small>{row.grade} · {row.student_id} · {new Date(row.created_at).toLocaleString("ko-KR")}</small></h3><p>{row.reviewed_text}</p></article>) : <p>저장된 내역이 없습니다.</p>}</section>}<footer>세특 스튜디오 · 생성 결과는 사실관계와 학교 기록 기준을 확인한 뒤 사용하세요.</footer></main>;
}
