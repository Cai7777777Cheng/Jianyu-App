/* 间语 4.2 · 与 Vite 原型同一套传达流程，file:// 可开。 */
(function () {
  "use strict";

  var FACES = {
    calm: { name: "平静", src: "assets/xiaojian/calm.png", tint: "#A5D8FF" },
    soft: { name: "软萌", src: "assets/xiaojian/soft.png", tint: "#FFD0E4" },
    listen: { name: "倾听", src: "assets/xiaojian/listen.png", tint: "#C9D4FF" },
    empathy: { name: "共情", src: "assets/xiaojian/empathy.png", tint: "#E5DBFF" },
    cheer: { name: "鼓励", src: "assets/xiaojian/cheer.png", tint: "#B2F2BB" },
    low: { name: "低落", src: "assets/xiaojian/low.png", tint: "#D5DCEB" }
  };
  var FREQS = ["很少开口", "刚好就好", "多关心一点"];
  var NAMES = ["阿宁", "你", "宁"];
  var HEARD = ["有点闷", "谢谢，我好一点了", "你先听我说"];
  var GOLDEN_LINE = "连续两天很少回我，我有点不安";
  var GOLDEN = {
    feel: "不安",
    situation: "连续两天消息很少回",
    need: "今晚能有 10 分钟一起聊聊今天发生的事，不急着解决所有问题",
    raw: GOLDEN_LINE,
    conflict: true
  };
  var STATE_LABEL = { done: "已疏通", part: "部分", open: "未解决" };
  var TODAY = 15;
  var LEAD = 2;
  var DAYS_N = 30;
  var SEED_DAYS = [
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
    { day: 28, state: "done", agreement: "忙的时候先回一句「晚点聊」。", result: "对方答应了，这件说开了。" }
  ];
  var TABS = { home: 1, hub: 1, cal: 1, me: 1 };

  function cloneDays() {
    return SEED_DAYS.map(function (d) { return { day: d.day, state: d.state, agreement: d.agreement, result: d.result }; });
  }
  function seedNotes() {
    return [
      { id: "n1", box: "in", who: "小间 · 代小周转达", body: "小间代转：\n小周这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。", status: "待看", meta: "短笺 · 经小周确认 · 不含原话", reply: "", conflict: false, fresh: false },
      { id: "n2", box: "out", who: "小间 · 代我转达", body: "小间代转：\n阿宁有点闷。希望忙的时候先回一句「晚点聊」。", status: "已送达", meta: "短笺 · 小周还没回", reply: "", conflict: false, fresh: false }
    ];
  }

  var state = {
    view: "home", tab: "home", stack: [],
    temper: "calm", shown: "calm", name: "阿宁", freq: "刚好就好",
    paused: false, calls: false, ventOnly: false, listening: false,
    heardI: 0, messages: [], box: "in", lens: "ning",
    card: null, offer: false, guideCard: null, channel: null,
    days: cloneDays(), playing: false, zhouNod: false,
    callSec: 0, callTick: null, noteSeq: 3, msgId: 1, relax: null, sheetKind: ""
  };

  try {
    var saved = JSON.parse(localStorage.getItem("jianyu42") || "null");
    if (saved && FACES[saved.temper]) {
      state.temper = saved.temper;
      state.shown = saved.temper;
      if (saved.name) state.name = saved.name;
      if (saved.freq) state.freq = saved.freq;
      if (saved.paused) state.paused = true;
      if (saved.calls) state.calls = true;
    }
  } catch (err) {}

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function persist() {
    try { localStorage.setItem("jianyu42", JSON.stringify({ temper: state.temper, name: state.name, freq: state.freq, paused: state.paused, calls: state.calls })); } catch (err) {}
  }
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.toggle("low", !TABS[state.view]);
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }
  function greetText() {
    var h = new Date().getHours();
    var part = h < 5 ? "夜深了" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
    return part + "，" + state.name + "<br />今天感觉怎么样？";
  }
  function faceFor(text) {
    if (/闷|累|难过|委屈|烦|哭|伤心|冷|慢|不理|不安/.test(text)) return "empathy";
    if (/开心|谢谢|好一点|加油|哈哈|棒|安心|轻松/.test(text)) return "cheer";
    if (/低落|不想|好难|没劲/.test(text)) return "low";
    if (/可爱|软|哄/.test(text)) return "soft";
    if (/听|在吗|说说/.test(text)) return "listen";
    return state.temper;
  }
  function cardFromText(text) {
    var value = String(text || "").trim();
    if (!value || /别告诉|别转|只倒|先听听/.test(value)) return null;
    if (/谢谢|好一点|开心|哈哈/.test(value) && !/回|不安|不理/.test(value)) return null;
    if (/回|消息|不理|冷淡|不安|很少回|冷战/.test(value)) return { feel: GOLDEN.feel, situation: GOLDEN.situation, need: GOLDEN.need, raw: value, conflict: true };
    if (/闷/.test(value)) return { feel: "闷", situation: "这会儿还说不上是哪一句", need: "先待一会儿，不用马上谈完", raw: value, conflict: true };
    if (/委屈|烦|生气|讨厌|指责|吵/.test(value)) return { feel: "委屈", situation: value.length > 24 ? value.slice(0, 24) : value, need: "先听我说完，再约一个时间", raw: value, conflict: true };
    return null;
  }
  function replyFor(text, face) {
    if (state.ventOnly || /先听听|只倒|别告诉|别转/.test(text)) return "这些话先留在树洞。我不会拿去转达。";
    if (cardFromText(text)) return "我听到的是感受，不是给对方的判决。原话留在树洞。这张卡要不要送出去，你来定。";
    if (face === "empathy") return "闷是真的。想让对方知道的话，只送感受、情境和一件小事。现在不送也行。";
    if (face === "cheer") return "听到了。你轻一点也完全可以，不用马上把话说完。";
    if (face === "low") return "先不用振作。你现在这样，我就在。";
    if (face === "listen") return "我在听。你说完，我再问要不要收成一张卡。";
    if (face === "soft") return "我在。不催你，想说的时候再说。";
    return "我在。想怎么说都行，不整理也没关系。";
  }
  function relayLines(card) {
    if (!card) return [];
    var golden = card.feel === GOLDEN.feel && card.situation === GOLDEN.situation && card.need === GOLDEN.need;
    if (golden) return [state.name + "最近有点闷闷的。", "当连续两天消息很少回的时候，TA 会感到不安。", "TA 希望今晚能有 10 分钟一起聊聊今天发生的事（不急着解决所有问题）。"];
    return [state.name + "最近有些" + card.feel + "。", "当" + card.situation + "的时候，TA 会感到" + card.feel + "。", "TA 希望" + card.need + "。"];
  }
  function relayText(card) { return ["小间代转："].concat(relayLines(card)).join("\n"); }
  function callScript(card) {
    return ["我是小间，受" + state.name + "委托代转，不是" + state.name + "本人。"].concat(relayLines(card)).concat(["你现在方便回一句，还是要我改成短笺留给你？"]).join("\n");
  }
  function stats() {
    var done = 0, part = 0, open = 0;
    state.days.forEach(function (d) { if (d.state === "done") done++; else if (d.state === "part") part++; else open++; });
    var total = state.days.length;
    return { done: done, part: part, open: open, total: total, rate: total ? Math.round((done / total) * 100) : 0 };
  }
  function dayBy(n) {
    for (var i = 0; i < state.days.length; i++) if (state.days[i].day === n) return state.days[i];
    return null;
  }
  function noteFrom(card, reply) {
    var agreed = reply.indexOf("今晚可以") >= 0;
    var heard = reply.indexOf("收到") >= 0;
    var together = reply.indexOf("一起") >= 0;
    var st = "open";
    var result = "已经转达。还在等小周回一句。";
    if (together) { st = "part"; result = "两边都点头，约了今晚 10 分钟。还没聊完，先记成部分疏通。"; }
    else if (agreed) { st = "part"; result = "小周回了「今晚可以」。两边各留了一小步，还没聊完。"; }
    else if (heard) { st = "part"; result = "小周回了「我收到了」。先确认收到，时间还没定。"; }
    return { day: TODAY, state: st, agreement: card.need, result: result };
  }
  function writeDay(card, reply) {
    var next = noteFrom(card, reply);
    state.days = state.days.map(function (d) { return d.day === TODAY ? next : d; });
  }

  function show(name) {
    state.view = name;
    if (TABS[name]) state.tab = name;
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.toggle("on", s.id === "view-" + name); });
    $("#tabbar").classList.toggle("hide", !TABS[name]);
    document.querySelectorAll(".tab").forEach(function (t) {
      var on = t.dataset.tab === state.tab && !!TABS[name];
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (name !== "call") stopCall();
    if (name !== "voice") state.playing = false;
    render();
  }
  function goTab(tab) { state.stack = []; closeSheet(); show(tab); }
  function openSub(name) { state.stack.push(state.view); show(name); }
  function back() { closeSheet(); show(state.stack.pop() || state.tab); }
  function land(name) { state.stack = []; closeSheet(); show(name); }

  function faceNow() { return state.listening ? "listen" : state.shown; }
  function paintFace() {
    var id = faceNow();
    var face = FACES[id];
    $("#phone").dataset.temper = id;
    $("#hero-img").src = face.src;
    $("#hero-img").alt = "小间 · " + face.name;
    $("#mood").textContent = face.name;
    $("#greet").innerHTML = greetText();
    document.querySelectorAll("[data-pick]").forEach(function (b) { b.classList.toggle("on", b.dataset.pick === state.temper); });
    $("#name-val").textContent = state.name;
    $("#freq-val").textContent = state.freq;
    $("#pause-switch").classList.toggle("on", state.paused);
    $("#call-switch").classList.toggle("on", state.calls);
    $("#vent-switch").classList.toggle("on", state.ventOnly);
    $("#tree-sub").textContent = state.ventOnly ? "今天只倒苦水" : "原话留在这里";
    $("#dock").classList.toggle("listening", state.listening);
    $("#hero-float").classList.toggle("listening", state.listening);
    var saying = $("#say").value.trim() && !state.listening;
    $("#icon-mic").hidden = saying;
    $("#icon-arrow").hidden = !saying;
    $("#help-go").classList.toggle("hot", state.listening);
    $("#help-go").setAttribute("aria-label", saying ? "发送" : "说话");
    $("#say").placeholder = state.listening ? "在听…" : "跟小间说说";
  }
  function bounce() {
    var el = $("#hero-float");
    el.classList.remove("bounce");
    void el.offsetWidth;
    el.classList.add("bounce");
  }
  $("#hero-float").addEventListener("animationend", function (e) {
    if (e.animationName === "pop") e.currentTarget.classList.remove("bounce");
  });

  function bubbleHtml(list) {
    return list.map(function (m) {
      var style = m.role === "me" ? ' style="background:' + m.tint + '"' : "";
      return '<div class="bubble ' + m.role + '"' + style + ">" + esc(m.text) + "</div>";
    }).join("");
  }
  function renderHome() {
    var fresh = null;
    state.notes.forEach(function (n) { if (n.fresh) fresh = n; });
    $("#bubbles").innerHTML = bubbleHtml(state.messages.slice(-2));
    $("#home-suggest").hidden = state.messages.length > 0;
    $("#home-chip").hidden = !(state.offer && state.card);
    $("#home-live").hidden = !fresh;
    if (fresh) {
      $("#live-b").textContent = fresh.reply ? "小周回了「" + fresh.reply + "」" : fresh.status === "已降级" ? "没接到，已改成信札" : "已转达，等小周回";
      $("#live-s").textContent = fresh.reply ? "点开可以看这封信札" : "点开信札，可以回一句";
    }
    var st = stats();
    $("#backlog-n").textContent = String(st.open);
  }
  function renderTree() {
    var html = state.messages.map(function (m) {
      var style = m.role === "me" ? ' style="background:' + m.tint + '"' : "";
      return '<div class="bubble ' + m.role + '"' + style + ">" + esc(m.text) + "</div>";
    }).join("");
    if (!state.messages.length) {
      html = '<p class="empty">树洞还是空的。点下面这句，或在首页说。</p><button class="suggest" type="button" data-act="golden">' + esc(GOLDEN_LINE) + "</button>";
    }
    $("#tree-log").innerHTML = html;
    $("#tree-log").scrollTop = 9999;
    $("#bubbles").scrollTop = 9999;
  }
  function renderDraft() {
    var card = state.card;
    if (!card) { $("#draft-body").innerHTML = '<p class="empty">还没有情绪卡。先在树洞或首页说一句。</p>'; return; }
    $("#draft-body").innerHTML =
      '<article class="emo-card"><div class="kicker">感受 · 情境 · 一件小事</div><h2>我听到的是</h2>' +
      '<div class="emo-line"><b>感受</b><span>我感到' + esc(card.feel) + "</span></div>" +
      '<div class="emo-line"><b>情境</b><span>当' + esc(card.situation) + "的时候</span></div>" +
      '<div class="emo-line"><b>需要</b><span>我希望' + esc(card.need) + "</span></div></article>" +
      '<div class="raw-box"><b>树洞原话 · 不会送出</b><p>' + esc(card.raw) + "</p></div>" +
      '<div class="choice-row"><button class="cta ghost" type="button" data-act="keep">只留树洞</button><button class="cta" type="button" data-act="convey">想转达</button></div>';
  }
  function renderPreview() {
    var card = state.card;
    var host = $("#preview-body");
    if (!card) { host.innerHTML = '<p class="empty">还没有可以转达的卡。</p>'; return; }
    host.innerHTML =
      '<article class="preview-card"><div class="plabel">小间代转 · 不是' + esc(state.name) + '本人</div><h2>只有这三句</h2><div class="relay">' +
      relayLines(card).map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("") +
      "</div><p class=\"warn\">树洞原话不会出现。来电上的名字是小间，不是小周。</p></article>" +
      '<label class="field"><span>感受</span><input id="field-feel" type="text" /></label>' +
      '<label class="field"><span>情境</span><input id="field-when" type="text" /></label>' +
      '<label class="field"><span>正向需求</span><input id="field-need" type="text" /></label>' +
      '<div class="chan-row">' +
      '<button type="button" class="chan chan-letter' + (state.channel === "letter" ? " on" : "") + '" data-act="channel" data-channel="letter"><span class="kicker">短笺</span><b>信札</b><small>小周可以回「我收到了」或「今晚可以」。</small></button>' +
      '<button type="button" class="chan chan-call' + (state.channel === "call" ? " on" : "") + '" data-act="channel" data-channel="call"><span class="kicker">来电</span><b>小间来电</b><small>' + (state.calls ? "小周已允许来电。" : "默认关。第一次会问小周。") + "</small></button></div>" +
      '<button class="cta" type="button" id="send-btn" data-act="send"' + (!state.channel ? " disabled" : "") + ">" +
      (state.channel === "call" ? "请小间打给小周" : state.channel === "letter" ? "放进小周的信札" : "先选一种送达") + "</button>";
    ["field-feel", "field-when", "field-need"].forEach(function (id, idx) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = [card.feel, card.situation, card.need][idx];
      el.addEventListener("input", function () {
        var keys = ["feel", "situation", "need"];
        state.card[keys[idx]] = el.value;
        var lines = $("#preview-body .relay");
        if (lines) lines.innerHTML = relayLines(state.card).map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("");
        var btn = $("#send-btn");
        if (btn) btn.disabled = !state.channel || !state.card.feel.trim() || !state.card.need.trim();
      });
    });
  }
  function tagClass(status) {
    if (status === "待看" || status === "稍后再看") return "tag wait";
    if (status === "已送达" || status === "已回应") return "tag ok";
    if (status === "已降级") return "tag warm";
    return "tag";
  }
  function visibleNotes() {
    var want = state.lens === "ning" ? state.box : state.box === "in" ? "out" : "in";
    return state.notes.filter(function (n) { return n.box === want; });
  }
  function canReply(n) {
    if (n.reply || n.status === "稍后再看") return false;
    if (state.lens === "zhou" && n.box === "out") return true;
    if (state.lens === "ning" && n.box === "in") return true;
    return false;
  }
  function renderLetters() {
    $("#letter-sub").textContent = state.lens === "ning" ? state.name + "的信札" : "小周的手机 · 看到的是短笺";
    document.querySelectorAll("#lens-seg button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.lens === state.lens);
      if (b.dataset.lens === "ning") b.textContent = state.name;
    });
    document.querySelectorAll("#box-seg button").forEach(function (b) { b.classList.toggle("on", b.dataset.box === state.box); });
    var html = "";
    var list = visibleNotes();
    if (!list.length) html = '<p class="empty">这一栏还是空的。</p>';
    list.forEach(function (n) {
      html += '<article class="letter ' + n.box + '"><header><span class="who">' + esc(n.who) + '</span><span class="' + tagClass(n.status) + '">' + esc(n.status) + "</span></header>";
      html += "<p>" + esc(n.body) + "</p><div class=\"meta\">" + esc(n.meta) + "</div>";
      if (n.reply) html += '<div class="meta">回了一句：' + esc(n.reply) + "</div>";
      if (canReply(n)) {
        html += '<div class="letter-actions">';
        html += '<button type="button" data-act="reply" data-id="' + n.id + '" data-reply="我收到了">我收到了</button>';
        html += '<button type="button" data-act="reply" data-id="' + n.id + '" data-reply="今晚可以">今晚可以</button>';
        html += '<button class="ghosty" type="button" data-act="later-note" data-id="' + n.id + '">稍后</button></div>';
      }
      html += "</article>";
    });
    $("#note-list").innerHTML = html;
    $("#write-note").textContent = state.card ? "用这张情绪卡写短笺" : "用演示卡写一封";
  }
  function renderCal() {
    var html = "";
    var map = {};
    state.days.forEach(function (d) { map[d.day] = d; });
    for (var i = 0; i < LEAD; i++) html += '<span class="day blank"></span>';
    for (var day = 1; day <= DAYS_N; day++) {
      var note = map[day];
      var st = note ? note.state : "empty";
      html += '<button type="button" class="day ' + st + (note ? " has" : "") + (day === TODAY ? " today" : "") + '" data-day="' + day + '"' + (note ? "" : " disabled") + "><span>" + day + '</span><i class="dot"></i></button>';
    }
    $("#cal-grid").innerHTML = html;
    var stt = stats();
    $("#sum-copy").textContent = stt.total + " 件里说开了 " + stt.done + " 件。还积压 " + stt.open + " 件，" + stt.part + " 件只通了一半。";
    $("#sum-rate").textContent = stt.rate + "%";
    $("#sum-part").textContent = String(stt.part);
    $("#sum-open").textContent = String(stt.open);
  }
  function renderVoice() {
    var card = state.card;
    var html = '<div class="voice-stage' + (state.playing ? " playing" : "") + '"><img class="voice-face" alt="" src="assets/xiaojian/calm.png" /><div class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>';
    if (card) {
      html += '<div class="script"><span>' + (state.playing ? "小间正在读" : "将要读的") + "</span><p>" + esc(callScript(card)) + "</p></div>";
      html += '<button class="cta" type="button" data-act="voice-toggle">' + (state.playing ? "停一下" : "让小间读一遍") + "</button>";
      html += '<button class="cta ghost" type="button" data-act="convey">改用信札或来电送出</button>';
    } else {
      html += '<p class="empty">还没有情绪卡。可以先用阿宁这张演示，或回树洞说一句。</p>';
      html += '<button class="cta" type="button" data-act="voice-demo">用演示的一张</button>';
      html += '<button class="cta ghost" type="button" data-open="tree">去树洞说</button>';
    }
    $("#voice-body").innerHTML = html;
  }
  function renderIncoming() {
    $("#incoming-sub").innerHTML = "有一句想替" + esc(state.name) + "转达<br />不是" + esc(state.name) + "本人";
    $("#incoming").classList.toggle("holding", state.sheetKind === "permit");
    document.querySelectorAll("#incoming button").forEach(function (b) { b.disabled = state.sheetKind === "permit"; });
  }
  function renderCall() {
    $("#call-sub").textContent = "受" + state.name + "委托代转";
    $("#call-flag").textContent = "通话中 · 不是" + state.name + "本人";
    $("#call-script").textContent = state.card ? callScript(state.card) : "";
    $("#call-time").textContent = pad(Math.floor(state.callSec / 60)) + ":" + pad(state.callSec % 60);
  }
  function renderGuide() {
    var name = state.name;
    $("#guide-body").innerHTML =
      '<p class="guide-note">演示里两张并排。真用的时候，每人只看到自己的那张，也看不到对方的树洞原话。</p>' +
      '<article class="guide-card ning"><div class="who">给' + esc(name) + '</div><h3>你已经说清楚需要了</h3><div class="step-label">我可以做的一小步</div><p class="step">今晚之前不再追问，把这 10 分钟留给对方决定。</p><div class="step-label">送出去之前</div><p class="step">还想加一句指责吗？先留在树洞，不送出去。</p></article>' +
      '<article class="guide-card zhou"><div class="who">给小周</div><h3>这是在说需要，不是在定罪</h3><div class="step-label">我可以做的一小步</div><p class="step">先回一句「我收到了」或「今晚可以」，再决定有没有 10 分钟。</p><div class="step-label">送出去之前</div><p class="step">想解释之前，先用自己的话复述对方的需要。</p></article>' +
      '<button class="cta" type="button" data-act="together">邀请一起聊 10 分钟</button>' +
      '<button class="cta ghost" type="button" data-act="open-zhou">看小周的信札</button>' +
      '<button class="cta ghost" type="button" data-act="open-today">看9月15日</button>';
  }
  function renderTogether() {
    var card = state.card;
    var html = '<div class="nod-row"><div class="nod on">' + esc(state.name) + '已准备<small>用「我感到…我需要…」</small></div>' +
      '<button type="button" class="nod' + (state.zhouNod ? " on" : "") + '" data-act="zhou-nod">' +
      (state.zhouNod ? "小周也愿意" : "请小周点头") + "<small>" + (state.zhouNod ? "两边都到了" : "还差这一边") + "</small></button></div>";
    if (state.zhouNod && card) {
      html += '<article class="line-card"><b>小间请' + esc(state.name) + "先说</b><p>我感到" + esc(card.feel) + "。我需要" + esc(card.need) + "。</p></article>";
      html += '<article class="line-card"><b>小间请小周说</b><p>我感到这几天有点赶。我需要先回一句，今晚再留 10 分钟。</p></article>';
      html += '<p class="guide-note">小间会拦住指责，改写成需要。今天可以只降温，不把所有问题谈完。</p>';
      html += '<button class="cta" type="button" data-act="save-pact">记成小约定</button>';
    } else {
      html += '<p class="empty">' + (state.zhouNod ? "还没有可以记的卡。" : "小周还没点头。点上面那一格，演示里就算两边都到了。") + "</p>";
    }
    $("#together-body").innerHTML = html;
  }
  function render() {
    paintFace();
    renderHome();
    renderTree();
    if (state.view === "draft") renderDraft();
    if (state.view === "preview") renderPreview();
    renderLetters();
    renderCal();
    if (state.view === "voice") renderVoice();
    renderIncoming();
    renderCall();
    if (state.view === "guide") renderGuide();
    if (state.view === "together") renderTogether();
  }

  function pushLine(role, text, tint) {
    state.messages.push({ id: state.msgId++, role: role, text: text, tint: tint });
  }
  function speak(text) {
    var value = String(text || "").trim();
    if (!value) return;
    var vent = state.ventOnly;
    var face = vent ? state.temper : faceFor(value);
    var tint = FACES[face].tint;
    var next = vent ? null : cardFromText(value);
    var from = state.view;
    pushLine("me", value, tint);
    state.shown = face;
    bounce();
    render();
    clearTimeout(state.relax);
    setTimeout(function () {
      pushLine("bot", replyFor(value, face), "#ffffff");
      if (next) { state.card = next; state.offer = true; }
      render();
    }, 420);
    setTimeout(function () {
      if (!state.listening) state.shown = state.temper;
      if (next) { state.stack.push(from); show("draft"); }
      else render();
    }, 880);
  }
  function startListen() {
    if (state.listening) return;
    state.listening = true;
    state.shown = "listen";
    bounce();
    render();
    setTimeout(function () {
      if (!state.listening) return;
      var line = HEARD[state.heardI % HEARD.length];
      state.heardI += 1;
      state.listening = false;
      speak(line);
    }, 900);
  }
  function deliver(status, meta, reply, dest) {
    var card = state.card;
    if (!card) return;
    var id = "n" + state.noteSeq++;
    state.notes.forEach(function (n) { n.fresh = false; });
    state.notes.unshift({
      id: id, box: "out", who: "小间 · 代我转达", body: relayText(card),
      status: reply ? "已回应" : status, meta: meta, reply: reply, conflict: !!card.conflict, fresh: true
    });
    state.guideCard = { feel: card.feel, situation: card.situation, need: card.need, raw: card.raw, conflict: card.conflict };
    state.offer = false;
    writeDay(card, reply);
    state.lens = "zhou";
    state.box = "in";
    if (card.conflict && dest === "guide") land("guide");
    else land("letters");
  }
  function openPreview(pref, source) {
    if (source) state.card = source;
    state.channel = pref;
    closeSheet();
    openSub("preview");
  }
  function sendChosen() {
    if (!state.card || !state.channel) { toast("先选信札，或小间来电。"); return; }
    if (!state.card.feel.trim() || !state.card.need.trim()) return;
    if (state.channel === "letter") {
      deliver("待看", "短笺 · 小周还没回", "", "guide");
      toast("已放进小周的信札。对方看到的是这三句，不是原话。");
      return;
    }
    state.stack.push("preview");
    state.sheetKind = state.calls ? "" : "permit";
    show("incoming");
    if (!state.calls) openPermit();
  }
  function stopCall() {
    if (state.callTick) { clearInterval(state.callTick); state.callTick = null; }
  }
  function startCall() {
    stopCall();
    state.callSec = 0;
    state.callTick = setInterval(function () {
      state.callSec += 1;
      var el = $("#call-time");
      if (el) el.textContent = pad(Math.floor(state.callSec / 60)) + ":" + pad(state.callSec % 60);
    }, 1000);
  }
  function openSheet(html, kind) {
    state.sheetKind = kind || "";
    $("#sheet-body").innerHTML = html;
    $("#sheet").hidden = false;
    if (state.view === "incoming") renderIncoming();
  }
  function closeSheet() {
    state.sheetKind = "";
    $("#sheet").hidden = true;
    if (state.view === "incoming") renderIncoming();
  }
  function openPermit() {
    openSheet(
      '<p class="kicker">小周的手机 · 第一次来电</p><h2>要允许小间来电吗？</h2><p class="lead">来电默认关着。允许之后，来电上的名字是「小间」，不是' + esc(state.name) + "，也不是小周。</p><p class=\"sheet-note\">先不允许的话，这句改成信札，不会再打。</p><div class=\"sheet-actions\"><button type=\"button\" class=\"ghost\" data-act=\"decline\">先不允许</button><button type=\"button\" class=\"cta\" data-act=\"allow\">允许来电</button></div>",
      "permit"
    );
  }
  function openDay(day) {
    var note = dayBy(day);
    if (!note) return;
    openSheet(
      '<p class="kicker">9月' + day + "日" + (day === TODAY ? " · 今天" : "") + "</p><h2>" + STATE_LABEL[note.state] + '</h2><span class="state-pill ' + note.state + '">' + STATE_LABEL[note.state] + "</span>" +
      '<div class="detail-block"><b>约定</b><p>' + esc(note.agreement) + "</p></div>" +
      '<div class="detail-block"><b>沟通结果</b><p>' + esc(note.result) + '</p></div><div class="sheet-actions"><button type="button" class="cta" data-close>知道了</button></div>',
      "day"
    );
  }
  function replyTo(id, reply) {
    var item = null;
    state.notes.forEach(function (n) {
      n.fresh = false;
      if (n.id === id) { n.status = "已回应"; n.reply = reply; n.fresh = true; item = n; }
    });
    if (item && item.box === "out" && item.conflict && state.guideCard) writeDay(state.guideCard, reply);
    toast((state.lens === "zhou" ? "小周" : state.name) + "回了「" + reply + "」。");
    render();
  }
  function resetDemo() {
    state.noteSeq = 3;
    state.msgId = 1;
    state.notes = seedNotes();
    state.days = cloneDays();
    state.messages = [];
    state.card = null;
    state.offer = false;
    state.guideCard = null;
    state.calls = false;
    state.ventOnly = false;
    state.listening = false;
    state.lens = "ning";
    state.box = "in";
    state.channel = null;
    state.zhouNod = false;
    state.shown = state.temper;
    persist();
    toast("演示回到开头。来电仍然关着。");
    goTab("home");
  }

  state.notes = seedNotes();

  function onClick(e) {
    var tab = e.target.closest("[data-tab]");
    if (tab) { goTab(tab.dataset.tab); return; }
    var open = e.target.closest("[data-open]");
    if (open) { openSub(open.dataset.open); return; }
    if (e.target.closest("[data-back]")) { back(); return; }
    var day = e.target.closest("[data-day]");
    if (day && !day.disabled) { openDay(Number(day.dataset.day)); return; }
    var pick = e.target.closest("[data-pick]");
    if (pick) {
      state.temper = pick.dataset.pick;
      state.shown = state.temper;
      state.listening = false;
      persist();
      bounce();
      toast("首页已换成「" + FACES[state.temper].name + "」。");
      render();
      return;
    }
    var lens = e.target.closest("[data-lens]");
    if (lens) { state.lens = lens.dataset.lens; renderLetters(); return; }
    var box = e.target.closest("[data-box]");
    if (box) { state.box = box.dataset.box; renderLetters(); return; }
    if (e.target.closest("[data-close]")) { closeSheet(); return; }

    var actEl = e.target.closest("[data-act]");
    if (!actEl) return;
    var act = actEl.dataset.act;
    if (act === "golden") speak(GOLDEN_LINE);
    else if (act === "vent") {
      state.ventOnly = !state.ventOnly;
      toast(state.ventOnly ? "今天只倒苦水，不会收成卡。" : "可以说。要不要转达，你再定。");
      render();
    } else if (act === "keep") {
      state.card = null;
      state.offer = false;
      toast("留在树洞了。对方看不到。");
      back();
    } else if (act === "convey") openPreview(null);
    else if (act === "channel") {
      state.channel = actEl.dataset.channel;
      renderPreview();
    } else if (act === "send") sendChosen();
    else if (act === "write-note") openPreview("letter", state.card || { feel: GOLDEN.feel, situation: GOLDEN.situation, need: GOLDEN.need, raw: GOLDEN.raw, conflict: true });
    else if (act === "hub-call") {
      if (state.card) openPreview("call");
      else openSheet('<h2>还没有情绪卡</h2><p class="lead">可以用阿宁这张演示卡。预览之后，再请小间打给小周。来电显示的是小间。</p><div class="script"><span>对方将看到</span><p>' + esc(relayLines(GOLDEN).join("\n")) + '</p></div><div class="sheet-actions"><button type="button" class="ghost" data-close>先去树洞</button><button type="button" class="cta coral" data-act="use-demo">用这张预览</button></div>', "demo");
    } else if (act === "use-demo") openPreview("call", { feel: GOLDEN.feel, situation: GOLDEN.situation, need: GOLDEN.need, raw: GOLDEN.raw, conflict: true });
    else if (act === "allow") {
      state.calls = true;
      persist();
      closeSheet();
      toast("小周允许了。来电上的名字是小间。");
    } else if (act === "decline") {
      closeSheet();
      deliver("已降级", "没有打开来电，改成了信札", "", "guide");
      toast("没打开来电。这句改成信札了，不会再打。");
    } else if (act === "answer") { closeSheet(); state.callSec = 0; show("call"); startCall(); }
    else if (act === "later-call") { deliver("待看", "来电选了稍后，没有再打", "", "guide"); toast("已稍后。不会再打，短笺留在信札里。"); }
    else if (act === "switch-letter") { deliver("待看", "来电改看了信札", "", "guide"); toast("改看信札了。没有继续打。"); }
    else if (act === "miss") {
      deliver("已降级", "没接到，已改成信札，没有再打", "", "guide");
      openSheet('<h2>这会儿没接到</h2><p class="lead">已改成一条信札，没有继续打。</p><div class="sheet-actions"><button type="button" class="ghost" data-close>看两边的一小步</button><button type="button" class="cta" data-act="miss-letters">去信札</button></div>', "miss");
    } else if (act === "miss-letters") {
      state.lens = "zhou";
      state.box = "in";
      state.stack = ["guide"];
      closeSheet();
      show("letters");
    } else if (act === "call-reply") { deliver("已回应", "来电里回的", actEl.dataset.reply, "guide"); }
    else if (act === "call-to-letter") { deliver("待看", "来电改成了短笺", "", "guide"); toast("改成短笺了。"); }
    else if (act === "hang") { deliver("待看", "来电接通了，还没回一句", "", "guide"); toast("已挂断。没有录音。"); }
    else if (act === "reply") replyTo(actEl.dataset.id, actEl.dataset.reply);
    else if (act === "later-note") {
      state.notes.forEach(function (n) { if (n.id === actEl.dataset.id) n.status = "稍后再看"; });
      toast("已放下。不会计时，也不会再催。");
      render();
    } else if (act === "open-zhou") {
      state.lens = "zhou";
      state.box = "in";
      openSub("letters");
    } else if (act === "open-today") {
      state.stack = [];
      show("cal");
      openDay(TODAY);
    } else if (act === "together") { state.zhouNod = false; openSub("together"); }
    else if (act === "zhou-nod") { state.zhouNod = true; renderTogether(); }
    else if (act === "save-pact") {
      var source = state.guideCard || state.card;
      if (!source) return;
      writeDay(source, "一起");
      toast("小约定写在 9月15日。月历上只看得到状态。");
      state.stack = [];
      show("cal");
      openDay(TODAY);
    } else if (act === "voice-toggle") { state.playing = !state.playing; renderVoice(); }
    else if (act === "voice-demo") { state.card = { feel: GOLDEN.feel, situation: GOLDEN.situation, need: GOLDEN.need, raw: GOLDEN.raw, conflict: true }; renderVoice(); }
    else if (act === "pick-name") {
      openSheet("<h2>怎么称呼你</h2><div class=\"name-list\">" + NAMES.map(function (n) {
        return '<button type="button" class="' + (n === state.name ? "on" : "") + '" data-act="name" data-name="' + n + '">' + n + "</button>";
      }).join("") + "</div>", "name");
    } else if (act === "name") { state.name = actEl.dataset.name; persist(); closeSheet(); render(); }
    else if (act === "cycle-freq") {
      state.freq = FREQS[(FREQS.indexOf(state.freq) + 1) % FREQS.length];
      persist();
      render();
    } else if (act === "toggle-calls") {
      state.calls = !state.calls;
      persist();
      toast(state.calls ? "已允许小间来电。" : "来电关了。下次打过来会再问一次。");
      render();
    } else if (act === "pause") {
      state.paused = !state.paused;
      persist();
      toast(state.paused ? "已暂停主动找你。" : "主动开口恢复了。");
      render();
    } else if (act === "reset") resetDemo();
  }

  $("#dock").addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.listening) return;
    if (!$("#say").value.trim()) { startListen(); return; }
    var value = $("#say").value;
    $("#say").value = "";
    speak(value);
  });
  $("#say").addEventListener("input", paintFace);
  $("#tree-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("#tree-say").value.trim()) { toast("先写一句。"); return; }
    speak($("#tree-say").value);
    $("#tree-say").value = "";
  });
  document.body.addEventListener("click", onClick);
  $("#sheet").addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { closeSheet(); return; }
    if (e.target.classList.contains("sheet-dim")) {
      if (state.sheetKind === "permit") return;
      closeSheet();
    }
  });

  function tick() {
    var now = new Date();
    $("#clock").textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
  }
  tick();
  setInterval(tick, 15000);
  render();
})();
