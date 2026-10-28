/* Solhaven. Shared mechanics adapted from MIT Nookwell/Taskline Lite; full grants in licenses/. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktopInput = matchMedia("(hover: hover) and (pointer: fine)");
  const menuBreakpoint = matchMedia("(min-width: 900px)");
  const main = document.getElementById("main");
  const footer = document.getElementById("site-footer");
  const toggle = document.getElementById("menu-toggle");
  const panel = document.getElementById("mobile-menu");
  const menuScroll = document.getElementById("menu-scroll");
  let draftSmooth, draftBar;
  let pageSmooth,
    menuSmooth,
    menuOpen = false,
    menuClosing = false;
  let menuTimer,
    menuRevision = 0,
    lockY = 0,
    locked = false,
    savedOverflow = "";
  let pageBar, menuBar;

  // All active Lenis regions share this one millisecond animation clock.
  const scrollers = new Set();
  let clock = 0;
  function tick(time) {
    for (const scroller of scrollers) scroller.raf(time);
    clock = scrollers.size ? requestAnimationFrame(tick) : 0;
  }
  function register(scroller) {
    scrollers.add(scroller);
    if (!clock) clock = requestAnimationFrame(tick);
    return scroller;
  }
  function destroy(scroller) {
    if (!scroller) return;
    scrollers.delete(scroller);
    scroller.destroy();
    if (!scrollers.size && clock) {
      cancelAnimationFrame(clock);
      clock = 0;
    }
  }
  function smoothFor(wrapper) {
    if (
      reduced.matches ||
      !desktopInput.matches ||
      typeof window.Lenis !== "function"
    )
      return;
    try {
      return register(
        new window.Lenis({
          ...(wrapper ? { wrapper, content: wrapper.firstElementChild } : {}),
          autoRaf: false,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.12,
          anchors: false,
          prevent: (node) =>
            node.closest?.(".scroll-rail") ||
            node.closest?.("textarea,input,[contenteditable=true]") ||
            (!wrapper && node.closest?.("#mobile-menu, #draft-scroll")),
        }),
      );
    } catch {
      return undefined;
    }
  }
  function configureMotion() {
    destroy(pageSmooth);
    destroy(menuSmooth);
    destroy(draftSmooth);
    draftSmooth = !document.getElementById("draft-result").hidden
      ? smoothFor(document.getElementById("draft-scroll"))
      : undefined;
    pageSmooth = smoothFor();
    menuSmooth = menuOpen ? smoothFor(menuScroll) : undefined;
    if (locked) pageSmooth?.stop();
  }
  configureMotion();
  reduced.addEventListener("change", configureMotion);
  desktopInput.addEventListener("change", configureMotion);

  function focusTarget(target) {
    if (target && !target.matches("a,button,input,textarea,summary,[tabindex]"))
      target.tabIndex = -1;
    target?.focus({ preventScroll: true });
  }
  function goTo(hash, focusAfter) {
    let target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return;
    }
    if (!target) return;
    if (location.hash !== hash) history.pushState(null, "", hash);
    if (pageSmooth && !reduced.matches) {
      pageSmooth.scrollTo(target, {
        duration: 0.8,
        onComplete: () => focusTarget(focusAfter || target),
      });
    } else {
      target.scrollIntoView({
        block: "start",
        behavior: reduced.matches ? "instant" : "smooth",
      });
      focusTarget(focusAfter || target);
    }
  }

  // A replacement is installed only after its geometry and handlers exist.
  function installScrollbar(region, label, host) {
    const page = region === window;
    const rail = document.createElement("div");
    rail.className = "scroll-rail" + (page ? "" : " scroll-rail--local");
    const thumb = document.createElement("div");
    thumb.className = "scroll-thumb";
    thumb.setAttribute("role", "scrollbar");
    thumb.setAttribute("aria-label", label);
    thumb.setAttribute("aria-orientation", "vertical");
    thumb.setAttribute("aria-controls", page ? "page-scroll" : region.id);
    thumb.setAttribute("aria-valuemin", "0");
    thumb.tabIndex = 0;
    rail.append(thumb);
    host.append(rail);
    let idle,
      max = 0,
      travel = 0,
      grab = 0,
      dragging = false;
    const current = () => (page ? window.scrollY : region.scrollTop);
    function activity() {
      rail.classList.add("is-active");
      clearTimeout(idle);
      idle = setTimeout(() => rail.classList.remove("is-active"), 1000);
    }
    function update() {
      const viewport = page ? innerHeight : region.clientHeight;
      const total = page
        ? Math.max(root.scrollHeight, document.body.scrollHeight)
        : region.scrollHeight;
      max = Math.max(0, total - viewport);
      rail.hidden =
        max <= 1 ||
        (page && locked) ||
        (!page &&
          (!!region.closest("[hidden]") ||
            (!!region.closest("dialog") && !region.closest("dialog").open)));
      if (rail.hidden) {
        thumb.tabIndex = -1;
        return;
      }
      thumb.tabIndex = 0;
      const track = rail.clientHeight;
      const size = Math.min(track, Math.max(28, (track * viewport) / total));
      travel = Math.max(0, track - size);
      thumb.style.height = size + "px";
      thumb.style.transform = `translateY(${max ? Math.min(1, current() / max) * travel : 0}px)`;
      thumb.setAttribute("aria-valuemax", String(Math.round(max)));
      thumb.setAttribute(
        "aria-valuenow",
        String(Math.round(Math.min(max, Math.max(0, current())))),
      );
      thumb.setAttribute(
        "aria-valuetext",
        `${max ? Math.round((current() / max) * 100) : 0}%`,
      );
    }
    function setScroll(value) {
      const next = Math.max(0, Math.min(max, value));
      const smooth = page
        ? pageSmooth
        : region.id === "menu-scroll"
          ? menuSmooth
          : draftSmooth;
      if (smooth) smooth.scrollTo(next, { immediate: true, force: true });
      else if (page) window.scrollTo({ top: next, behavior: "instant" });
      else region.scrollTop = next;
      update();
      activity();
    }
    thumb.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      focusTarget(thumb);
      update();
      grab = event.clientY - thumb.getBoundingClientRect().top;
      dragging = true;
      rail.classList.add("is-dragging");
      thumb.setPointerCapture(event.pointerId);
      activity();
    });
    thumb.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const y = event.clientY - rail.getBoundingClientRect().top - grab;
      setScroll(travel ? (y / travel) * max : 0);
    });
    const endDrag = () => {
      dragging = false;
      rail.classList.remove("is-dragging");
      activity();
    };
    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);
    thumb.addEventListener("lostpointercapture", endDrag);
    thumb.addEventListener("keydown", (event) => {
      const viewport = page ? innerHeight : region.clientHeight;
      const delta = {
        ArrowUp: -40,
        ArrowDown: 40,
        PageUp: -viewport * 0.85,
        PageDown: viewport * 0.85,
      };
      if (event.key in delta || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        setScroll(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? max
              : current() + delta[event.key],
        );
      }
    });
    region.addEventListener(
      "scroll",
      () => {
        update();
        activity();
      },
      { passive: true },
    );
    window.addEventListener("resize", update, { passive: true });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(update);
      observer.observe(page ? document.body : region.firstElementChild);
    }
    update();
    (page ? root : region).classList.add(
      page ? "has-page-scrollbar" : "has-local-scrollbar",
    );
    return { update };
  }
  try {
    pageBar = installScrollbar(window, "Page scroll", document.body);
  } catch {
    root.classList.remove("has-page-scrollbar");
  }
  try {
    menuBar = installScrollbar(menuScroll, "Navigation scroll", panel);
  } catch {
    menuScroll.classList.remove("has-local-scrollbar");
  }

  function lockBackground() {
    if (locked) return;
    locked = true;
    lockY = window.scrollY;
    savedOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    pageSmooth?.stop();
    document.querySelector(".site-header .brand").inert = true;
    main.inert = true;
    footer.inert = true;
    pageBar?.update();
  }
  function unlockBackground() {
    root.style.overflow = savedOverflow;
    document.querySelector(".site-header .brand").inert = false;
    main.inert = false;
    footer.inert = false;
    locked = false;
    // No fixed-body layout substitution: native scroll position stays intact.
    if (Math.abs(window.scrollY - lockY) > 1)
      window.scrollTo({ top: lockY, behavior: "instant" });
    pageSmooth?.start();
    pageBar?.update();
  }
  function openMenu() {
    clearTimeout(menuTimer);
    ++menuRevision;
    menuOpen = true;
    menuClosing = false;
    panel.hidden = false;
    panel.inert = false;
    panel.classList.remove("is-closing");
    lockBackground();
    // Commit the offscreen start state before the reversible CSS transition.
    panel.getBoundingClientRect();
    root.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
    destroy(menuSmooth);
    menuSmooth = smoothFor(menuScroll);
    menuBar?.update();
    focusTarget(panel.querySelector("nav a"));
  }
  function closeMenu(after, immediate = false) {
    if (!menuOpen && !menuClosing) {
      after?.();
      return;
    }
    clearTimeout(menuTimer);
    const revision = ++menuRevision;
    menuOpen = false;
    menuClosing = true;
    panel.classList.add("is-closing");
    panel.inert = true;
    root.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    const finish = () => {
      if (revision !== menuRevision) return;
      menuClosing = false;
      panel.hidden = true;
      panel.classList.remove("is-closing");
      destroy(menuSmooth);
      menuSmooth = undefined;
      unlockBackground();
      menuBar?.update();
      if (after) after();
      else
        focusTarget(
          toggle.offsetParent
            ? toggle
            : document.querySelector(".primary-nav a"),
        );
    };
    if (immediate || reduced.matches) finish();
    else menuTimer = setTimeout(finish, 280);
  }
  toggle.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener("keydown", (event) => {
    if (!menuOpen && !menuClosing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === "Tab") {
      const controls = [
        toggle,
        ...panel.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex="0"]',
        ),
      ];
      const at = controls.indexOf(document.activeElement);
      if (event.shiftKey && at <= 0) {
        event.preventDefault();
        focusTarget(controls.at(-1));
      } else if (!event.shiftKey && (at === controls.length - 1 || at < 0)) {
        event.preventDefault();
        focusTarget(toggle);
      }
    }
  });
  menuBreakpoint.addEventListener("change", () => {
    if (menuBreakpoint.matches) closeMenu(null, true);
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (
      !link ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    event.preventDefault();
    if (panel.contains(link)) closeMenu(() => goTo(hash));
    else goTo(hash);
  });
  // Native keyboard/drag input interrupts any in-flight eased page travel.
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        locked ||
        ![
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key) ||
        event.target.closest("input,textarea,button,summary,[role=scrollbar]")
      )
        return;
      pageSmooth?.scrollTo(window.scrollY, { immediate: true });
    },
    true,
  );
  toggle.hidden = false;
  root.classList.add("enhanced");

  document.querySelectorAll(".faq-item").forEach((details) => {
    const summary = details.querySelector("summary");
    const answer = details.querySelector(".faq-answer");
    if (!details.animate) return;
    let expanded = details.open,
      animation,
      revision = 0;
    function change(next) {
      const version = ++revision;
      const start = details.getBoundingClientRect().height;
      animation?.cancel();
      animation = undefined;
      expanded = next;
      details.open = true;
      details.dataset.expanded = String(next);
      details.style.height = "auto";
      const border =
        parseFloat(getComputedStyle(details).borderBottomWidth) || 0;
      const end = next
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + border;
      if (reduced.matches) {
        details.open = next;
        details.style.height = "";
        details.style.overflow = "";
        return;
      }
      details.style.height = start + "px";
      details.style.overflow = "hidden";
      animation = details.animate(
        [{ height: start + "px" }, { height: end + "px" }],
        {
          duration: Math.min(240, 180 + Math.abs(end - start) * 0.15),
          easing: "cubic-bezier(.22,.61,.36,1)",
          fill: "both",
        },
      );
      animation.onfinish = () => {
        if (version !== revision) return;
        details.open = expanded;
        details.style.height = "";
        details.style.overflow = "";
        animation?.cancel();
        animation = undefined;
      };
    }
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      change(!expanded);
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => {
        if (animation) change(expanded);
      });
      observer.observe(answer);
      observer.observe(summary);
    }
    reduced.addEventListener("change", () => {
      if (animation) change(expanded);
    });
  });
  document.fonts?.ready.then(() => {
    pageBar?.update();
    menuBar?.update();
  });
  // Deep links work after fonts/layout settle, without a decorative entrance.
  window.addEventListener("load", () => {
    if (location.hash && location.hash !== "#top") {
      let target;
      try {
        target = document.getElementById(
          decodeURIComponent(location.hash.slice(1)),
        );
      } catch {
        return;
      }
      if (target) {
        if (pageSmooth) pageSmooth.scrollTo(target, { immediate: true });
        else target.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
  });
  const scope = {
    solar: {
      name: "Rooftop solar",
      title: "A clear start with solar",
      copy: "Panels collect sunlight. An inverter converts their output into electricity your home can use. A site assessment helps establish a suitable layout.",
      items: [
        "Roof condition, usable area and shade",
        "Current electricity use and supply",
        "Equipment location and grid requirements",
      ],
    },
    storage: {
      name: "Solar + storage",
      title: "Make storage part of the conversation",
      copy: "A battery can store energy for later use. Discuss how storage fits your household and which compatible equipment and controls would be needed. Backup power requires a specific design.",
      items: [
        "What you would like storage to support",
        "A suitable battery location and compatibility",
        "System controls, safety and operating limits",
      ],
    },
    review: {
      name: "Existing system review",
      title: "Build on what is already there",
      copy: "Start with your existing panels, inverter and any storage. A qualified installer can inspect their condition and compatibility before recommending changes.",
      items: [
        "Equipment models and approximate installation age",
        "Your questions and any observed changes",
        "Inspection, maintenance and upgrade options",
      ],
    },
  };
  let currentScope = "solar";
  document.querySelectorAll('input[name="system"]').forEach((input) => {
    input.addEventListener("change", () => {
      currentScope = input.value;
      const item = scope[currentScope];
      document.getElementById("scope-title").textContent = item.title;
      document.getElementById("scope-copy").textContent = item.copy;
      document.getElementById("scope-list").replaceChildren(
        ...item.items.map((text) => {
          const li = document.createElement("li");
          li.textContent = text;
          return li;
        }),
      );
      document.querySelector(".system-drawing").dataset.scope = currentScope;
      pageBar?.update();
    });
  });
  const form = document.getElementById("enquiry-form");
  document.getElementById("prepare-draft").disabled = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    for (const name of ["name", "area", "message"]) {
      const field = form.elements[name];
      if (!field.value.trim()) {
        field.setCustomValidity("Please add a little more detail.");
        field.reportValidity();
        field.addEventListener("input", () => field.setCustomValidity(""), {
          once: true,
        });
        return;
      }
    }
    const text = `UNSENT SOLAR PROJECT BRIEF\n\nName: ${String(data.get("name")).trim()}\nEmail: ${String(data.get("email")).trim()}\nTown or area: ${String(data.get("area")).trim()}\nScope to explore: ${scope[currentScope].name}\nStarting point: ${data.get("stage")}\n\nWhat I would like to discuss:\n${String(data.get("message")).trim()}\n\nPrepared locally with the Solhaven demonstration. Nothing has been sent or booked. Equipment suitability, costs and local requirements need a site-led proposal.`;
    document.getElementById("draft-text").textContent = text;
    const result = document.getElementById("draft-result");
    result.hidden = false;
    document.getElementById("copy-status").textContent = "";
    const scroll = document.getElementById("draft-scroll");
    scroll.scrollTop = 0;
    destroy(draftSmooth);
    draftSmooth = smoothFor(scroll);
    if (!draftBar) {
      try {
        draftBar = installScrollbar(
          scroll,
          "Unsent brief scroll",
          scroll.parentElement,
        );
      } catch {
        scroll.classList.remove("has-local-scrollbar");
      }
    }
    draftBar?.update();
    pageBar?.update();
    goTo("#draft-result", document.getElementById("draft-title"));
  });
  form.addEventListener("input", () => {
    if (!document.getElementById("draft-result").hidden)
      document.getElementById("copy-status").textContent =
        "Details changed. Prepare your brief again to update it.";
  });
  document.querySelectorAll('input[name="system"]').forEach((input) =>
    input.addEventListener("change", () => {
      if (!document.getElementById("draft-result").hidden)
        document.getElementById("copy-status").textContent =
          "Scope changed. Prepare your brief again to update it.";
    }),
  );
  document.getElementById("copy-draft").addEventListener("click", async () => {
    const field = document.getElementById("draft-text");
    try {
      await navigator.clipboard.writeText(field.textContent);
      document.getElementById("copy-status").textContent =
        "Brief copied. Nothing has been sent.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(field);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      focusTarget(document.getElementById("draft-scroll"));
      document.getElementById("copy-status").textContent =
        "Copy the selected brief with your keyboard or use Download text.";
    }
  });
  document.getElementById("download-draft").addEventListener("click", () => {
    const blob = new Blob([document.getElementById("draft-text").textContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "solhaven-unsent-project-brief.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById("copy-status").textContent =
      "Brief prepared for download. Nothing has been sent.";
  });
})();
