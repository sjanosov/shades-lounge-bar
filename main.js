document.documentElement.classList.add("has-js");

document.getElementById("year").textContent = new Date().getFullYear();

const toggle = document.querySelector(".nav-toggle");
const navClose = document.querySelector(".nav-close");
const links = document.getElementById("nav-links");

// aria-expanded na hamburgeru je zdroj pravdy i pro CSS — podle něj se
// přepíná hamburger ↔ křížek, takže se musí měnit při každém zavření.
const setNavOpen = (open) => {
  links.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
};

toggle.addEventListener("click", () => {
  setNavOpen(!links.classList.contains("open"));
});

navClose.addEventListener("click", () => {
  setNavOpen(false);
  toggle.focus(); // křížek se skryje, fokus nesmí spadnout na <body>
});

links.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => setNavOpen(false));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && links.classList.contains("open")) {
    setNavOpen(false);
    toggle.focus();
  }
});

/* ==========================================================================
   Fotogalerie — filtr kategorií + lightbox
   Vše je progresivní vylepšení: bez JS zůstanou všechny fotky v DOM
   a odkazy vedou přímo na obrázek.
   ========================================================================== */

const grid = document.getElementById("gallery-grid");

if (grid) {
  const items = Array.from(grid.querySelectorAll(".gallery-item"));
  const chips = Array.from(document.querySelectorAll(".gallery-chip"));
  const emptyNote = document.getElementById("gallery-empty");

  /* ---------- Odkrývání při scrollu ---------- */

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    items.forEach((item, i) => {
      item.style.transitionDelay = (i % 3) * 70 + "ms";
      observer.observe(item);
    });
  } else {
    items.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Filtr kategorií ---------- */

  const applyFilter = (value) => {
    items.forEach((item) => {
      const show = value === "vse" || item.dataset.cat === value;
      item.hidden = !show;
      if (show) item.classList.add("is-visible");
    });

    emptyNote.hidden = items.some((item) => !item.hidden);

    chips.forEach((chip) => {
      const active = chip.dataset.filter === value;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => applyFilter(chip.dataset.filter));
  });

  /* ---------- Lightbox ---------- */

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxCounter = document.getElementById("lightbox-counter");
  const btnClose = lightbox.querySelector(".lightbox-close");
  const btnPrev = lightbox.querySelector("[data-lightbox-prev]");
  const btnNext = lightbox.querySelector("[data-lightbox-next]");

  let slides = [];
  let index = 0;
  let lastFocused = null;

  const showSlide = (i) => {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    const link = slides[index];
    const thumb = link.querySelector("img");

    lightboxImg.src = link.getAttribute("href");
    lightboxImg.alt = thumb.alt;
    lightboxCaption.textContent = thumb.alt;
    lightboxCounter.textContent = index + 1 + " / " + slides.length;

    btnPrev.hidden = slides.length < 2;
    btnNext.hidden = slides.length < 2;
  };

  const openLightbox = (link) => {
    // procházíme jen fotky, které projdou aktuálním filtrem
    slides = items
      .filter((item) => !item.hidden)
      .map((item) => item.querySelector(".gallery-link"));
    lastFocused = document.activeElement;
    showSlide(slides.indexOf(link));
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    btnClose.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    document.body.classList.remove("lightbox-open");
    if (lastFocused) lastFocused.focus();
  };

  items.forEach((item) => {
    const link = item.querySelector(".gallery-link");
    link.addEventListener("click", (e) => {
      // Ctrl/Cmd/prostřední klik nechme prohlížeči — otevře obrázek v nové záložce
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      e.preventDefault();
      openLightbox(link);
    });
  });

  lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });
  btnPrev.addEventListener("click", () => showSlide(index - 1));
  btnNext.addEventListener("click", () => showSlide(index + 1));

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;

    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      showSlide(index - 1);
    } else if (e.key === "ArrowRight") {
      showSlide(index + 1);
    } else if (e.key === "Tab") {
      // fokus drží uvnitř dialogu
      const focusable = Array.from(lightbox.querySelectorAll("button")).filter(
        (b) => !b.hidden,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // swipe na mobilu
  let touchX = null;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true },
  );
  lightbox.addEventListener(
    "touchend",
    (e) => {
      if (touchX === null) return;
      const delta = e.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 50) showSlide(delta < 0 ? index + 1 : index - 1);
      touchX = null;
    },
    { passive: true },
  );
}
