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
    digestShown: false,
    callOutEnabled: false,
  };

  const TAB_META = {
    home: { title: "首页·小间", sub: () => `${state.temper} · ${state.look}` },
    tree: { title: "树洞", sub: () => (state.ventOnly ? "今日仅树洞 · 不推销转达" : "倾听 · 可整理需求") },
    notes: { title: "信笺箱", sub: () => "短笺 · 语音 · 通话摘要" },
    us: { title: "我们", sub: () => "配对 · 授权 · 小约定" },
    me: { title: "我的", sub: () => "完整形象 · 隐私 · 安全" },
  };

  const TEMPER_REPLIES = {
    软萌陪伴: "嗨嗨～听到了。今天闷闷的没关系，我陪你待一会儿，不着急把话说成结论。",
    冷静温柔: "我听到了。累和闷都可以先放在这里。你要是愿意，我们一句一句来；不想整理也可以。",
    "毒舌但善良": "气压不对就对了。说或不说都行，我又不收咨询费——但别一个人硬扛到爆。",
  };

  const OB_STEPS = [
    {
      key: "temper",
      title: "小间的气质",
      hint: "像交朋友，不像填量表。可随时改。",
      options: [
        { id: "软萌陪伴", d: "更多共情、轻贴纸；严肃问题仍不轻飘。" },
        { id: "冷静温柔", d: "少打断、一句一问；成人感、误伤少。（默认）" },
        { id: "毒舌但善良", d: "私聊可解压；代转仍走 Soft Start-up，禁止攻击伴侣。" },
      ],
      def: "冷静温柔",
    },
    {
      key: "look",
      title: "形象系",
      hint: "完整形象会在「我的」页展示。",
      options: [
        { id: "小星球信使", d: "温和信使感，像从另一颗小星球来送信。（默认）" },
        { id: "动物系软兽", d: "软软的陪伴感，适合想被哄但不说教的时候。" },
        { id: "小人偶贴纸风", d: "扁平贴纸感，轻盈、不压迫。" },
      ],
      def: "小星球信使",
    },
    {
      key: "freq",
      title: "主动频率",
      hint: "影响触达配额；一键暂停仍可用。",
      options: [
        { id: "很少开口", d: "阈值更高；每周主动私聊上限更低。" },
        { id: "刚好就好", d: "中等触达，仍须自报门闩。（默认）" },
        { id: "多关心一点", d: "稍勤快一点，但仍不连环催。" },
      ],
      def: "刚好就好",
    },
    {
      key: "callName",
      title: "怎么叫你",
      hint: "仅影响小间对你的称呼。",
      options: [
        { id: "阿宁", d: "用你的名字。" },
        { id: "你", d: "中性、克制。" },
        { id: "宝", d: "更亲昵（可自定义，Demo 示意）。" },
      ],
      def: "阿宁",
    },
    {
      key: "taboos",
      title: "不希望小间……",
      hint: "可多选。危机时一律切平静安全话术。",
      multi: true,
      options: [
        { id: "不说教", d: "禁止「你应该」。" },
        { id: "不太撒娇", d: "少卖萌。" },
        { id: "不催沟通", d: "不主动推销「该告诉对方了」。" },
        { id: "不用心理学术语", d: "不标签你。" },
      ],
      def: ["不说教", "不催沟通"],
    },
  ];

  /* ---------- helpers ---------- */
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
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function drawFace(svgHost, temper) {
    // CSS/SVG 小间形象占位，无外网图
    const palette = {
      软萌陪伴: { a: "#f3c9c0", b: "#e8a99a", eye: "#5a4038" },
      冷静温柔: { a: "#e8d5c4", b: "#c4785a", eye: "#3d3530" },
      "毒舌但善良": { a: "#d4c4b0", b: "#8a6a5a", eye: "#2c2a28" },
    };
    const p = palette[temper] || palette["冷静温柔"];
    svgHost.innerHTML = `
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="g1" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stop-color="${p.a}"/>
            <stop offset="100%" stop-color="${p.b}"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#g1)"/>
        <circle cx="50" cy="52" r="28" fill="rgba(255,255,255,0.25)"/>
        <!-- 星球小耳朵 / 信使角 -->
        <ellipse cx="28" cy="28" rx="8" ry="11" fill="${p.b}" opacity="0.85"/>
        <ellipse cx="72" cy="28" rx="8" ry="11" fill="${p.b}" opacity="0.85"/>
        <!-- 眼睛 -->
        <circle cx="38" cy="48" r="3.2" fill="${p.eye}"/>
        <circle cx="62" cy="48" r="3.2" fill="${p.eye}"/>
        <circle cx="39" cy="47" r="1" fill="#fff"/>
        <circle cx="63" cy="47" r="1" fill="#fff"/>
        <!-- 微笑 -->
        <path d="M40 60 Q50 68 60 60" stroke="${p.eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <!-- 小星星 -->
        <circle cx="78" cy="62" r="2" fill="#fff" opacity="0.7"/>
        <circle cx="22" cy="58" r="1.5" fill="#fff" opacity="0.5"/>
      </svg>`;
  }

  function drawPersonaArt() {
    const host = $("#persona-art");
    const lookHint = {
      小星球信使: "信使",
      动物系软兽: "软兽",
      小人偶贴纸风: "贴纸",
    };
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.cssText = "width:100px;height:100px";
    drawFace(wrap, state.temper);
    host.appendChild(wrap);
    const cap = document.createElement("div");
    cap.style.cssText =
      "position:absolute;bottom:10px;left:0;right:0;font-size:11px;color:rgba(44,42,40,0.55);font-weight:600";
    cap.textContent = lookHint[state.look] || state.look;
    host.style.position = "relative";
    host.appendChild(cap);
  }

  function syncPersonaUI() {
    $("#tag-temper").textContent = state.temper;
    $("#tag-look").textContent = state.look;
    $("#tag-freq").textContent = state.freq;
    $("#info-temper").textContent = state.temper;
    $("#info-look").textContent = state.look;
    $("#info-freq").textContent = state.freq;
    $("#info-taboo").textContent = state.taboos.join(" · ") || "无";
    drawFace($("#home-face"), state.temper);
    drawFace($("#call-face"), state.temper);
    drawPersonaArt();
    const bubble = TEMPER_REPLIES[state.temper] || TEMPER_REPLIES["冷静温柔"];
    // 首页开场随气质
    const openers = {
      软萌陪伴: "嗨嗨，我是小间～好像有点闷闷的，要不要和我说两句？",
      冷静温柔: "我是小间。如果你这会儿想找人说说，我在。",
      "毒舌但善良": "气压有点不对。说或不说都行，我又不收咨询费。",
    };
    $("#home-bubble-msg").textContent = openers[state.temper] || openers["冷静温柔"];
    updateTopbar();
  }

  function updateTopbar() {
    const m = TAB_META[state.tab];
    $("#top-title").textContent = m.title;
    $("#top-sub").textContent = m.sub();
  }

  function switchTab(tab) {
    state.tab = tab;
    $all(".screen").forEach((s) => s.classList.toggle("active", s.dataset.tab === tab));
    $all(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    updateTopbar();
    // 树洞屏隐藏顶栏副操作习惯：保持
    if (tab === "tree") {
      $("#wechat-note").style.opacity = "0.55";
    } else {
      $("#wechat-note").style.opacity = "0.92";
    }
  }

  /* ---------- 认识小间 ---------- */
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
    $("#ob-step-label").textContent = `${state.obStep + 1} / ${OB_STEPS.length}`;
    $("#ob-next").textContent = last ? "完成并试聊" : "下一步";

    const dots = $("#ob-dots");
    dots.innerHTML = OB_STEPS.map((_, i) => `<span class="${i === state.obStep ? "on" : ""}"></span>`).join("");

    const selected = state.obDraft[step.key];
    let html = `<div class="card-title">${step.title}</div><p class="card-desc" style="margin-bottom:12px">${step.hint}</p><div class="option-list">`;
    step.options.forEach((op) => {
      let isSel = false;
      if (step.multi) {
        isSel = (selected || []).includes(op.id);
      } else {
        isSel = selected === op.id;
      }
      html += `<button type="button" class="option ${isSel ? "selected" : ""}" data-opt="${op.id}">
        <div class="ot">${op.id}</div><div class="od">${op.d}</div></button>`;
    });
    html += "</div>";

    if (last) {
      const t = state.obDraft.temper || "冷静温柔";
      html += `<div class="trial-box"><div class="prompt">试聊：你说「今天有点累」→ 小间用所选气质回</div>
        <div class="reply" id="trial-reply">${TEMPER_REPLIES[t]}</div></div>`;
    }

    $("#ob-content").innerHTML = html;

    $all(".option", $("#ob-content")).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.opt;
        if (step.multi) {
          let arr = state.obDraft.taboos ? state.obDraft.taboos.slice() : [];
          if (arr.includes(id)) arr = arr.filter((x) => x !== id);
          else arr.push(id);
          state.obDraft.taboos = arr;
        } else {
          state.obDraft[step.key] = id;
          if (step.key === "temper" && $("#trial-reply")) {
            $("#trial-reply").textContent = TEMPER_REPLIES[id];
          }
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
    toast("从下一句开始换新语气。历史对话不会重写。");
    switchTab("me");
  }

  /* ---------- 树洞聊天 ---------- */
  function appendMsg(role, text) {
    const area = $("#chat-area");
    const div = document.createElement("div");
    div.className = "msg " + role;
    if (role === "bot") {
      div.innerHTML = `<div class="meta">小间</div>${escapeHtml(text)}`;
    } else {
      div.textContent = text;
    }
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function botReply(userText) {
    if (state.ventOnly) {
      return (
        TEMPER_REPLIES[state.temper] +
        "（今天只倒苦水：我不会推销转达。想说随时继续。）"
      );
    }
    if (/累|闷|慢|委屈|怕/.test(userText)) {
      return "我接住了。这更像「需要被及时看见」。你可以继续倒；若哪天想让 TA 知道，点「本期总结」里的「请小间转达」即可——我不会自动发。";
    }
    return TEMPER_REPLIES[state.temper] || "我在听。";
  }

  function sendChat() {
    const input = $("#chat-input");
    const text = input.value.trim();
    if (!text) return;
    appendMsg("user", text);
    input.value = "";
    setTimeout(() => appendMsg("bot", botReply(text)), 450);
  }

  /* ---------- 通道 / 电话 ---------- */
  function openChannels() {
    const callBtn = $("#ch-call");
    if (state.callOutEnabled) {
      callBtn.classList.remove("disabled");
      callBtn.querySelector(".ci-desc").textContent =
        "以小间身份代转，不冒充伴侣。需双方授权与当次确认。";
    } else {
      // 仍可点，但提示需开启——Demo 允许进入示意
      callBtn.classList.remove("disabled");
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

  /* ---------- 时钟 ---------- */
  function tickClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    $("#clock").textContent = `${h}:${m}`;
  }

  /* ---------- 绑定 ---------- */
  function bind() {
    $all(".tab").forEach((t) => {
      t.addEventListener("click", () => switchTab(t.dataset.tab));
    });

    $all("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.go));
    });

    $("#btn-open-onboarding").addEventListener("click", openOnboarding);
    $("#btn-remeet").addEventListener("click", openOnboarding);
    $("#ob-close").addEventListener("click", closeOnboarding);
    $("#ob-skip").addEventListener("click", () => {
      const step = OB_STEPS[state.obStep];
      if (!state.obDraft[step.key]) state.obDraft[step.key] = step.def;
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep++;
        renderObStep();
      } else finishOnboarding();
    });
    $("#ob-next").addEventListener("click", () => {
      const step = OB_STEPS[state.obStep];
      if (step.multi && !state.obDraft.taboos) state.obDraft.taboos = step.def.slice();
      else if (!step.multi && !state.obDraft[step.key]) state.obDraft[step.key] = step.def;
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep++;
        renderObStep();
      } else finishOnboarding();
    });

    $("#btn-trial-again").addEventListener("click", () => {
      toast("试聊：「今天有点累」→ " + TEMPER_REPLIES[state.temper]);
    });

    $("#btn-bubble-dismiss").addEventListener("click", () => {
      $("#home-bubble").style.display = "none";
      toast("好。需要时点「先跟小间说」。");
    });

    $("#btn-demo-signal").addEventListener("click", () => {
      $("#home-bubble").style.display = "block";
      switchTab("home");
      toast("演示：模拟「需要聊聊」触达气泡");
    });

    // 只倒苦水
    $("#toggle-vent-wrap").addEventListener("click", () => {
      state.ventOnly = !state.ventOnly;
      const sw = $("#toggle-vent");
      sw.classList.toggle("on", state.ventOnly);
      sw.setAttribute("aria-checked", state.ventOnly ? "true" : "false");
      updateTopbar();
      toast(state.ventOnly ? "已开启：关闭自动建议转达" : "已关闭「只倒苦水」");
    });

    $("#btn-show-digest").addEventListener("click", () => {
      const ban = $("#digest-banner");
      const show = ban.style.display === "none" || !ban.style.display;
      ban.style.display = show ? "block" : "none";
      state.digestShown = show;
    });

    $("#btn-digest-skip").addEventListener("click", () => {
      $("#digest-banner").style.display = "none";
      toast("已跳过本期总结，下期再说。");
    });

    $("#btn-digest-forward").addEventListener("click", () => {
      openChannels();
    });

    $("#btn-send").addEventListener("click", sendChat);
    $("#chat-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });

    // 信笺分段
    $all("#notes-seg button").forEach((b) => {
      b.addEventListener("click", () => {
        $all("#notes-seg button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const seg = b.dataset.seg;
        $("#notes-inbox").style.display = seg === "inbox" ? "block" : "none";
        $("#notes-outbox").style.display = seg === "outbox" ? "block" : "none";
      });
    });

    $all("[data-resp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const map = {
          later: "好，稍后回应。对方只会看到「稍后」。",
          reply: "已记下你的一句回复（Demo：不真发）。",
          invite: "已发出「邀请一起聊」示意（需双方同意）。",
        };
        toast(map[btn.dataset.resp]);
        $("#note-incoming").querySelector(".tag").textContent =
          btn.dataset.resp === "later" ? "稍后" : "已回应";
        $("#note-incoming").querySelector(".tag").className =
          "tag " + (btn.dataset.resp === "later" ? "tag-mute" : "tag-warm");
        $("#notes-dot").style.display = "none";
      });
    });

    // 开关
    $all(".switch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const on = !sw.classList.contains("on");
        sw.classList.toggle("on", on);
        sw.setAttribute("aria-pressed", on ? "true" : "false");
        if (sw.dataset.sw === "call-out") {
          state.callOutEnabled = on;
          toast(on ? "已开启：允许小间代打电话（发）" : "已关闭代打电话");
        } else if (sw.id === "sw-phone-default") {
          toast(on ? "电话代转默认：开（仍需当次确认）" : "电话代转默认：关");
        }
      });
    });

    $("#btn-open-channels").addEventListener("click", openChannels);
    $("#sheet-close").addEventListener("click", closeChannels);
    $("#sheet-channels").addEventListener("click", (e) => {
      if (e.target === $("#sheet-channels")) closeChannels();
    });

    $all("[data-ch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ch = btn.dataset.ch;
        if (ch === "call") {
          if (!state.callOutEnabled) {
            toast("示意：通道矩阵里「代打电话」仍关，但可预览来电界面");
          }
          openCall();
          return;
        }
        closeChannels();
        $("#digest-banner").style.display = "none";
        const labels = {
          note: "短笺已进入待确认（Demo 不真发）。可在信笺箱查看。",
          voice: "语音代转草稿已生成（Demo）。",
          pause: "已建议暂停冷却。到点会轻问是否整理修复句。",
        };
        toast(labels[ch] || "已选择");
        if (ch === "note" || ch === "voice") switchTab("notes");
      });
    });

    $("#call-reject").addEventListener("click", () => {
      $("#call-actions").style.display = "none";
      $("#call-script").style.display = "none";
      $("#call-decline").classList.add("show");
    });
    $("#call-accept").addEventListener("click", () => {
      toast("示意：已接通。通话结束后双方可见摘要（非倾诉原文）。");
      closeCall();
      switchTab("notes");
    });
    $("#call-done").addEventListener("click", () => {
      closeCall();
      switchTab("notes");
      toast("未接已降级：留言 + 短笺留档。");
    });

    $("#btn-retro").addEventListener("click", () => {
      toast("复盘卡示意：触发点 / 需求 / 有效通道 / 下次小事。双方确认才写入小约定。");
    });
  }

  /* init */
  tickClock();
  setInterval(tickClock, 30000);
  syncPersonaUI();
  bind();
  // 默认展示总结条入口提示：树洞里点「本期总结」
})();
