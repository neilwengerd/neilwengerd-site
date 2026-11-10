/* Looping image carousels ([data-reel]) and the client quote carousel ([data-quotes]).
   Without JavaScript the image carousels scroll sideways and the first quote shows. */
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-reel]").forEach(initReel);
  document.querySelectorAll("[data-quotes]").forEach(initQuotes);

  function initReel(root) {
    var viewport = root.querySelector(".gr-reel-viewport");
    var track = root.querySelector(".gr-reel-track");
    var originals = Array.prototype.slice.call(track.children);
    var n = originals.length;
    if (n < 2) return;

    function copy(el) {
      var c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.removeAttribute("aria-label");
      return c;
    }
    /* Three clones on each side is enough for the loop and keeps the page light. */
    var c = Math.min(n, 3);
    originals.slice(n - c).forEach(function (el) { track.insertBefore(copy(el), originals[0]); });
    originals.slice(0, c).forEach(function (el) { track.appendChild(copy(el)); });

    var all = Array.prototype.slice.call(track.children);
    var index = c;
    var step = 0;
    var dragX = 0;
    var startX = 0;
    var startY = 0;
    var pointerId = null;
    var dragged = false;

    root.classList.add("is-ready");

    function measure() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      step = all[0].offsetWidth + gap;
    }

    var activeEl = null;

    function paint(animate) {
      track.style.transition = animate && !reduceMotion ? "" : "none";
      track.style.transform = "translate3d(" + (-index * step + dragX) + "px,0,0)";
      if (activeEl !== all[index]) {
        if (activeEl) activeEl.classList.remove("is-active");
        activeEl = all[index];
        activeEl.classList.add("is-active");
      }
    }

    function normalize() {
      if (index >= c + n) index -= n;
      else if (index < c) index += n;
      else return;
      paint(false);
      void track.offsetWidth;
    }

    function goTo(i) {
      normalize();
      index = i;
      paint(true);
      if (reduceMotion) normalize();
    }

    /* Autoplay: advances every 3 seconds while the carousel is on screen.
       It pauses on mouse hover, keyboard focus, touch, and when the tab is hidden,
       and it never runs for visitors who prefer reduced motion. */
    var timer = null;
    var onScreen = false;
    var hovering = false;
    var touching = false;

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function play() {
      stop();
      if (reduceMotion || !onScreen || hovering || touching || document.hidden) return;
      if (viewport.contains(document.activeElement) && viewport.matches(":focus-visible")) return;
      timer = setInterval(function () { goTo(index + 1); }, 3000);
    }

    function userGoTo(i) {
      goTo(i);
      play();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        play();
      }, { threshold: 0.25 }).observe(root);
    } else {
      onScreen = true;
    }

    root.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") { hovering = true; play(); }
    });
    root.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") { hovering = false; play(); }
    });
    viewport.addEventListener("focus", play);
    viewport.addEventListener("blur", play);
    document.addEventListener("visibilitychange", play);

    track.addEventListener("transitionend", function (e) {
      if (e.target === track && e.propertyName === "transform") normalize();
    });

    /* Mouse: the arrow cursor points left or right of the active slide's centre, and a click goes that way.
       Touch: tapping a peeking slide jumps to it. */
    viewport.addEventListener("click", function (e) {
      if (dragged) return;
      var slide = e.target.closest ? e.target.closest(".gr-reel-track > li") : null;
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        var i = all.indexOf(slide);
        if (i > -1 && i !== index) userGoTo(i);
        return;
      }
      var a = all[index].getBoundingClientRect();
      userGoTo(index + (e.clientX < a.left + a.width / 2 ? -1 : 1));
    });

    function setCursor(dir) {
      viewport.classList.toggle("cursor-prev", dir < 0);
      viewport.classList.toggle("cursor-next", dir > 0);
    }

    viewport.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || dragged) return;
      var a = all[index].getBoundingClientRect();
      setCursor(e.clientX < a.left + a.width / 2 ? -1 : 1);
    });
    viewport.addEventListener("pointerleave", function () { setCursor(0); });

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); userGoTo(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); userGoTo(index - 1); }
    });

    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType !== "mouse") { touching = true; stop(); }
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragX = 0;
      dragged = false;
    });

    viewport.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!dragged && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        dragged = true;
        setCursor(0);
        root.classList.add("is-dragging");
        if (e.pointerType === "mouse") viewport.setPointerCapture(pointerId);
      }
      if (dragged) {
        dragX = dx;
        paint(false);
      }
    });

    function release(e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      root.classList.remove("is-dragging");
      var dx = dragX;
      dragX = 0;
      touching = false;
      if (dragged && Math.abs(dx) > Math.min(60, step * 0.15)) goTo(index + (dx < 0 ? 1 : -1));
      else paint(true);
      play();
      setTimeout(function () { dragged = false; }, 0);
    }
    viewport.addEventListener("pointerup", release);
    viewport.addEventListener("pointercancel", release);

    window.addEventListener("resize", function () {
      measure();
      paint(false);
    });

    measure();
    paint(false);
  }

  function initQuotes(root) {
    var quotes = Array.prototype.slice.call(root.querySelectorAll(".gr-quote"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".gr-dot"));
    if (quotes.length < 2) return;
    var current = 0;

    /* Quotes are long, so they advance every 10 seconds. Same pauses as the image carousels. */
    var QUOTE_MS = 10000;
    var timer = null;
    var onScreen = false;
    var hovering = false;
    var touching = false;

    function show(i) {
      current = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) {
        q.classList.toggle("is-active", k === current);
        q.setAttribute("aria-hidden", k === current ? "false" : "true");
      });
      dots.forEach(function (d, k) {
        d.classList.toggle("is-active", k === current);
        if (k === current) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function play() {
      stop();
      if (reduceMotion || !onScreen || hovering || touching || document.hidden) return;
      if (root.contains(document.activeElement) && document.activeElement.matches(":focus-visible")) return;
      timer = setInterval(function () { show(current + 1); }, QUOTE_MS);
    }

    function userShow(i) {
      show(i);
      play();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        play();
      }, { threshold: 0.4 }).observe(root);
    } else {
      onScreen = true;
    }

    root.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") { hovering = true; play(); }
    });
    root.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") { hovering = false; play(); }
    });
    root.addEventListener("focusin", play);
    root.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", play);

    dots.forEach(function (d, k) { d.addEventListener("click", function () { userShow(k); }); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { userShow(current + 1); }
      if (e.key === "ArrowLeft") { userShow(current - 1); }
    });

    var startX = null;
    root.addEventListener("pointerdown", function (e) {
      startX = e.clientX;
      if (e.pointerType !== "mouse") { touching = true; stop(); }
    });
    root.addEventListener("pointerup", function (e) {
      touching = false;
      if (startX !== null) {
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      }
      startX = null;
      play();
    });
    root.addEventListener("pointercancel", function () {
      touching = false;
      startX = null;
      play();
    });
  }
})();
