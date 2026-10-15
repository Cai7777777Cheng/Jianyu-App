import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CAL_DAYS,
  CAL_LEAD,
  CAL_MONTH,
  CAL_YEAR,
  DAY_NOTES,
  FACES,
  FREQS,
  HEARD,
  NAMES,
  SCRIPT,
  SEED_LETTERS,
  STATE_LABEL,
  faceById,
  faceFor,
  monthStats,
  replyFor,
  type DayNote,
  type FaceId,
  type Letter,
  type Resolve,
} from "./data.ts";

type View = "home" | "hub" | "cal" | "me" | "tree" | "letters" | "composer" | "call";
type Tab = "home" | "hub" | "cal" | "me";
type Msg = { id: number; role: "me" | "bot"; text: string; tint: string };
type Sheet =
  | { kind: "day"; day: number }
  | { kind: "phone" }
  | { kind: "name" }
  | { kind: "miss" }
  | { kind: "reply"; id: string }
  | null;

const TABS: Tab[] = ["home", "hub", "cal", "me"];
const STATS = monthStats(DAY_NOTES);
const STORE = "jianyu-web";

function loadSaved(): { temper: FaceId; name: string; freq: string; paused: boolean } {
  const fallback = { temper: "calm" as FaceId, name: "阿宁", freq: "刚好就好", paused: false };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "null") as Partial<typeof fallback> | null;
    if (!raw) return fallback;
    const temper = FACES.some((f) => f.id === raw.temper) ? (raw.temper as FaceId) : fallback.temper;
    return {
      temper,
      name: raw.name || fallback.name,
      freq: raw.freq || fallback.freq,
      paused: !!raw.paused,
    };
  } catch {
    return fallback;
  }
}

function greet(name: string) {
  const h = new Date().getHours();
  const part = h < 5 ? "夜深了" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
  return `${part}，${name}`;
}

function pad(n: number) {
  return (n < 10 ? "0" : "") + n;
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconHub() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}
function IconMe() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.2-3 3.5-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="0.73" strokeLinecap="round">
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h12M13 6l6 6-6 6" />
    </svg>
  );
}

function MoodFace({ state }: { state: Resolve }) {
  const mouth =
    state === "done" ? "M7 14.5c1.2 1.5 2.8 2.2 5 2.2s3.8-.7 5-2.2" : state === "part" ? "M7.5 15h9" : "M7 16.5c1.3-1.5 3-2.2 5-2.2s3.7.7 5 2.2";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {state === "open" ? (
        <>
          <path d="M6.5 8.5 9.5 10M9.5 8.5 6.5 10M14.5 8.5 17.5 10M17.5 8.5 14.5 10" fill="none" stroke="#111" strokeWidth="0.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="8.2" cy="10" r="1.15" fill="#111" />
          <circle cx="15.8" cy="10" r="1.15" fill="#111" />
        </>
      )}
      <path d={mouth} fill="none" stroke="#111" strokeWidth="0.53" strokeLinecap="round" />
    </svg>
  );
}

function tagClass(status: string) {
  if (status === "待看") return "tag wait";
  if (status === "已送达" || status === "已回应") return "tag ok";
  if (status === "已降级") return "tag warm";
  return "tag";
}

