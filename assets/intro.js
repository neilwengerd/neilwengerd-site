/* Intro: the header is pinned at the top for the first screen of scrolling while
   the signature starts large and centered, then shrinks and rises into its place
   between the nav links. Sections fade in as they enter the viewport. Only runs
   when <html> has the "has-intro" class, which the inline script in <head> adds
   unless the visitor prefers reduced motion. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("has-intro")) return;

  var track = document.querySelector(".intro-track");
  var header = document.querySelector(".site-header");
  var cell = document.querySelector(".signature");
  var img = cell && cell.querySelector("img");
  if (!track || !header || !cell || !img) return;

  var vh = 0;
  var distance = 0; /* scroll distance over which the signature travels */
  var endScale = 1;
  var cellCenterY = 0; /* signature cell center, measured from the header top */
  var queued = false;

  function measure() {
    vh = window.innerHeight;
    distance = track.offsetHeight - header.offsetHeight;
    var startWidth = img.offsetWidth;
    endScale = startWidth ? cell.offsetWidth / startWidth : 1;
    var c = cell.getBoundingClientRect();
    var h = header.getBoundingClientRect();
    cellCenterY = c.top - h.top + c.height / 2;
  }

  function easeOut(p) {
    return 1 - Math.pow(1 - p, 3);
  }

  function update() {
    queued = false;
    var s = Math.max(0, window.pageYOffset);
    var p = distance > 0 ? Math.min(1, s / distance) : 1;
    var e = easeOut(p);

    /* While pinned, the header's top is at the viewport top. */
    var ty = (vh / 2 - cellCenterY) * (1 - e);
    var k = 1 + (endScale - 1) * e;

    img.style.willChange = p < 1 ? "transform" : "auto";
    img.style.transform =
      "translate(-50%, -50%) translate3d(0, " + ty + "px, 0) scale(" + k + ")";
  }

  function queue() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }

  function remeasure() {
    measure();
    update();
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", remeasure);
  window.addEventListener("load", remeasure);
  remeasure();

  /* Fade-in on scroll */
  var targets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    Array.prototype.forEach.call(targets, function (t) {
      io.observe(t);
    });
  } else {
    Array.prototype.forEach.call(targets, function (t) {
      t.classList.add("is-visible");
    });
  }
})();
