(function () {
  "use strict";

  // 固定导航滚动阴影
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  // 移动端菜单
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.querySelectorAll(".hero__jump").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 锚点平滑滚动（为固定导航留出偏移）
  var navLinks = document.querySelectorAll('.nav__link[href^="#"], .hero__jump[href^="#"]');
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navH = document.querySelector(".site-header")
        ? document.querySelector(".site-header").offsetHeight
        : 64;
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  // 滚动渐入
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // 轮播（支持页面内多个 [data-carousel]）
  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
    var prevBtn = root.querySelector(".carousel__btn--prev");
    var nextBtn = root.querySelector(".carousel__btn--next");
    var dotsWrap = root.querySelector(".carousel__dots");
    var index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        s.classList.toggle("is-active", j === index);
      });
      if (dotsWrap) {
        var dots = dotsWrap.querySelectorAll(".carousel__dot");
        dots.forEach(function (d, j) {
          d.setAttribute("aria-selected", j === index ? "true" : "false");
        });
      }
    }

    if (dotsWrap && slides.length) {
      slides.forEach(function (_, j) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel__dot";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "第 " + (j + 1) + " 张");
        b.addEventListener("click", function () {
          show(j);
        });
        dotsWrap.appendChild(b);
      });
      show(0);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        show(index - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        show(index + 1);
      });
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1);
      }
    });
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);

  // 返回顶部
  var backTop = document.querySelector(".back-top");
  if (backTop) {
    function toggleBackTop() {
      if (window.scrollY > 420) {
        backTop.classList.add("is-visible");
        backTop.removeAttribute("tabindex");
        backTop.setAttribute("aria-hidden", "false");
      } else {
        backTop.classList.remove("is-visible");
        backTop.setAttribute("tabindex", "-1");
        backTop.setAttribute("aria-hidden", "true");
      }
    }
    window.addEventListener("scroll", toggleBackTop, { passive: true });
    toggleBackTop();
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
