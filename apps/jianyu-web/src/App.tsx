import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CAL_DAYS,
  CAL_LEAD,
  CAL_MONTH,
  CAL_YEAR,
  DAY_NOTES,
  DEMO_TODAY,
  FACES,
  FREQS,
  FIRM_REPLY,
  GOLDEN_CARD,
  NAMES,
  NEED_THRESHOLD,
  PARTNER,
  PRECALL_LINE,
  SEED_LETTERS,
  SEED_NEED_HISTORY,
  SEED_NEED_TODAY,
  SEED_TREE,
  SOFT_CHECKIN,
  SOFT_REPLIES,
  STATE_LABEL,
  asideFor,
  bumpNeed,
  callScript,
  cardFromText,
  daySoftLabel,
  faceById,
  faceFor,
  guidesFor,
  isLightReply,
  monthStats,
  noteFromConvey,
  relayLines,
  relayText,
  tierFor,
  type DayNote,
  type EmotionCard,
  type FaceId,
  type Letter,
  type NeedSource,
} from "./data.ts";

type View =
  | "home"
  | "hub"
  | "cal"
  | "me"
  | "letters"
  | "draft"
  | "preview"
  | "incoming"
  | "call"
  | "delivered"
  | "guide"
  | "together"
  | "voice";
type Tab = "home" | "hub" | "cal" | "me";
type Msg = { id: number; day: number; role: "me" | "bot"; text: string; tint: string; at?: string };
type Channel = "letter" | "call";
type Lens = "ning" | "zhou";
type Sheet =
  | { kind: "day"; day: number }
  | { kind: "name" }
  | { kind: "permit" }
  | { kind: "miss" }
  | { kind: "demo-call" }
  | { kind: "demo-call-confirm" }
  | { kind: "call-confirm"; enter: boolean }
  | { kind: "need-ask" }
  | { kind: "call-empty" }
  | null;

const ASK_KEY = "jianyu-need-asked";

