/* 间语 2.0 · 纯前端 mock，file:// 可开。气质只改表情和围巾颜色。 */
(function () {
  "use strict";

  var state = {
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
    greetHidden: false,
  };

  var FACES = {
    "冷静温柔": { y: 136, rx: 23, ry: 26, pupil: 11, smile: "soft", blush: 0.42, brow: false, gaze: 1 },
    "软萌陪伴": { y: 134, rx: 25, ry: 30, pupil: 12.5, smile: "wide", blush: 0.6, brow: false, gaze: 0 },
    "毒舌但善良": { y: 140, rx: 22, ry: 17, pupil: 9.2, smile: "smirk", blush: 0.16, brow: true, gaze: 5 },
  };

  var SCARF = {
    "冷静温柔": ["#ffe7a8", "#ffc44d", "#ff7e1a"],
    "软萌陪伴": ["#ffd9e4", "#ff9bb0", "#ff6b7a"],
    "毒舌但善良": ["#ffe08a", "#ff9a1f", "#f04a00"],
  };

  var CLAY = {
    hero: {
      body: ["#c5d4ff", "#6d8cff", "#3356f2", "#1a34c4"],
      tip: ["#ffe0f6", "#e184ff", "#ff5e9c"],
    },
    green: {
      body: ["#d9ffe9", "#5be0a4", "#18a86a", "#0b7a48"],
      tip: ["#fff6d2", "#ffe08a", "#ffb703"],
      scarf: ["#fff4cc", "#ffe08a", "#f0b429"],
      face: { y: 136, rx: 23, ry: 28, pupil: 12, smile: "wide", blush: 0.4, brow: false, gaze: 0 },
    },
    orange: {
      body: ["#ffe6d0", "#ffa15c", "#f06a1a", "#c2410c"],
      tip: ["#ffe0f2", "#ff8ac4", "#ff5c8a"],
      scarf: ["#ffe08a", "#ffb020", "#e23b0e"],
      face: { y: 138, rx: 22, ry: 25, pupil: 11, smile: "soft", blush: 0.36, brow: false, gaze: -2 },
    },
  };

  var REPLIES = {
    "软萌陪伴": "听到了。今天闷一点也没关系，我陪你待一会儿，不急着收成结论。",
    "冷静温柔": "我听到了。累和闷都可以先放在这里。想整理就一句一句来，不想也可以。",
    "毒舌但善良": "气压不对就对了。说或不说都行，我又不收咨询费。别一个人硬扛到爆。",
  };

  var OB_STEPS = [
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
      title: "同一只小间，换配件",
      hint: "身体还是这只。只换星球环、耳朵或贴纸。",
      options: [
        { id: "小星球信使", d: "芽尖上多一圈小行星环。默认。" },
        { id: "动物系软兽", d: "两侧多两只圆耳朵。" },
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
        { id: "不太撒娇", d: "少一点腮红和软乎乎。" },
        { id: "不催沟通", d: "不推销「该告诉对方了」。" },
        { id: "不用心理学术语", d: "不给你贴标签。" },
      ],
      def: ["不说教", "不催沟通"],
    },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function radial(id, cx, cy, stops) {
    var inner = stops.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>';
    }).join("");
    return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="75%">' + inner + "</radialGradient>";
  }

  function linear(id, stops) {
    var inner = stops.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>';
    }).join("");
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' + inner + "</linearGradient>";
  }

  function mouthPath(kind) {
    if (kind === "wide") {
      return "M96 166 C110 190 138 190 152 166 C136 178 108 178 96 166";
    }
    if (kind === "smirk") {
      return "M110 180 C124 186 142 174 158 164 C142 176 124 188 110 180";
    }
    return "M106 170 C116 184 132 184 142 170 C132 176 114 176 106 170";
  }

  function blobSVG(opts) {
    var uid = opts.uid || "b";
    var kin = opts.kin || "";
    var temper = opts.temper || "冷静温柔";
    var look = opts.look || "小星球信使";
    var taboos = opts.taboos || [];
    var clay = kin ? CLAY[kin] : CLAY.hero;
    var face = kin ? clay.face : (FACES[temper] || FACES["冷静温柔"]);
    var scarf = kin ? clay.scarf : (SCARF[temper] || SCARF["冷静温柔"]);
    var blush = face.blush;
    if (!kin && taboos.indexOf("不太撒娇") !== -1) blush *= 0.35;

    var lx = 90;
    var rx = 150;
    var eyeY = face.y;
    var tipY = 50;
    var ground = opts.ground !== false;

    var parts = [];
    parts.push('<svg viewBox="0 0 240 300" width="100%" height="100%" aria-hidden="true">');
    parts.push("<defs>");
    parts.push(radial(uid + "-body", "34%", "30%", [
      ["0%", clay.body[0]],
      ["32%", clay.body[1]],
      ["64%", clay.body[2]],
      ["100%", clay.body[3]],
    ]));
    parts.push(radial(uid + "-tip", "36%", "32%", [
      ["0%", clay.tip[0]],
      ["48%", clay.tip[1]],
      ["100%", clay.tip[2]],
    ]));
    parts.push(linear(uid + "-scarf", [
      ["0%", scarf[0]],
      ["48%", scarf[1]],
      ["100%", scarf[2]],
    ]));
    parts.push(radial(uid + "-eye", "40%", "36%", [
      ["0%", "#ffffff"],
      ["72%", "#f4f7ff"],
      ["100%", "#e4e9f5"],
    ]));
    parts.push(
      '<filter id="' + uid + '-blur" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="2.4"/></filter>'
    );
    parts.push(
      '<filter id="' + uid + '-shadow" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feGaussianBlur stdDeviation="5"/></filter>'
    );
    parts.push("</defs>");

    if (ground) {
      parts.push('<ellipse cx="120" cy="286" rx="62" ry="10" fill="#1e2748" opacity="0.16" filter="url(#' + uid + '-shadow)"/>');
    }

    if (!kin && look === "动物系软兽") {
      parts.push('<circle cx="28" cy="150" r="24" fill="url(#' + uid + '-body)"/>');
      parts.push('<circle cx="212" cy="146" r="22" fill="url(#' + uid + '-body)"/>');
      parts.push('<circle cx="28" cy="152" r="11" fill="#ffb4c8" opacity="0.55"/>');
      parts.push('<circle cx="212" cy="148" r="10" fill="#ffb4c8" opacity="0.5"/>');
    }

    parts.push('<path d="M120 92 C176 84 214 124 210 168 C206 218 176 258 120 262 C62 258 28 216 32 166 C36 122 66 86 120 92 Z" fill="url(#' + uid + '-body)"/>');
    parts.push('<ellipse cx="92" cy="132" rx="30" ry="16" fill="#fff" opacity="0.38" filter="url(#' + uid + '-blur)"/>');
    parts.push('<ellipse cx="156" cy="214" rx="36" ry="22" fill="#0c1a66" opacity="0.1"/>');

    parts.push('<ellipse cx="120" cy="86" rx="20" ry="16" fill="url(#' + uid + '-body)"/>');
    if (!kin && look === "小星球信使") {
      parts.push('<path d="M104 44 Q120 28 136 44" fill="none" stroke="#ffe3f4" stroke-width="3" stroke-linecap="round"/>');
    }
    parts.push('<circle cx="120" cy="' + tipY + '" r="18" fill="url(#' + uid + '-tip)"/>');
    parts.push('<ellipse cx="112" cy="42" rx="7" ry="4" fill="#fff" opacity="0.75"/>');
    if (!kin && look === "小星球信使") {
      parts.push('<path d="M102 58 Q120 74 138 58" fill="none" stroke="#ffe3f4" stroke-width="3" stroke-linecap="round"/>');
    }

    [lx, rx].forEach(function (cx, i) {
      var y = eyeY + (i === 1 ? -1 : 0);
      var gx = cx + face.gaze;
      parts.push('<ellipse cx="' + cx + '" cy="' + (y + 5) + '" rx="' + (face.rx + 1) + '" ry="' + face.ry + '" fill="#10206e" opacity="0.16"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + y + '" rx="' + face.rx + '" ry="' + face.ry + '" fill="url(#' + uid + '-eye)"/>');
      parts.push('<ellipse cx="' + gx + '" cy="' + (y + 4) + '" rx="' + (face.pupil * 0.82) + '" ry="' + face.pupil + '" fill="#161616"/>');
      parts.push('<circle cx="' + (gx + 4) + '" cy="' + (y - 4) + '" r="3.4" fill="#fff"/>');
      parts.push('<circle cx="' + (gx - 3) + '" cy="' + (y + 6) + '" r="1.5" fill="#fff" opacity="0.75"/>');
    });

    if (face.brow) {
      parts.push('<path d="M156 118 Q172 110 188 120" fill="none" stroke="#1a2370" stroke-width="4" stroke-linecap="round" opacity="0.55"/>');
    }

    parts.push('<ellipse cx="58" cy="' + (eyeY + 22) + '" rx="13" ry="7" fill="#ff8fb2" opacity="' + blush + '"/>');
    parts.push('<ellipse cx="184" cy="' + (eyeY + 20) + '" rx="13" ry="7" fill="#ff8fb2" opacity="' + blush + '"/>');

    parts.push('<path d="M42 210 C70 190 168 188 204 210 C190 234 54 240 36 220 Z" fill="url(#' + uid + '-scarf)"/>');
    parts.push('<ellipse cx="198" cy="214" rx="13" ry="10" fill="' + scarf[1] + '"/>');
    parts.push('<path d="M192 218 C214 212 216 244 196 256 C184 242 178 226 192 218 Z" fill="' + scarf[2] + '"/>');
    parts.push('<path d="M70 208 C106 198 148 198 178 210" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.4"/>');

    parts.push('<path d="' + mouthPath(face.smile) + '" fill="#f7f8ff"/>');

    if (!kin && look === "小人偶贴纸风") {
      parts.push('<g transform="rotate(10 178 168)">');
      parts.push('<circle cx="178" cy="168" r="15" fill="#ffe566"/>');
      parts.push('<ellipse cx="172" cy="162" rx="6" ry="3" fill="#fff" opacity="0.45"/>');
      parts.push('<circle cx="173" cy="166" r="1.5" fill="#1a1a1a"/>');
      parts.push('<circle cx="183" cy="166" r="1.5" fill="#1a1a1a"/>');
      parts.push('<path d="M173 172 Q178 176 183 172" fill="none" stroke="#1a1a1a" stroke-width="1.3" stroke-linecap="round"/>');
      parts.push("</g>");
    }

    parts.push("</svg>");
    return parts.join("");
  }

  function paint(el, opts) {
    if (!el) return;
    el.innerHTML = blobSVG(opts);
  }

  function personaOpts(extra) {
    var base = {
      temper: state.temper,
      look: state.look,
      taboos: state.taboos,
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
    }
    return base;
  }

  function paintAll() {
    paint($("#home-face"), personaOpts({ uid: "home", ground: false }));
    paint($("#tree-face"), personaOpts({ uid: "tree", ground: true }));
    paint($("#persona-art"), personaOpts({ uid: "me", ground: false }));
    paint($("#call-face"), personaOpts({ uid: "call", ground: false }));
  }

  function paintKins() {
    paint($("#kin-green"), { uid: "kg", kin: "green", ground: true });
    paint($("#kin-orange"), { uid: "ko", kin: "orange", ground: true });
  }

  function greetingLine() {
    var name = state.callName;
    if (state.greetHidden) return "嗨，" + name + "。";
    if (state.temper === "软萌陪伴") return name + "，我在，不着急。";
    if (state.temper === "毒舌但善良") return name + "，有话直说。";
    return name + "，我在。想说就说。";
  }

  function syncGreet() {
    $("#hello-line").textContent = greetingLine();
    $("#btn-dismiss").classList.toggle("is-hidden", state.greetHidden);
  }

  function updateCallCopy() {
    var name = state.callName;
    $("#call-sub").textContent = "我是小间，代" + name + "转达。不是" + name + "本人，也不是你的伴侣。";
    $("#call-script").innerHTML =
      "<strong>小间会这样说</strong>「你好，我是间语的小间。这通电话是" +
      escapeHtml(name) +
      "授权我打的，不是 TA 本人。TA 希望你知道：忙的时候如果能回一句「晚点聊」，会安心很多。不用现在答应什么。」";
  }

  function syncPersona() {
    $("#persona-line").textContent = state.temper + " · " + state.look + " · " + state.freq;
    $("#info-name").textContent = state.callName;
    $("#info-taboo").textContent = state.taboos.length ? state.taboos.join(" · ") : "没有特别禁忌";
    syncGreet();
    paintAll();
    updateCallCopy();
    syncTreeSub();
  }

  function syncTreeSub() {
    $("#tree-sub").textContent = state.ventOnly ? "今天只听，不往外传" : "这些话只有你看得到";
  }

  function switchTab(tab) {
    state.tab = tab;
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("active", s.dataset.tab === tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.classList.toggle("active", t.dataset.tab === tab);
      if (t.dataset.tab === tab) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
  }

  function setDigest(open) {
    $("#digest-banner").classList.toggle("show", open);
  }

  function refreshTodoLabel() {
    var pending = document.querySelectorAll("#screen-home .trail-hot").length;
    $("#todo-label").textContent = pending ? "待处理" : "都处理过了";
  }

  function setTrail(id, text, hot) {
    var el = $(id);
    el.textContent = text;
    el.classList.toggle("trail-hot", !!hot);
    refreshTodoLabel();
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
    var step = OB_STEPS[state.obStep];
    var last = state.obStep === OB_STEPS.length - 1;
    $("#ob-step-label").textContent = (state.obStep + 1) + " / " + OB_STEPS.length;
    $("#ob-next").textContent = last ? "完成" : "下一步";
    $("#ob-dots").innerHTML = OB_STEPS.map(function (_, i) {
      return '<span class="' + (i === state.obStep ? "on" : "") + '"></span>';
    }).join("");

    var selected = state.obDraft[step.key];
    var preview = blobSVG({
      uid: "ob",
      temper: state.obDraft.temper || "冷静温柔",
      look: state.obDraft.look || "小星球信使",
      taboos: state.obDraft.taboos || [],
      ground: true,
    });
    var html = '<div class="ob-preview">' + preview + "</div>";
    html += '<h3 class="ob-title">' + escapeHtml(step.title) + "</h3>";
    html += '<p class="ob-hint">' + escapeHtml(step.hint) + "</p>";
    html += '<div class="option-list">';
    step.options.forEach(function (op) {
      var isSel = step.multi ? (selected || []).indexOf(op.id) !== -1 : selected === op.id;
      html += '<button type="button" class="option' + (isSel ? " selected" : "") + '" data-opt="' + escapeHtml(op.id) + '">';
      html += '<span><span class="ot">' + escapeHtml(op.id) + '</span><span class="od">' + escapeHtml(op.d) + "</span></span>";
      html += '<svg class="check" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html += "</button>";
    });
    html += "</div>";
    if (last) {
      var t = state.obDraft.temper || "冷静温柔";
      html += '<div class="trial"><p class="ob-hint">你说「今天有点累」。小间这样回：</p>';
      html += '<div class="trial-reply">' + escapeHtml(REPLIES[t]) + "</div></div>";
    }
    $("#ob-content").innerHTML = html;

    Array.prototype.forEach.call($("#ob-content").querySelectorAll(".option"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-opt");
        if (step.multi) {
          var arr = (state.obDraft.taboos || []).slice();
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
    var d = state.obDraft;
    state.temper = d.temper || "冷静温柔";
    state.look = d.look || "小星球信使";
    state.freq = d.freq || "刚好就好";
    state.callName = d.callName || "阿宁";
    state.taboos = d.taboos && d.taboos.length ? d.taboos.slice() : [];
    state.greetHidden = false;
    syncPersona();
    closeOnboarding();
    toast("下一句开始换语气。已经说过的话不会改写。");
    switchTab("home");
  }

  function appendMsg(role, text) {
    var area = $("#chat-area");
    var div = document.createElement("div");
    div.className = "msg " + role;
    div.textContent = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function botReply(userText) {
    var base = REPLIES[state.temper] || REPLIES["冷静温柔"];
    if (state.ventOnly) return base + " 今天只倒苦水，我不会推销转达。";
    if (/累|闷|慢|委屈|怕/.test(userText)) {
      return "我接住了。这更像「需要被及时看见」。你可以继续说。想让对方知道的话，打开本期总结，点「请小间转达」。我不会自己发出去。";
    }
    return base;
  }

  function sendChat() {
    var input = $("#chat-input");
    var text = input.value.trim();
    if (!text) return;
    appendMsg("user", text);
    input.value = "";
    setTimeout(function () { appendMsg("bot", botReply(text)); }, 450);
  }

  function openChannels() {
    var desc = $("#ch-call-desc");
    desc.textContent = state.callOutEnabled
      ? "以小间的身份打，不冒充对方。这一次仍要你再确认。"
      : "以小间的身份打，不冒充对方。现在「代打电话」还关着，仍可看看接听界面。";
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
    $("#phone").classList.add("is-call");
  }

  function closeCall() {
    $("#phone-call").classList.remove("open");
    $("#phone").classList.remove("is-call");
  }

  function tickClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");
    $("#clock").textContent = h + ":" + m;
  }

  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.addEventListener("click", function () { switchTab(t.dataset.tab); });
    });

    $("#btn-talk").addEventListener("click", function () { switchTab("tree"); });
    $("#btn-home-note").addEventListener("click", function () { switchTab("notes"); });
    $("#btn-home-digest").addEventListener("click", function () {
      switchTab("tree");
      setDigest(true);
    });

    $("#btn-dismiss").addEventListener("click", function () {
      state.greetHidden = true;
      syncGreet();
      toast("好。想说的时候，点下面就行。");
    });
    $("#btn-demo").addEventListener("click", function () {
      state.greetHidden = false;
      syncGreet();
      switchTab("home");
      toast("小间轻轻问了一句。");
    });

    $("#btn-remeet").addEventListener("click", openOnboarding);
    $("#ob-close").addEventListener("click", closeOnboarding);
    $("#ob-skip").addEventListener("click", function () {
      var step = OB_STEPS[state.obStep];
      if (step.multi) {
        if (!state.obDraft.taboos) state.obDraft.taboos = step.def.slice();
      } else if (!state.obDraft[step.key]) {
        state.obDraft[step.key] = step.def;
      }
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep += 1;
        renderObStep();
      } else finishOnboarding();
    });
    $("#ob-next").addEventListener("click", function () {
      var step = OB_STEPS[state.obStep];
      if (step.multi && !state.obDraft.taboos) state.obDraft.taboos = step.def.slice();
      else if (!step.multi && !state.obDraft[step.key]) state.obDraft[step.key] = step.def;
      if (state.obStep < OB_STEPS.length - 1) {
        state.obStep += 1;
        renderObStep();
      } else finishOnboarding();
    });

    $("#btn-trial-again").addEventListener("click", function () {
      toast("「今天有点累」→ " + REPLIES[state.temper]);
    });

    $("#vent-row").addEventListener("click", function () {
      state.ventOnly = !state.ventOnly;
      var sw = $("#toggle-vent");
      sw.classList.toggle("on", state.ventOnly);
      sw.setAttribute("aria-checked", state.ventOnly ? "true" : "false");
      syncTreeSub();
      toast(state.ventOnly ? "今天只听，不推销转达" : "可以在你点头之后再转达");
    });

    $("#btn-show-digest").addEventListener("click", function () {
      setDigest(!$("#digest-banner").classList.contains("show"));
    });
    $("#btn-digest-skip").addEventListener("click", function () {
      setDigest(false);
      setTrail("#home-digest-trail", "已跳过", false);
      toast("这期先跳过。");
    });
    $("#btn-digest-forward").addEventListener("click", openChannels);

    $("#btn-send").addEventListener("click", sendChat);
    $("#chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChat();
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-resp]"), function (btn) {
      btn.addEventListener("click", function () {
        var map = {
          later: "好，先放着。对方只会看到「稍后」。",
          reply: "记下了你的一句回复。这里不会真的发出去。",
          invite: "已发出「一起聊」的示意。要双方都愿意。",
        };
        toast(map[btn.dataset.resp]);
        var tag = $("#note-tag");
        var later = btn.dataset.resp === "later";
        tag.textContent = later ? "稍后" : "已回应";
        tag.classList.add("is-done");
        $("#notes-dot").classList.add("is-off");
        setTrail("#home-note-trail", tag.textContent, false);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("button.switch"), function (sw) {
      sw.addEventListener("click", function () {
        var on = !sw.classList.contains("on");
        sw.classList.toggle("on", on);
        sw.setAttribute("aria-checked", on ? "true" : "false");
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

    Array.prototype.forEach.call(document.querySelectorAll("[data-ch]"), function (btn) {
      btn.addEventListener("click", function () {
        var ch = btn.dataset.ch;
        if (ch === "call") {
          if (!state.callOutEnabled) toast("代打电话还关着。先看看来电长什么样。");
          openCall();
          return;
        }
        closeChannels();
        setDigest(false);
        var labels = {
          note: "短笺进了待确认。这里不会真的发出去。",
          voice: "语音代转先放成草稿。",
          pause: "先暂停。到点再问要不要整理一句台阶。",
        };
        toast(labels[ch] || "已选择");
        if (ch === "note" || ch === "voice") {
          setTrail("#home-digest-trail", ch === "note" ? "已转达" : "语音草稿", false);
          switchTab("notes");
        } else {
          setTrail("#home-digest-trail", "先暂停", false);
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
  paintKins();
  syncPersona();
  bind();
})();
