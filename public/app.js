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
  const footerOverlay = document.getElementById('footer-overlay');

  // ── Navbar Scroll Tracking ─────────────────
  let lastScrollY = 0;
  let navbarHidden = false;
  const SCROLL_THRESHOLD = 8; // dead-zone to prevent flicker

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

    // Cover fit
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
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
        } else {
          wellnessOverlay.classList.remove('active');
        }

        // ── Showcase Overlay Sequence ──
        // Active during section 4 mostly (sectionProgress 2.7 to 3.8)
        if (sectionProgress >= 2.6 && sectionProgress <= 4.1) {
          showcaseOverlay.classList.add('active');
          
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
              // Item is PAST its focus time — scale down and float up as background
              detail.classList.remove('active');
              
              // How far past its zone is it?
              const pastProg = localProg - endZone;
              
              // Float up and back
              const yOffset = -pastProg * 300;
              const scale = 1 - (pastProg * 0.4);
              const opacity = 1 - (pastProg * 8); // Fade out very quickly
              
              card.style.transform = `translateY(${yOffset}px) scale(${scale}) translateZ(-100px) rotateX(0deg) rotateY(0deg)`;
              card.style.opacity = Math.max(0, opacity);
              card.style.zIndex = 1;
              
              detail.style.transform = `translateY(-30px)`;
              detail.style.opacity = 0; // Hide details immediately
              
            } else {
              // Item is in the FUTURE — hide completely 
              detail.classList.remove('active');
              card.style.transform = `translateY(150px) scale(0.9)`;
              card.style.opacity = 0;
              card.style.zIndex = 2;
              
              detail.style.opacity = 0;
            }
          });
          
        } else {
          showcaseOverlay.classList.remove('active');
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

  window.addEventListener('mousemove', (e) => {
    // Normalize mouse position from -1 to 1
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1; // Invert Y
    
    // Apply smooth custom properties to base body for CSS reading
    document.body.style.setProperty('--rotX', `${mouseY * maxTilt}deg`);
    document.body.style.setProperty('--rotY', `${mouseX * maxTilt}deg`);
    
    // Optional subtle parallax on text elements when visible
    if (wellnessOverlay.classList.contains('active')) {
      const wellnessText = document.getElementById('wellness-text');
      if (wellnessText) {
        wellnessText.style.transform = `translate(${mouseX * -15}px, ${mouseY * 15}px)`;
      }
    }
  });

  // ── Init ───────────────────────────────────
  async function init() {
    await loadAllImages();

    // Hide preloader
    preloader.classList.add('hidden');

    // Draw first frame
    drawFrame(0);

    // Trigger condensation reveal after a short dramatic pause
    setTimeout(() => {
      heroText.classList.add('revealed');
    }, 400);

    // Listen to scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawFrame(lastDrawn);
    });
  }

  init();
})();
