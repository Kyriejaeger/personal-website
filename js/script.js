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

  // 轮播：仅加载当前张与相邻张，减轻手机流量与首屏压力
  function loadSlideImage(slide) {
    if (!slide) return;
    var img = slide.querySelector("img");
    if (!img) return;
    var url = img.getAttribute("data-src");
    if (!url || img.getAttribute("src")) return;
    img.setAttribute("src", url);
    img.removeAttribute("data-src");
    slide.classList.add("is-loading");
    img.addEventListener(
      "load",
      function () {
        slide.classList.remove("is-loading");
      },
      { once: true }
    );
    img.addEventListener(
      "error",
      function () {
        slide.classList.remove("is-loading");
      },
      { once: true }
    );
  }

  function preloadAround(slides, center) {
    var n = slides.length;
    if (!n) return;
    loadSlideImage(slides[center]);
    loadSlideImage(slides[(center + 1) % n]);
    loadSlideImage(slides[(center - 1 + n) % n]);
  }

  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
    var prevBtn = root.querySelector(".carousel__btn--prev");
    var nextBtn = root.querySelector(".carousel__btn--next");
    var dotsWrap = root.querySelector(".carousel__dots");
    var index = 0;
    var started = false;

    function startCarousel() {
      if (started) return;
      started = true;
      preloadAround(slides, index);
    }

    function updateUI() {
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

    function show(i, fromUser) {
      index = (i + slides.length) % slides.length;
      updateUI();
      if (started || fromUser) {
        if (!started) started = true;
        preloadAround(slides, index);
      }
    }

    if ("IntersectionObserver" in window) {
      var carouselIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              startCarousel();
              carouselIo.unobserve(root);
            }
          });
        },
        { rootMargin: "120px 0px", threshold: 0.01 }
      );
      carouselIo.observe(root);
    } else {
      startCarousel();
    }

    if (dotsWrap && slides.length) {
      slides.forEach(function (_, j) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel__dot";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "第 " + (j + 1) + " 张");
        b.addEventListener("click", function () {
          show(j, true);
        });
        dotsWrap.appendChild(b);
      });
      updateUI();
    } else if (slides.length) {
      updateUI();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        show(index - 1, true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        show(index + 1, true);
      });
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1, true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1, true);
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
