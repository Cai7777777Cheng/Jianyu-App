/* 间语 3.1 · 首页原地说话。形象用锁定图裁切的 PNG。 */
(function () {
  "use strict";

  var FACES = {
    calm: { name: "平静", src: "assets/xiaojian/calm.png" },
    soft: { name: "软萌", src: "assets/xiaojian/soft.png" },
    listen: { name: "倾听", src: "assets/xiaojian/listen.png" },
    empathy: { name: "共情", src: "assets/xiaojian/empathy.png" },
    cheer: { name: "鼓励", src: "assets/xiaojian/cheer.png" },
    low: { name: "低落", src: "assets/xiaojian/low.png" }
  };
  var FREQS = ["很少开口", "刚好就好", "多关心一点"];
  var NAMES = ["阿宁", "你", "宁"];
  var HEARD = ["有点闷", "谢谢，我好一点了", "你先听我说"];
  var SCRIPT = "我是小间，不是对方本人。对方想让你知道：有点闷，希望忙的时候先回一句「晚点聊」。这不是指责。";

  var state = {
    view: "home",
    tab: "home",
    stack: [],
    temper: "calm",
    shown: "calm",
    name: "阿宁",
    freq: "刚好就好",
    paused: false,
    ventOnly: false,
    listening: false,
    heardI: 0,
    messages: [],
    box: "in",
    previewed: false,
    viaVoice: false,
    callSec: 0,
    callTick: null,
    noteSeq: 3,
    relax: null,
    notes: [
      { id: "n1", box: "in", who: "对方的小间 · 代转", body: "这几天有点撑，不是不想理你。如果可以，周末留半小时只待着，不谈正事。", status: "待看", meta: "短笺 · 经对方确认", reply: "" },
      { id: "n2", box: "out", who: "我确认过的短笺", body: "我有点闷。希望你忙的时候先回我一句「晚点聊」。", status: "已送达", meta: "短笺 · 对方还没回", reply: "" }
    ]
  };

  try {
    var saved = JSON.parse(localStorage.getItem("jianyu31") || "null");
    if (saved && FACES[saved.temper]) {
      state.temper = saved.temper;
      state.shown = saved.temper;
      if (saved.name) state.name = saved.name;
      if (saved.freq) state.freq = saved.freq;
      if (saved.paused) state.paused = true;
    }
  } catch (err) {}

  function $(s, r) { return (r || document).querySelector(s); }
  function persist() {
    try {
      localStorage.setItem("jianyu31", JSON.stringify({
        temper: state.temper, name: state.name, freq: state.freq, paused: state.paused
      }));
    } catch (err) {}
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function toast(msg) {
    var el = $("#toast");
    el.classList.toggle("low", state.view !== "home" && state.view !== "hub" && state.view !== "me");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  function greetText() {
    var h = new Date().getHours();
    var part = h < 5 ? "夜深了" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
    return part + "，" + state.name;
  }
  function fmt(n) { return (n < 10 ? "0" : "") + n; }

  function faceFor(text) {
    if (/闷|累|难过|委屈|烦|哭|伤心|冷|慢|不理/.test(text)) return "empathy";
    if (/开心|谢谢|好一点|加油|哈哈|棒|安心|轻松/.test(text)) return "cheer";
    if (/低落|不想|好难|没劲/.test(text)) return "low";
    if (/可爱|软|哄/.test(text)) return "soft";
    if (/听|在吗|说说/.test(text)) return "listen";
    return state.temper;
  }

  function paintHero() {
    var face = state.listening ? "listen" : state.shown;
    var meta = FACES[face] || FACES.calm;
    $("#hero-img").src = meta.src;
    $("#hero-img").alt = "小间 · " + meta.name;
    $("#hero-name").textContent = meta.name;
    $("#call-img").src = FACES[state.temper].src;
    $("#hero-float").classList.toggle("listening", state.listening);
    document.querySelectorAll("[data-pick]").forEach(function (b) {
      var on = b.dataset.pick === state.temper;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $("#greet").textContent = greetText();
    $("#name-val").textContent = state.name;
    $("#freq-val").textContent = state.freq;
    $("#pause-switch").classList.toggle("on", state.paused);
    $("#vent-switch").classList.toggle("on", state.ventOnly);
    $("#mic").classList.toggle("on", state.listening);
    $("#mic").setAttribute("aria-pressed", state.listening ? "true" : "false");
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

  function showFace(id, hold) {
    state.shown = FACES[id] ? id : state.temper;
    paintHero();
    bounce();
    clearTimeout(state.relax);
    if (hold) {
      state.relax = setTimeout(function () {
        if (!state.listening) {
          state.shown = state.temper;
          paintHero();
        }
      }, 4200);
    }
  }

  function replyFor(text) {
    if (state.ventOnly || /先听听|只倒|别告诉/.test(text)) {
      return "这些话先留在这儿。我不会拿去转达。";
    }
    var face = faceFor(text);
    if (face === "empathy") return "闷是真的。若要让对方知道，可以收成一句：希望忙的时候先回我「晚点聊」。现在不送也行。";
    if (face === "cheer") return "听到了。你轻一点也完全可以，不用马上把话说完。";
    if (face === "low") return "先不用振作。你现在这样，我就在。";
    if (face === "listen") return "我在听。你说完，我再问要不要收成一句。";
    if (face === "soft") return "我在。不催你，想说的时候再说。";
    return "我在。想怎么说都行，不整理也没关系。";
  }

  function renderBubbles() {
    var list = state.messages.slice(-2);
    $("#bubbles").innerHTML = list.map(function (m) {
      return '<div class="bubble ' + (m.role === "me" ? "me" : "bot") + '">' + esc(m.text) + "</div>";
    }).join("");
    var log = $("#tree-log");
    log.innerHTML = state.messages.map(function (m) {
      return '<div class="bubble ' + (m.role === "me" ? "me" : "bot") + '">' + esc(m.text) + "</div>";
    }).join("") || '<p class="greet-sub">树洞还是空的。日常说话在首页。</p>';
    log.scrollTop = log.scrollHeight;
  }

  function pushLine(role, text) {
    state.messages.push({ role: role, text: text });
    renderBubbles();
  }

  function speak(text) {
    var value = (text || "").trim();
    if (!value) return;
    pushLine("me", value);
    var face = faceFor(value);
    if (state.ventOnly) face = state.temper;
    showFace(face, true);
    setTimeout(function () { pushLine("bot", replyFor(value)); }, 420);
  }

  /* 导航 */
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
    if (name !== "call") stopCall();
    if (name === "tree") $("#tree-sub").textContent = state.ventOnly ? "今天只倒苦水" : "完整记录留在这里";
  }
  function goTab(tab) { state.stack = []; show(tab); }
  function openSub(name) { state.stack.push(state.view); show(name); }
  function back() { if (state.view === "call") stopCall(); show(state.stack.pop() || state.tab); }

  function stopListen() {
    state.listening = false;
    if (state.recog) { try { state.recog.stop(); } catch (err) {} }
    paintHero();
  }
  function startListen() {
    state.listening = true;
    state.shown = "listen";
    paintHero();
    setTimeout(function () {
      if (!state.listening) return;
      var line = HEARD[state.heardI++ % HEARD.length];
      stopListen();
      speak(line);
    }, 900);
  }

  /* 信札 */
  function tagClass(status) {
    if (status === "待看") return "tag wait";
    if (status === "已送达" || status === "已回应") return "tag ok";
    if (status === "已降级") return "tag warm";
    return "tag";
  }
  function renderNotes() {
    var list = state.notes.filter(function (n) { return n.box === state.box; });
    var html = list.length ? "" : '<p class="greet-sub">这一栏还是空的。</p>';
    list.forEach(function (n) {
      html += '<article class="letter"><header><span class="who">' + esc(n.who) + '</span><span class="' + tagClass(n.status) + '">' + esc(n.status) + "</span></header>";
      html += "<p>" + esc(n.body) + '</p><div class="meta">' + esc(n.meta) + "</div>";
      if (n.reply) html += '<div class="meta">你的回应：' + esc(n.reply) + "</div>";
      if (n.box === "in" && n.status === "待看") {
        html += '<div class="letter-actions"><button type="button" data-act="later" data-id="' + n.id + '">稍后</button><button type="button" data-act="reply-one" data-id="' + n.id + '">回一句</button></div>';
      }
      html += "</article>";
    });
    $("#note-list").innerHTML = html;
  }
  function findNote(id) { return state.notes.filter(function (n) { return n.id === id; })[0]; }
  function buildSentence() {
    var feel = $("#field-feel").value.trim();
    var when = $("#field-when").value.trim();
    var need = $("#field-need").value.trim();
    if (!feel || !need) return "";
    return feel + (when ? "（" + when + "）" : "") + "。我希望" + need + "。不是指责，只是这个需要。";
  }
  function sendNote() {
    var sentence = buildSentence();
    if (!sentence || !state.previewed) { toast("先预览，再确认转达。"); return; }
    state.notes.unshift({
      id: "n" + (state.noteSeq++),
      box: "out",
      who: state.viaVoice ? "语音代转" : "我刚确认的短笺",
      body: sentence,
      status: "已送达",
      meta: (state.viaVoice ? "语音" : "短笺") + " · 经你确认 · 不含原话",
      reply: ""
    });
    state.previewed = false;
    state.viaVoice = false;
    $("#preview").classList.remove("on");
    $("#btn-send-note").disabled = true;
    $("#field-feel").value = $("#field-when").value = $("#field-need").value = "";
    state.box = "out";
    document.querySelectorAll("#seg button").forEach(function (b) { b.classList.toggle("on", b.dataset.box === "out"); });
    renderNotes();
    toast("已送达。对方看到的是这句，不是原话。");
    show("letters");
  }

  function stopCall() {
    if (state.callTick) { clearInterval(state.callTick); state.callTick = null; }
  }
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
  function openSheet(html) { $("#sheet-body").innerHTML = html; $("#sheet").classList.add("open"); }
  function closeSheet() { $("#sheet").classList.remove("open"); }

  function onClick(e) {
    var el = e.target.closest("[data-tab],[data-open],[data-act],[data-pick],[data-back],[data-box]");
    if (el && el.dataset.tab) { goTab(el.dataset.tab); return; }
    if (el && el.hasAttribute("data-back")) { back(); return; }
    if (el && el.dataset.box) {
      state.box = el.dataset.box;
      document.querySelectorAll("#seg button").forEach(function (b) { b.classList.toggle("on", b.dataset.box === state.box); });
      renderNotes();
      return;
    }
    if (el && el.dataset.pick) {
      state.temper = el.dataset.pick;
      state.shown = el.dataset.pick;
      state.listening = false;
      persist();
      paintHero();
      bounce();
      toast("首页已换成「" + FACES[state.temper].name + "」。");
      return;
    }
    if (!el || !el.dataset.act) return;
    var act = el.dataset.act;
    if (act === "vent") {
      state.ventOnly = !state.ventOnly;
      paintHero();
      $("#tree-sub").textContent = state.ventOnly ? "今天只倒苦水" : "完整记录留在这里";
      toast(state.ventOnly ? "今天只倒苦水，不会建议转达。" : "可以听，也可以之后再整理。");
    } else if (act === "pause") {
      state.paused = !state.paused; persist(); paintHero();
      toast(state.paused ? "已暂停主动找你。" : "主动开口恢复了。");
    } else if (act === "cycle-freq") {
      state.freq = FREQS[(FREQS.indexOf(state.freq) + 1) % FREQS.length];
      persist(); paintHero();
    } else if (act === "pick-name") {
      var html = "<h2>怎么称呼你</h2><div class=\"name-list\">";
      NAMES.forEach(function (n) {
        html += '<button type="button" data-act="set-name" data-name="' + n + '" class="' + (n === state.name ? "on" : "") + '">' + n + "</button>";
      });
      openSheet(html + "</div>");
    } else if (act === "set-name") {
      state.name = el.dataset.name; persist(); paintHero(); closeSheet();
    } else if (act === "voice") {
      $("#field-feel").value = "我有点闷";
      $("#field-when").value = "你回得慢的时候";
      $("#field-need").value = "先回我一句「晚点聊」";
      state.viaVoice = true;
      state.previewed = false;
      $("#preview").classList.remove("on");
      $("#btn-send-note").disabled = true;
      toast("已整理成一句，还没发出。");
    } else if (act === "preview-note") {
      var sentence = buildSentence();
      if (!sentence) { toast("先写下感受，和你希望的那一件小事。"); return; }
      $("#preview-text").textContent = sentence;
      $("#preview").classList.add("on");
      state.previewed = true;
      $("#btn-send-note").disabled = false;
    } else if (act === "send-note") sendNote();
    else if (act === "sheet-close") closeSheet();
    else if (act === "call-go") { closeSheet(); openSub("call"); startCall(); }
    else if (act === "hangup") { stopCall(); toast("已挂断。没有录音。"); back(); }
    else if (act === "missed") {
      stopCall();
      state.notes.unshift({ id: "n" + (state.noteSeq++), box: "out", who: "电话未接 · 改短笺", body: "我有点闷。希望你忙的时候先回我一句「晚点聊」。不是指责。", status: "已降级", meta: "未接，没有再打", reply: "" });
      openSheet("<h2>对方这会儿没接</h2><p class=\"lead\">已改成一条短笺，没有继续打。</p><div class=\"sheet-actions\"><button type=\"button\" class=\"ghost\" data-act=\"miss-stay\">知道了</button><button type=\"button\" class=\"cta\" data-act=\"miss-go\">去信札</button></div>");
    } else if (act === "miss-stay") { closeSheet(); back(); }
    else if (act === "miss-go") {
      closeSheet(); state.box = "out"; renderNotes();
      state.stack = state.stack.filter(function (v) { return v !== "call"; });
      show("letters");
    } else if (act === "later") {
      var later = findNote(el.dataset.id); if (later) later.status = "稍后再看";
      renderNotes(); toast("已放下。不会计时。");
    } else if (act === "reply-one") {
      openSheet("<h2>回一句</h2><label class=\"field\" style=\"margin-top:12px\"><span>你的一句</span><input id=\"reply-input\" type=\"text\" placeholder=\"好，我记下了\" /></label><div class=\"sheet-actions\"><button type=\"button\" class=\"ghost\" data-act=\"sheet-close\">取消</button><button type=\"button\" class=\"cta\" data-act=\"send-reply\" data-id=\"" + el.dataset.id + "\">送出</button></div>");
    } else if (act === "send-reply") {
      var input = $("#reply-input");
      var reply = input ? input.value.trim() : "";
      if (!reply) { toast("先写一句。"); return; }
      var note = findNote(el.dataset.id);
      if (note) { note.status = "已回应"; note.reply = reply; }
      closeSheet(); renderNotes();
    }
  }

  $("#mic").addEventListener("click", function () {
    if (state.listening) stopListen();
    else startListen();
  });
  $("#dock").addEventListener("submit", function (e) {
    e.preventDefault();
    speak($("#say").value);
    $("#say").value = "";
  });
  $("#tree-form").addEventListener("submit", function (e) {
    e.preventDefault();
    speak($("#tree-say").value);
    $("#tree-say").value = "";
  });
  ["field-feel", "field-when", "field-need"].forEach(function (id) {
    $("#" + id).addEventListener("input", function () {
      state.previewed = false;
      state.viaVoice = false;
      $("#preview").classList.remove("on");
      $("#btn-send-note").disabled = true;
    });
  });
  document.body.addEventListener("click", function (e) {
    var open = e.target.closest("[data-open]");
    if (open) {
      var dest = open.dataset.open;
      if (dest === "tree") openSub("tree");
      else if (dest === "letters") { renderNotes(); openSub("letters"); }
      else if (dest === "composer") openSub("composer");
      else if (dest === "phone") {
        openSheet("<h2>这次请小间打过去？</h2><p class=\"lead\">小间会报自己的名字，说明是代转。不会装成你，也不会装成对方。没接就改短笺，不会再打。</p><div class=\"script-box\"><b>将要说的</b>" + esc(SCRIPT) + "</div><p class=\"sheet-note\">如果是紧急危险，先联系当地求助，而不是打这通电话。</p><div class=\"sheet-actions\"><button type=\"button\" class=\"ghost\" data-act=\"sheet-close\">先不打</button><button type=\"button\" class=\"cta coral\" data-act=\"call-go\">确认拨打</button></div>");
      }
      return;
    }
    if (e.target.hasAttribute("data-close")) closeSheet();
    onClick(e);
  });

  function tick() {
    var now = new Date();
    $("#clock").textContent = fmt(now.getHours()) + ":" + fmt(now.getMinutes());
    if (state.view === "home") $("#greet").textContent = greetText();
  }
  paintHero();
  renderNotes();
  renderBubbles();
  tick();
  setInterval(tick, 15000);
})();
