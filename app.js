/* 间语 Demo · 纯前端 mock，无 API */
(function () {
  "use strict";

  const state = {
    tab: "home",
    ventOnly: false,
    temper: "冷静温柔",
    look: "小星球信使",
    freq: "刚好就好",
    callName: "阿宁",
    taboos: ["不说教", "不催沟通"],
    obStep: 0,
    obDraft: {},
    callOutEnabled: false,
  };

  const TAB_META = {
    home: { title: "首页", sub: function () { return ""; } },
    tree: {
      title: "树洞",
      sub: function () {
        return state.ventOnly ? "今天只听，不推销转达" : "说的话默认只有你看得到";
      },
    },
    notes: { title: "信笺箱", sub: function () { return "对方的话在最上面"; } },
    us: { title: "我们", sub: function () { return "授权和约定收在这里"; } },
    me: { title: "我的", sub: function () { return "这只小间只有你看得到"; } },
  };

  const TEMPER_VISUAL = {
    软萌陪伴: { stroke: "#e8a317", face: "#fff8e8", eyes: "round", mouth: "wide", blush: true },
    冷静温柔: { stroke: "#12b8c2", face: "#f4fbfb", eyes: "calm", mouth: "soft", blush: false },
    "毒舌但善良": { stroke: "#f25c2a", face: "#fff6f1", eyes: "sharp", mouth: "smirk", blush: false },
  };

  const TEMPER_REPLIES = {
    软萌陪伴: "嗨嗨，听到了。今天闷闷的没关系，我陪你待一会儿，不着急把话说成结论。",
    冷静温柔: "我听到了。累和闷都可以先放在这里。你要是愿意，我们一句一句来；不想整理也可以。",
    "毒舌但善良": "气压不对就对了。说或不说都行，我又不收咨询费——但别一个人硬扛到爆。",
  };

  const OPENERS = {
    软萌陪伴: "嗨嗨，我是小间。好像有点闷闷的，要不要和我说两句？",
    冷静温柔: "我是小间。如果你这会儿想找人说说，我在。",
    "毒舌但善良": "气压有点不对。说或不说都行，我又不收咨询费。",
  };

  const OB_STEPS = [
    {
      key: "temper",
      title: "小间什么气质",
      hint: "像交一个朋友。不满意，下一句就能换。",
      options: [
        { id: "软萌陪伴", d: "更软一点。正经事仍然不轻飘。" },
        { id: "冷静温柔", d: "少打断，一句一问。默认是这个。" },
        { id: "毒舌但善良", d: "私聊可以吐槽。转达给对方时仍然好好说话。" },
      ],
      def: "冷静温柔",
    },
    {
      key: "look",
      title: "同一个小间，小配件",
      hint: "脸不会换一套画风，只换天线或耳朵。",
      options: [
        { id: "小星球信使", d: "天线顶上一枚小星球。默认。" },
        { id: "动物系软兽", d: "多两只圆耳朵，还是这只 bot。" },
        { id: "小人偶贴纸风", d: "脸上多一枚小黄贴纸。" },
      ],
      def: "小星球信使",
    },
    {
      key: "freq",
      title: "小间多久找你",
      hint: "只影响主动开口。你随时可以让它安静。",
      options: [
        { id: "很少开口", d: "更少主动来找你。" },
        { id: "刚好就好", d: "偶尔出现。默认。" },
        { id: "多关心一点", d: "稍勤快，仍然不连环催。" },
      ],
      def: "刚好就好",
    },
    {
      key: "callName",
      title: "怎么叫你",
      hint: "只影响小间对你的称呼。",
      options: [
        { id: "阿宁", d: "用你的名字。" },
        { id: "你", d: "中性，克制。" },
        { id: "宝", d: "更亲一点。这里只是示意。" },
      ],
      def: "阿宁",
    },
    {
      key: "taboos",
      title: "不希望小间",
      hint: "可以多选。遇到安全问题，一律改成平静说话。",
      multi: true,
      options: [
        { id: "不说教", d: "不说「你应该」。" },
        { id: "不太撒娇", d: "少卖萌。" },
        { id: "不催沟通", d: "不推销「该告诉对方了」。" },
        { id: "不用心理学术语", d: "不给你贴标签。" },
      ],
      def: ["不说教", "不催沟通"],
    },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function visualOf(temper) {
    return TEMPER_VISUAL[temper] || TEMPER_VISUAL["冷静温柔"];
  }

  function xiaojianSVG(temper, look, variant) {
    const v = visualOf(temper);
    const full = variant === "full";
    const ink = "#1a2332";
    const sw = full ? 4 : 6;
    const face = v.face;
    const stroke = v.stroke;

    let eyes;
    if (v.eyes === "round") {
      eyes = [
        '<circle cx="78" cy="92" r="9" fill="' + ink + '"/>',
        '<circle cx="122" cy="92" r="9" fill="' + ink + '"/>',
        '<circle cx="81.5" cy="88.5" r="2.8" fill="#fff"/>',
        '<circle cx="125.5" cy="88.5" r="2.8" fill="#fff"/>',
      ].join("");
    } else if (v.eyes === "sharp") {
      eyes = [
        '<ellipse cx="78" cy="94" rx="9" ry="5.5" fill="' + ink + '"/>',
        '<ellipse cx="122" cy="94" rx="9" ry="5.5" fill="' + ink + '"/>',
        '<circle cx="81" cy="92.5" r="2.1" fill="#fff"/>',
        '<circle cx="125" cy="92.5" r="2.1" fill="#fff"/>',
        '<path d="M66 78 Q76 74 86 78" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
        '<path d="M112 76 Q126 66 138 78" stroke="' + ink + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      ].join("");
    } else {
      eyes = [
        '<ellipse cx="78" cy="92" rx="7" ry="9" fill="' + ink + '"/>',
        '<ellipse cx="122" cy="92" rx="7" ry="9" fill="' + ink + '"/>',
        '<circle cx="80.5" cy="88.5" r="2.4" fill="#fff"/>',
        '<circle cx="124.5" cy="88.5" r="2.4" fill="#fff"/>',
      ].join("");
    }

    let mouth;
    if (v.mouth === "wide") {
      mouth = '<path d="M72 116 Q100 136 128 116" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (v.mouth === "smirk") {
      mouth = '<path d="M76 120 Q104 128 130 110" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else {
      mouth = '<path d="M80 118 Q100 130 120 118" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }

    const blush = v.blush
      ? '<ellipse cx="58" cy="112" rx="9" ry="4.5" fill="#f0c56a"/>' +
        '<ellipse cx="142" cy="112" rx="9" ry="4.5" fill="#f0c56a"/>'
      : "";

    const ears = look === "动物系软兽"
      ? '<circle cx="36" cy="96" r="16" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>' +
        '<circle cx="164" cy="96" r="16" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>'
      : "";

    const ring = look === "小星球信使"
      ? '<ellipse cx="100" cy="16" rx="14" ry="4.2" fill="none" stroke="' + stroke + '" stroke-width="2.4"/>'
      : "";

    const sticker = look === "小人偶贴纸风"
      ? '<rect x="128" y="112" width="26" height="26" rx="7" fill="#ffe14a" stroke="' + stroke + '" stroke-width="2.4"/>' +
        '<circle cx="136" cy="122" r="1.7" fill="' + ink + '"/>' +
        '<circle cx="146" cy="122" r="1.7" fill="' + ink + '"/>' +
        '<path d="M135 128 Q141 132 147 128" stroke="' + ink + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      : "";

    const body = full
      ? '<ellipse cx="100" cy="214" rx="38" ry="7" fill="rgba(26,35,50,0.08)"/>' +
        '<line x1="70" y1="176" x2="46" y2="186" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round"/>' +
        '<line x1="130" y1="176" x2="154" y2="186" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round"/>' +
        '<circle cx="44" cy="188" r="7" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>' +
        '<circle cx="156" cy="188" r="7" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>' +
        '<rect x="68" y="150" width="64" height="52" rx="24" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>' +
        '<circle cx="100" cy="176" r="6" fill="' + stroke + '"/>'
      : "";

    const viewBox = full ? "0 0 200 228" : (look === "动物系软兽" ? "12 0 176 164" : "28 0 144 162");

    return (
      '<svg viewBox="' + viewBox + '" width="100%" height="100%" aria-hidden="true">' +
        ears +
        body +
        '<line x1="100" y1="40" x2="100" y2="20" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round"/>' +
        '<circle cx="100" cy="16" r="8" fill="' + stroke + '"/>' +
        ring +
        '<rect x="38" y="40" width="124" height="116" rx="50" fill="' + face + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>' +
        eyes +
        blush +
        mouth +
        sticker +
      "</svg>"
    );
  }

  function paintHost(el, variant) {
    if (!el) return;
    el.innerHTML = xiaojianSVG(state.temper, state.look, variant);
  }

  function paintXiaojian() {
    paintHost($("#home-face"), "head");
    paintHost($("#tree-face"), "head");
    paintHost($("#call-face"), "head");
    paintHost($("#persona-art"), "full");
  }

  function updateCallCopy() {
    const name = state.callName;
    $("#call-sub").textContent = "我是小间，代" + name + "转达。不是" + name + "本人，也不是你的伴侣。";
    $("#call-script").innerHTML =
      "<strong>小间会这样说</strong><br><br>「你好，我是间语的小间。这通电话是" +
      escapeHtml(name) +
      "授权我代为转达的，不是 TA 本人。TA 希望你知道：忙的时候如果能回一句『晚点聊』，会安心很多。不需要你现在做任何保证。」";
  }

  function syncPersonaUI() {
    $("#tag-temper").textContent = state.temper;
    $("#tag-look").textContent = state.look;
    $("#tag-freq").textContent = state.freq;
    $("#info-taboo").textContent = state.taboos.length ? state.taboos.join(" · ") : "没有特别禁忌";
    $("#info-name").textContent = state.callName;
    $("#hello-title").textContent = "嗨，" + state.callName;
    $("#home-bubble-msg").textContent = OPENERS[state.temper] || OPENERS["冷静温柔"];
    paintXiaojian();
    updateCallCopy();
    updateTopbar();
  }

  function updateTopbar() {
    const meta = TAB_META[state.tab];
    const bar = $("#topbar");
    $("#top-title").textContent = meta.title;
    $("#top-sub").textContent = meta.sub();
    bar.classList.toggle("is-home", state.tab === "home");
    bar.classList.toggle("is-focus", state.tab === "tree" || state.tab === "notes");
    bar.classList.toggle("is-quiet", state.tab === "us" || state.tab === "me");
  }

  function switchTab(tab) {
    state.tab = tab;
    $all(".screen").forEach(function (s) {
      s.classList.toggle("active", s.dataset.tab === tab);
    });
    $all(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    updateTopbar();
  }

  function setDigest(open) {
    $("#digest-banner").classList.toggle("show", open);
  }

  function markHomeDigest(label, done) {
    const tag = $("#home-digest-tag");
    const card = $("#btn-home-digest");
    if (tag) {
      tag.textContent = label;
      tag.className = "tag " + (done ? "tag-mute" : "tag-cyan");
    }
    if (card) card.classList.toggle("is-done", !!done);
    refreshTodoCount();
  }

  function refreshTodoCount() {
    const n = $all(".todo:not(.is-done)").length;
    const count = $(".todo-count");
    const label = $(".todo-head span");
    if (count) count.textContent = String(n);
    if (label) label.textContent = n ? "待你处理" : "都处理过了";
  }

  function openOnboarding() {
    state.obStep = 0;
    state.obDraft = {
      temper: state.temper,
      look: state.look,
      freq: state.freq,
      callName: state.callName,
      taboos: state.taboos.slice(),
    };
    $("#overlay-onboarding").classList.add("open");
    renderObStep();
  }

  function closeOnboarding() {
    $("#overlay-onboarding").classList.remove("open");
  }

  function renderObStep() {
    const step = OB_STEPS[state.obStep];
    const last = state.obStep === OB_STEPS.length - 1;
    $("#ob-step-label").textContent = (state.obStep + 1) + " / " + OB_STEPS.length;
    $("#ob-next").textContent = last ? "完成" : "下一步";
    $("#ob-dots").innerHTML = OB_STEPS.map(function (_, i) {
      return '<span class="' + (i === state.obStep ? "on" : "") + '"></span>';
    }).join("");

    const selected = state.obDraft[step.key];
    const preview = xiaojianSVG(
      state.obDraft.temper || "冷静温柔",
      state.obDraft.look || "小星球信使",
      "head"
    );
    let html = '<div class="ob-preview">' + preview + "</div>";
    html += '<div class="ob-title">' + step.title + "</div>";
    html += '<p class="ob-hint">' + step.hint + "</p><div class=\"option-list\">";
    step.options.forEach(function (op) {
      const isSel = step.multi ? (selected || []).indexOf(op.id) !== -1 : selected === op.id;
      html += '<button type="button" class="option ' + (isSel ? "selected" : "") + '" data-opt="' + op.id + '">';
      html += '<div class="ot">' + op.id + '</div><div class="od">' + op.d + "</div></button>";
    });
    html += "</div>";
    if (last) {
      const t = state.obDraft.temper || "冷静温柔";
      html += '<div class="trial-box"><div class="prompt">你说「今天有点累」。小间这样回：</div>';
      html += '<div class="reply" id="trial-reply">' + escapeHtml(TEMPER_REPLIES[t]) + "</div></div>";
    }
    $("#ob-content").innerHTML = html;

    $all(".option", $("#ob-content")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.dataset.opt;
        if (step.multi) {
          let arr = (state.obDraft.taboos || []).slice();
          if (arr.indexOf(id) !== -1) arr = arr.filter(function (x) { return x !== id; });
          else arr.push(id);
          state.obDraft.taboos = arr;
        } else {
          state.obDraft[step.key] = id;
        }
        renderObStep();
      });
    });
  }

  function finishOnboarding() {
    const d = state.obDraft;
    state.temper = d.temper || "冷静温柔";
    state.look = d.look || "小星球信使";
    state.freq = d.freq || "刚好就好";
    state.callName = d.callName || "阿宁";
    state.taboos = d.taboos && d.taboos.length ? d.taboos.slice() : [];
    syncPersonaUI();
    closeOnboarding();
    toast("下一句开始换语气。已经说过的话不会改写。");
    switchTab("me");
  }

  function appendMsg(role, text) {
    const area = $("#chat-area");
    const div = document.createElement("div");
    div.className = "msg " + role;
    if (role === "bot") div.innerHTML = '<div class="meta">小间</div>' + escapeHtml(text);
    else div.textContent = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function botReply(userText) {
    const base = TEMPER_REPLIES[state.temper] || TEMPER_REPLIES["冷静温柔"];
    if (state.ventOnly) return base + " 今天只倒苦水，我不会推销转达。";
    if (/累|闷|慢|委屈|怕/.test(userText)) {
      return "我接住了。这更像「需要被及时看见」。你可以继续说。想让对方知道的话，打开本期总结，点「请小间转达」。我不会自己发出去。";
    }
    return base;
  }

  function sendChat() {
    const input = $("#chat-input");
    const text = input.value.trim();
    if (!text) return;
    appendMsg("user", text);
    input.value = "";
    setTimeout(function () { appendMsg("bot", botReply(text)); }, 450);
  }

  function openChannels() {
    const desc = $("#ch-call-desc");
    if (desc) {
      desc.textContent = state.callOutEnabled
        ? "以小间身份打，不冒充伴侣。这一次仍要你再确认。"
        : "以小间身份打，不冒充伴侣。现在「代打电话」还关着，仍可预览来电界面。";
    }
    $("#sheet-channels").classList.add("open");
  }

  function closeChannels() {
    $("#sheet-channels").classList.remove("open");
  }

  function openCall() {
    closeChannels();
    $("#call-actions").style.display = "flex";
    $("#call-decline").classList.remove("show");
    $("#call-script").style.display = "block";
    $("#phone-call").classList.add("open");
  }

  function closeCall() {
    $("#phone-call").classList.remove("open");
  }

  function tickClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    $("#clock").textContent = h + ":" + m;
  }

  function bind() {
    $all(".tab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.dataset.tab); });
    });
    $all("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () { switchTab(btn.dataset.go); });
    });

    $("#btn-home-note").addEventListener("click", function () { switchTab("notes"); });
    $("#btn-home-digest").addEventListener("click", function () {
      switchTab("tree");
      setDigest(true);
    });

    $("#btn-open-onboarding").addEventListener("click", openOnboarding);
    $("#btn-remeet").addEventListener("click", openOnboarding);
    $("#ob-close").addEventListener("click", closeOnboarding);
    $("#ob-skip").addEventListener("click", function () {
      const step = OB_STEPS[state.obStep];
      if (!state.obDraft[step.key]) state.obDraft[step.key] = step.def;
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep += 1;
        renderObStep();
      } else finishOnboarding();
    });
    $("#ob-next").addEventListener("click", function () {
      const step = OB_STEPS[state.obStep];
      if (step.multi && !state.obDraft.taboos) state.obDraft.taboos = step.def.slice();
      else if (!step.multi && !state.obDraft[step.key]) state.obDraft[step.key] = step.def;
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep += 1;
        renderObStep();
      } else finishOnboarding();
    });

    $("#btn-trial-again").addEventListener("click", function () {
      toast("「今天有点累」→ " + TEMPER_REPLIES[state.temper]);
    });

    $("#btn-bubble-dismiss").addEventListener("click", function () {
      $("#home-bubble").classList.add("is-hidden");
      toast("好。想说的时候，点那颗大按钮。");
    });
    $("#btn-demo-signal").addEventListener("click", function () {
      $("#home-bubble").classList.remove("is-hidden");
      switchTab("home");
      toast("演示：小间轻轻问了一句");
    });

    $("#toggle-vent-wrap").addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".tree-face")) return;
      state.ventOnly = !state.ventOnly;
      const sw = $("#toggle-vent");
      sw.classList.toggle("on", state.ventOnly);
      sw.setAttribute("aria-checked", state.ventOnly ? "true" : "false");
      updateTopbar();
      toast(state.ventOnly ? "今天只听，不推销转达" : "可以在你点头之后再转达");
    });

    $("#btn-show-digest").addEventListener("click", function () {
      setDigest(!$("#digest-banner").classList.contains("show"));
    });
    $("#btn-digest-skip").addEventListener("click", function () {
      setDigest(false);
      markHomeDigest("已跳过", true);
      toast("这期先跳过。");
    });
    $("#btn-digest-forward").addEventListener("click", openChannels);

    $("#btn-send").addEventListener("click", sendChat);
    $("#chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendChat();
    });

    $all("[data-resp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const map = {
          later: "好，先放着。对方只会看到「稍后」。",
          reply: "记下了你的一句回复。这里不会真的发出去。",
          invite: "已发出「一起聊」的示意。要双方都愿意。",
        };
        toast(map[btn.dataset.resp]);
        const tag = $("#note-incoming .tag");
        const later = btn.dataset.resp === "later";
        tag.textContent = later ? "稍后" : "已回应";
        tag.className = "tag " + (later ? "tag-mute" : "tag-cyan");
        $("#notes-dot").style.display = "none";
        const homeTag = $("#home-note-tag");
        homeTag.textContent = tag.textContent;
        homeTag.className = tag.className;
        $("#btn-home-note").classList.add("is-done");
        refreshTodoCount();
      });
    });

    $all(".switch").forEach(function (sw) {
      sw.addEventListener("click", function () {
        const on = !sw.classList.contains("on");
        sw.classList.toggle("on", on);
        sw.setAttribute("aria-pressed", on ? "true" : "false");
        if (sw.dataset.sw === "call-out") {
          state.callOutEnabled = on;
          toast(on ? "已允许小间代打电话。每次仍要再确认。" : "已关闭代打电话");
        } else if (sw.id === "sw-phone-default") {
          toast(on ? "电话代转默认开了。每次还是要再确认。" : "电话代转保持默认关");
        }
      });
    });

    $("#btn-open-channels").addEventListener("click", openChannels);
    $("#sheet-close").addEventListener("click", closeChannels);
    $("#sheet-channels").addEventListener("click", function (e) {
      if (e.target === $("#sheet-channels")) closeChannels();
    });

    $all("[data-ch]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const ch = btn.dataset.ch;
        if (ch === "call") {
          if (!state.callOutEnabled) toast("代打电话还关着。先看看来电长什么样。");
          openCall();
          return;
        }
        closeChannels();
        setDigest(false);
        const labels = {
          note: "短笺进了待确认。这里不会真的发出去。",
          voice: "语音代转先放成草稿。",
          pause: "先暂停。到点再问要不要整理一句台阶。",
        };
        toast(labels[ch] || "已选择");
        if (ch === "note" || ch === "voice") {
          markHomeDigest(ch === "note" ? "已转达" : "语音草稿", true);
          switchTab("notes");
        } else {
          markHomeDigest("先暂停", true);
        }
      });
    });

    $("#call-reject").addEventListener("click", function () {
      $("#call-actions").style.display = "none";
      $("#call-script").style.display = "none";
      $("#call-decline").classList.add("show");
    });
    $("#call-accept").addEventListener("click", function () {
      toast("接通了。结束后双方只看到摘要，看不到树洞原文。");
      closeCall();
      switchTab("notes");
    });
    $("#call-done").addEventListener("click", function () {
      closeCall();
      switchTab("notes");
      toast("未接已改成留言和短笺。");
    });

    $("#btn-retro").addEventListener("click", function () {
      toast("复盘卡：触发点、需求、哪种说法有用。双方都点头，才写进小约定。");
    });
  }

  tickClock();
  setInterval(tickClock, 30000);
  syncPersonaUI();
  bind();
})();
