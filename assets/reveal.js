/* Fade sections in as they enter the viewport. Only runs when <html> has "has-reveal",
   which the inline script in <head> adds unless the visitor prefers reduced motion. */
(function () {
  var items = document.querySelectorAll("[data-reveal]");
  if (!document.documentElement.classList.contains("has-reveal") || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
  items.forEach(function (el) { io.observe(el); });
})();
