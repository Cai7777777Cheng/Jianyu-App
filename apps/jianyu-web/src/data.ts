export type FaceId = "calm" | "soft" | "listen" | "empathy" | "cheer" | "low";
export type Resolve = "done" | "part" | "open";

export type Face = { id: FaceId; name: string; src: string; tint: string };

export const FACES: Face[] = [
  { id: "calm", name: "平静", src: "/xiaojian/calm.png", tint: "#A5D8FF" },
  { id: "soft", name: "软萌", src: "/xiaojian/soft.png", tint: "#FFD0E4" },
  { id: "listen", name: "倾听", src: "/xiaojian/listen.png", tint: "#C9D4FF" },
  { id: "empathy", name: "共情", src: "/xiaojian/empathy.png", tint: "#E5DBFF" },
  { id: "cheer", name: "鼓励", src: "/xiaojian/cheer.png", tint: "#B2F2BB" },
  { id: "low", name: "低落", src: "/xiaojian/low.png", tint: "#D5DCEB" },
];

export function faceById(id: FaceId): Face {
  return FACES.find((f) => f.id === id) ?? FACES[0];
}

export const FREQS = ["很少开口", "刚好就好", "多关心一点"];
export const NAMES = ["阿宁", "你", "宁"];
export const HEARD = ["有点闷", "谢谢，我好一点了", "你先听我说"];
export const PARTNER = "小周";
/** 低承诺主推。今晚可以仍可用，但是次按钮。 */
export const SOFT_REPLIES = ["我收到了", "这几天再聊"] as const;
export const FIRM_REPLY = "今晚可以";
export const GOLDEN_LINE = "连续两天很少回我，我有点不安";

export function isLightReply(reply: string) {
  return reply === "我收到了" || reply === "这几天再聊" || reply === FIRM_REPLY;
}

/** 演示月历里，这条传达写在 15 日。 */
export const DEMO_TODAY = 15;

export type EmotionCard = {
  feel: string;
  situation: string;
  need: string;
  raw: string;
  conflict: boolean;
};

export const GOLDEN_CARD: EmotionCard = {
  feel: "不安",
  situation: "连续两天消息很少回",
  need: "今晚能有 10 分钟一起聊聊今天发生的事，不急着解决所有问题",
  raw: GOLDEN_LINE,
  conflict: true,
};

export function cardFromText(text: string): EmotionCard | null {
  const value = text.trim();
  if (!value || /别告诉|别转|只倒|先听听/.test(value)) return null;
  if (/谢谢|好一点|开心|哈哈/.test(value) && !/回|不安|不理/.test(value)) return null;
  if (/回|消息|不理|冷淡|不安|很少回|冷战/.test(value)) {
    return { ...GOLDEN_CARD, raw: value, conflict: true };
  }
  if (/闷/.test(value)) {
    return {
      feel: "闷",
      situation: "这会儿还说不上是哪一句",
      need: "先待一会儿，不用马上谈完",
      raw: value,
      conflict: true,
    };
  }
  if (/委屈|烦|生气|讨厌|指责|吵/.test(value)) {
    return {
      feel: "委屈",
      situation: value.length > 24 ? value.slice(0, 24) : value,
      need: "先听我说完，再约一个时间",
      raw: value,
      conflict: true,
    };
  }
  return null;
}

export function relayLines(card: EmotionCard, name: string): string[] {
  const golden =
    card.feel === GOLDEN_CARD.feel &&
    card.situation === GOLDEN_CARD.situation &&
    card.need === GOLDEN_CARD.need;
  if (golden) {
    return [
      `${name}最近有点闷闷的。`,
      "当连续两天消息很少回的时候，TA 会感到不安。",
      "TA 希望今晚能有 10 分钟一起聊聊今天发生的事（不急着解决所有问题）。",
    ];
  }
  return [
    `${name}最近有些${card.feel}。`,
    `当${card.situation}的时候，TA 会感到${card.feel}。`,
    `TA 希望${card.need}。`,
  ];
}

