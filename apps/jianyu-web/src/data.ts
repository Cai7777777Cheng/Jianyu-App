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
export const LIGHT_REPLIES = ["我收到了", "今晚可以"] as const;
export const GOLDEN_LINE = "连续两天很少回我，我有点不安";

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
  return ["小间代转：", ...relayLines(card, name)].join("\n");
}

export function callScript(card: EmotionCard, name: string): string {
  return [
    `我是小间，受${name}委托代转，不是${name}本人。`,
    ...relayLines(card, name),
    "你现在方便回一句，还是要我改成短笺留给你？",
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
      step: "先回一句「我收到了」或「今晚可以」，再决定有没有 10 分钟。",
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
  if (ventOnly || /先听听|只倒|别告诉|别转/.test(text)) return "这些话先留在树洞。我不会拿去转达。";
  if (cardFromText(text)) return "我听到的是感受，不是给对方的判决。原话留在树洞。这张卡要不要送出去，你来定。";
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
  const heard = reply.includes("收到");
  const together = reply.includes("一起");
  let state: Resolve = "open";
  let result = "已经转达。还在等小周回一句。";
  if (together) {
    state = "part";
    result = "两边都点头，约了今晚 10 分钟。还没聊完，先记成部分疏通。";
  } else if (agreed) {
    state = "part";
    result = "小周回了「今晚可以」。两边各留了一小步，还没聊完。";
  } else if (heard) {
    state = "part";
    result = "小周回了「我收到了」。先确认收到，时间还没定。";
  }
  return {
    day: DEMO_TODAY,
    state,
    agreement: card.need,
    result,
  };
}

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
    who: "小间 · 代小周转达",
    body: "小间代转：\n小周这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。",
    status: "待看",
    meta: "短笺 · 经小周确认 · 不含原话",
    reply: "",
    conflict: false,
    fresh: false,
  },
  {
    id: "n2",
    box: "out",
    who: "小间 · 代我转达",
    body: "小间代转：\n阿宁有点闷。希望忙的时候先回一句「晚点聊」。",
    status: "已送达",
    meta: "短笺 · 小周还没回",
    reply: "",
    conflict: false,
    fresh: false,
  },
];
