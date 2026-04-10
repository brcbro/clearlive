/* ============================================
   ClearLivin — Scroll-Driven Frame Scrubber
   ============================================
   Five video sections, each mapped to 192 frames.
   Scroll drives playback forward; reverse scroll
   drives playback backward — seamlessly across
   all five sections.
   ============================================ */

(() => {
  'use strict';

  // ── Config ─────────────────────────────────
  const SECTIONS = [
    { id: 1, totalFrames: 192 },
    { id: 2, totalFrames: 192 },
    { id: 3, totalFrames: 192 },
    { id: 4, totalFrames: 192 },
    { id: 5, totalFrames: 192 },
  ];

  const FRAME_EXT = 'jpg';
  const FRAME_PATH = (sectionId, frameNum) =>
    `assets/frames/${sectionId}/frame_${String(frameNum).padStart(4, '0')}.${FRAME_EXT}`;

  // Total frames across all sections
  const TOTAL_FRAMES = SECTIONS.reduce((sum, s) => sum + s.totalFrames, 0);

  // ── DOM ────────────────────────────────────
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d');
  const preloader = document.getElementById('preloader');
  const preloaderPercent = document.querySelector('.preloader-percent');
  const progressFill = document.getElementById('progress-fill');
  const dots = document.querySelectorAll('.dot');
  const navbar = document.getElementById('navbar');
  const heroText = document.getElementById('hero-text');
  const wellnessOverlay = document.getElementById('wellness-overlay');
  
  const showcaseOverlay = document.getElementById('showcase-overlay');
  const productCards = document.querySelectorAll('.product-card');
  const detailItems = document.querySelectorAll('.detail-item');
  const partnersOverlay = document.getElementById('partners-overlay');
  const footerOverlay = document.getElementById('footer-overlay');
  const cursorDot     = document.getElementById('cursor-dot');
  const cursorRing    = document.getElementById('cursor-ring');
  const particlesEl   = document.getElementById('particles');
  const preloaderFill = document.getElementById('preloader-fill');
  const statNums      = document.querySelectorAll('.stat-num');

  // ── Navbar Scroll Tracking ─────────────────
  let lastScrollY = 0;
  let navbarHidden = false;
  const SCROLL_THRESHOLD = 8; // dead-zone to prevent flicker

  // ── Stat Counter State ─────────────────────
  let wellnessAnimated = false;

  // ── Showcase Exit State ─────────────────────
  let showcaseActive   = false;
  let showcaseExitTimer = null;

  function animateCounter(el, target, duration) {
    const isDecimal = String(target).includes('.');
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const val = eased * target;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Canvas Size ────────────────────────────
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Image Store ────────────────────────────
  // Flat array: index 0..TOTAL_FRAMES-1
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;

  function globalIndexToLocal(globalIdx) {
    let offset = 0;
    for (const section of SECTIONS) {
      if (globalIdx < offset + section.totalFrames) {
        return {
          sectionId: section.id,
          frameNum: globalIdx - offset + 1, // 1-based
        };
      }
      offset += section.totalFrames;
    }
    // clamp to last frame
    const last = SECTIONS[SECTIONS.length - 1];
    return { sectionId: last.id, frameNum: last.totalFrames };
  }

  // ── Load Images ────────────────────────────
  function loadAllImages() {
    return new Promise((resolve) => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const { sectionId, frameNum } = globalIndexToLocal(i);
        const img = new Image();
        img.src = FRAME_PATH(sectionId, frameNum);
        img.onload = img.onerror = () => {
          loadedCount++;
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          preloaderPercent.textContent = `${pct}%`;
          if (preloaderFill) preloaderFill.style.width = `${pct}%`;
          if (loadedCount === TOTAL_FRAMES) resolve();
        };
        images[i] = img;
      }
    });
  }

  // ── Draw Frame ─────────────────────────────
  let lastDrawn = -1;

  function drawFrame(globalIdx) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, globalIdx));
    if (idx === lastDrawn) return;
    lastDrawn = idx;

    const img = images[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover fit — ceil dimensions to eliminate sub-pixel gaps at edges
    const scale = Math.max(cw / iw, ch / ih);
    const dw = Math.ceil(iw * scale);
    const dh = Math.ceil(ih * scale);
    const dx = Math.floor((cw - dw) / 2);
    const dy = Math.floor((ch - dh) / 2);

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ── Scroll Handler ─────────────────────────
  function getScrollProgress() {
    const scrollTop = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? scrollTop / maxScroll : 0;
  }

  function getCurrentSection(progress) {
    const sectionIdx = Math.min(
      SECTIONS.length - 1,
      Math.floor(progress * SECTIONS.length)
    );
    return sectionIdx;
  }

  function updateDots(sectionIdx) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === sectionIdx);
    });
  }

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const progress = getScrollProgress();
        const globalFrame = Math.round(progress * (TOTAL_FRAMES - 1));
        const sectionIdx = getCurrentSection(progress);

        drawFrame(globalFrame);
        updateDots(sectionIdx);
        progressFill.style.width = `${(progress * 100).toFixed(2)}%`;

        // ── Navbar show/hide ──
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;

        if (currentScrollY <= 50) {
          // Always show at top
          if (navbarHidden) {
            navbar.classList.remove('nav-hidden');
            navbarHidden = false;
          }
        } else if (delta > SCROLL_THRESHOLD && !navbarHidden) {
          // Scrolling down → hide
          navbar.classList.add('nav-hidden');
          navbarHidden = true;
        } else if (delta < -SCROLL_THRESHOLD && navbarHidden) {
          // Scrolling up → show
          navbar.classList.remove('nav-hidden');
          navbarHidden = false;
        }

        lastScrollY = currentScrollY;

        // ── Hero text fade on scroll ──
        // Fade out hero text as user scrolls through section 1
        const sectionProgress = progress * SECTIONS.length; // 0-5
        if (sectionProgress < 0.5) {
          heroText.style.opacity = '1';
          heroText.classList.remove('faded-out');
        } else if (sectionProgress < 1) {
          const fadeProgress = (sectionProgress - 0.5) / 0.5; // 0-1
          heroText.style.opacity = String(1 - fadeProgress);
          heroText.classList.remove('faded-out');
        } else {
          heroText.style.opacity = '0';
          heroText.classList.add('faded-out');
        }
        // ── Wellness overlay show/hide ──
        // Show during ~33%-48% progress (sectionProgress 1.65 to 2.4)
        if (sectionProgress >= 1.65 && sectionProgress <= 2.4) {
          wellnessOverlay.classList.add('active');
          if (!wellnessAnimated) {
            wellnessAnimated = true;
            setTimeout(() => {
              statNums.forEach(el => {
                animateCounter(el, parseFloat(el.dataset.target), 1600);
              });
            }, 550);
          }
        } else {
          wellnessOverlay.classList.remove('active');
          if (sectionProgress < 1.4) wellnessAnimated = false; // reset when scrolled back away
        }

        // ── Showcase background pre-load ──
        // Fade the dark background in gradually before cards appear,
        // so there is never a sudden colour flash from the video canvas.
        if (!showcaseActive && !showcaseOverlay.classList.contains('is-leaving')) {
          if (sectionProgress >= 2.0 && sectionProgress < 2.5) {
            showcaseOverlay.style.opacity = Math.min(1, (sectionProgress - 2.0) / 0.5).toFixed(3);
          } else if (sectionProgress < 2.0) {
            showcaseOverlay.style.opacity = '0';
          }
        }

        // ── Showcase Overlay Sequence ──
        // Appears at 50% progress (sectionProgress 2.5), disappears at 70% (3.0)
        if (sectionProgress >= 2.5 && sectionProgress <= 3.0) {
          if (showcaseExitTimer) { clearTimeout(showcaseExitTimer); showcaseExitTimer = null; }

          // Clear the pre-load inline style so the CSS active class takes over cleanly
          showcaseOverlay.style.opacity = '';

          const wasLeaving = showcaseOverlay.classList.contains('is-leaving');
          showcaseOverlay.classList.remove('is-leaving');

          // Restart entrance animation when first entering OR when reversing mid-exit
          if (!showcaseActive || wasLeaving) {
            showcaseOverlay.classList.remove('active');
            void showcaseOverlay.offsetWidth; // force reflow so keyframes reset
          }

          showcaseOverlay.classList.add('active');
          const isFirstEntry = !showcaseActive || wasLeaving;
          showcaseActive = true;

          // Start all card slideshows on first entry, staggered so they're never in sync
          if (isFirstEntry) {
            expandCards.forEach((c, i) => {
              stopSlideshow(c);
              setTimeout(() => startSlideshow(c), 600 + i * 380);
            });
          }
          
          // Local progress 0 to 1 over the active area
          const localProg = Math.max(0, Math.min(1, (sectionProgress - 2.8) / 1.0));
          
          // Three items, so 3 stages of animation (0-0.33, 0.33-0.66, 0.66-1.0)
          const totalItems = productCards.length;
          
          productCards.forEach((card, i) => {
            const detail = detailItems[i];
            
            // Item activation zones
            const startZone = i * (1/totalItems);
            const endZone = (i+1) * (1/totalItems);
            
            // How far are we through *this* item's dedicated focus time
            let itemProg = 0;
            if (localProg >= startZone) {
               itemProg = Math.min(1, (localProg - startZone) / (1/totalItems));
            }
            
            if (localProg >= startZone && localProg <= endZone) {
              // Item is CURRENTLY active and sliding in
              detail.classList.add('active');
              
              // Slide in from bottom effect
              const yOffset = (1 - Math.min(1, itemProg * 3)) * 100;
              const opacity = Math.min(1, itemProg * 3);
              
              card.style.transform = `translateY(${yOffset}px) scale(1) translateZ(0) rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg))`;
              card.style.opacity = opacity;
              card.style.zIndex = 3;
              
              detail.style.transform = `translateX(${yOffset*0.5}px)`;
              detail.style.opacity = opacity;
              
            } else if (localProg > endZone) {
              // Item is PAST its focus time — fade out in place, no 3D pull-back
              detail.classList.remove('active');

              const pastProg = localProg - endZone;
              const opacity = 1 - (pastProg * 8); // quick fade

              card.style.transform = `translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)`;
              card.style.opacity = Math.max(0, opacity);
              card.style.zIndex = 1;

              detail.style.transform = `translateY(0px)`;
              detail.style.opacity = 0;
              
            } else {
              // Item is in the FUTURE — hide completely 
              detail.classList.remove('active');
              card.style.transform = `translateY(150px) scale(0.9)`;
              card.style.opacity = 0;
              card.style.zIndex = 2;
              
              detail.style.opacity = 0;
            }
          });
          
        } else if (showcaseActive) {
          showcaseActive = false;
          expandCards.forEach(c => stopSlideshow(c)); // halt all slideshows on exit
          if (showcaseExitTimer) { clearTimeout(showcaseExitTimer); showcaseExitTimer = null; }

          if (sectionProgress > 3.0) {
            // Scrolled forward past end — smooth exit animation
            showcaseOverlay.classList.add('is-leaving');
            showcaseExitTimer = setTimeout(() => {
              showcaseOverlay.classList.remove('active', 'is-leaving');
              showcaseExitTimer = null;
            }, 1050);
          } else {
            // Scrolled backward before start — hide immediately, no linger
            showcaseOverlay.style.opacity = '';
            showcaseOverlay.classList.remove('active', 'is-leaving');
            productCards.forEach(card => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(150px) scale(0.9)';
              card.style.zIndex = '';
            });
            detailItems.forEach(detail => {
              detail.style.opacity = '0';
              detail.style.transform = '';
              detail.classList.remove('active');
            });
          }
        }

        // ── Partners Overlay Sequence (60%–86% progress) ──
        if (sectionProgress >= 3.1 && sectionProgress <= 4.3) {
          partnersOverlay.classList.add('active');
        } else {
          partnersOverlay.classList.remove('active');
        }

        // ── Footer Overlay Sequence ──
        if (sectionProgress >= 4.3) {
          footerOverlay.classList.add('active');
          // Slightly dim the video canvas to let the footer pop
          canvas.style.opacity = Math.max(0.2, 1 - ((sectionProgress - 4.3) * 1.5));
        } else {
          footerOverlay.classList.remove('active');
          canvas.style.opacity = '1';
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  // ── Dot Click Navigation ───────────────────
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const sectionIdx = parseInt(dot.dataset.section, 10);
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const targetScroll = (sectionIdx / SECTIONS.length) * maxScroll;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
  });

  // ── 3D Parallax Mouse Tracking ─────────────────
  let mouseX = 0;
  let mouseY = 0;
  const maxTilt = 15; // Max tilt in degrees

  // Lerp targets for smooth 3D rotation
  let targetRotX = 0, targetRotY = 0;
  let smoothRotX = 0, smoothRotY = 0;

  // Cursor ring lerp state
  let cursorRingX = window.innerWidth / 2;
  let cursorRingY = window.innerHeight / 2;
  let cursorTargetX = cursorRingX;
  let cursorTargetY = cursorRingY;

  window.addEventListener('mousemove', (e) => {
    // Normalize mouse position from -1 to 1
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1; // Invert Y

    // Update cursor dot immediately for zero-lag feel
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top  = e.clientY + 'px';
    cursorTargetX = e.clientX;
    cursorTargetY = e.clientY;

    // Set rotation targets — lerp loop applies them smoothly
    targetRotX = mouseY * maxTilt;
    targetRotY = mouseX * maxTilt;

    // Optional subtle parallax on text elements when visible
    if (wellnessOverlay.classList.contains('active')) {
      const wellnessText = document.getElementById('wellness-text');
      if (wellnessText) {
        wellnessText.style.transform = `translate(${mouseX * -15}px, ${mouseY * 15}px)`;
      }
      // Watermark drifts opposite direction at slower speed for depth parallax
      const wmark = document.getElementById('wellness-watermark');
      if (wmark) {
        wmark.style.setProperty('--wm-x', `${mouseX * 9}px`);
        wmark.style.setProperty('--wm-y', `${mouseY * -9}px`);
      }
    }
  });

  // ── Smooth Animation Loop ────────────────────────
  // Handles cursor ring lerp + 3D rotation lerp each frame
  function smoothLoop() {
    // Lerp cursor ring toward actual cursor
    cursorRingX += (cursorTargetX - cursorRingX) * 0.1;
    cursorRingY += (cursorTargetY - cursorRingY) * 0.1;
    cursorRing.style.left = cursorRingX.toFixed(1) + 'px';
    cursorRing.style.top  = cursorRingY.toFixed(1) + 'px';

    // Lerp 3D rotation properties
    smoothRotX += (targetRotX - smoothRotX) * 0.08;
    smoothRotY += (targetRotY - smoothRotY) * 0.08;
    document.body.style.setProperty('--rotX', `${smoothRotX.toFixed(2)}deg`);
    document.body.style.setProperty('--rotY', `${smoothRotY.toFixed(2)}deg`);

    requestAnimationFrame(smoothLoop);
  }
  smoothLoop();

  // ── Cursor Visibility + Hover State ─────────────
  window.addEventListener('mousemove', () => {
    document.body.classList.add('cursor-visible');
  }, { once: true });

  document.querySelectorAll('button, a, .expand-card, .dot, .footer-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // ── Floating Particles ───────────────────────────
  (function initParticles() {
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = (Math.random() * 5 + 2).toFixed(1);
      p.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${(Math.random() * 100).toFixed(1)}%`,
        `bottom:-${size}px`,
        `animation-delay:-${(Math.random() * 15).toFixed(1)}s`,
        `animation-duration:${(Math.random() * 10 + 10).toFixed(1)}s`,
      ].join(';');
      particlesEl.appendChild(p);
    }
  })();

  // ── Magnetic Buttons ─────────────────────────────
  document.querySelectorAll('.detail-btn, .form-submit').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 10;
      btn.style.setProperty('--mag-x', `${x}px`);
      btn.style.setProperty('--mag-y', `${y}px`);
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--mag-x', '0px');
      btn.style.setProperty('--mag-y', '0px');
    });
  });

  // ── Expand Cards — Photos & Slideshow ───────────
  const expandCards = document.querySelectorAll('.expand-card');

  // One folder per card (DOM order: ClearCore, PureFlow, Aura)
  const CARD_IMAGES = [
    // Card 0 — ClearCore (megatron whole-home system)
    [
      'assets/products/megatron/CL_Atlantium_Product_Studio_V01.PNG',
      'assets/products/megatron/CL_Atlantium_Product_Studio_V02.PNG',
      'assets/products/megatron/Atlantium_OscarResidences.JPEG',
      'assets/products/megatron/Atlantium_inside view v3.png',
      'assets/products/megatron/rz163_Deniseedit_april2024.png',
      'assets/products/megatron/RZ163-11 flange v1.png',
    ],
    // Card 1 — PureFlow (shower head)
    [
      'assets/products/shower head/ClearShower_Silver_001.png',
      'assets/products/shower head/ClearShower_Silver_002.png',
      'assets/products/shower head/Bathtub shower head placement.png',
      'assets/products/shower head/Bathtub shower head placement-2.png',
      'assets/products/shower head/Bathtub shower head placement-3.png',
      'assets/products/shower head/nano-banana-2026-01-15T21-55-34.jpg',
      'assets/products/shower head/nano-banana-2026-01-16T01-13-26.jpg',
      'assets/products/shower head/nano-banana-2026-01-16T01-16-03.jpg',
    ],
    // Card 2 — Aura (RO under-sink)
    [
      'assets/products/water ro/Editorial Grid - ClearPurePro RO\u2122 Purification Kiosk.png',
      'assets/products/water ro/Editorial Grid - ClearPurePro RO\u2122 Purification Kiosk-2.png',
      'assets/products/water ro/Editorial Grid - ClearPurePro RO\u2122 Purification Kiosk-3.png',
    ],
  ];

  const slideshowTimers = new Map();
  const slideIndices    = new Map();

  function buildSlides(card, cardIndex) {
    const bg      = card.querySelector('.expand-card-bg');
    const overlay = bg.querySelector('.expand-card-overlay');
    const oldImg  = bg.querySelector('.expand-card-img');
    if (oldImg) oldImg.remove();

    (CARD_IMAGES[cardIndex] || []).forEach((src, j) => {
      const slide = document.createElement('div');
      slide.className = 'card-slide' + (j === 0 ? ' is-active' : '');
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.draggable = false;
      slide.appendChild(img);
      bg.insertBefore(slide, overlay);
    });
  }

  function startSlideshow(card) {
    if (slideshowTimers.has(card)) return;
    const slides = card.querySelectorAll('.card-slide');
    if (slides.length < 2) return;

    let idx = slideIndices.get(card) || 0;
    const tick = () => {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
      slideIndices.set(card, idx);
    };
    slideshowTimers.set(card, setInterval(tick, 2400));
  }

  function stopSlideshow(card) {
    const id = slideshowTimers.get(card);
    if (id !== undefined) { clearInterval(id); slideshowTimers.delete(card); }
  }

  if (expandCards.length) {
    expandCards.forEach((card, i) => buildSlides(card, i));

    expandCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        expandCards.forEach(c => c.classList.remove('is-expanded'));
        card.classList.add('is-expanded');
      });
    });

    const expandRow = document.querySelector('.expand-row');
    if (expandRow) {
      expandRow.addEventListener('mouseleave', () => {
        expandCards.forEach(c => c.classList.remove('is-expanded'));
        expandCards[0].classList.add('is-expanded');
      });
    }
  }

  // ── Click Ripple ─────────────────────────────────
  document.addEventListener('click', (e) => {
    const r = document.createElement('div');
    r.className = 'click-ripple';
    r.style.left = e.clientX + 'px';
    r.style.top  = e.clientY + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });

  // ── Init ───────────────────────────────────
  async function init() {
    await loadAllImages();

    // Hide preloader
    preloader.classList.add('hidden');

    // Draw first frame
    drawFrame(0);

    // Trigger condensation reveal
    setTimeout(() => {
      heroText.classList.add('revealed');
    }, 100);

    // Listen to scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawFrame(lastDrawn);
    });
  }

  init();
})();