export default function App() {
  const saved = useRef(loadSaved());
  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<View[]>([]);
  const [temper, setTemper] = useState<FaceId>(saved.current.temper);
  const [shown, setShown] = useState<FaceId>(saved.current.temper);
  const [name, setName] = useState(saved.current.name);
  const [freq, setFreq] = useState(saved.current.freq);
  const [paused, setPaused] = useState(saved.current.paused);
  const [ventOnly, setVentOnly] = useState(false);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [treeDraft, setTreeDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [letters, setLetters] = useState<Letter[]>(SEED_LETTERS);
  const [box, setBox] = useState<"in" | "out">("in");
  const [feel, setFeel] = useState("");
  const [when, setWhen] = useState("");
  const [need, setNeed] = useState("");
  const [previewOn, setPreviewOn] = useState(false);
  const [viaVoice, setViaVoice] = useState(false);
  const [callSec, setCallSec] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [clock, setClock] = useState("9:41");
  const [pop, setPop] = useState(0);
  const heardI = useRef(0);
  const msgId = useRef(1);
  const noteSeq = useRef(3);
  const temperRef = useRef(temper);
  const ventRef = useRef(ventOnly);
  const listenRef = useRef(listening);
  const floatRef = useRef<HTMLDivElement>(null);
  temperRef.current = temper;
  ventRef.current = ventOnly;
  listenRef.current = listening;

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ temper, name, freq, paused }));
    } catch {
      /* file:// or private mode */
    }
  }, [temper, name, freq, paused]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (view !== "call") return;
    const id = window.setInterval(() => setCallSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [view]);

  useEffect(() => {
    const el = floatRef.current;
    if (!el) return;
    el.classList.remove("bounce");
    void el.offsetWidth;
    el.classList.add("bounce");
  }, [pop]);

  useEffect(() => {
    if (!toastOn) return;
    const id = window.setTimeout(() => setToastOn(false), 2200);
    return () => window.clearTimeout(id);
  }, [toastOn, toast]);

  function ping(msg: string) {
    setToast(msg);
    setToastOn(true);
  }

  function show(next: View) {
    setView(next);
    if ((TABS as string[]).includes(next)) setTab(next as Tab);
    if (next !== "call") setCallSec(0);
  }
  function goTab(next: Tab) {
    setStack([]);
    setSheet(null);
    show(next);
  }
  function openSub(next: View) {
    setStack((s) => [...s, view]);
    show(next);
  }
  function back() {
    setSheet(null);
    const prev = stack[stack.length - 1] ?? tab;
    setStack((s) => s.slice(0, -1));
    show(prev);
  }

  function pushLine(role: "me" | "bot", text: string, tint: string) {
    const id = msgId.current++;
    setMessages((list) => [...list, { id, role, text, tint }]);
  }

  function speak(text: string) {
    const value = text.trim();
    if (!value) return;
    const face = ventRef.current ? temperRef.current : faceFor(value, temperRef.current);
    const tint = faceById(face).tint;
    pushLine("me", value, tint);
    setShown(face);
    setPop((n) => n + 1);
    window.setTimeout(() => {
      pushLine("bot", replyFor(value, face, ventRef.current), "#ffffff");
    }, 420);
    window.setTimeout(() => {
      if (!listenRef.current) setShown(temperRef.current);
    }, 4200);
  }

  function startListen() {
    if (listenRef.current) return;
    setListening(true);
    setShown("listen");
    setPop((n) => n + 1);
    window.setTimeout(() => {
      if (!listenRef.current) return;
      const line = HEARD[heardI.current % HEARD.length];
      heardI.current += 1;
      setListening(false);
      speak(line);
    }, 900);
  }

  function onHelp(e: FormEvent) {
    e.preventDefault();
    if (listening) return;
    if (!draft.trim()) {
      startListen();
      return;
    }
    const value = draft;
    setDraft("");
    speak(value);
  }

  function buildSentence() {
    if (!feel.trim() || !need.trim()) return "";
    return `${feel.trim()}${when.trim() ? `（${when.trim()}）` : ""}。我希望${need.trim()}。不是指责，只是这个需要。`;
  }

  function sendNote() {
    const sentence = buildSentence();
    if (!sentence || !previewOn) {
      ping("先预览，再确认转达。");
      return;
    }
    const id = "n" + noteSeq.current++;
    setLetters((list) => [
      {
        id,
        box: "out",
        who: viaVoice ? "语音代转" : "我刚确认的短笺",
        body: sentence,
        status: "已送达",
        meta: `${viaVoice ? "语音" : "短笺"} · 经你确认 · 不含原话`,
        reply: "",
      },
      ...list,
    ]);
    setPreviewOn(false);
    setViaVoice(false);
    setFeel("");
    setWhen("");
    setNeed("");
    setBox("out");
    ping("已送达。对方看到的是这句，不是原话。");
    show("letters");
  }

  const face = faceById(listening ? "listen" : shown);
  const rest = faceById(temper);
  const isTab = (TABS as string[]).includes(view);
  const homeLines = messages.slice(-2);
  const dayNote = (day: number) => DAY_NOTES.find((d) => d.day === day);
  const sentence = buildSentence();

  const cells: Array<number | null> = [
    ...Array.from({ length: CAL_LEAD }, () => null),
    ...Array.from({ length: CAL_DAYS }, (_, i) => i + 1),
  ];

  return (
    <div className="stage">
      <p className="stage-hint">
        间语 · Vite 原型
        <br />
        首页直接跟小间说。底栏四栏。
      </p>
      <div className="phone" data-temper={listening ? "listen" : shown}>
        <header className="status">
          <time>{clock}</time>
          <span className="island" aria-hidden="true" />
          <span className="status-icons" aria-hidden="true">
            <svg viewBox="0 0 18 12" width="17" height="12">
              <rect x="0" y="7" width="3" height="5" rx="0.6" />
              <rect x="5" y="4.5" width="3" height="7.5" rx="0.6" />
              <rect x="10" y="2" width="3" height="10" rx="0.6" />
              <rect x="15" y="0" width="3" height="12" rx="0.6" />
            </svg>
            <svg viewBox="0 0 16 12" width="15" height="12" fill="none" stroke="#111" strokeWidth="0.53" strokeLinecap="round">
              <path d="M1 4.6c3.2-2.6 10.8-2.6 14 0" />
              <path d="M3.5 7.2c2.2-1.7 6.8-1.7 9 0" />
            </svg>
            <svg viewBox="0 0 25 12" width="24" height="12">
              <rect x="0.7" y="0.7" width="20" height="10.6" rx="2.2" fill="none" stroke="#111" strokeWidth="0.43" />
              <rect x="2.4" y="2.4" width="15" height="7.2" rx="1" />
              <path d="M23 4.2v3.6" stroke="#111" strokeWidth="0.53" strokeLinecap="round" />
            </svg>
          </span>
        </header>

        <div className="app">
          <section className={view === "home" ? "screen on" : "screen"} id="view-home">
            <div className="home">
              <div className="home-top">
                <div>
                  <h1 className="greet">
                    {greet(name)}
                    <br />
                    今天感觉怎么样？
                  </h1>
                  <span className="mood">{face.name}</span>
                </div>
                <button className="backlog" type="button" onClick={() => goTab("cal")}>
                  还积着 {STATS.open}
                </button>
              </div>
              <div className="hero-zone">
                <div className={listening ? "float listening" : "float"} id="hero-float" ref={floatRef}>
                  <div className="sway">
                    <img id="hero-img" alt={`小间 · ${face.name}`} src={face.src} draggable={false} />
                  </div>
                </div>
              </div>
              <div className="bubbles" aria-live="polite">
                {homeLines.map((m) => (
                  <div key={m.id} className={m.role === "me" ? "bubble me" : "bubble bot"} style={m.role === "me" ? { background: m.tint } : undefined}>
                    {m.text}
                  </div>
                ))}
              </div>
              <form className={listening ? "help listening" : "help"} id="dock" onSubmit={onHelp}>
                <input
                  id="say"
                  value={draft}
                  placeholder={listening ? "在听…" : "跟小间说说"}
                  autoComplete="off"
                  enterKeyHint="send"
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className={listening ? "help-go hot" : "help-go"} type="submit" aria-label={draft.trim() ? "发送" : "说话"}>
                  {draft.trim() && !listening ? <IconArrow /> : <IconMic />}
                </button>
              </form>
            </div>
          </section>

          <section className={view === "hub" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">交流</h1>
              <p className="page-sub">同一件事，选一块说出去。</p>
              <div className="bento">
                <button className="tile tile-tree" type="button" onClick={() => openSub("tree")}>
                  <img className="tile-art" src="/channels/tree.png" alt="" draggable={false} />
                  <span className="tile-copy">
                    <span className="kicker">私密</span>
                    <span className="tile-title">树洞</span>
                    <span className="tile-desc">说给小间听，默认不转给对方。</span>
                  </span>
                </button>
                <button className="tile tile-note" type="button" onClick={() => openSub("letters")}>
                  <img className="tile-art" src="/channels/letters.png" alt="" draggable={false} />
                  <span className="tile-copy">
                    <span className="kicker">信件</span>
                    <span className="tile-title">信札</span>
                    <span className="tile-desc">短笺和回应</span>
                  </span>
                </button>
                <button className="tile tile-voice" type="button" onClick={() => openSub("composer")}>
                  <img className="tile-art" src="/channels/voice.png" alt="" draggable={false} />
                  <span className="tile-copy">
                    <span className="kicker">整理</span>
                    <span className="tile-title">语音</span>
                    <span className="tile-desc">收成一句需求</span>
                  </span>
                </button>
              </div>
              <button className="tile tile-phone" type="button" onClick={() => setSheet({ kind: "phone" })}>
                <img className="tile-art" src="/channels/phone.png" alt="" draggable={false} />
                <span className="tile-copy">
                  <span className="kicker">需当次确认</span>
                  <span className="tile-title">电话</span>
                  <span className="tile-desc">小间用自己的名字打。没接就改短笺，不连着打。</span>
                </span>
              </button>
            </div>
          </section>

          <section className={view === "cal" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">情绪日历</h1>
              <p className="page-sub">
                {CAL_YEAR}年{CAL_MONTH}月 · 两人之间的事
              </p>
              <div className="legend">
                <i className="done">已疏通</i>
                <i className="part">部分</i>
                <i className="open">未解决</i>
              </div>
              <div className="week">
                {"日一二三四五六".split("").map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cal-grid">
                {cells.map((day, i) => {
                  if (day == null) return <span key={`b${i}`} className="day blank" />;
                  const note = dayNote(day);
                  const state = note?.state ?? "empty";
                  return (
                    <button key={day} type="button" className={`day ${state}`} disabled={!note} onClick={() => note && setSheet({ kind: "day", day })}>
                      {note ? <MoodFace state={note.state} /> : null}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
              <section className="summary">
                <div className="kicker">本月小结</div>
                <h2>疏通了</h2>
                <p>
                  {STATS.total} 件里说开了 {STATS.done} 件。还积压 {STATS.open} 件，{STATS.part} 件只通了一半。
                </p>
                <div className="stats">
                  <div>
                    <b>{STATS.rate}%</b>
                    <span>疏通率</span>
                  </div>
                  <div>
                    <b>{STATS.part}</b>
                    <span>只通一半</span>
                  </div>
                  <div>
                    <b>{STATS.open}</b>
                    <span>还积着</span>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section className={view === "me" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">我的</h1>
              <p className="page-sub">点一只，首页的小间和颜色一起换。</p>
              <div className="temper-grid">
                {FACES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={temper === f.id ? "temper on" : "temper"}
                    style={{ background: f.tint }}
                    aria-pressed={temper === f.id}
                    onClick={() => {
                      setTemper(f.id);
                      setShown(f.id);
                      setListening(false);
                      setPop((n) => n + 1);
                      ping(`首页已换成「${f.name}」。`);
                    }}
                  >
                    <img src={f.src} alt="" draggable={false} />
                    <em>{f.name}</em>
                  </button>
                ))}
              </div>
              <div className="sec">设置</div>
              <div className="set-card">
                <button className="set-row" type="button" onClick={() => setSheet({ kind: "name" })}>
                  <span>
                    <b>怎么称呼你</b>
                    <small>只影响小间怎么叫你</small>
                  </span>
                  <span className="set-val">{name}</span>
                </button>
                <button
                  className="set-row"
                  type="button"
                  onClick={() => setFreq(FREQS[(FREQS.indexOf(freq) + 1) % FREQS.length])}
                >
                  <span>
                    <b>主动开口</b>
                    <small>还是要你自己接话</small>
                  </span>
                  <span className="set-val">{freq}</span>
                </button>
                <button
                  className="set-row"
                  type="button"
                  onClick={() => {
                    setPaused((v) => !v);
                    ping(!paused ? "已暂停主动找你。" : "主动开口恢复了。");
                  }}
                >
                  <span>
                    <b>暂停主动找我</b>
                    <small>首页仍然可以说话</small>
                  </span>
                  <span className={paused ? "switch on" : "switch"}>
                    <i />
                  </span>
                </button>
              </div>
              <div className="sec">微信</div>
              <div className="wx">
                <h3>微信里的小间</h3>
                <ul>
                  <li>聊天框里可以说，话回到首页和树洞。</li>
                  <li>短笺要在这里预览确认，电话要每次点头。</li>
                  <li>小间只用自己的名字，不会装成你的伴侣。</li>
                </ul>
                <p className="note">这是说明。这个原型不连接微信。</p>
              </div>
            </div>
          </section>

          <section className={view === "tree" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>树洞</h1>
                <p>{ventOnly ? "今天只倒苦水" : "完整记录留在这里"}</p>
              </div>
              <button
                className="vent"
                type="button"
                onClick={() => {
                  setVentOnly((v) => !v);
                  ping(!ventOnly ? "今天只倒苦水，不会建议转达。" : "可以听，也可以之后再整理。");
                }}
              >
                <span className={ventOnly ? "switch on" : "switch"}>
                  <i />
                </span>
                <span>只倒苦水</span>
              </button>
            </header>
            <div className="chat-log">
              {messages.length === 0 ? <p className="empty">树洞还是空的。日常说话在首页。</p> : null}
              {messages.map((m) => (
                <div key={m.id} className={m.role === "me" ? "bubble me" : "bubble bot"} style={m.role === "me" ? { background: m.tint } : undefined}>
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="help pad-help"
              onSubmit={(e) => {
                e.preventDefault();
                speak(treeDraft);
                setTreeDraft("");
              }}
            >
              <input value={treeDraft} placeholder="继续说给小间" onChange={(e) => setTreeDraft(e.target.value)} />
              <button className="help-go" type="submit" aria-label="发送">
                <IconArrow />
              </button>
            </form>
          </section>

          <section className={view === "letters" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>信札</h1>
                <p>对方看到的是短笺，不是原话</p>
              </div>
            </header>
            <div className="scroll tight">
              <div className="seg">
                <button type="button" className={box === "in" ? "on" : ""} onClick={() => setBox("in")}>
                  收到
                </button>
                <button type="button" className={box === "out" ? "on" : ""} onClick={() => setBox("out")}>
                  发出
                </button>
              </div>
              {letters.filter((n) => n.box === box).length === 0 ? <p className="empty">这一栏还是空的。</p> : null}
              {letters
                .filter((n) => n.box === box)
                .map((n) => (
                  <article key={n.id} className="letter">
                    <header>
                      <span className="who">{n.who}</span>
                      <span className={tagClass(n.status)}>{n.status}</span>
                    </header>
                    <p>{n.body}</p>
                    <div className="meta">{n.meta}</div>
                    {n.reply ? <div className="meta">你的回应：{n.reply}</div> : null}
                    {n.box === "in" && n.status === "待看" ? (
                      <div className="letter-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setLetters((list) => list.map((item) => (item.id === n.id ? { ...item, status: "稍后再看" } : item)));
                            ping("已放下。不会计时。");
                          }}
                        >
                          稍后
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyDraft("");
                            setSheet({ kind: "reply", id: n.id });
                          }}
                        >
                          回一句
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
            </div>
          </section>

          <section className={view === "composer" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>短笺</h1>
                <p>确认之后才发出</p>
              </div>
            </header>
            <div className="scroll tight">
              <label className="field">
                <span>感受</span>
                <input
                  value={feel}
                  placeholder="我有点闷"
                  onChange={(e) => {
                    setFeel(e.target.value);
                    setPreviewOn(false);
                    setViaVoice(false);
                  }}
                />
              </label>
              <label className="field">
                <span>当时</span>
                <input
                  value={when}
                  placeholder="你回得慢的时候"
                  onChange={(e) => {
                    setWhen(e.target.value);
                    setPreviewOn(false);
                    setViaVoice(false);
                  }}
                />
              </label>
              <label className="field">
                <span>希望对方</span>
                <input
                  value={need}
                  placeholder="先回我一句「晚点聊」"
                  onChange={(e) => {
                    setNeed(e.target.value);
                    setPreviewOn(false);
                    setViaVoice(false);
                  }}
                />
              </label>
              <button
                className="voice-btn"
                type="button"
                onClick={() => {
                  setFeel("我有点闷");
                  setWhen("你回得慢的时候");
                  setNeed("先回我一句「晚点聊」");
                  setViaVoice(true);
                  setPreviewOn(false);
                  ping("已整理成一句，还没发出。");
                }}
              >
                说一句（示意）
              </button>
              <div className={previewOn ? "preview on" : "preview"}>
                <div className="plabel">对方将看到</div>
                <p>{sentence}</p>
                <p className="warn">这是整理后的需求，不是原话。点下面才会发出。</p>
              </div>
              <button
                className="cta"
                type="button"
                onClick={() => {
                  if (!sentence) {
                    ping("先写下感受，和你希望的那一件小事。");
                    return;
                  }
                  setPreviewOn(true);
                }}
              >
                预览这句
              </button>
              <button className="cta" type="button" disabled={!previewOn} onClick={sendNote}>
                确认转达
              </button>
            </div>
          </section>

          <section className={view === "call" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>小间来电</h1>
                <p>我是小间，不是对方本人</p>
              </div>
            </header>
            <div className="call-body">
              <div className="call-flag">
                <span className="live" />
                <span>通话中 · 小间在说</span>
              </div>
              <img className="call-face" alt="" src={rest.src} />
              <div className="script">
                <span>小间正在说</span>
                <p>{SCRIPT}</p>
              </div>
              <div className="call-time">
                {pad(Math.floor(callSec / 60))}:{pad(callSec % 60)}
              </div>
              <div className="call-actions">
                <button
                  type="button"
                  onClick={() => {
                    ping("已挂断。没有录音。");
                    back();
                  }}
                >
                  <span className="round dark">挂</span>
                  <span>挂断</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = "n" + noteSeq.current++;
                    setLetters((list) => [
                      {
                        id,
                        box: "out",
                        who: "电话未接 · 改短笺",
                        body: "我有点闷。希望你忙的时候先回我一句「晚点聊」。不是指责。",
                        status: "已降级",
                        meta: "未接，没有再打",
                        reply: "",
                      },
                      ...list,
                    ]);
                    setSheet({ kind: "miss" });
                  }}
                >
                  <span className="round line">未</span>
                  <span>对方未接</span>
                </button>
              </div>
            </div>
          </section>

          <nav className={isTab ? "tabbar" : "tabbar hide"} role="tablist">
            {(
              [
                ["home", "首页", <IconHome key="h" />],
                ["hub", "交流", <IconHub key="u" />],
                ["cal", "日历", <IconCal key="c" />],
                ["me", "我的", <IconMe key="m" />],
              ] as const
            ).map(([id, label, icon]) => (
              <button key={id} className={tab === id && isTab ? "tab on" : "tab"} type="button" role="tab" aria-selected={tab === id} onClick={() => goTab(id)}>
                {icon}
                {label}
              </button>
            ))}
          </nav>

          {sheet ? (
            <div className="sheet">
              <div className="sheet-dim" onClick={() => setSheet(null)} />
              <div className="sheet-panel" role="dialog" aria-modal="true">
                <div className="grab" />
                {sheet.kind === "day" ? <DaySheet note={dayNote(sheet.day) as DayNote} onClose={() => setSheet(null)} /> : null}
                {sheet.kind === "phone" ? (
                  <>
                    <h2>这次请小间打过去？</h2>
                    <p className="lead">小间会报自己的名字，说明是代转。不会装成你，也不会装成对方。没接就改短笺，不会再打。</p>
                    <div className="script-box">
                      <b>将要说的</b>
                      {SCRIPT}
                    </div>
                    <p className="sheet-note">如果是紧急危险，先联系当地求助，而不是打这通电话。</p>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={() => setSheet(null)}>
                        先不打
                      </button>
                      <button
                        className="cta coral"
                        type="button"
                        onClick={() => {
                          setSheet(null);
                          setCallSec(0);
                          openSub("call");
                        }}
                      >
                        确认拨打
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "name" ? (
                  <>
                    <h2>怎么称呼你</h2>
                    <div className="name-list">
                      {NAMES.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={n === name ? "on" : ""}
                          onClick={() => {
                            setName(n);
                            setSheet(null);
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                {sheet.kind === "miss" ? (
                  <>
                    <h2>对方这会儿没接</h2>
                    <p className="lead">已改成一条短笺，没有继续打。</p>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={() => { setSheet(null); back(); }}>
                        知道了
                      </button>
                      <button
                        className="cta"
                        type="button"
                        onClick={() => {
                          setSheet(null);
                          setBox("out");
                          setStack((s) => s.filter((v) => v !== "call"));
                          show("letters");
                        }}
                      >
                        去信札
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "reply" ? (
                  <>
                    <h2>回一句</h2>
                    <label className="field" style={{ marginTop: 12 }}>
                      <span>你的一句</span>
                      <input value={replyDraft} placeholder="好，我记下了" onChange={(e) => setReplyDraft(e.target.value)} />
                    </label>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={() => setSheet(null)}>
                        取消
                      </button>
                      <button
                        className="cta"
                        type="button"
                        onClick={() => {
                          const reply = replyDraft.trim();
                          if (!reply) {
                            ping("先写一句。");
                            return;
                          }
                          const id = sheet.id;
                          setLetters((list) => list.map((item) => (item.id === id ? { ...item, status: "已回应", reply } : item)));
                          setSheet(null);
                        }}
                      >
                        送出
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={toastOn ? (isTab ? "toast show" : "toast show low") : "toast"} role="status">
            {toast}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaySheet({ note, onClose }: { note: DayNote; onClose: () => void }) {
  return (
    <>
      <h2>
        {CAL_MONTH}月{note.day}日 · {STATE_LABEL[note.state]}
      </h2>
      <p className="lead">{note.issue}</p>
      <div className="script-box">{note.detail}</div>
      <div className="sheet-actions">
        <button className="cta" type="button" onClick={onClose}>
          知道了
        </button>
      </div>
    </>
  );
}