export function relayText(card: EmotionCard, name: string): string {
  return ["小间想把这会儿的心情说清楚。", ...relayLines(card, name)].join("\n");
}

export function callScript(card: EmotionCard, name: string): string {
  return [
    "我是小间。我想用自己的话，把这会儿的心情说清楚。",
    ...relayLines(card, name),
    "你要是方便，可以回一句。不方便的话，我就写成短笺留在这里。",
  ].join("\n");
}

export type Guide = { who: string; tone: "ning" | "zhou"; title: string; step: string; check: string };

export function guidesFor(name: string, partner: string): Guide[] {
  return [
    {
      who: name,
      tone: "ning",
      title: "你已经说清楚需要了",
      step: "今晚之前不再追问，把这 10 分钟留给对方决定。",
      check: "还想加一句指责吗？先留在树洞，不送出去。",
    },
    {
      who: partner,
      tone: "zhou",
      title: "这是在说需要，不是在定罪",
      step: "先回「我收到了」或「这几天再聊」；今晚有空再点「今晚可以」。",
      check: "想解释之前，先用自己的话复述对方的需要。",
    },
  ];
}

export function faceFor(text: string, temper: FaceId): FaceId {
  if (/闷|累|难过|委屈|烦|哭|伤心|冷|慢|不理|不安/.test(text)) return "empathy";
  if (/开心|谢谢|好一点|加油|哈哈|棒|安心|轻松/.test(text)) return "cheer";
  if (/低落|不想|好难|没劲/.test(text)) return "low";
  if (/可爱|软|哄/.test(text)) return "soft";
  if (/听|在吗|说说/.test(text)) return "listen";
  return temper;
}

export function replyFor(text: string, face: FaceId, ventOnly: boolean): string {
  if (ventOnly || /先听听|只倒|别告诉|别转/.test(text)) return "这些话先留在树洞。我不会送出去。";
  if (cardFromText(text)) return "我听到的是感受。这些话先留在树洞。要不要送出去，你来定。";
  if (face === "empathy") return "闷是真的。想让对方知道的话，只送感受、情境和一件小事。现在不送也行。";
  if (face === "cheer") return "听到了。你轻一点也完全可以，不用马上把话说完。";
  if (face === "low") return "先不用振作。你现在这样，我就在。";
  if (face === "listen") return "我在听。你说完，我再问要不要收成一张卡。";
  if (face === "soft") return "我在。不催你，想说的时候再说。";
  return "我在。想怎么说都行，不整理也没关系。";
}

export type DayNote = {
  day: number;
  state: Resolve;
  agreement: string;
  result: string;
};

/** 2026-09-01 是周二。日历从周日排起，前面空两格。 */
export const CAL_LEAD = 2;
export const CAL_YEAR = 2026;
export const CAL_MONTH = 9;
export const CAL_DAYS = 30;

export const DAY_NOTES: DayNote[] = [
  { day: 2, state: "done", agreement: "周日下午一起待着，不安排别的。", result: "说开了。周末去哪，两边都点了头。" },
  { day: 4, state: "done", agreement: "各自认一项家务。", result: "说开了。谁洗碗这件算过去了。" },
  { day: 6, state: "part", agreement: "家务清单写到一半，先搁着。", result: "对上了一部分，剩下的没定。" },
  { day: 7, state: "part", agreement: "先说到「我知道你累」。", result: "只通了一半，后面还没说。" },
  { day: 8, state: "open", agreement: "还没有约定。", result: "回消息慢这件还闷着，没有转成短笺。" },
  { day: 9, state: "open", agreement: "先不约。对方说这会儿不想聊。", result: "一句话刺到了。这件还积着。" },
  { day: 11, state: "done", agreement: "加班那晚，改天补一顿晚饭。", result: "说开了。晚饭凉了这件过去了。" },
  { day: 14, state: "done", agreement: "见父母改到下月。", result: "两边都点头，这件说开了。" },
  { day: 15, state: "part", agreement: "这周找一晚见面。", result: "时间对不上，只定到这一步。" },
  { day: 16, state: "part", agreement: "账先对上两笔。", result: "还有一笔没说完。" },
  { day: 18, state: "open", agreement: "还没有约定。", result: "沉默了一晚，早上也没接话。" },
  { day: 19, state: "open", agreement: "还没有约定。", result: "朋友圈那条看见了，还没谈。" },
  { day: 21, state: "done", agreement: "这个月不提钱。", result: "两边都点头，这件说开了。" },
  { day: 22, state: "done", agreement: "周末留半小时，只待着，不谈正事。", result: "约好了。" },
  { day: 24, state: "done", agreement: "把「想见你」说清楚。", result: "说开了。不是不想理。" },
  { day: 27, state: "part", agreement: "早上那两句先说到这儿。", result: "说了两句，晚上又安静了。" },
  { day: 28, state: "done", agreement: "忙的时候先回一句「晚点聊」。", result: "对方答应了，这件说开了。" },
];

