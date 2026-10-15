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
export const SCRIPT =
  "我是小间，不是对方本人。对方想让你知道：有点闷，希望忙的时候先回一句「晚点聊」。这不是指责。";

export function faceFor(text: string, temper: FaceId): FaceId {
  if (/闷|累|难过|委屈|烦|哭|伤心|冷|慢|不理/.test(text)) return "empathy";
  if (/开心|谢谢|好一点|加油|哈哈|棒|安心|轻松/.test(text)) return "cheer";
  if (/低落|不想|好难|没劲/.test(text)) return "low";
  if (/可爱|软|哄/.test(text)) return "soft";
  if (/听|在吗|说说/.test(text)) return "listen";
  return temper;
}

export function replyFor(text: string, face: FaceId, ventOnly: boolean): string {
  if (ventOnly || /先听听|只倒|别告诉/.test(text)) return "这些话先留在这儿。我不会拿去转达。";
  if (face === "empathy") return "闷是真的。若要让对方知道，可以收成一句：希望忙的时候先回我「晚点聊」。现在不送也行。";
  if (face === "cheer") return "听到了。你轻一点也完全可以，不用马上把话说完。";
  if (face === "low") return "先不用振作。你现在这样，我就在。";
  if (face === "listen") return "我在听。你说完，我再问要不要收成一句。";
  if (face === "soft") return "我在。不催你，想说的时候再说。";
  return "我在。想怎么说都行，不整理也没关系。";
}

export type DayNote = {
  day: number;
  state: Resolve;
  issue: string;
  detail: string;
};

/** 2026-09-01 是周二。日历从周日排起，前面空两格。 */
export const CAL_LEAD = 2;
export const CAL_YEAR = 2026;
export const CAL_MONTH = 9;
export const CAL_DAYS = 30;

export const DAY_NOTES: DayNote[] = [
  { day: 2, state: "done", issue: "周末去哪", detail: "说开了，改到周日下午一起待着，不安排别的。" },
  { day: 4, state: "done", issue: "谁洗碗", detail: "各自认了一项。这件算说开了。" },
  { day: 6, state: "part", issue: "家务清单", detail: "写了一半，剩下的没定，先搁着。" },
  { day: 7, state: "part", issue: "谁先开口", detail: "只说到「我知道你累」，还没说到后面。" },
  { day: 8, state: "open", issue: "回消息慢", detail: "还闷着。没约时间谈，也还没转成短笺。" },
  { day: 9, state: "open", issue: "一句话刺到了", detail: "对方说先不想聊。这件还积着。" },
  { day: 11, state: "done", issue: "晚饭凉了", detail: "解释了加班，约了补一顿。说开了。" },
  { day: 14, state: "done", issue: "想见父母", detail: "日子改到下月，两边都点头。" },
  { day: 15, state: "part", issue: "想见面", detail: "时间对不上，只定了「这周找一晚」。" },
  { day: 16, state: "part", issue: "钱花在哪", detail: "对上了两笔，还有一笔没说完。" },
  { day: 18, state: "open", issue: "沉默了一晚", detail: "早上也没接话。还没疏通。" },
  { day: 19, state: "open", issue: "朋友圈那条", detail: "看见了，还没谈开。" },
  { day: 21, state: "done", issue: "这个月不提钱", detail: "两边都点头。这件说开了。" },
  { day: 22, state: "done", issue: "只待着", detail: "周末留半小时，不谈正事。约好了。" },
  { day: 24, state: "done", issue: "是不是冷淡", detail: "把「想见你」说清楚了，不是不想理。" },
  { day: 27, state: "part", issue: "早上那两句", detail: "说了两句，晚上又安静了。通了一半。" },
  { day: 28, state: "done", issue: "晚点聊", detail: "说成约定：忙的时候先回一句。对方答应了。" },
];

export function monthStats(days: DayNote[]) {
  const done = days.filter((d) => d.state === "done").length;
  const part = days.filter((d) => d.state === "part").length;
  const open = days.filter((d) => d.state === "open").length;
  const total = days.length;
  const rate = total ? Math.round((done / total) * 100) : 0;
  return { done, part, open, total, rate };
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
};

export const SEED_LETTERS: Letter[] = [
  {
    id: "n1",
    box: "in",
    who: "对方的小间 · 代转",
    body: "这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。",
    status: "待看",
    meta: "短笺 · 经对方确认",
    reply: "",
  },
  {
    id: "n2",
    box: "out",
    who: "我确认过的短笺",
    body: "我有点闷。希望你忙的时候先回我一句「晚点聊」。",
    status: "已送达",
    meta: "短笺 · 对方还没回",
    reply: "",
  },
];
