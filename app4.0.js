/* 间语 4.0 · 与 Vite 原型同一套交互，file:// 可开。 */
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
  var SCRIPT = "我是小间，不是对方本人。对方想让你知道：有点闷，希望忙的时候先回一句「晚点聊」。这不是指责。";
  var STATE_LABEL = { done: "已疏通", part: "部分", open: "未解决" };
  var DAYS = [
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
    { day: 28, state: "done", issue: "晚点聊", detail: "说成约定：忙的时候先回一句。对方答应了。" }
  ];
  var TABS = { home: 1, hub: 1, cal: 1, me: 1 };

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
    var saved = JSON.parse(localStorage.getItem("jianyu40") || "null");
    if (saved && FACES[saved.temper]) {
      state.temper = saved.temper;
      state.shown = saved.temper;
      if (saved.name) state.name = saved.name;
      if (saved.freq) state.freq = saved.freq;
      if (saved.paused) state.paused = true;
    }
  } catch (err) {}

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function persist() {
    try {
      localStorage.setItem("jianyu40", JSON.stringify({
        temper: state.temper, name: state.name, freq: state.freq, paused: state.paused
      }));
    } catch (err) {}
  }
  function toast(msg) {
    var el = $("#toast");
    el.classList.toggle("low", !TABS[state.view]);
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  function greetText() {
    var h = new Date().getHours();
    var part = h < 5 ? "夜深了" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
    return part + "，" + state.name + "<br />今天感觉怎么样？";
  }
  function faceFor(text) {
    if (/闷|累|难过|委屈|烦|哭|伤心|冷|慢|不理/.test(text)) return "empathy";
    if (/开心|谢谢|好一点|加油|哈哈|棒|安心|轻松/.test(text)) return "cheer";
    if (/低落|不想|好难|没劲/.test(text)) return "low";
    if (/可爱|软|哄/.test(text)) return "soft";
    if (/听|在吗|说说/.test(text)) return "listen";
    return state.temper;
  }
  function replyFor(text, face) {
    if (state.ventOnly || /先听听|只倒|别告诉/.test(text)) return "这些话先留在这儿。我不会拿去转达。";
    if (face === "empathy") return "闷是真的。若要让对方知道，可以收成一句：希望忙的时候先回我「晚点聊」。现在不送也行。";
    if (face === "cheer") return "听到了。你轻一点也完全可以，不用马上把话说完。";
    if (face === "low") return "先不用振作。你现在这样，我就在。";
    if (face === "listen") return "我在听。你说完，我再问要不要收成一句。";
    if (face === "soft") return "我在。不催你，想说的时候再说。";
    return "我在。想怎么说都行，不整理也没关系。";
  }
  function dayBy(n) {
    for (var i = 0; i < DAYS.length; i++) if (DAYS[i].day === n) return DAYS[i];
    return null;
  }
  function faceNow() {
    return FACES[state.listening ? "listen" : state.shown];
  }

  function paint() {
    var face = faceNow();
    $("#phone").setAttribute("data-temper", state.listening ? "listen" : state.shown);
    $("#hero-img").src = face.src;
    $("#hero-img").alt = "小间 · " + face.name;
    $("#mood").textContent = face.name;
    $("#call-img").src = FACES[state.temper].src;
    $("#hero-float").classList.toggle("listening", state.listening);
    $("#greet").innerHTML = greetText();
    $("#name-val").textContent = state.name;
    $("#freq-val").textContent = state.freq;
    $("#pause-switch").classList.toggle("on", state.paused);
    $("#vent-switch").classList.toggle("on", state.ventOnly);
    $("#dock").classList.toggle("listening", state.listening);
    $("#say").placeholder = state.listening ? "在听…" : "跟小间说说";
    var has = $("#say").value.trim().length > 0 && !state.listening;
    $("#icon-mic").hidden = has;
    $("#icon-arrow").hidden = !has;
    $("#help-go").setAttribute("aria-label", has ? "发送" : "说话");
    $("#help-go").classList.toggle("hot", state.listening);
    document.querySelectorAll("[data-pick]").forEach(function (b) {
      var on = b.dataset.pick === state.temper;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
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

  function renderBubbles() {
    var list = state.messages.slice(-2);
    $("#bubbles").innerHTML = list.map(function (m) {
      var style = m.role === "me" ? ' style="background:' + m.tint + '"' : "";
      return '<div class="bubble ' + (m.role === "me" ? "me" : "bot") + '"' + style + ">" + esc(m.text) + "</div>";
    }).join("");
    var log = $("#tree-log");
    log.innerHTML = state.messages.map(function (m) {
      var style = m.role === "me" ? ' style="background:' + m.tint + '"' : "";
      return '<div class="bubble ' + (m.role === "me" ? "me" : "bot") + '"' + style + ">" + esc(m.text) + "</div>";
    }).join("") || '<p class="empty">树洞还是空的。日常说话在首页。</p>';
    log.scrollTop = log.scrollHeight;
  }
  function speak(text) {
    var value = (text || "").trim();
    if (!value) return;
    var face = state.ventOnly ? state.temper : faceFor(value);
    state.messages.push({ role: "me", text: value, tint: FACES[face].tint });
    state.shown = face;
    paint();
    bounce();
    renderBubbles();
    setTimeout(function () {
      state.messages.push({ role: "bot", text: replyFor(value, face), tint: "#fff" });
      renderBubbles();
    }, 420);
    clearTimeout(state.relax);
    state.relax = setTimeout(function () {
      if (!state.listening) {
        state.shown = state.temper;
        paint();
      }
    }, 4200);
  }

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
  function goTab(tab) { state.stack = []; closeSheet(); show(tab); }
  function openSub(name) { state.stack.push(state.view); show(name); }
  function back() { closeSheet(); show(state.stack.pop() || state.tab); }

  function stopListen() {
    state.listening = false;
    paint();
  }
  function startListen() {
    if (state.listening) return;
    state.listening = true;
    state.shown = "listen";
    paint();
    bounce();
    setTimeout(function () {
      if (!state.listening) return;
      var line = HEARD[state.heardI++ % HEARD.length];
      stopListen();
      speak(line);
    }, 900);
  }

  function renderCal() {
    var html = "";
    var i;
    for (i = 0; i < 2; i++) html += '<span class="day blank"></span>';
    for (i = 1; i <= 30; i++) {
      var note = dayBy(i);
      if (!note) html += '<span class="day empty">' + i + "</span>";
      else {
        html += '<button type="button" class="day ' + note.state + '" data-day="' + i + '">';
        html += moodSvg(note.state) + "<span>" + i + "</span></button>";
      }
    }
    $("#cal-grid").innerHTML = html;
    var done = 0, part = 0, open = 0;
    DAYS.forEach(function (d) {
      if (d.state === "done") done++;
      else if (d.state === "part") part++;
      else open++;
    });
    var total = DAYS.length;
    $("#sum-copy").textContent = total + " 件里说开了 " + done + " 件。还积压 " + open + " 件，" + part + " 件只通了一半。";
    $("#sum-rate").textContent = Math.round((done / total) * 100) + "%";
    $("#sum-part").textContent = String(part);
    $("#sum-open").textContent = String(open);
    document.querySelector(".backlog").textContent = "还积着 " + open;
  }
  function moodSvg(st) {
    var mouth = st === "done" ? "M7 14.5c1.2 1.5 2.8 2.2 5 2.2s3.8-.7 5-2.2" : st === "part" ? "M7.5 15h9" : "M7 16.5c1.3-1.5 3-2.2 5-2.2s3.7.7 5 2.2";
    var eyes = st === "open"
      ? '<path d="M6.5 8.5 9.5 10M9.5 8.5 6.5 10M14.5 8.5 17.5 10M17.5 8.5 14.5 10" fill="none" stroke="#111" stroke-width="1.5" stroke-linecap="round"/>'
      : '<circle cx="8.2" cy="10" r="1.15" fill="#111"/><circle cx="15.8" cy="10" r="1.15" fill="#111"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + eyes + '<path d="' + mouth + '" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round"/></svg>';
  }

  function tagClass(status) {
    if (status === "待看") return "tag wait";
    if (status === "已送达" || status === "已回应") return "tag ok";
    if (status === "已降级") return "tag warm";
    return "tag";
  }
  function renderNotes() {
    var list = state.notes.filter(function (n) { return n.box === state.box; });
    var html = list.length ? "" : '<p class="empty">这一栏还是空的。</p>';
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
  function findNote(id) {
    return state.notes.filter(function (n) { return n.id === id; })[0];
  }
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
    $("#call-script").textContent = SCRIPT;
    state.callTick = setInterval(function () {
      state.callSec += 1;
      $("#call-time").textContent = pad(Math.floor(state.callSec / 60)) + ":" + pad(state.callSec % 60);
    }, 1000);
  }
  function openSheet(html) {
    $("#sheet-body").innerHTML = html;
    $("#sheet").hidden = false;
  }
  function closeSheet() { $("#sheet").hidden = true; }

  function onClick(e) {
    var el = e.target.closest("[data-tab],[data-act],[data-pick],[data-back],[data-box],[data-day]");
    if (el && el.dataset.tab) { goTab(el.dataset.tab); return; }
    if (el && el.hasAttribute("data-back")) { back(); return; }
    if (el && el.dataset.day) {
      var note = dayBy(Number(el.dataset.day));
      if (!note) return;
      openSheet("<h2>9月" + note.day + "日 · " + STATE_LABEL[note.state] + "</h2><p class=\"lead\">" + esc(note.issue) + "</p><div class=\"script-box\">" + esc(note.detail) + "</div><div class=\"sheet-actions\"><button type=\"button\" class=\"cta\" data-act=\"sheet-close\">知道了</button></div>");
      return;
    }
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
      paint();
      bounce();
      toast("首页已换成「" + FACES[state.temper].name + "」。");
      return;
    }
    if (!el || !el.dataset.act) return;
    var act = el.dataset.act;
    if (act === "vent") {
      state.ventOnly = !state.ventOnly;
      paint();
      $("#tree-sub").textContent = state.ventOnly ? "今天只倒苦水" : "完整记录留在这里";
      toast(state.ventOnly ? "今天只倒苦水，不会建议转达。" : "可以听，也可以之后再整理。");
    } else if (act === "pause") {
      state.paused = !state.paused; persist(); paint();
      toast(state.paused ? "已暂停主动找你。" : "主动开口恢复了。");
    } else if (act === "cycle-freq") {
      state.freq = FREQS[(FREQS.indexOf(state.freq) + 1) % FREQS.length];
      persist(); paint();
    } else if (act === "pick-name") {
      var html = "<h2>怎么称呼你</h2><div class=\"name-list\">";
      NAMES.forEach(function (n) {
        html += '<button type="button" data-act="set-name" data-name="' + n + '" class="' + (n === state.name ? "on" : "") + '">' + n + "</button>";
      });
      openSheet(html + "</div>");
    } else if (act === "set-name") {
      state.name = el.dataset.name; persist(); paint(); closeSheet();
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
      closeSheet();
      state.box = "out";
      renderNotes();
      state.stack = state.stack.filter(function (v) { return v !== "call"; });
      show("letters");
    } else if (act === "later") {
      var later = findNote(el.dataset.id);
      if (later) later.status = "稍后再看";
      renderNotes();
      toast("已放下。不会计时。");
    } else if (act === "reply-one") {
      openSheet("<h2>回一句</h2><label class=\"field\" style=\"margin-top:12px\"><span>你的一句</span><input id=\"reply-input\" type=\"text\" placeholder=\"好，我记下了\" /></label><div class=\"sheet-actions\"><button type=\"button\" class=\"ghost\" data-act=\"sheet-close\">取消</button><button type=\"button\" class=\"cta\" data-act=\"send-reply\" data-id=\"" + el.dataset.id + "\">送出</button></div>");
    } else if (act === "send-reply") {
      var input = $("#reply-input");
      var reply = input ? input.value.trim() : "";
      if (!reply) { toast("先写一句。"); return; }
      var item = findNote(el.dataset.id);
      if (item) { item.status = "已回应"; item.reply = reply; }
      closeSheet();
      renderNotes();
    }
  }

  $("#say").addEventListener("input", paint);
  $("#dock").addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.listening) return;
    if (!$("#say").value.trim()) { startListen(); return; }
    speak($("#say").value);
    $("#say").value = "";
    paint();
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
    $("#clock").textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
  }
  renderCal();
  paint();
  renderNotes();
  renderBubbles();
  tick();
  setInterval(tick, 15000);
})();