function readAsked(): number | null {
  try {
    const raw = localStorage.getItem(ASK_KEY);
    const n = Number(raw);
    return raw && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

const TABS: Tab[] = ["home", "hub", "cal", "me"];
const STORE = "jianyu-web";
const CALL_FACE = "/xiaojian/calm.png";

function loadSaved(): { temper: FaceId; name: string; freq: string; paused: boolean; calls: boolean } {
  const fallback = { temper: "calm" as FaceId, name: "阿宁", freq: "刚好就好", paused: false, calls: false };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "null") as Partial<typeof fallback> | null;
    if (!raw) return fallback;
    const temper = FACES.some((f) => f.id === raw.temper) ? (raw.temper as FaceId) : fallback.temper;
    return {
      temper,
      name: raw.name || fallback.name,
      freq: raw.freq || fallback.freq,
      paused: !!raw.paused,
      calls: !!raw.calls,
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

function cloneDays() {
  return DAY_NOTES.map((d) => ({ ...d }));
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="7.2" />
      <circle cx="9.4" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <path d="M9.2 14.2c.9.9 4.7.9 5.6 0" />
    </svg>
  );
}
function IconHub() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h11" />
      <path d="M12 6.5 17.5 12 12 17.5" />
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
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
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

/** 倾诉旁白最多每三张卡一句。 */
function sparseAsides(lines: Msg[]): Msg[] {
  let me = 0;
  const out: Msg[] = [];
  for (const line of lines) {
    if (line.role === "me") {
      me += 1;
      out.push(line);
      continue;
    }
    if (me > 0 && me % 3 === 0) out.push(line);
  }
  return out;
}

function tagClass(status: string) {
  if (status === "待看" || status === "稍后再看") return "tag wait";
  if (status === "已送达" || status === "已回应") return "tag ok";
  if (status === "已降级") return "tag warm";
  return "tag";
}

export default function App() {
  const [saved] = useState(loadSaved);
  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<View[]>([]);
  const [temper, setTemper] = useState<FaceId>(saved.temper);
  const [shown, setShown] = useState<FaceId>(saved.temper);
  const [name, setName] = useState(saved.name);
  const [freq, setFreq] = useState(saved.freq);
  const [paused, setPaused] = useState(saved.paused);
  const [callsEnabled, setCallsEnabled] = useState(saved.calls);
  const [ventOnly, setVentOnly] = useState(false);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [letters, setLetters] = useState<Letter[]>(SEED_LETTERS);
  const [box, setBox] = useState<"in" | "out">("in");
  const [lens, setLens] = useState<Lens>("ning");
  const [card, setCard] = useState<EmotionCard | null>(null);
  const [offer, setOffer] = useState(false);
  const [guideCard, setGuideCard] = useState<EmotionCard | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [days, setDays] = useState<DayNote[]>(cloneDays);
  const [callSec, setCallSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zhouNod, setZhouNod] = useState(false);
  const [partnerReply, setPartnerReply] = useState("");
  const [callArmed, setCallArmed] = useState(false);
  const [chipHidden, setChipHidden] = useState(false);
  const [chipSoft, setChipSoft] = useState(false);
  const [chipFlash, setChipFlash] = useState(0);
  const [chipPulse, setChipPulse] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [togetherOpen, setTogetherOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [needScore, setNeedScore] = useState(SEED_NEED_TODAY);
  const [needHistory, setNeedHistory] = useState(() => SEED_NEED_HISTORY.map((item) => ({ ...item })));
  const [needChartOpen, setNeedChartOpen] = useState(false);
  const [needDetail, setNeedDetail] = useState(false);
  const [moreFor, setMoreFor] = useState<string | null>(null);
  const [askedDay, setAskedDay] = useState<number | null>(readAsked);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [clock, setClock] = useState("9:41");
  const [pop, setPop] = useState(0);
  const msgId = useRef(1);
  const noteSeq = useRef(3);
  const temperRef = useRef(temper);
  const ventRef = useRef(ventOnly);
  const listenRef = useRef(listening);
  const viewRef = useRef(view);
  const nameRef = useRef(name);
  const callsRef = useRef(callsEnabled);
  const scoreRef = useRef(needScore);
  const askedRef = useRef(askedDay);
  const voiceSeen = useRef(false);
  const holdRef = useRef<number | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stats = monthStats(days);
  const face = faceById(listening ? "listen" : shown);
  const isTab = (TABS as string[]).includes(view);
  const fresh = letters.find((item) => item.fresh);
  const script = card ? callScript(card, name) : "";
  const guides = guidesFor(name, PARTNER);
  const tier = tierFor(needScore);
  const needReady = needScore >= NEED_THRESHOLD;

  useEffect(() => {
    temperRef.current = temper;
    ventRef.current = ventOnly;
    listenRef.current = listening;
    viewRef.current = view;
    nameRef.current = name;
    callsRef.current = callsEnabled;
  }, [temper, ventOnly, listening, view, name, callsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ temper, name, freq, paused, calls: callsEnabled }));
    } catch {
      /* file:// or private mode */
    }
  }, [temper, name, freq, paused, callsEnabled]);

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
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "pop") el.classList.remove("bounce");
    };
    el.addEventListener("animationend", onEnd);
    return () => el.removeEventListener("animationend", onEnd);
  }, []);

  useEffect(() => {
    const el = floatRef.current;
    if (!el || pop === 0) return;
    el.classList.remove("bounce");
    void el.offsetWidth;
    el.classList.add("bounce");
  }, [pop]);

  useEffect(() => {
    if (!toastOn) return;
    const id = window.setTimeout(() => setToastOn(false), 2400);
    return () => window.clearTimeout(id);
  }, [toastOn, toast]);

  useEffect(() => {
    askedRef.current = askedDay;
  }, [askedDay]);

  useEffect(() => {
    if (view !== "voice") {
      voiceSeen.current = false;
      return;
    }
    if (voiceSeen.current) return;
    voiceSeen.current = true;
    raiseNeed("voice");
  }, [view]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 9999 });
  }, [messages, view]);

  function ping(msg: string) {
    setToast(msg);
    setToastOn(true);
  }

  function show(next: View) {
    setView(next);
    if ((TABS as string[]).includes(next)) setTab(next as Tab);
    if (next !== "call") setCallSec(0);
    if (next !== "voice") setPlaying(false);
    if (next === "home" && viewRef.current !== "home") setChipHidden(false);
  }
  function goTab(next: Tab) {
    setStack([]);
    setSheet(null);
    show(next);
  }
  function openSub(next: View) {
    setStack((s) => [...s, viewRef.current]);
    show(next);
  }
  function back() {
    setSheet(null);
    const prev = stack[stack.length - 1] ?? tab;
    setStack((s) => s.slice(0, -1));
    show(prev);
  }
  function land(next: View) {
    setStack([]);
    setSheet(null);
    show(next);
  }

  function markAsked() {
    if (askedRef.current === DEMO_TODAY) return;
    askedRef.current = DEMO_TODAY;
    setAskedDay(DEMO_TODAY);
    try {
      localStorage.setItem(ASK_KEY, String(DEMO_TODAY));
    } catch {
      /* private mode */
    }
  }

  function raiseNeed(source: NeedSource, text = "", venting = false) {
    const prev = scoreRef.current;
    const next = bumpNeed(prev, source, text, venting);
    scoreRef.current = next;
    setNeedScore(next);
    setNeedHistory((hist) => hist.map((item) => (item.day === DEMO_TODAY ? { ...item, score: next } : item)));
    if (prev < NEED_THRESHOLD && next >= NEED_THRESHOLD && askedRef.current !== DEMO_TODAY) {
      markAsked();
      window.setTimeout(() => setSheet({ kind: "need-ask" }), 480);
    }
  }

  function pushLine(role: "me" | "bot", text: string, tint: string, at?: string) {
    const id = msgId.current++;
    setMessages((list) => [...list, { id, day: DEMO_TODAY, role, text, tint, at }]);
  }

  function speak(text: string, opts?: { source?: NeedSource; chip?: boolean }) {
    const value = text.trim();
    if (!value) return;
    const source = opts?.source ?? "tree";
    const chip = opts?.chip === true;
    const vent = ventRef.current;
    const faceId = vent ? temperRef.current : faceFor(value, temperRef.current);
    const tint = faceById(faceId).tint;
    const nextCard = vent || chip ? null : cardFromText(value);
    const priorMe = SEED_TREE.filter((line) => line.role === "me").length + messages.filter((line) => line.role === "me").length;
    const sayAside = (priorMe + 1) % 3 === 0;
    pushLine("me", value, tint, "刚刚");
    setShown(faceId);
    setListening(false);
    setPop((n) => n + 1);
    raiseNeed(source, value, vent);
    const bot = asideFor(value, vent);
    window.setTimeout(() => {
      if (sayAside) pushLine("bot", bot, "#ffffff");
      if (nextCard) {
        setCard(nextCard);
        setOffer(true);
        setChipHidden(false);
        setChipSoft(false);
        setChipPulse(true);
        setChipFlash((n) => n + 1);
      }
    }, 420);
  }

  function acceptNeedAsk() {
    if (!card) setCard({ ...GOLDEN_CARD });
    setSheet({ kind: "call-confirm", enter: true });
  }

  function declineNeedAsk() {
    const source = card ?? { ...GOLDEN_CARD };
    setSheet(null);
    enterPreview(source);
  }

  function openCallTile() {
    if (!card) {
      setSheet({ kind: "call-empty" });
      return;
    }
    setSheet({ kind: "call-confirm", enter: false });
  }

  function holdNeedStart() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => setNeedDetail(true), 520);
  }

  function holdNeedEnd() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }

  function toggleListen() {
    if (listenRef.current) {
      setListening(false);
      return;
    }
    setListening(true);
    setPop((n) => n + 1);
  }

  function onHelp(e: FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (listening && !value) {
      setListening(false);
      return;
    }
    if (!value) {
      toggleListen();
      return;
    }
    setDraft("");
    setListening(false);
    speak(value, { source: "tree" });
  }

  function deliver(source: EmotionCard, status: string, meta: string, reply: string) {
    const id = "n" + noteSeq.current++;
    const letter: Letter = {
      id,
      box: "out",
      who: "小间",
      body: relayText(source, nameRef.current),
      status: reply ? "已回应" : status,
      meta,
      reply,
      conflict: source.conflict,
      fresh: true,
    };
    setLetters((list) => [letter, ...list.map((item) => ({ ...item, fresh: false }))]);
    setGuideCard(source);
    setOffer(false);
    setPartnerReply(isLightReply(reply) ? reply : "");
    setGuideOpen(false);
    setTogetherOpen(false);
    setZhouNod(false);
    setCallArmed(false);
    setDays((list) => list.map((d) => (d.day === DEMO_TODAY ? noteFromConvey(source, reply) : d)));
    setLens("zhou");
    setBox("in");
    if (source.conflict) land("delivered");
    else land("letters");
  }

  function enterPreview(source?: EmotionCard) {
    if (source) setCard(source);
    setChannel("letter");
    setCallArmed(false);
    setSheet(null);
    if (viewRef.current !== "preview") openSub("preview");
  }

  function armCall(source?: EmotionCard) {
    if (source) setCard(source);
    setChannel("call");
    setCallArmed(true);
    setSheet(null);
    if (viewRef.current !== "preview") openSub("preview");
  }

  function keepLetter(source?: EmotionCard) {
    if (source) setCard(source);
    setChannel("letter");
    setCallArmed(false);
    setSheet(null);
    if (viewRef.current !== "preview") openSub("preview");
  }

  function sendChosen() {
    if (!card || !channel) {
      ping("先选信札，或小间来电。");
      return;
    }
    if (channel === "letter") {
      deliver(card, "待看", "短笺 · 小周还没回", "");
      ping("已放进小周的信札。送出去的是这三句。");
      return;
    }
    setStack((s) => [...s, "preview"]);
    show("incoming");
    if (!callsRef.current) setSheet({ kind: "permit" });
  }

  function allowCalls() {
    setCallsEnabled(true);
    setSheet(null);
  }

  function declineCalls() {
    if (!card) return;
    setSheet(null);
    deliver(card, "已降级", "没有打开来电，改成了信札", "");
    ping("没打开来电。这句改成信札了，不会再打。");
  }

  function answerCall() {
    setSheet(null);
    setCallSec(0);
    show("call");
  }

  function laterCall() {
    if (!card) return;
    deliver(card, "待看", "来电选了稍后，没有再打", "");
    ping("已稍后。不会再打，短笺留在信札里。");
  }

  function missedCall() {
    if (!card) return;
    deliver(card, "已降级", "没接到，已改成信札，没有再打", "");
    setSheet({ kind: "miss" });
  }

  function replyTo(id: string, reply: string) {
    setLetters((list) => list.map((item) => (item.id === id ? { ...item, status: "已回应", reply, fresh: true } : { ...item, fresh: false })));
    const item = letters.find((n) => n.id === id);
    if (item?.box === "out" && item.conflict) {
      if (isLightReply(reply)) setPartnerReply(reply);
      if (guideCard) setDays((list) => list.map((d) => (d.day === DEMO_TODAY ? noteFromConvey(guideCard, reply) : d)));
    }
    ping(`${lens === "zhou" ? "小周" : name}回了「${reply}」。`);
  }

  function resetDemo() {
    noteSeq.current = 3;
    msgId.current = 1;
    setLetters(SEED_LETTERS.map((n) => ({ ...n })));
    setDays(cloneDays());
    setMessages([]);
    setCard(null);
    setOffer(false);
    setGuideCard(null);
    setCallsEnabled(false);
    setVentOnly(false);
    setListening(false);
    setLens("ning");
    setBox("in");
    setChannel("letter");
    setCallArmed(false);
    setZhouNod(false);
    setPartnerReply("");
    setChipHidden(false);
    setChipSoft(false);
    setChipFlash(0);
    setChipPulse(false);
    setReviewOpen(false);
    setGuideOpen(false);
    setTogetherOpen(false);
    setDraft("");
    setNeedDetail(false);
    setMoreFor(null);
    scoreRef.current = SEED_NEED_TODAY;
    askedRef.current = null;
    setNeedScore(SEED_NEED_TODAY);
    setNeedHistory(SEED_NEED_HISTORY.map((item) => ({ ...item })));
    setNeedChartOpen(false);
    setAskedDay(null);
    try {
      localStorage.removeItem(ASK_KEY);
    } catch {
      /* private mode */
    }
    ping("演示回到开头。来电仍然关着。");
    goTab("home");
  }

  function visibleLetters() {
    const want = lens === "ning" ? box : box === "in" ? "out" : "in";
    return letters.filter((n) => n.box === want);
  }

  function canReply(n: Letter) {
    if (n.reply || n.status === "稍后再看") return false;
    if (lens === "zhou" && n.box === "out") return true;
    if (lens === "ning" && n.box === "in") return true;
    return false;
  }

  const cells: Array<number | null> = [...Array.from({ length: CAL_LEAD }, () => null), ...Array.from({ length: CAL_DAYS }, (_, i) => i + 1)];
  const dayNote = (day: number) => days.find((d) => d.day === day);
  const journalLines = [...SEED_TREE, ...messages];
  const shownJournal = sparseAsides(journalLines);
  const journalGroups = Array.from(
    shownJournal.reduce((map, line) => {
      const list = map.get(line.day) ?? [];
      list.push(line);
      map.set(line.day, list);
      return map;
    }, new Map<number, Msg[]>()),
  ).sort((a, b) => a[0] - b[0]);
  function ventsOn(day: number) {
    return journalLines.filter((line) => line.day === day && line.role === "me");
  }
  const canSend = draft.trim().length > 0;
  const heroFace = listening ? faceById("listen") : face;
  const shownCard = guideCard ?? card;
  function renderGuideExtras() {
    return (
    <>
      <p className="demo-bar">演示：两张并排。真用的时候，每人只看到自己的那张。</p>
      {guides.map((g) => (
        <article key={g.who} className={`guide-card ${g.tone}`}>
          <div className="who">给{g.who}</div>
          <h3>{g.title}</h3>
          <div className="step-label">我可以做的一小步</div>
          <p className="step">{g.step}</p>
          <div className="step-label">送出去之前</div>
          <p className="step">{g.check}</p>
        </article>
      ))}
      {partnerReply ? (
        <button className="fold inner" type="button" aria-expanded={togetherOpen} onClick={() => setTogetherOpen((v) => !v)}>
          <span>若两边都回了一句，可邀请一起聊</span>
          <small>{togetherOpen ? "收起" : "展开"}</small>
        </button>
      ) : (
        <p className="lock-note">等对方回一句之后，再考虑要不要一起聊</p>
      )}
      {togetherOpen && partnerReply ? (
        <button
          className="cta"
          type="button"
          onClick={() => {
            setZhouNod(false);
            openSub("together");
          }}
        >
          邀请一起聊 10 分钟
        </button>
      ) : null}
    </>
    );
  }

  return (
    <div className="stage">
      <p className="stage-hint">
        间语 · 阿宁 / 小周
        <br />
        先被小间接住，再决定要不要轻轻递出去。
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
          <section className={view === "home" ? "screen on" : "screen"}>
            <div className="home vent-home">
              <div className="home-top">
                <div>
                  <h1 className="greet">
                    {greet(name)}
                    <span className="greet-soft">想说就说，不说也行。</span>
                  </h1>
                  <span className="mood presence">小间在</span>
                </div>
                <button className="month-link" type="button" onClick={() => goTab("cal")} aria-label="痕迹">
                  <IconCal />
                  <span>痕迹</span>
                </button>
              </div>
              <div className={listening ? "half-hero listening" : "half-hero"}>
                <div className="halo" aria-hidden="true" />
                <div className={listening ? "float listening" : "float"} ref={floatRef}>
                  <div className="sway">
                    <img alt="小间" src={heroFace.src} draggable={false} />
                  </div>
                </div>
              </div>
              <div className="vent-log home-log" ref={logRef}>
                {journalGroups.map(([day, lines]) => (
                  <div key={day} className="day-group">
                    <div className="day-label soft">{daySoftLabel(day)}</div>
                    {lines.map((m) =>
                      m.role === "me" ? (
                        <article key={m.id} className="journal-card" style={{ background: m.tint }}>
                          {m.at ? <time>{m.at}</time> : null}
                          <p>{m.text}</p>
                        </article>
                      ) : (
                        <p key={m.id} className="aside-line">
                          {m.text}
                        </p>
                      ),
                    )}
                  </div>
                ))}
                {messages.every((m) => m.role !== "me") ? <p className="vent-empty">今天的话会留在这里。</p> : null}
              </div>
              <div className="dock-stack home-dock">
                <button
                  className={ventOnly ? "vent-quiet on" : "vent-quiet"}
                  type="button"
                  aria-pressed={ventOnly}
                  onClick={() => {
                    setVentOnly((v) => !v);
                    ping(!ventOnly ? "今天只倒在这里，不收成卡。" : "要不要让小周知道，你再定。");
                  }}
                >
                  {ventOnly ? "今天只倒，不递出" : "只倒给小间"}
                </button>
                {messages.length === 0 ? (
                  <button className="suggest" type="button" onClick={() => speak(SOFT_CHECKIN, { source: "home", chip: true })}>
                    {SOFT_CHECKIN}
                  </button>
                ) : null}
                {offer && card && !ventOnly && !chipHidden ? (
                  <div
                    className={chipPulse ? "chip-row pulse" : "chip-row"}
                    key={chipFlash}
                    onAnimationEnd={() => setChipPulse(false)}
                  >
                    <button className="card-chip" type="button" onClick={() => openSub("draft")}>
                      <span>
                        <b>{chipSoft ? "还有一张未看的卡" : "情绪卡好了"}</b>
                        <small>{chipSoft ? "想看的时候再点开" : `还没决定要不要让${PARTNER}知道`}</small>
                      </span>
                    </button>
                    <button
                      className="chip-dismiss"
                      type="button"
                      onClick={() => {
                        setChipHidden(true);
                        setChipSoft(true);
                        setChipPulse(false);
                      }}
                    >
                      先放下
                    </button>
                  </div>
                ) : null}
                {fresh ? (
                  <button
                    className="live-pill"
                    type="button"
                    onClick={() => {
                      setLens("zhou");
                      setBox("in");
                      openSub("letters");
                    }}
                  >
                    <span>
                      <b>{fresh.reply ? `${PARTNER}回了「${fresh.reply}」` : fresh.status === "已降级" ? "没接到，已改成信札" : `已经送到，等${PARTNER}回`}</b>
                      <small>{fresh.reply ? "点开可以看这封信札" : "点开信札，可以回一句"}</small>
                    </span>
                  </button>
                ) : null}
                <form className={listening ? "help listening" : "help"} onSubmit={onHelp}>
                  <input
                    value={draft}
                    placeholder={listening ? "在听…" : "说给小间"}
                    autoComplete="off"
                    enterKeyHint="send"
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    className={canSend ? "help-go send" : listening ? "help-go mic hot" : "help-go mic"}
                    type="submit"
                    aria-label={canSend ? "发送" : listening ? "停止" : "说话"}
                  >
                    {canSend ? <IconArrow /> : <IconMic />}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className={view === "hub" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">递出</h1>
              <p className="page-sub">信札，或一通很短的来电。</p>
              <div className="bento bento-two">
                <button className="tile tile-note" type="button" onClick={() => openSub("letters")}>
                  <img className="tile-art" src="/channels/letters.png" alt="" draggable={false} />
                  <span className="tile-copy">
                    <span className="tile-title">信札</span>
                    <span className="tile-desc">低承诺回一句。</span>
                  </span>
                </button>
                <button className="tile tile-call" type="button" onClick={openCallTile}>
                  <img className="tile-art" src="/channels/phone.png" alt="" draggable={false} />
                  <span className="tile-copy">
                    <span className="tile-title">小间来电</span>
                    <span className="tile-desc">很短，默认关着。</span>
                  </span>
                </button>
              </div>
              <div className={`need-soft tier-${tier.id}`}>
                {needReady ? (
                  <button className="ask-chip" type="button" onClick={() => setSheet({ kind: "need-ask" })}>
                    小间想问你一声
                  </button>
                ) : (
                  <p className="need-stage">{tier.label}</p>
                )}
                <div
                  className="need-glow"
                  onPointerDown={holdNeedStart}
                  onPointerUp={holdNeedEnd}
                  onPointerLeave={holdNeedEnd}
                  onPointerCancel={holdNeedEnd}
                >
                  <div className="need-glow-fill" style={{ width: `${Math.max(8, Math.min(100, needScore))}%` }} />
                </div>
                <div className="need-meta">
                  <button className="need-detail" type="button" onClick={() => setNeedDetail((open) => !open)}>
                    {needDetail ? "收起" : "详情"}
                  </button>
                  <button
                    className="need-trend"
                    type="button"
                    aria-expanded={needChartOpen}
                    onClick={() => setNeedChartOpen((open) => !open)}
                  >
                    {needChartOpen ? "收起" : "近几天"}
                  </button>
                </div>
                {needDetail ? (
                  <p className="need-secret">
                    {needScore} · 问你的线在 {NEED_THRESHOLD}
                  </p>
                ) : null}
                {needChartOpen ? (
                  <div>
                    <NeedChart points={needHistory} />
                    <p className="need-chart-note">近几天</p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className={view === "cal" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">痕迹</h1>
              <p className="page-sub">
                {stats.total === 0 ? "这个月还没记下什么。" : `${CAL_YEAR}年${CAL_MONTH}月 · 点一天看疏通状态`}
              </p>
              <div className="legend">
                <i className="done">已疏通</i>
                <i className="part">说了一半</i>
                <i className="open">还闷着</i>
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
                    <button
                      key={day}
                      type="button"
                      className={`day ${state}${note ? " has" : ""}${day === DEMO_TODAY ? " today" : ""}`}
                      disabled={!note}
                      onClick={() => note && setSheet({ kind: "day", day })}
                    >
                      <span>{day}</span>
                      <i className="dot" />
                    </button>
                  );
                })}
              </div>
              <button className="fold" type="button" aria-expanded={reviewOpen} onClick={() => setReviewOpen((v) => !v)}>
                <span>本月回顾</span>
                <small>{reviewOpen ? "收起" : "展开"}</small>
              </button>
              {reviewOpen ? (
                <section className="summary">
                  <div className="kicker">本月回顾</div>
                  <h2>说开了</h2>
                  <p>
                    {stats.total} 件里说开了 {stats.done} 件。{stats.part} 件说了一半，{stats.open} 件还闷着。
                  </p>
                  <div className="stats">
                    <div>
                      <b>{stats.rate}%</b>
                      <span>说开了</span>
                    </div>
                    <div>
                      <b>{stats.part}</b>
                      <span>说了一半</span>
                    </div>
                    <div>
                      <b>{stats.open}</b>
                      <span>还闷着</span>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </section>

          <section className={view === "me" ? "screen on" : "screen"}>
            <div className="scroll">
              <h1 className="page-title">我的</h1>
              <p className="page-sub">点一只，小间的样子和颜色一起换。</p>
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
                      ping(`小间已换成「${f.name}」。`);
                    }}
                  >
                    <img src={f.src} alt="" draggable={false} />
                    <em>{f.name}</em>
                  </button>
                ))}
              </div>
              <div className="sec">设置</div>
              <div className="set-card">
                <button
                  className="set-row"
                  type="button"
                  onClick={() => {
                    setCallsEnabled((v) => !v);
                    ping(!callsEnabled ? "已允许小间来电。" : "来电关了。下次打过来会再问一次。");
                  }}
                >
                  <span>
                    <b>允许小间来电</b>
                    <small>默认关。不答应也不会被催，会改成信札</small>
                  </span>
                  <span className={callsEnabled ? "switch on" : "switch"}>
                    <i />
                  </span>
                </button>
                <button className="set-row" type="button" onClick={() => setSheet({ kind: "name" })}>
                  <span>
                    <b>怎么称呼你</b>
                    <small>只影响小间怎么叫你</small>
                  </span>
                  <span className="set-val">{name}</span>
                </button>
                <button className="set-row" type="button" onClick={() => setFreq(FREQS[(FREQS.indexOf(freq) + 1) % FREQS.length])}>
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
                    <small>小间里仍然可以说话</small>
                  </span>
                  <span className={paused ? "switch on" : "switch"}>
                    <i />
                  </span>
                </button>
              </div>
              <button className="linkish" type="button" onClick={resetDemo}>
                把这条演示回到开头
              </button>
              <button className="linkish deep-demo" type="button" onClick={() => setSheet({ kind: "demo-call" })}>
                演示来电
              </button>
            </div>
          </section>

          <section className={view === "draft" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>情绪卡</h1>
                <p>只给你看 · 还没送出</p>
              </div>
            </header>
            <div className="scroll tight">
              {card ? (
                <>
                  <article className="emo-card">
                    <div className="kicker">感受 · 情境 · 一件小事</div>
                    <h2>我听到的是</h2>
                    <div className="emo-line">
                      <b>感受</b>
                      <span>我感到{card.feel}</span>
                    </div>
                    <div className="emo-line">
                      <b>情境</b>
                      <span>当{card.situation}的时候</span>
                    </div>
                    <div className="emo-line">
                      <b>需要</b>
                      <span>我希望{card.need}</span>
                    </div>
                  </article>
                  <div className="raw-box">
                    <b>树洞里的话 · 留在这里</b>
                    <p>{card.raw}</p>
                  </div>
                  <div className="choice-row">
                    <button
                      className="cta"
                      type="button"
                      onClick={() => {
                        setCard(null);
                        setOffer(false);
                        ping("留在小间了。");
                        back();
                      }}
                    >
                      只留在小间
                    </button>
                    <button className="cta ghost" type="button" onClick={() => enterPreview()}>
                      想让小周知道
                    </button>
                  </div>
                </>
              ) : (
                <p className="empty">还没有情绪卡。先在小间说一句。</p>
              )}
            </div>
          </section>

          <section className={view === "preview" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>送出前看一眼</h1>
                <p>确认之后才会送出</p>
              </div>
            </header>
            <div className="scroll tight">
              {card ? (
                <>
                  <article className="preview-card">
                    <div className="plabel">小间想说清楚的</div>
                    <h2>只有这三句</h2>
                    <div className="relay">
                      {relayLines(card, name).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <p className="warn">树洞里的话还留在树洞。来电上的名字是小间。</p>
                  </article>
                  <label className="field">
                    <span>感受</span>
                    <input value={card.feel} onChange={(e) => setCard({ ...card, feel: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>情境</span>
                    <input value={card.situation} onChange={(e) => setCard({ ...card, situation: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>正向需求</span>
                    <input value={card.need} onChange={(e) => setCard({ ...card, need: e.target.value })} />
                  </label>
                  <div className="chan-row">
                    <button
                      type="button"
                      className={channel === "letter" ? "chan chan-letter on" : "chan chan-letter"}
                      onClick={() => {
                        setChannel("letter");
                        setCallArmed(false);
                      }}
                    >
                      <span className="kicker">短笺 · 默认</span>
                      <b>信札</b>
                      <small>{PARTNER}可以回「我收到了」或「这几天再聊」。</small>
                    </button>
                    <button
                      type="button"
                      className={channel === "call" && callArmed ? "chan chan-call on" : "chan chan-call"}
                      onClick={() => setSheet({ kind: "call-confirm", enter: false })}
                    >
                      <span className="kicker">需对方允许</span>
                      <b>小间来电</b>
                      <small>不确定就用信札。点开会再确认一次。</small>
                    </button>
                  </div>
                  <button
                    className="cta"
                    type="button"
                    disabled={!(channel === "letter" || (channel === "call" && callArmed)) || !card.feel.trim() || !card.need.trim()}
                    onClick={sendChosen}
                  >
                    {channel === "call" && callArmed ? `确认请小间打给${PARTNER}` : channel === "letter" ? `放进${PARTNER}的信札` : "先选一种送达"}
                  </button>
                  <button className="text-btn hear" type="button" onClick={() => openSub("voice")}>
                    听小间读一遍
                  </button>
                </>
              ) : (
                <p className="empty">还没有可以送出的卡。</p>
              )}
            </div>
          </section>

          <section className={view === "letters" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>信札</h1>
                <p>{lens === "ning" ? `${name}的信札` : `${PARTNER}看到的短笺`}</p>
              </div>
              <div className="who-switch" role="tablist" aria-label="看谁的信札">
                <button type="button" className={lens === "ning" ? "on" : ""} onClick={() => setLens("ning")}>
                  {name}
                </button>
                <button type="button" className={lens === "zhou" ? "on" : ""} onClick={() => setLens("zhou")}>
                  {PARTNER}
                </button>
              </div>
            </header>
            <div className="scroll tight">
              <div className="seg seg-lite">
                <button type="button" className={box === "in" ? "on" : ""} onClick={() => setBox("in")}>
                  收到
                </button>
                <button type="button" className={box === "out" ? "on" : ""} onClick={() => setBox("out")}>
                  发出
                </button>
              </div>
              {visibleLetters().length === 0 ? <p className="empty">这一栏还是空的。</p> : null}
              {visibleLetters().map((n) => (
                <article key={n.id} className={n.box === "out" ? "letter out" : "letter in"}>
                  <header>
                    <span className="who">{n.who}</span>
                    <span className={tagClass(n.status)}>{n.status}</span>
                  </header>
                  <p>{n.body}</p>
                  <div className="meta">{n.meta}</div>
                  {n.reply ? <div className="meta">回了一句：{n.reply}</div> : null}
                  {n.status === "稍后再看" && !n.reply ? (
                    <button
                      className="reopen"
                      type="button"
                      onClick={() => setLetters((list) => list.map((item) => (item.id === n.id ? { ...item, status: "待看" } : item)))}
                    >
                      再回一句
                    </button>
                  ) : null}
                  {canReply(n) ? (
                    <>
                      <div className="letter-actions pair">
                        <button className="solid" type="button" onClick={() => replyTo(n.id, "我收到了")}>
                          我收到了
                        </button>
                        <button className="outline" type="button" onClick={() => replyTo(n.id, "这几天再聊")}>
                          这几天再聊
                        </button>
                      </div>
                      <div className="letter-links">
                        <button className="letter-link" type="button" onClick={() => setMoreFor((id) => (id === n.id ? null : n.id))}>
                          {moreFor === n.id ? "收起" : "更多"}
                        </button>
                        {moreFor === n.id ? (
                          <button className="letter-link" type="button" onClick={() => replyTo(n.id, FIRM_REPLY)}>
                            今晚可以
                          </button>
                        ) : null}
                        <button
                          className="letter-link later"
                          type="button"
                          onClick={() => {
                            setLetters((list) => list.map((item) => (item.id === n.id ? { ...item, status: "稍后再看" } : item)));
                            ping("已放下。不会计时，也不会再催。");
                          }}
                        >
                          稍后
                        </button>
                      </div>
                    </>
                  ) : null}
                  {n.reply && n.conflict && lens === "ning" && n.box === "out" && isLightReply(n.reply) ? (
                    <button className="reopen" type="button" onClick={() => openSub("delivered")}>
                      去已送达
                    </button>
                  ) : null}
                </article>
              ))}
              <button
                className="cta ghost"
                type="button"
                onClick={() => enterPreview(card ?? { ...GOLDEN_CARD })}
              >
                写一封短笺
              </button>
            </div>
          </section>

          <section className={view === "voice" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>听一遍</h1>
                <p>小间读这张卡</p>
              </div>
            </header>
            <div className="scroll tight">
              <div className={playing ? "voice-stage playing" : "voice-stage"}>
                <img className="voice-face" alt="" src={CALL_FACE} />
                <div className="bars" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </div>
              </div>
              {card ? (
                <>
                  <div className="script">
                    <span>{playing ? "小间正在读" : "将要读的"}</span>
                    <p>{script}</p>
                  </div>
                  <button
                    className="cta"
                    type="button"
                    onClick={() => setPlaying((v) => !v)}
                  >
                    {playing ? "停一下" : "让小间读一遍"}
                  </button>
                  <button className="cta ghost" type="button" onClick={() => enterPreview()}>
                    改用信札或来电送出
                  </button>
                </>
              ) : (
                <>
                  <p className="empty">还没有可以读的卡。先在小间说一句，或写一封短笺。</p>
                  <button className="cta ghost" type="button" onClick={() => goTab("home")}>
                    回小间
                  </button>
                </>
              )}
            </div>
          </section>

          <section className={view === "incoming" ? "screen on" : "screen"}>
            <div className={sheet?.kind === "permit" ? "incoming holding" : "incoming"}>
              <div className="who-flag">{PARTNER}的手机</div>
              <div className="pulse-wrap">
                <span className="pulse-ring" />
                <span className="pulse-ring d2" />
                <img className="incoming-face" alt="小间" src={CALL_FACE} draggable={false} />
              </div>
              <h1>小间</h1>
              <p className="precall">{PRECALL_LINE}</p>
              <div className="incoming-actions">
                <button
                  className="cta"
                  type="button"
                  disabled={sheet?.kind === "permit"}
                  onClick={() => {
                    if (!card) return;
                    deliver(card, "待看", "来电改看了信札", "");
                    ping("改看信札了。没有继续打。");
                  }}
                >
                  改看信札
                </button>
                <button className="cta ghost" type="button" onClick={laterCall} disabled={sheet?.kind === "permit"}>
                  稍后
                </button>
                <button className="incoming-answer" type="button" onClick={answerCall} disabled={sheet?.kind === "permit"}>
                  接通
                </button>
                <button className="text-btn plain" type="button" disabled={sheet?.kind === "permit"} onClick={missedCall}>
                  这会儿不方便
                </button>
              </div>
            </div>
          </section>

          <section className={view === "call" ? "screen on" : "screen"}>
            <header className="subhead">
              <button
                className="back"
                type="button"
                aria-label="挂断"
                onClick={() => {
                  if (!card) {
                    back();
                    return;
                  }
                  deliver(card, "待看", "来电接通了，还没回一句", "");
                  ping("已挂断。没有录音。");
                }}
              >
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>小间</h1>
                <p>在把心情说清楚</p>
              </div>
            </header>
            <div className="call-body">
              <div className="call-flag">
                <span className="live" />
                <span>通话中</span>
              </div>
              <img className="call-face" alt="" src={CALL_FACE} />
              <div className="script">
                <span>小间正在说</span>
                <p>{script}</p>
              </div>
              <div className="call-time">
                {pad(Math.floor(callSec / 60))}:{pad(callSec % 60)}
              </div>
              <div className="call-actions">
                {SOFT_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    className="cta"
                    type="button"
                    onClick={() => {
                      if (!card) return;
                      deliver(card, "已回应", "来电里回的", reply);
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
              <div className="call-actions ghosts">
                <button
                  className="cta ghost"
                  type="button"
                  onClick={() => {
                    if (!card) return;
                    deliver(card, "已回应", "来电里回的", FIRM_REPLY);
                  }}
                >
                  今晚可以
                </button>
                <button
                  className="cta ghost"
                  type="button"
                  onClick={() => {
                    if (!card) return;
                    deliver(card, "待看", "来电改成了短笺", "");
                    ping("改成短笺了。");
                  }}
                >
                  改成信札
                </button>
                <button
                  className="cta ghost"
                  type="button"
                  onClick={() => {
                    if (!card) return;
                    deliver(card, "待看", "来电接通了，还没回一句", "");
                    ping("已挂断。没有录音。");
                  }}
                >
                  挂断
                </button>
              </div>
            </div>
          </section>

          <section className={view === "delivered" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="回首页" onClick={() => goTab("home")}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>已送达</h1>
                <p>送出去的是这三句</p>
              </div>
            </header>
            <div className="scroll tight">
              {shownCard ? (
                <>
                  <article className="delivered-card">
                    <div className="kicker">已放进{PARTNER}的信札</div>
                    <h2>先到这里</h2>
                    <div className="relay">
                      {relayLines(shownCard, name).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <p className="warn">{partnerReply ? `${PARTNER}回了「${partnerReply}」` : "还没回。不催。"}</p>
                  </article>
                  <button className="cta" type="button" onClick={() => goTab("home")}>
                    回首页
                  </button>
                  <button
                    className="cta ghost"
                    type="button"
                    onClick={() => {
                      setLens("zhou");
                      setBox("in");
                      openSub("letters");
                    }}
                  >
                    去信札看看
                  </button>
                  {shownCard.conflict ? (
                    <>
                      <button className="fold" type="button" aria-expanded={guideOpen} onClick={() => setGuideOpen((v) => !v)}>
                        <span>可选：两边各一小步</span>
                        <small>{guideOpen ? "收起" : "展开"}</small>
                      </button>
                      {guideOpen ? renderGuideExtras() : null}
                    </>
                  ) : null}
                </>
              ) : (
                <p className="empty">还没有送出的短笺。</p>
              )}
            </div>
          </section>

          <section className={view === "guide" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回首页" onClick={() => goTab("home")}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>两边各一小步</h1>
                <p>不站队，也不训一个人</p>
              </div>
            </header>
            <div className="scroll tight">
              {renderGuideExtras()}
              <button
                className="cta ghost"
                type="button"
                onClick={() => {
                  setLens("zhou");
                  setBox("in");
                  openSub("letters");
                }}
              >
                看{PARTNER}的信札
              </button>
              <button
                className="cta ghost"
                type="button"
                onClick={() => {
                  setStack([]);
                  show("cal");
                  setSheet({ kind: "day", day: DEMO_TODAY });
                }}
              >
                看{CAL_MONTH}月{DEMO_TODAY}日
              </button>
            </div>
          </section>

          <section className={view === "together" ? "screen on" : "screen"}>
            <header className="subhead">
              <button className="back" type="button" aria-label="返回" onClick={back}>
                <IconBack />
              </button>
              <div className="subhead-text">
                <h1>一起聊</h1>
                <p>两边都点头才开始</p>
              </div>
            </header>
            <div className="scroll tight">
              <div className="nod-row">
                <div className="nod on">
                  {name}已准备
                  <small>用「我感到…我需要…」</small>
                </div>
                <div className={zhouNod ? "nod on" : "nod"}>
                  {zhouNod ? `${PARTNER}也愿意` : `已邀请，${PARTNER}可自己决定`}
                  <small>{zhouNod ? "两边都到了" : "不催。对方可以不来。"}</small>
                </div>
              </div>
              {zhouNod ? null : (
                <button className="text-btn demo-nod" type="button" onClick={() => setZhouNod(true)}>
                  演示：{PARTNER}自己愿意
                </button>
              )}
              {zhouNod && card ? (
                <>
                  <article className="line-card">
                    <b>小间请{name}先说</b>
                    <p>我感到{card.feel}。我需要{card.need}。</p>
                  </article>
                  <article className="line-card">
                    <b>小间请{PARTNER}说</b>
                    <p>我感到这几天有点赶。我需要先回一句，今晚再留 10 分钟。</p>
                  </article>
                  <p className="guide-note">小间会拦住指责，改写成需要。今天可以只降温，不把所有问题谈完。</p>
                  <button
                    className="cta"
                    type="button"
                    onClick={() => {
                      if (!guideCard && !card) return;
                      const source = guideCard ?? card;
                      setDays((list) => list.map((d) => (d.day === DEMO_TODAY ? noteFromConvey(source, "一起") : d)));
                      ping(`小约定写在 ${CAL_MONTH}月${DEMO_TODAY}日。月历上只看得到状态。`);
                      setStack([]);
                      show("cal");
                      setSheet({ kind: "day", day: DEMO_TODAY });
                    }}
                  >
                    记成小约定
                  </button>
                </>
              ) : (
                <p className="empty">
                  {zhouNod ? "还没有可以记的卡。" : `已邀请。${PARTNER}可以自己决定，不来也没关系。`}
                </p>
              )}
            </div>
          </section>

          <nav className={isTab ? "tabbar" : "tabbar hide"} role="tablist">
            {(
              [
                ["home", "小间", <IconHome key="h" />],
                ["hub", "递出", <IconHub key="u" />],
                ["cal", "痕迹", <IconCal key="c" />],
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
              <div
                className="sheet-dim"
                onClick={() => {
                  if (sheet.kind === "permit") return;
                  if (sheet.kind === "call-confirm" || sheet.kind === "demo-call-confirm") {
                    setChannel("letter");
                    setCallArmed(false);
                  }
                  setSheet(null);
                }}
              />
              <div className="sheet-panel" role="dialog" aria-modal="true">
                <div className="grab" />
                {sheet.kind === "day" && dayNote(sheet.day) ? (
                  <DaySheet note={dayNote(sheet.day) as DayNote} lines={ventsOn(sheet.day)} onClose={() => setSheet(null)} />
                ) : null}
                {sheet.kind === "permit" ? (
                  <>
                    <p className="kicker">{PARTNER}的手机 · 第一次来电</p>
                    <h2>要允许小间来电吗？</h2>
                    <p className="lead">来电默认关着。允许之后，来电上的名字是「小间」。</p>
                    <p className="sheet-note">不允许也不会被催，这句会改成信札。</p>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={declineCalls}>
                        先不允许
                      </button>
                      <button className="cta" type="button" onClick={allowCalls}>
                        允许来电
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
                    <h2>这会儿没接到</h2>
                    <p className="lead">已放进信札，没有继续打。不催。</p>
                    <div className="sheet-actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          setGuideOpen(true);
                          setSheet(null);
                        }}
                      >
                        看两边的一小步
                      </button>
                      <button
                        className="cta"
                        type="button"
                        onClick={() => {
                          setLens("zhou");
                          setBox("in");
                          setStack(["delivered"]);
                          setSheet(null);
                          show("letters");
                        }}
                      >
                        去信札
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "need-ask" ? (
                  <>
                    <p className="kicker">小间</p>
                    <h2>要不要让小间打个很短的电话？</h2>
                    <p className="lead">不同意就写成信札。来电默认关着，第一次仍会问对方允不允许。</p>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={declineNeedAsk}>
                        写成信札
                      </button>
                      <button className="cta" type="button" onClick={acceptNeedAsk}>
                        可以，打个很短的
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "call-empty" ? (
                  <>
                    <h2>先有一句，再决定打不打</h2>
                    <p className="lead">来电默认关着。可以先回小间说，或写成短笺。</p>
                    <div className="sheet-actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          setSheet(null);
                          goTab("home");
                        }}
                      >
                        回小间
                      </button>
                      <button className="cta" type="button" onClick={() => enterPreview({ ...GOLDEN_CARD })}>
                        写一封短笺
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "demo-call" ? (
                  <>
                    <h2>演示一通来电</h2>
                    <p className="lead">来电默认关着。对方第一次仍会问允不允许。不想打，就写成短笺。</p>
                    <div className="sheet-actions">
                      <button className="ghost" type="button" onClick={() => keepLetter({ ...GOLDEN_CARD })}>
                        写成短笺
                      </button>
                      <button className="cta" type="button" onClick={() => setSheet({ kind: "demo-call-confirm" })}>
                        看这通来电
                      </button>
                    </div>
                  </>
                ) : null}
                {sheet.kind === "demo-call-confirm" || sheet.kind === "call-confirm" ? (
                  <>
                    <p className="kicker">再确认一次</p>
                    <h2>仍要用小间打给对方吗？</h2>
                    <p className="lead">来电会响对方手机。对方可能关掉；关掉则改信札、不连环打。</p>
                    <div className="sheet-actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => keepLetter(sheet.kind === "demo-call-confirm" ? { ...GOLDEN_CARD } : undefined)}
                      >
                        还是用信札
                      </button>
                      <button
                        className="cta"
                        type="button"
                        onClick={() => armCall(sheet.kind === "demo-call-confirm" ? { ...GOLDEN_CARD } : undefined)}
                      >
                        仍要用来电
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

function NeedChart({ points }: { points: { day: number; score: number }[] }) {
  const w = 320;
  const h = 72;
  const padX = 18;
  const y = 28;
  const xAt = (i: number) => (points.length <= 1 ? w / 2 : padX + (i * (w - padX * 2)) / (points.length - 1));
  const line = points.map((_, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${y}`).join(" ");
  const max = Math.max(...points.map((p) => p.score), 1);
  return (
    <svg className="need-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="近几天">
      <path className="need-chart-line" d={line} />
      {points.map((p, i) => (
        <g key={p.day}>
          <circle className="need-chart-dot" cx={xAt(i)} cy={y} r="4" opacity={0.35 + (p.score / max) * 0.65} />
          <text className="need-chart-label" x={xAt(i)} y={h - 8} textAnchor="middle">
            {p.day}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DaySheet({ note, lines, onClose }: { note: DayNote; lines: Msg[]; onClose: () => void }) {
  return (
    <>
      <p className="kicker">
        {CAL_MONTH}月{note.day}日{note.day === DEMO_TODAY ? " · 今天" : ""}
      </p>
      <h2>{STATE_LABEL[note.state]}</h2>
      <span className={`state-pill ${note.state}`}>{STATE_LABEL[note.state]}</span>
      <div className="detail-block">
        <b>约定</b>
        <p>{note.agreement}</p>
      </div>
      <div className="detail-block">
        <b>沟通结果</b>
        <p>{note.result}</p>
      </div>
      <div className="detail-block">
        <b>当天树洞</b>
        {lines.length === 0 ? (
          <p>这天树洞是空的。</p>
        ) : (
          <ul className="hole-list">
            {lines.map((line) => (
              <li key={line.id} className={line.role}>
                {line.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="sheet-actions">
        <button className="cta" type="button" onClick={onClose}>
          知道了
        </button>
      </div>
    </>
  );
}
