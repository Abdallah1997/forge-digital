/* ============================================================
   FORGE DIGITAL — Cinematic Footer
   Requires: GSAP + ScrollTrigger (loaded via CDN in <head>)
   ============================================================ */

(function () {
  'use strict';

  function initCinematicFooter() {
    // Wait for GSAP to be available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(initCinematicFooter, 100);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const curtain   = document.getElementById('cfCurtain');
    const giantText = document.getElementById('cfGiantText');
    const heading   = document.getElementById('cfHeading');
    const pills     = document.getElementById('cfPills');
    const topBtn    = document.getElementById('cfTopBtn');

    if (!curtain) return;

    // ── 1. Giant text parallax reveal ──────────────────────────
    gsap.fromTo(giantText,
      { y: '8vh', scale: 0.85, opacity: 0 },
      {
        y: '0vh', scale: 1, opacity: 1,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: curtain,
          start: 'top 85%',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      }
    );

    // ── 2. Heading + pills staggered reveal ────────────────────
    gsap.fromTo([heading, pills],
      { y: 55, opacity: 0 },
      {
        y: 0, opacity: 1,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: curtain,
          start: 'top 45%',
          end: 'center bottom',
          scrub: 1,
        },
      }
    );

    // ── 3. Aurora pulse on scroll ──────────────────────────────
    const aurora = document.getElementById('cfAurora');
    if (aurora) {
      ScrollTrigger.create({
        trigger: curtain,
        start: 'top 60%',
        onEnter: () => aurora.style.opacity = '1',
        onLeaveBack: () => aurora.style.opacity = '.3',
      });
    }

    // ── 4. Magnetic button effect ──────────────────────────────
    document.querySelectorAll('.cf-magnetic').forEach(el => {
      el.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        gsap.to(this, {
          x: dx * 0.38,
          y: dy * 0.38,
          rotationX: -dy * 0.12,
          rotationY:  dx * 0.12,
          scale: 1.05,
          ease: 'power2.out',
          duration: 0.4,
          transformPerspective: 600,
        });
      });

      el.addEventListener('mouseleave', function () {
        gsap.to(this, {
          x: 0, y: 0,
          rotationX: 0, rotationY: 0,
          scale: 1,
          ease: 'elastic.out(1, 0.35)',
          duration: 1.1,
        });
      });
    });

    // ── 5. Back to top ─────────────────────────────────────────
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ── 6. Duplicate marquee content for seamless loop ─────────
    const marqueeInner = document.querySelector('.cf-marquee-inner');
    if (marqueeInner) {
      const clone = marqueeInner.cloneNode(true);
      marqueeInner.parentElement.appendChild(clone);
    }
  }

  // Run after DOM + GSAP CDN scripts are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCinematicFooter);
  } else {
    initCinematicFooter();
  }
})();