export function monthStats(days: DayNote[]) {
  const done = days.filter((d) => d.state === "done").length;
  const part = days.filter((d) => d.state === "part").length;
  const open = days.filter((d) => d.state === "open").length;
  const total = days.length;
  const rate = total ? Math.round((done / total) * 100) : 0;
  return { done, part, open, total, rate };
}

export function noteFromConvey(card: EmotionCard, reply: string): DayNote {
  const agreed = reply.includes("今晚可以");
  const soon = reply.includes("这几天");
  const heard = reply.includes("收到");
  const together = reply.includes("一起");
  let state: Resolve = "open";
  let result = "已经送到。还在等小周回一句。";
  if (together) {
    state = "part";
    result = "两边都点头，约了今晚 10 分钟。还没聊完，先记成部分疏通。";
  } else if (agreed) {
    state = "part";
    result = "小周回了「今晚可以」。两边各留了一小步，还没聊完。";
  } else if (soon) {
    state = "part";
    result = "对方认收到了，约这几天再找时间。";
  } else if (heard) {
    state = "part";
    result = "先确认收到，时间还没定。";
  }
  return {
    day: DEMO_TODAY,
    state,
    agreement: card.need,
    result,
  };
}

export type TreeLine = { id: number; day: number; role: "me" | "bot"; text: string; tint: string; at?: string };

/** 演示月里已经记下的树洞。今天（15 日）从空白开始，说了才写上。 */
export const SEED_TREE: TreeLine[] = [
  { id: -6, day: 8, role: "me", text: "回消息有点慢，我闷了一晚上。", tint: "#E5DBFF", at: "夜里" },
  { id: -5, day: 8, role: "bot", text: "我听着。", tint: "#ffffff" },
  { id: -4, day: 14, role: "me", text: "见父母的事，我其实松了一口气。", tint: "#B2F2BB", at: "傍晚" },
  { id: -3, day: 14, role: "bot", text: "听到了。你轻一点也可以。", tint: "#ffffff" },
  { id: -2, day: 22, role: "me", text: "周末只想待着，不想安排正事。", tint: "#FFD0E4", at: "下午" },
  { id: -1, day: 22, role: "bot", text: "你说，我在。", tint: "#ffffff" },
];

/** 树洞软提示：只倒出来，不收成卡。 */
export const VENT_CHIPS = ["有点闷", "先听听就好", "今晚先放着"] as const;
export const VENT_COMPANION = "我在。你想怎么说都行。";

export const ASIDES = ["我听着。", "这些话先放在这儿。", "不急着整理。", "你说，我在。"] as const;

/** 日标签副标。今天固定写「今天」。 */
export const DAY_SOFT: Record<number, string> = {
  8: "那晚",
  14: "那天",
  22: "那个周末",
};

