"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedDraft, SubjectResult } from "@/lib/types";
import styles from "./page-tweaks.module.css";
const SUBJECTS = ["국어", "수학", "영어", "과학", "사회"],
  MODEL = "gemini-3.5-flash-lite";
export default function Home() {
  const [view, setView] = useState("draft"),
    [apiOpen, setApiOpen] = useState(false),
    [key, setKey] = useState(""),
    [model, setModel] = useState(MODEL),
    [grade, setGrade] = useState("고등학교 1학년"),
    [id, setId] = useState(""),
    [subs, setSubs] = useState<string[]>([]),
    [note, setNote] = useState(""),
    [count, setCount] = useState("1"),
    [results, setResults] = useState<SubjectResult[]>([]),
    [history, setHistory] = useState<SavedDraft[]>([]),
    [historyCount, setHistoryCount] = useState(0),
    [edits, setEdits] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(""),
    [msg, setMsg] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [step, setStep] = useState(0);
  useEffect(() => {
    setKey(localStorage.getItem("gemini_api_key") || "");
    setModel(localStorage.getItem("gemini_model") || MODEL);
    loadHistoryCount();
  }, []);
  const rows = useMemo(
    () => history.filter((x) => x.student_id.includes(search)),
    [history, search],
  );
  const toggle = (s: string) =>
    setSubs((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]));
  const clearDrafts = () => {
    setResults([]);
    setMsg("");
    setStep(0);
  };
  const toastMsg = (x: string) => {
    setToast(x);
    setTimeout(() => setToast(""), 3500);
  };
  const saveKey = () => {
    localStorage.setItem("gemini_api_key", key);
    localStorage.setItem("gemini_model", model);
    setApiOpen(false);
    toastMsg("Gemini API 설정을 저장했습니다.");
  };
  async function loadHistoryCount() {
    if (!supabase) return;
    const { count, error } = await supabase
      .from("setuk_drafts")
      .select("id", { count: "exact", head: true });
    if (!error) setHistoryCount(count || 0);
  }
  async function create() {
    if (!subs.length)
      return setMsg("세특 초안을 생성하려면 과목을 선택하세요.");
    if (!note.trim()) return setMsg("학생 활동 내용을 입력하세요.");
    setBusy(true);
    setStep(1);
    setTimeout(() => setStep(2), 450);
    setTimeout(() => setStep(3), 900);
    try {
      const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: id,
            grade,
            subjects: subs,
            observation: note,
            model,
            apiKey: key,
            outputCount: Number(count),
          }),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setResults(d.results);
      setStep(4);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "생성 실패");
      setStep(0);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!supabase || !id) return setMsg("저장할 학번을 입력하세요.");
    const { data, error } = await supabase
      .from("setuk_drafts")
      .insert(
        results.map((r) => ({
          student_id: id,
          grade,
          subject: r.subject,
          source_observation: note,
          collected_notes: r.collected,
          draft_text: r.draft,
          reviewed_text: r.reviewed,
          review_notes: r.notes,
        })),
      )
      .select("*");
    if (error) setMsg(error.message);
    else {
      setHistory((previous) => [...(data as SavedDraft[]), ...previous]);
      setHistoryCount((current) => current + (data?.length || 0));
      toastMsg("Supabase에 저장했습니다.");
    }
  }
  async function load() {
    setView("history");
    if (!supabase) return setMsg("Supabase 환경 변수를 설정하세요.");
    const { data, error } = await supabase
      .from("setuk_drafts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setMsg(error.message);
    else {
      const a = (data || []) as SavedDraft[];
      setHistory(a);
      setHistoryCount(a.length);
      setEdits(Object.fromEntries(a.map((x) => [x.id, x.reviewed_text])));
    }
  }
  async function edit(r: SavedDraft) {
    if (!supabase) return;
    const { error } = await supabase
      .from("setuk_drafts")
      .update({ reviewed_text: edits[r.id] })
      .eq("id", r.id);
    error ? setMsg(error.message) : toastMsg("수정 내용을 저장했습니다.");
  }
  return (
    <main className={`${styles.shell} hp-shell`}>
      <div className="utility">세특 메이커</div>
      <div className="app-layout">
        <aside className="left-menu">
          <h1>세특 메이커</h1>
          <button
            className={view === "draft" ? "active" : ""}
            onClick={() => setView("draft")}
          >
            세특 작성
          </button>
          <button className={view === "history" ? "active" : ""} onClick={load}>
            저장 내역 <b>{historyCount}</b>
          </button>
          <hr />
          <button onClick={() => setApiOpen(true)}>API 키 입력</button>
        </aside>
        <section className="app-content">
          {msg && <p className="notice">{msg}</p>}
          {view === "draft" ? (
            <>
              <section className="hero">
                <div>
                  <p>AI-POWERED STUDENT RECORDS</p>
                  <h1>
                    관찰을 더 정확하게,
                    <br />
                    세특 초안은 더 빠르게.
                  </h1>
                </div>
              </section>
              <section className="page">
                <h2>세특 초안 작성</h2>
                <div className="draft-grid">
                  <section className="hp-card form-card">
                    <label>
                      학년
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                      >
                        <option>고등학교 1학년</option>
                        <option>고등학교 2학년</option>
                        <option>고등학교 3학년</option>
                      </select>
                    </label>
                    <label>
                      학번
                      <input
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="예: 10101"
                      />
                    </label>
                    <label>
                      결과물 개수
                      <select
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                      >
                        <option value="1">1개</option>
                        <option value="2">2개</option>
                        <option value="3">3개</option>
                      </select>
                    </label>
                    <label>과목</label>
                    <div className="chips">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggle(s)}
                          className={subs.includes(s) ? "selected" : ""}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <label>학생 활동 내용</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="actions">
                      <button className="outline" onClick={clearDrafts}>
                        초기화
                      </button>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={create}
                      >
                        세특 초안 생성하기
                      </button>
                    </div>
                  </section>
                  <section className="hp-card agent-card">
                    <p>AI AGENT WORKFLOW</p>
                    {["수집 에이전트", "작성 에이전트", "검토 에이전트"].map(
                      (x, i) => (
                        <article
                          className={
                            step === i + 1
                              ? "working"
                              : step > i + 1
                                ? "complete"
                                : ""
                          }
                          key={x}
                        >
                          <b>0{i + 1}</b>
                          <strong>{x}</strong>
                          <em>
                            {step === i + 1
                              ? "진행 중"
                              : step > i + 1
                                ? "완료"
                                : "대기"}
                          </em>
                        </article>
                      ),
                    )}
                  </section>
                </div>
                {results.length > 0 && (
                  <section className="result-list">
                    <div className="result-actions">
                      <h2>생성된 세특 초안</h2>
                      <button className="outline" onClick={clearDrafts}>
                        초기화
                      </button>
                      <button className="primary" onClick={save}>
                        Supabase 저장
                      </button>
                    </div>
                    {results.map((r) => (
                      <article key={r.subject}>
                        <b>{r.subject}</b>
                        <p>{r.reviewed}</p>
                      </article>
                    ))}
                  </section>
                )}
              </section>
            </>
          ) : (
            <section className="page">
              <div className="result-actions">
                <h2>저장 내역</h2>
                <button className="outline" onClick={load}>
                  새로고침
                </button>
              </div>
              <div className="search">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="학번으로 검색"
                />
                <span>{rows.length}건</span>
              </div>
              {rows.map((r) => (
                <article className="history-card" key={r.id}>
                  <b>
                    {r.subject} · 학번 {r.student_id}
                  </b>
                  <textarea
                    value={edits[r.id] || ""}
                    onChange={(e) =>
                      setEdits((x) => ({ ...x, [r.id]: e.target.value }))
                    }
                  />
                  <footer>
                    <button className="primary" onClick={() => edit(r)}>
                      수정 저장하기
                    </button>
                  </footer>
                </article>
              ))}
            </section>
          )}
        </section>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {apiOpen && (
        <div className="modal-backdrop">
          <section className="api-modal">
            <button className="close" onClick={() => setApiOpen(false)}>
              ×
            </button>
            <h2>API 키 입력</h2>
            <label>
              Gemini API Key
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </label>
            <label>
              선호 모델
              <input value={model} onChange={(e) => setModel(e.target.value)} />
            </label>
            <button className="primary" onClick={saveKey}>
              설정 저장
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
