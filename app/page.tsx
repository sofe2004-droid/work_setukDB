"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedDraft, SubjectResult } from "@/lib/types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const subjectOptions = ["국어", "수학", "영어", "사회", "과학", "역사", "정보", "예술", "체육"];
type View = "create" | "history" | "settings";

export default function Home() {
  const [view, setView] = useState<View>("create");
  const [studentId, setStudentId] = useState(""); const [grade, setGrade] = useState("1학년");
  const [subjects, setSubjects] = useState<string[]>(["국어"]); const [observation, setObservation] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL); const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState<SubjectResult[]>([]); const [history, setHistory] = useState<SavedDraft[]>([]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { setApiKey(localStorage.getItem("gemini_api_key") || ""); setModel(localStorage.getItem("gemini_model") || DEFAULT_MODEL); }, []);
  const supabaseReady = useMemo(() => Boolean(supabase), []);
  const toggleSubject = (subject: string) => setSubjects((old) => old.includes(subject) ? old.filter((x) => x !== subject) : [...old, subject]);
  async function generate() {
    setBusy(true); setMessage(""); setResults([]);
    try { const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, grade, subjects, observation, model, apiKey }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setResults(data.results); }
    catch (e) { setMessage(e instanceof Error ? e.message : "생성에 실패했습니다."); } finally { setBusy(false); }
  }
  async function saveAll() {
    if (!supabase) return setMessage("Supabase 환경 변수를 설정한 뒤 사용할 수 있습니다.");
    if (!studentId.trim()) return setMessage("저장할 학생 식별값을 입력하세요.");
    const rows = results.map((r) => ({ student_id: studentId, grade, subject: r.subject, source_observation: observation, collected_notes: r.collected, draft_text: r.draft, reviewed_text: r.reviewed, review_notes: r.notes }));
    setBusy(true); const { error } = await supabase.from("setuk_drafts").insert(rows); setBusy(false);
    setMessage(error ? `저장 실패: ${error.message}` : `${rows.length}건을 저장했습니다.`);
  }
  async function loadHistory() { setView("history"); if (!supabase) return setMessage("Supabase 환경 변수를 설정하세요."); const { data, error } = await supabase.from("setuk_drafts").select("*").order("created_at", { ascending: false }).limit(100); if (error) setMessage(`조회 실패: ${error.message}`); else setHistory((data || []) as SavedDraft[]); }
  function download() { const content = results.map((r) => `[${r.subject}]\n${r.reviewed}`).join("\n\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" })); a.download = "세특_초안.txt"; a.click(); URL.revokeObjectURL(a.href); }
  function saveSettings() { localStorage.setItem("gemini_api_key", apiKey); localStorage.setItem("gemini_model", model || DEFAULT_MODEL); setMessage("개인 설정을 이 브라우저에 저장했습니다. API 키는 서버나 DB에 저장되지 않습니다."); }
  return <main><header><div><p className="eyebrow">STUDENT RECORD DRAFT STUDIO</p><h1>세특 초안 스튜디오</h1></div><nav><button onClick={() => setView("create")}>작성</button><button onClick={loadHistory}>저장 내역</button><button onClick={() => setView("settings")}>개인 설정</button></nav></header>
    {message && <p className="notice">{message}</p>}
    {view === "create" && <><section className="panel form"><label>학생 식별값<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="예: 10101 또는 별칭" /></label><label>학년<select value={grade} onChange={e => setGrade(e.target.value)}><option>1학년</option><option>2학년</option><option>3학년</option></select></label><fieldset><legend>과목 (복수 선택)</legend>{subjectOptions.map(s => <label className="chip" key={s}><input type="checkbox" checked={subjects.includes(s)} onChange={() => toggleSubject(s)} />{s}</label>)}</fieldset><label>학생 활동 키워드 또는 관찰 내용<textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="예: 기후 변화 자료를 비교하며 원인을 질문하고, 모둠 발표에서 근거를 들어 의견을 설명함" rows={7}/></label><button className="primary" disabled={busy || !subjects.length} onClick={generate}>{busy ? "3단계 에이전트가 작성 중…" : "세특 초안 생성"}</button></section>
      {results.length > 0 && <section className="results"><div className="result-head"><div><p className="eyebrow">REVIEWED RESULTS</p><h2>과목별 세특 문구</h2></div><div><button onClick={download}>텍스트 다운로드</button><button className="primary" disabled={busy || !supabaseReady} onClick={saveAll}>Supabase에 저장</button></div></div>{results.map(r => <article key={r.subject}><h3>{r.subject}</h3><p>{r.reviewed}</p><details><summary>에이전트 처리 과정 보기</summary><p><b>수집:</b> {r.collected}</p><p><b>초안:</b> {r.draft}</p>{r.notes.length > 0 && <p><b>검토:</b> {r.notes.join(" · ")}</p>}</details></article>)}</section>}</>}
    {view === "history" && <section className="panel"><h2>저장 내역</h2><p className="muted">학생 식별값·학년·과목·생성일시 기준으로 과거 문구를 다시 확인합니다.</p>{history.map(row => <article className="history" key={row.id}><div><b>{row.subject}</b><span>{row.grade} · {row.student_id} · {new Date(row.created_at).toLocaleString("ko-KR")}</span></div><p>{row.reviewed_text}</p></article>)}{!history.length && <p className="muted">저장된 내역이 없습니다.</p>}</section>}
    {view === "settings" && <section className="panel settings"><h2>개인 설정</h2><p className="muted">키는 현재 브라우저의 localStorage에만 보관되며 생성 요청 때만 서버로 전달됩니다.</p><label>Gemini API 키<input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza…" /></label><label>선호 모델<input value={model} onChange={e => setModel(e.target.value)} placeholder={DEFAULT_MODEL} /></label><button className="primary" onClick={saveSettings}>설정 저장</button></section>}
  </main>;
}
