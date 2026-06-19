(function () {
  var targets = document.querySelectorAll("[data-observe]");

  if (!targets.length) {
    return;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (target) {
      target.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.2
  });

  targets.forEach(function (target) {
    observer.observe(target);
  });
})();

(function () {
  var sliders = document.querySelectorAll(".js-voices");

  if (!sliders.length) {
    return;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  sliders.forEach(function (slider) {
    var track = slider.querySelector(".js-voices-track");
    var dotsWrap = slider.querySelector(".js-voices-dots");

    if (!track || !dotsWrap) {
      return;
    }

    var originalSlides = Array.prototype.slice.call(track.children);

    if (originalSlides.length < 2) {
      return;
    }

    originalSlides.forEach(function (slide, index) {
      slide.dataset.voiceIndex = String(index);
    });

    var firstClone = originalSlides[0].cloneNode(true);
    var lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
    firstClone.dataset.voiceIndex = "0";
    lastClone.dataset.voiceIndex = String(originalSlides.length - 1);
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");
    firstClone.classList.add("is-clone");
    lastClone.classList.add("is-clone");
    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);

    var slides = Array.prototype.slice.call(track.children);

    var mobileSliderQuery = window.matchMedia("(max-width: 767.98px)");
    var threeColumnQuery = window.matchMedia("(max-width: 1080px) and (min-width: 768px)");
    var dots = [];

    function getScrollLeft(slide) {
      if (!mobileSliderQuery.matches) {
        return slide.offsetLeft;
      }

      return slide.offsetLeft - ((track.clientWidth - slide.offsetWidth) / 2);
    }

    function getVisibleCount() {
      if (mobileSliderQuery.matches) {
        return 1;
      }

      if (threeColumnQuery.matches) {
        return 3;
      }

      return 4;
    }

    function getPageCount() {
      return Math.max(1, originalSlides.length - getVisibleCount() + 1);
    }

    function getPageIndex(slideIndex) {
      return Math.min(slideIndex, getPageCount() - 1);
    }

    function renderDots() {
      dotsWrap.textContent = "";
      dots = [];

      for (var index = 0; index < getPageCount(); index++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "voices__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", mobileSliderQuery.matches ? (index + 1) + "枚目のメッセージを表示" : (index + 1) + "ページ目のメッセージを表示");
        dot.addEventListener("click", function (event) {
          var pageIndex = Number(event.currentTarget.dataset.pageIndex);
          track.scrollTo({
            left: getScrollLeft(originalSlides[pageIndex]),
            behavior: reducedMotion ? "auto" : "smooth"
          });
        });
        dot.dataset.pageIndex = String(index);
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function setActive(index) {
      var activePageIndex = getPageIndex(index);

      dots.forEach(function (dot, i) {
        var active = i === activePageIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });

      slides.forEach(function (slide) {
        slide.classList.toggle("is-active", Number(slide.dataset.voiceIndex) === index);
      });
    }

    renderDots();
    setActive(0);

    window.requestAnimationFrame(function () {
      track.scrollLeft = getScrollLeft(originalSlides[0]);
    });

    var raf = null;
    var normalizeTimer = null;

    function getClosestSlide() {
      var trackPoint = mobileSliderQuery.matches ? track.scrollLeft + (track.clientWidth / 2) : track.scrollLeft;
      var closest = slides[0];
      var min = Infinity;

      slides.forEach(function (slide) {
        if (!mobileSliderQuery.matches && slide.classList.contains("is-clone")) {
          return;
        }

        var slidePoint = mobileSliderQuery.matches ? slide.offsetLeft + (slide.offsetWidth / 2) : slide.offsetLeft;
        var dist = Math.abs(slidePoint - trackPoint);

        if (dist < min) {
          min = dist;
          closest = slide;
        }
      });

      return closest;
    }

    function normalizeLoop() {
      if (!mobileSliderQuery.matches) {
        return;
      }

      var closestSlide = getClosestSlide();

      if (closestSlide === lastClone) {
        track.scrollLeft = getScrollLeft(originalSlides[originalSlides.length - 1]);
      }

      if (closestSlide === firstClone) {
        track.scrollLeft = getScrollLeft(originalSlides[0]);
      }
    }

    track.addEventListener("scroll", function () {
      if (raf) {
        return;
      }

      raf = window.requestAnimationFrame(function () {
        raf = null;

        setActive(Number(getClosestSlide().dataset.voiceIndex));
      });

      window.clearTimeout(normalizeTimer);
      normalizeTimer = window.setTimeout(normalizeLoop, 120);
    });

    function updateDotsForViewport() {
      var closestIndex = Number(getClosestSlide().dataset.voiceIndex);
      renderDots();
      setActive(closestIndex);
    }

    if ("addEventListener" in mobileSliderQuery) {
      mobileSliderQuery.addEventListener("change", updateDotsForViewport);
      threeColumnQuery.addEventListener("change", updateDotsForViewport);
    } else {
      mobileSliderQuery.addListener(updateDotsForViewport);
      threeColumnQuery.addListener(updateDotsForViewport);
    }
  });
})();
