/* 间语 3.0 · 纯前端，file:// 可开。形象为内联 SVG。 */
(function () {
  "use strict";

  var PAL = {
    blue: "#2F6FFF",
    indigo: "#43368F",
    yellow: "#F6C234",
    pink: "#FF7EAE",
    orange: "#FF8E2E",
    amber: "#F0A33A",
    purple: "#7A4DFF",
    tear: "#8FD4FF",
    stem: "#D09AD6",
    ball: "#E7B8E8",
    ink: "#1A1A1A"
  };

  var META = {
    hero: { name: "小间" },
    calm: { name: "平静" },
    soft: { name: "软萌" },
    listen: { name: "倾听" },
    empathy: { name: "共情" },
    cheer: { name: "鼓励" },
    low: { name: "低落" }
  };

  var FREQS = ["很少开口", "刚好就好", "多关心一点"];
  var NAMES = ["阿宁", "你", "宁"];
  var SCRIPT = "我是小间，不是对方本人。对方想让你知道：有点闷，希望忙的时候先回一句「晚点聊」。这不是指责。";

  var state = {
    view: "home",
    tab: "home",
    stack: [],
    temper: "hero",
    name: "阿宁",
    freq: "刚好就好",
    paused: false,
    ventOnly: false,
    chatFrom: "home",
    messages: [],
    openedChat: false,
    box: "in",
    pending: true,
    viaVoice: false,
    previewed: false,
    callSec: 0,
    callTick: null,
    noteSeq: 3,
    notes: [
      {
        id: "n1",
        box: "in",
        who: "对方的小间 · 代转",
        body: "这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。",
        status: "待看",
        meta: "短笺 · 经对方确认",
        reply: ""
      },
      {
        id: "n2",
        box: "out",
        who: "我确认过的短笺",
        body: "我有点闷。希望你忙的时候先回我一句「晚点聊」，我会安心很多。",
        status: "已送达",
        meta: "短笺 · 对方还没回",
        reply: ""
      }
    ]
  };

  try {
    var saved = JSON.parse(localStorage.getItem("jianyu3") || "null");
    if (saved && META[saved.temper]) {
      state.temper = saved.temper;
      if (saved.name) state.name = saved.name;
      if (saved.freq) state.freq = saved.freq;
      if (saved.paused) state.paused = true;
    }
  } catch (err) { /* 无存储时用默认 */ }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function persist() {
    try {
      localStorage.setItem("jianyu3", JSON.stringify({
        temper: state.temper,
        name: state.name,
        freq: state.freq,
        paused: state.paused
      }));
    } catch (err) { /* file 协议偶发拒绝时忽略 */ }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    var el = $("#toast");
    var sub = state.view !== "home" && state.view !== "hub" && state.view !== "me";
    el.classList.toggle("low", sub);
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  function greetText() {
    var h = new Date().getHours();
    var part = h < 5 ? "夜深了" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
    return part + "，" + state.name;
  }

  /* ---------- 锁定形象 ---------- */
  var uidN = 0;

  function eye(cx, cy, r, ox) {
    var pr = r * 0.48;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff"/>' +
      '<circle cx="' + (cx + ox) + '" cy="' + (cy + r * 0.08) + '" r="' + pr + '" fill="' + PAL.ink + '"/>' +
      '<circle cx="' + (cx + ox - r * 0.22) + '" cy="' + (cy - r * 0.2) + '" r="' + (r * 0.16) + '" fill="#fff"/>';
  }
  function eyes(cx, cy, r, gap, inward) {
    var d = gap || r * 1.72;
    var n = inward == null ? 1.4 : inward;
    return eye(cx - d, cy, r, n) + eye(cx + d, cy, r, -n);
  }
  function mouth(cx, cy, w, k) {
    if (k === "flat") {
      return '<path d="M ' + (cx - w) + " " + cy + " H " + (cx + w) + '" stroke="' + PAL.ink + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    }
    var dy = k === "frown" ? -6.5 : 6.5;
    return '<path d="M ' + (cx - w) + " " + cy + " Q " + cx + " " + (cy + dy) + " " + (cx + w) + " " + cy + '" stroke="' + PAL.ink + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  }
  function brows(cx, cy, half, kind) {
    var inn = kind === "cheer" ? 8 : -6;
    var out = kind === "cheer" ? -3 : 5;
    var x1 = cx - half, x2 = cx - half * 0.25, x3 = cx + half * 0.25, x4 = cx + half;
    var sw = kind === "cheer" ? 4 : 3.2;
    return '<path d="M ' + x1 + " " + (cy + out) + " L " + x2 + " " + (cy + inn) + '" stroke="' + PAL.ink + '" stroke-width="' + sw + '" stroke-linecap="round" fill="none"/>' +
      '<path d="M ' + x4 + " " + (cy + out) + " L " + x3 + " " + (cy + inn) + '" stroke="' + PAL.ink + '" stroke-width="' + sw + '" stroke-linecap="round" fill="none"/>';
  }
  function tear(cx, cy) {
    return '<path d="M ' + cx + " " + cy + " C " + (cx + 7) + " " + (cy + 8) + ", " + (cx + 6) + " " + (cy + 16) + ", " + cx + " " + (cy + 20) + " C " + (cx - 6) + " " + (cy + 16) + ", " + (cx - 7) + " " + (cy + 8) + ", " + cx + " " + cy + ' Z" fill="' + PAL.tear + '"/>';
  }
  function spring(x, yBall, yJoin) {
    var r = 10;
    var y0 = yBall + r - 1;
    var turns = 3;
    var amp = 7;
    var steps = turns * 16;
    var d = "";
    var i, t, y, px;
    for (i = 0; i <= steps; i++) {
      t = i / steps;
      y = y0 + (yJoin - y0) * t;
      px = x + Math.sin(t * turns * Math.PI * 2) * amp;
      d += (i === 0 ? "M" : "L") + px.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    return '<path d="' + d + '" fill="none" stroke="' + PAL.purple + '" stroke-width="4.6" stroke-linecap="round"/>' +
      '<circle cx="' + x + '" cy="' + yBall + '" r="' + r + '" fill="' + PAL.purple + '"/>';
  }
  function heroAntenna() {
    return '<path d="M 108 96 C 124 76, 130 56, 133 48" fill="none" stroke="' + PAL.stem + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="142" cy="34" r="13" fill="' + PAL.ball + '"/>';
  }
  function scarf(color, cx, y, half) {
    var x1 = cx - half;
    var x2 = cx + half;
    var h = 22;
    var band = '<path fill="' + color + '" d="M ' + x1 + " " + (y + 8) + " Q " + cx + " " + (y - 2) + " " + x2 + " " + (y + 6) + " L " + (x2 - 1) + " " + (y + h + 4) + " Q " + cx + " " + (y + h + 14) + " " + x1 + " " + (y + h + 2) + ' Z"/>';
    var tail = '<path fill="' + color + '" d="M ' + (x2 - 22) + " " + (y + 8) + " L " + (x2 + 10) + " " + (y + 16) + " L " + (x2 - 2) + " " + (y + h + 32) + " L " + (x2 - 30) + " " + (y + h + 18) + ' Z"/>';
    return { band: band, tail: tail };
  }
  function superellipse(cx, cy, rx, ry, n) {
    var steps = 80;
    var d = "";
    var i, t, c, s, x, y;
    for (i = 0; i <= steps; i++) {
      t = (i / steps) * Math.PI * 2;
      c = Math.cos(t);
      s = Math.sin(t);
      x = cx + Math.sign(c) * rx * Math.pow(Math.abs(c), 2 / n);
      y = cy + Math.sign(s) * ry * Math.pow(Math.abs(s), 2 / n);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    return d + "Z";
  }
  function roundedPoly(pts, radius) {
    var n = pts.length;
    var d = "";
    var i, prev, curr, next, v1x, v1y, v2x, v2y, l1, l2, r, p1x, p1y, p2x, p2y;
    for (i = 0; i < n; i++) {
      prev = pts[(i - 1 + n) % n];
      curr = pts[i];
      next = pts[(i + 1) % n];
      v1x = curr.x - prev.x; v1y = curr.y - prev.y;
      v2x = next.x - curr.x; v2y = next.y - curr.y;
      l1 = Math.hypot(v1x, v1y); l2 = Math.hypot(v2x, v2y);
      r = Math.min(radius, l1 / 2.2, l2 / 2.2);
      p1x = curr.x - (v1x / l1) * r; p1y = curr.y - (v1y / l1) * r;
      p2x = curr.x + (v2x / l2) * r; p2y = curr.y + (v2y / l2) * r;
      d += (i === 0 ? "M " : " L ") + p1x.toFixed(2) + " " + p1y.toFixed(2);
      d += " Q " + curr.x + " " + curr.y + " " + p2x.toFixed(2) + " " + p2y.toFixed(2);
    }
    return d + " Z";
  }
  function capsule(x, y, w, h) {
    var r = h / 2;
    return "M " + (x + r) + " " + y + " H " + (x + w - r) +
      " A " + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
      " H " + (x + r) +
      " A " + r + " " + r + " 0 0 1 " + (x + r) + " " + y + " Z";
  }
  function circles(list, fill) {
    return list.map(function (c) {
      return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"' + (fill ? ' fill="' + fill + '"' : "") + "/>";
    }).join("");
  }

  var flower = [[100, 118, 36], [62, 156, 40], [138, 156, 40], [100, 150, 32]];
  var arch = "M 40 148 A 60 60 0 0 0 160 148 L 160 186 Q 160 208 138 208 L 62 208 Q 40 208 40 186 Z";
  var cheerD = superellipse(100, 150, 62, 66, 3.4);
  var heroD = superellipse(100, 152, 66, 70, 4.5);
  var triD = roundedPoly([{ x: 100, y: 76 }, { x: 176, y: 210 }, { x: 24, y: 210 }], 18);
  var capD = capsule(16, 118, 168, 90);

  var SPECS = {
    hero: {
      body: '<path d="' + heroD + '" fill="' + PAL.blue + '"/>',
      clip: '<path d="' + heroD + '"/>',
      face: eyes(100, 138, 17, 30) + mouth(100, 164, 9, "smile"),
      scarf: PAL.yellow, scx: 100, sy: 172, sh: 64,
      antenna: heroAntenna()
    },
    calm: {
      body: '<circle cx="100" cy="146" r="64" fill="' + PAL.blue + '"/>',
      clip: '<circle cx="100" cy="146" r="64"/>',
      face: eyes(100, 128, 16.5, 28) + mouth(100, 154, 8, "smile"),
      scarf: PAL.yellow, scx: 100, sy: 162, sh: 62,
      antenna: spring(100, 22, 84)
    },
    soft: {
      body: circles(flower, PAL.blue),
      clip: circles(flower),
      face: eyes(100, 136, 15, 26) + mouth(100, 158, 10, "smile"),
      scarf: PAL.pink, scx: 100, sy: 168, sh: 68,
      antenna: spring(100, 18, 86)
    },
    listen: {
      body: '<path d="' + capD + '" fill="' + PAL.blue + '"/>',
      clip: '<path d="' + capD + '"/>',
      face: eyes(100, 152, 15, 28) + mouth(100, 174, 8, "frown"),
      scarf: PAL.yellow, scx: 100, sy: 178, sh: 68,
      antenna: spring(100, 22, 120)
    },
    empathy: {
      body: '<path d="' + arch + '" fill="' + PAL.blue + '"/>',
      clip: '<path d="' + arch + '"/>',
      face: brows(100, 112, 34, "worry") + eyes(100, 130, 15, 27) + mouth(100, 156, 8, "frown") + tear(136, 138),
      scarf: PAL.yellow, scx: 100, sy: 170, sh: 58,
      antenna: spring(100, 18, 92)
    },
    cheer: {
      body: '<path d="' + cheerD + '" fill="' + PAL.blue + '"/>',
      clip: '<path d="' + cheerD + '"/>',
      face: brows(100, 112, 36, "cheer") + eyes(100, 136, 15, 28) + mouth(100, 162, 8, "smile"),
      scarf: PAL.orange, scx: 100, sy: 170, sh: 58,
      antenna: spring(100, 18, 88)
    },
    low: {
      body: '<path d="' + triD + '" fill="' + PAL.indigo + '"/>',
      clip: '<path d="' + triD + '"/>',
      face: eyes(100, 142, 12, 20, 0.8) + mouth(100, 164, 7, "frown"),
      scarf: PAL.amber, scx: 100, sy: 172, sh: 52,
      antenna: spring(100, 16, 82)
    }
  };

  function xiaojian(kind, uid) {
    var k = SPECS[kind] || SPECS.hero;
    var sc = scarf(k.scarf, k.scx, k.sy, k.sh);
    return '<svg viewBox="0 0 200 250" aria-hidden="true">' +
      '<defs><clipPath id="' + uid + '">' + k.clip + "</clipPath></defs>" +
      k.body +
      '<g clip-path="url(#' + uid + ')">' + sc.band + "</g>" +
      sc.tail + k.face + k.antenna +
      "</svg>";
  }

  function paintFaces() {
    document.querySelectorAll("[data-face], [data-kind]").forEach(function (el) {
      var kind = el.dataset.kind || state.temper;
      el.innerHTML = xiaojian(kind, "xj" + (++uidN));
    });
    document.querySelectorAll("[data-pick]").forEach(function (b) {
      var on = b.dataset.pick === state.temper;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var meta = META[state.temper] || META.hero;
    $("#hero-label").textContent = state.temper === "hero" ? "默认形象" : meta.name;
    $("#me-sub").textContent = state.temper === "hero"
      ? "首页是默认这一只，点下面可换"
      : "首页已换成「" + meta.name + "」";
    $("#greet").textContent = greetText();
    $("#reset-hero").hidden = state.temper === "hero";
    $("#name-val").textContent = state.name;
    $("#freq-val").textContent = state.freq;
    $("#pause-switch").classList.toggle("on", state.paused);
    $("#pause-switch").setAttribute("aria-checked", state.paused ? "true" : "false");
    $("#vent-switch").classList.toggle("on", state.ventOnly);
    renderPending();
  }

  function renderPending() {
    var box = $("#pending-text");
    if (state.pending) {
      box.innerHTML = "<strong>有一句还没送出</strong><span>希望忙时回「晚点聊」· 可预览，不会自动发</span>";
    } else {
      box.innerHTML = "<strong>这会儿没有待发出的话</strong><span>树洞里的内容，默认只留在这里</span>";
    }
  }

  /* ---------- 导航 ---------- */
  var TABS = { home: 1, hub: 1, me: 1 };

  function show(name) {
    state.view = name;
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("on", s.id === "view-" + name);
    });
    var isTab = !!TABS[name];
    $("#tabbar").classList.toggle("hide", !isTab);
    if (isTab) state.tab = name;
    document.querySelectorAll(".tab").forEach(function (t) {
      var on = t.dataset.tab === state.tab;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    var sc = $(".screen.on .scroll, .screen.on .chat-log");
    if (sc) sc.scrollTop = 0;
    if (name !== "call") stopCall();
  }

  function goTab(tab) {
    state.stack = [];
    show(tab);
  }

  function openSub(name) {
    state.stack.push(state.view);
    show(name);
  }

  function back() {
    if (state.view === "call") stopCall();
    var prev = state.stack.pop();
    show(prev || state.tab);
  }

  function openChat(from) {
    state.chatFrom = from;
    $("#chat-title").textContent = from === "tree" ? "树洞" : "小间";
    $("#vent-btn").hidden = from !== "tree";
    syncChatSub();
    openSub("chat");
    ensureOpener();
    var log = $("#chat-log");
    log.scrollTop = log.scrollHeight;
  }

  function syncChatSub() {
    if (state.chatFrom === "tree") {
      $("#chat-sub").textContent = state.ventOnly ? "今天只倒苦水，不往外送" : "只留在这里，不会自动发出";
    } else {
      $("#chat-sub").textContent = "想说就说，不着急";
    }
  }

  /* ---------- 对话 ---------- */
  var BASE = {
    hero: "我在。你想怎么说都行，不整理也没关系。",
    calm: "我听到了。我们可以慢慢来，不急着给它一个结论。",
    soft: "嗯，我在。你说的我接着，不催你往下。",
    listen: "我先接着听。你要是愿意，我再复述一遍给你对。",
    empathy: "这种感觉说出来就好。我说偏了，你直接改我。",
    cheer: "你愿意开口，这件事本身就清楚。想停也可以。",
    low: "不用找漂亮的说法。你现在这样，我就在。"
  };
  var HEAVY = {
    hero: "听起来，难的是等回应的那段空。若要让对方知道，可以是这一句：我有点闷，希望忙的时候先回我「晚点聊」。现在不送出也完全可以。",
    calm: "你在意的是被看见，不是要算旧账。这句话可以先放在这儿：希望忙的时候先回我一句「晚点聊」。要转达的话，我们再单独确认。",
    soft: "闷是真的，不是你太敏感。如果以后想让对方知道，我们用很轻的一句：希望忙时回我「晚点聊」。今天不送也行。",
    listen: "我听到的是：消息慢的时候，你会怀疑自己是不是不被放在心上。若要收成需求，就是：希望忙的时候先回我一句「晚点聊」。",
    empathy: "这种闷会发沉，我在。先不用决定要不要告诉对方。真要说的时候，那一句可以是：希望你忙时先回我「晚点聊」，我不是在指责。",
    cheer: "你可以把责怪收成需求，这句话站得住：我有点闷，希望忙的时候先回我「晚点聊」。要送的话，去短笺里再点一次确认。",
    low: "先不用修好它。闷就闷着，我陪你待一会儿。想把话说给对方，也等你自己准备好。"
  };
  var VENT = {
    hero: "今天这些话留在这儿。我不会拿去转达，也不会提醒你该去说。",
    calm: "只倒苦水。我听着，不把这句话送出去。",
    soft: "那我就只陪着。这些话不出这个树洞。",
    listen: "我听到了，到此为止。不复述给对方，也不建议你现在去说。",
    empathy: "闷就先放在我这儿。我不会把它变成要发给对方的句子。",
    cheer: "说完就可以停。今天没有「你应该去沟通」这一步。",
    low: "不用振作，也不用转达。我在。"
  };

  function replyFor(text) {
    var t = state.temper in BASE ? state.temper : "hero";
    if (state.ventOnly || /先听听|只倒|别告诉|别转/.test(text)) return VENT[t];
    if (/收成|转达|短笺|告诉对方/.test(text)) {
      return "可以收成这一句：我有点闷，希望忙的时候先回我「晚点聊」。对方只会看到这句，看不到你在树洞里说的话。要发出去，得到短笺里再确认一次。";
    }
    if (/闷|累|慢|委屈|烦|冷|不理|难过|气|晚/.test(text)) return HEAVY[t];
    return BASE[t];
  }

  function appendMsg(role, text) {
    var row = document.createElement("div");
    row.className = "msg-row" + (role === "me" ? " me" : "");
    if (role === "bot") {
      var face = document.createElement("div");
      face.className = "mini-face";
      face.dataset.face = "";
      face.innerHTML = xiaojian(state.temper, "xj" + (++uidN));
      row.appendChild(face);
    }
    var bubble = document.createElement("div");
    bubble.className = "bubble " + (role === "me" ? "me" : "bot");
    bubble.textContent = text;
    row.appendChild(bubble);
    $("#chat-log").appendChild(row);
  }

  function ensureOpener() {
    if (state.openedChat) return;
    state.openedChat = true;
    appendMsg("bot", BASE[state.temper] || BASE.hero);
  }

  function sendChat(text) {
    var value = (text || "").trim();
    if (!value) return;
    appendMsg("me", value);
    appendMsg("bot", replyFor(value));
    var log = $("#chat-log");
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- 信札 / 短笺 ---------- */
  function tagClass(status) {
    if (status === "待看") return "tag wait";
    if (status === "已送达") return "tag ok";
    if (status === "已回应" || status === "已读") return "tag done";
    if (status === "已降级") return "tag warm";
    return "tag";
  }

  function renderNotes() {
    var list = state.notes.filter(function (n) { return n.box === state.box; });
    var html = "";
    if (!list.length) {
      html = '<p class="empty-note">这一栏还是空的。</p>';
    }
    list.forEach(function (n) {
      html += '<article class="letter"><header><span class="who">' + esc(n.who) + '</span><span class="' + tagClass(n.status) + '">' + esc(n.status) + "</span></header>";
      html += "<p>" + esc(n.body) + "</p>";
      html += '<div class="meta">' + esc(n.meta) + "</div>";
      if (n.reply) html += '<div class="meta">你的回应：' + esc(n.reply) + "</div>";
      if (n.box === "in" && n.status === "待看") {
        html += '<div class="letter-actions">' +
          '<button type="button" data-act="later" data-id="' + n.id + '">稍后</button>' +
          '<button type="button" data-act="reply-one" data-id="' + n.id + '">回一句</button>' +
          '<button type="button" data-act="invite" data-id="' + n.id + '">一起聊</button>' +
          "</div>";
      }
      html += "</article>";
    });
    $("#note-list").innerHTML = html;
  }

  function findNote(id) {
    return state.notes.filter(function (n) { return n.id === id; })[0];
  }

  function buildSentence() {
    var feel = $("#field-feel").value.trim();
    var when = $("#field-when").value.trim();
    var need = $("#field-need").value.trim();
    if (!feel || !need) return "";
    var mid = when ? "（" + when + "）" : "";
    return feel + mid + "。我希望" + need + "。不是指责，只是这个需要。";
  }

  function invalidatePreview() {
    state.previewed = false;
    state.viaVoice = false;
    $("#preview").classList.remove("on");
    $("#btn-send-note").disabled = true;
  }

  function fillDraft() {
    $("#field-feel").value = "我有点闷";
    $("#field-when").value = "你回得慢的时候";
    $("#field-need").value = "先回我一句「晚点聊」";
  }

  function sendNote() {
    var sentence = buildSentence();
    if (!sentence || !state.previewed) {
      toast("先预览这句话，再确认转达。");
      return;
    }
    var kind = state.viaVoice ? "语音" : "短笺";
    state.notes.unshift({
      id: "n" + (state.noteSeq++),
      box: "out",
      who: kind === "语音" ? "语音代转" : "我刚确认的短笺",
      body: sentence,
      status: "已送达",
      meta: kind + " · 经你确认 · 不含树洞原文",
      reply: ""
    });
    state.pending = false;
    state.previewed = false;
    state.viaVoice = false;
    $("#preview").classList.remove("on");
    $("#btn-send-note").disabled = true;
    $("#field-feel").value = "";
    $("#field-when").value = "";
    $("#field-need").value = "";
    renderPending();
    state.box = "out";
    document.querySelectorAll("#seg button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.box === "out");
    });
    renderNotes();
    toast("已送达。对方看到的是这句需求，不是树洞原文。");
    state.stack = state.stack.filter(function (v) { return v !== "composer"; });
    show("letters");
  }

  /* ---------- 电话 ---------- */
  function stopCall() {
    if (state.callTick) {
      clearInterval(state.callTick);
      state.callTick = null;
    }
  }
  function fmt(n) { return (n < 10 ? "0" : "") + n; }
  function startCall() {
    stopCall();
    state.callSec = 0;
    $("#call-time").textContent = "00:00";
    $("#call-flag-text").textContent = "通话中 · 小间在说";
    $("#call-script").textContent = SCRIPT;
    state.callTick = setInterval(function () {
      state.callSec += 1;
      $("#call-time").textContent = fmt(Math.floor(state.callSec / 60)) + ":" + fmt(state.callSec % 60);
    }, 1000);
  }

  function openSheet(html) {
    $("#sheet-body").innerHTML = html;
    $("#sheet").classList.add("open");
  }
  function closeSheet() {
    $("#sheet").classList.remove("open");
  }

  function sheetCall() {
    openSheet(
      "<h2>这次请小间打过去？</h2>" +
      '<p class="lead">小间会报自己的名字，说明是代转。不会装成你，也不会装成对方。对方没接，就改成短笺，不会再打一次。</p>' +
      '<div class="script-box"><b>将要说的</b>' + esc(SCRIPT) + "</div>" +
      '<p class="sheet-note">如果是紧急危险，先联系当地求助，而不是打这通电话。</p>' +
      '<div class="sheet-actions"><button type="button" class="ghost" data-act="sheet-close">先不打</button><button type="button" class="cta coral" data-act="call-go">确认拨打</button></div>'
    );
  }

  function sheetDigest() {
    if (!state.pending) {
      toast("没有待发出的话。");
      return;
    }
    openSheet(
      "<h2>这句还没送出</h2>" +
      '<p class="lead">整理过的需求，不是树洞原文。不会自动发给对方。</p>' +
      '<div class="script-box"><b>可预览</b>我有点闷。不是要翻旧账。我希望你忙的时候，先回我一句「晚点聊」。</div>' +
      '<div class="sheet-actions"><button type="button" class="ghost" data-act="sheet-close">先放着</button><button type="button" class="cta" data-act="to-composer">收成短笺</button></div>'
    );
  }

  function sheetNames() {
    var html = "<h2>怎么称呼你</h2><div class=\"name-list\">";
    NAMES.forEach(function (n) {
      html += '<button type="button" data-act="set-name" data-name="' + n + '" class="' + (n === state.name ? "on" : "") + '">' + n + "</button>";
    });
    html += "</div>";
    openSheet(html);
  }

  function sheetReply(id) {
    openSheet(
      "<h2>回一句</h2>" +
      '<p class="lead">短一点就好。不会替你加别的话。</p>' +
      '<label class="field" style="margin-top:12px"><span>你的一句</span><input id="reply-input" type="text" placeholder="好，我记下了" autocomplete="off" /></label>' +
      '<div class="sheet-actions"><button type="button" class="ghost" data-act="sheet-close">取消</button><button type="button" class="cta" data-act="send-reply" data-id="' + id + '">送出</button></div>'
    );
    setTimeout(function () {
      var input = $("#reply-input");
      if (input) input.focus();
    }, 60);
  }

  function addDegradedNote() {
    state.notes.unshift({
      id: "n" + (state.noteSeq++),
      box: "out",
      who: "电话未接 · 改短笺",
      body: "我有点闷。希望你忙的时候先回我一句「晚点聊」。不是指责。",
      status: "已降级",
      meta: "未接，没有再打 · 对方看到的是这句",
      reply: ""
    });
    state.pending = false;
    renderPending();
  }

  /* ---------- 事件 ---------- */
  function onClick(e) {
    var el = e.target.closest("[data-tab],[data-open],[data-act],[data-pick],[data-back],[data-say],[data-box]");
    if (!el) return;
    if (el.dataset.tab) {
      goTab(el.dataset.tab);
      return;
    }
    if (el.hasAttribute("data-back")) {
      back();
      return;
    }
    if (el.dataset.box) {
      state.box = el.dataset.box;
      document.querySelectorAll("#seg button").forEach(function (b) {
        b.classList.toggle("on", b.dataset.box === state.box);
      });
      renderNotes();
      return;
    }
    if (el.dataset.pick) {
      state.temper = el.dataset.pick;
      persist();
      paintFaces();
      toast(state.temper === "hero"
        ? "已换回默认形象。"
        : "已换成「" + META[state.temper].name + "」。回首页就能看到。");
      return;
    }
    if (el.dataset.say) {
      sendChat(el.dataset.say);
      return;
    }
    if (el.dataset.open) {
      var dest = el.dataset.open;
      if (dest === "tree") openChat("tree");
      else if (dest === "letters") { renderNotes(); openSub("letters"); }
      else if (dest === "composer") openSub("composer");
      else if (dest === "phone") sheetCall();
      return;
    }
    var act = el.dataset.act;
    if (!act) return;
    if (act === "talk") openChat("home");
    else if (act === "pending") sheetDigest();
    else if (act === "vent") {
      state.ventOnly = !state.ventOnly;
      $("#vent-switch").classList.toggle("on", state.ventOnly);
      syncChatSub();
      toast(state.ventOnly ? "今天只倒苦水，不会建议你转达。" : "可以听，也可以之后再整理。");
    } else if (act === "pause") {
      state.paused = !state.paused;
      persist();
      paintFaces();
      toast(state.paused ? "已暂停主动找你。树洞还在。" : "主动开口恢复为「" + state.freq + "」。");
    } else if (act === "cycle-freq") {
      var i = FREQS.indexOf(state.freq);
      state.freq = FREQS[(i + 1) % FREQS.length];
      persist();
      paintFaces();
      toast("主动开口：" + state.freq);
    } else if (act === "pick-name") sheetNames();
    else if (act === "set-name") {
      state.name = el.dataset.name;
      persist();
      paintFaces();
      closeSheet();
    } else if (act === "prefill") {
      fillDraft();
      invalidatePreview();
      state.viaVoice = false;
      openSub("composer");
    } else if (act === "voice") {
      var btn = $("#voice-btn");
      btn.classList.add("listen");
      btn.textContent = "在听…";
      setTimeout(function () {
        fillDraft();
        state.viaVoice = true;
        state.previewed = false;
        $("#preview").classList.remove("on");
        $("#btn-send-note").disabled = true;
        btn.classList.remove("listen");
        btn.textContent = "说一句（示意）";
        toast("已整理成一句，还没发出。");
      }, 900);
    } else if (act === "preview-note") {
      var sentence = buildSentence();
      if (!sentence) {
        toast("先写下感受，和你希望对方做的那一件小事。");
        return;
      }
      $("#preview-text").textContent = sentence;
      $("#preview").classList.add("on");
      state.previewed = true;
      $("#btn-send-note").disabled = false;
    } else if (act === "send-note") sendNote();
    else if (act === "sheet-close") closeSheet();
    else if (act === "call-go") {
      closeSheet();
      openSub("call");
      startCall();
    } else if (act === "to-composer") {
      closeSheet();
      fillDraft();
      invalidatePreview();
      openSub("composer");
    } else if (act === "hangup") {
      stopCall();
      toast("已挂断。没有留下录音。");
      back();
    } else if (act === "missed") {
      stopCall();
      addDegradedNote();
      openSheet(
        "<h2>对方这会儿没接</h2>" +
        '<p class="lead">已改成一条短笺，没有继续打。</p>' +
        '<div class="script-box"><b>对方将看到</b>我有点闷。希望你忙的时候先回我一句「晚点聊」。不是指责。</div>' +
        '<div class="sheet-actions"><button type="button" class="ghost" data-act="miss-stay">知道了</button><button type="button" class="cta" data-act="miss-go">去信札看看</button></div>'
      );
    } else if (act === "miss-stay") {
      closeSheet();
      back();
    } else if (act === "miss-go") {
      closeSheet();
      state.box = "out";
      document.querySelectorAll("#seg button").forEach(function (b) {
        b.classList.toggle("on", b.dataset.box === "out");
      });
      renderNotes();
      state.stack = state.stack.filter(function (v) { return v !== "call"; });
      show("letters");
    } else if (act === "later") {
      var later = findNote(el.dataset.id);
      if (later) later.status = "稍后再看";
      renderNotes();
      toast("已放下。不会计时，也不会催你。");
    } else if (act === "invite") {
      toast("已记下一起聊的意愿。这版不进入三人聊。");
    } else if (act === "reply-one") sheetReply(el.dataset.id);
    else if (act === "send-reply") {
      var input = $("#reply-input");
      var reply = input ? input.value.trim() : "";
      if (!reply) { toast("先写一句再送出。"); return; }
      var note = findNote(el.dataset.id);
      if (note) {
        note.status = "已回应";
        note.reply = reply;
      }
      closeSheet();
      renderNotes();
      toast("已回给对方的小间。");
    }
  }

  function tickClock() {
    var now = new Date();
    $("#clock").textContent = fmt(now.getHours()) + ":" + fmt(now.getMinutes());
    if (state.view === "home") $("#greet").textContent = greetText();
  }

  function bind() {
    document.body.addEventListener("click", onClick);
    $("#chat-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#chat-input");
      sendChat(input.value);
      input.value = "";
    });
    ["field-feel", "field-when", "field-need"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () {
        if (state.previewed) invalidatePreview();
      });
    });
    $("#sheet").addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeSheet();
    });
  }

  paintFaces();
  renderNotes();
  tickClock();
  setInterval(tickClock, 15000);
  bind();
})();