export function daySoftLabel(day: number): string {
  const head = `${CAL_MONTH}月${day}日`;
  if (day === DEMO_TODAY) return `${head} · 今天`;
  const soft = DAY_SOFT[day];
  return soft ? `${head} · ${soft}` : head;
}

/** 树洞旁白：一段倾诉最多一句。 */
export function asideFor(text: string, ventOnly: boolean): string {
  if (ventOnly || /先听听|只倒|别告诉|别转/.test(text)) return "这些话先留在这儿。";
  if (/闷|委屈|烦|不安|不理|哭|难过|生气/.test(text)) return "我听着。";
  if (/谢谢|好一点|开心|哈哈/.test(text)) return "听到了。你轻一点也可以。";
  if (/听|在吗|说说/.test(text)) return "你说，我在。";
  return ASIDES[text.length % ASIDES.length];
}

/** 来电阈值。种子今天过线，方便演示主动问一次。 */
export const NEED_THRESHOLD = 72;
export const SEED_NEED_TODAY = 78;

export type NeedSource = "tree" | "home" | "voice";

export const NEED_TIERS = [
  { id: "calm", label: "平静", face: "calm" as FaceId, line: "还早，先树洞就好", min: 0 },
  { id: "notice", label: "留意", face: "soft" as FaceId, line: "有一点想被听见", min: 40 },
  { id: "near", label: "临近", face: "listen" as FaceId, line: "快到可以问你了", min: 60 },
  { id: "ready", label: "可触发", face: "empathy" as FaceId, line: "已经攒到可以问你了", min: NEED_THRESHOLD },
] as const;

export type NeedTierId = (typeof NEED_TIERS)[number]["id"];

export function tierFor(score: number) {
  let tier: (typeof NEED_TIERS)[number] = NEED_TIERS[0];
  for (const item of NEED_TIERS) {
    if (score >= item.min) tier = item;
  }
  return tier;
}

/** 近 7 日。今天（15 日）种子 78。 */
export const SEED_NEED_HISTORY: { day: number; score: number }[] = [
  { day: 9, score: 28 },
  { day: 10, score: 36 },
  { day: 11, score: 44 },
  { day: 12, score: 51 },
  { day: 13, score: 58 },
  { day: 14, score: 66 },
  { day: DEMO_TODAY, score: SEED_NEED_TODAY },
];

/**
 * Demo weights: tree hole high, home chat mid, voice page low.
 * Strong feeling words and vent-only add to the tree signal.
 */
export function bumpNeed(score: number, source: NeedSource, text = "", ventOnly = false): number {
  let delta = source === "tree" ? 6 : source === "home" ? 3 : 2;
  if (source !== "voice" && /闷|委屈|烦|不安|不理|冷淡|很少回|哭|难过|生气|讨厌|指责|吵|冷战|没劲|不想/.test(text)) {
    delta += source === "tree" ? 8 : 3;
  }
  if (source === "tree" && ventOnly) delta += 4;
  return Math.max(0, Math.min(100, score + delta));
}

export const PRECALL_LINE = "小间根据你这几天的话，想帮你说清楚";

export const STATE_LABEL: Record<Resolve, string> = {
  done: "已疏通",
  part: "部分",
  open: "未解决",
};

export type Letter = {
  id: string;
  box: "in" | "out";
  who: string;
  body: string;
  status: string;
  meta: string;
  reply: string;
  conflict: boolean;
  fresh: boolean;
};

export const SEED_LETTERS: Letter[] = [
  {
    id: "n1",
    box: "in",
    who: "小间",
    body: "小间想把这会儿的心情说清楚。\n小周这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。",
    status: "待看",
    meta: "短笺 · 经小周确认",
    reply: "",
    conflict: false,
    fresh: false,
  },
  {
    id: "n2",
    box: "out",
    who: "小间",
    body: "小间想把这会儿的心情说清楚。\n阿宁有点闷。希望忙的时候先回一句「晚点聊」。",
    status: "已送达",
    meta: "短笺 · 小周还没回",
    reply: "",
    conflict: false,
    fresh: false,
  },
];
