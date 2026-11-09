(function () {
  var root = document.documentElement;

  /* Theme */
  try {
    var saved = localStorage.getItem("jo-theme");
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) {}
  document.getElementById("theme-btn").addEventListener("click", function () {
    var current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("jo-theme", next); } catch (e) {}
  });

  /* Mobile menu */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menu-btn");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* Scroll progress */
  var fill = document.getElementById("progress-fill");
  function onScroll() {
    var h = root.scrollHeight - window.innerHeight;
    fill.style.setProperty("--p", h > 0 ? Math.min(1, window.scrollY / h) : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Active nav link */
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = "#" + en.target.id;
          links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) io.observe(s); });
  }

  /* Project filter */
  var chips = document.querySelectorAll(".chip");
  var cards = document.querySelectorAll(".project");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      cards.forEach(function (card) {
        var show = f === "all" || card.getAttribute("data-cat") === f;
        card.hidden = !show;
      });
    });
  });

  /* Copy email */
  var copyBtn = document.getElementById("copy-btn");
  copyBtn.addEventListener("click", function () {
    var text = document.getElementById("email-text").textContent;
    function done(ok) {
      copyBtn.textContent = ok ? "Copied" : "Press Ctrl+C";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { selectEmail(); done(false); });
    } else { selectEmail(); done(false); }
  });
  function selectEmail() {
    var r = document.createRange();
    r.selectNodeContents(document.getElementById("email-text"));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* Contact form */
  var ENDPOINT = ""; /* Paste a form service URL here (for example Formspree) to receive real messages. */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var msg = document.getElementById("message");
  var count = document.getElementById("count");
  var sendBtn = document.getElementById("send-btn");

  msg.addEventListener("input", function () { count.textContent = msg.value.length; });

  function setError(id, text) {
    var field = document.getElementById("f-" + id);
    document.getElementById(id + "-err").textContent = text;
    field.classList.toggle("invalid", !!text);
    document.getElementById(id).setAttribute("aria-invalid", text ? "true" : "false");
    return !text;
  }
  var rules = {
    name: function (v) { return v.trim().length < 2 ? "Please enter your name." : ""; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email like you@company.com."; },
    message: function (v) { return v.trim().length < 10 ? "Write at least 10 characters so I know how to help." : ""; }
  };
  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("blur", function () { setError(id, rules[id](el.value)); });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") setError(id, rules[id](el.value)); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = ""; status.textContent = "";
    var valid = true, firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var ok = setError(id, rules[id](document.getElementById(id).value));
      if (!ok && !firstBad) firstBad = document.getElementById(id);
      valid = valid && ok;
    });
    if (!valid) { firstBad.focus(); status.className = "fail"; status.textContent = "Please fix the highlighted fields."; return; }

    if (!ENDPOINT) {
      status.className = "ok";
      status.textContent = "Your message looks good. This site has no mail service connected yet, so nothing was sent.";
      return;
    }
    sendBtn.disabled = true;
    status.textContent = "Sending…";
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ name: form.name.value, email: form.email.value, topic: form.topic.value, message: form.message.value }) })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); status.className = "ok"; status.textContent = "Thank you. Your message was sent and I'll reply soon."; form.reset(); count.textContent = "0"; })
      .catch(function () { status.className = "fail"; status.textContent = "Something went wrong and the message was not sent. Please try again."; })
      .then(function () { sendBtn.disabled = false; });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();