/**
 * NIIOMA — Interactive Horizontal Scroll Engine & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initHorizontalScrollEngine();
  initVideoPlayback();
  initAmbientParticles();
  initModalHandling();
  initMobileMenu();
  initInteractiveDeviceParallax();
  initInteractiveCardsTilt();
});

/* ==========================================================================
   Horizontal Scroll Engine (Mouse Wheel, Top Nav, Keyboard & Touch)
   ========================================================================== */
function initHorizontalScrollEngine() {
  const container = document.getElementById('horizontalContainer');
  const slides = document.querySelectorAll('.horizontal-slide');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const scrollCue = document.getElementById('scrollCue');

  if (!container || !slides.length) return;

  let currentSlide = 0;
  const totalSlides = slides.length;
  let scrollTimeout = null;

  function scrollToSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;
    currentSlide = index;

    const targetSlide = slides[index];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    updateActiveState(currentSlide);
  }

  function updateActiveState(index) {
    // Update Top Nav Links active state
    navLinks.forEach((link, idx) => {
      link.classList.toggle('active', idx === index);
    });

    // Update Slide Active state to trigger entry animations
    slides.forEach((slide, idx) => {
      const slideVideos = slide.querySelectorAll('video');
      if (idx === index) {
        if (!slide.classList.contains('slide-active')) {
          slide.classList.add('slide-active');
        } else {
          // Re-trigger animations by briefly removing and adding class with reflow
          slide.classList.remove('slide-active');
          void slide.offsetWidth;
          slide.classList.add('slide-active');
        }

        // Play active slide videos at high speed (1.45x)
        slideVideos.forEach((v) => {
          if (v.preload === 'none') v.preload = 'auto';
          v.playbackRate = 1.45;
          if (v.paused) v.play().catch(() => {});
        });

        // Warm up adjacent next slide video in the background during idle time
        const nextSlide = slides[idx + 1];
        if (nextSlide) {
          nextSlide.querySelectorAll('video').forEach(nv => {
            if (nv.preload === 'none') nv.preload = 'auto';
          });
        }

        // Animate counter numbers on Slide 4
        if (slide.classList.contains('slide-how-it-works')) {
          animateCounters(slide);
        }
      } else {
        slide.classList.remove('slide-active');

        // Pause distant videos (more than 1 slide away) to release GPU decoding load
        if (Math.abs(idx - index) > 1) {
          slideVideos.forEach((v) => {
            if (!v.paused) v.pause();
          });
        }
      }
    });
  }

  function animateCounters(slide) {
    const vals = slide.querySelectorAll('.metric-val[data-target]');
    vals.forEach(val => {
      const target = parseInt(val.getAttribute('data-target'), 10);
      const suffix = val.getAttribute('data-suffix') || '';
      const duration = 1200;
      const startTime = performance.now();

      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(ease * target);
        val.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        }
      }
      requestAnimationFrame(updateNumber);
    });
  }

  // --- Wheel Event Interception for Seamless Horizontal Translation ---
  let lastWheelTime = 0;

  window.addEventListener('wheel', (e) => {
    // Allow standard scrolling inside modal when open
    const modal = document.getElementById('registerModal');
    if (modal && modal.classList.contains('active')) return;

    // Normalize vertical & horizontal wheel deltas
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const now = Date.now();

    // Prevent default vertical jump
    e.preventDefault();

    // Cooldown throttle (550ms) to ensure smooth slide-by-slide transitions
    if (now - lastWheelTime > 550) {
      if (delta > 20) {
        if (currentSlide < totalSlides - 1) {
          scrollToSlide(currentSlide + 1);
          lastWheelTime = now;
        }
      } else if (delta < -20) {
        if (currentSlide > 0) {
          scrollToSlide(currentSlide - 1);
          lastWheelTime = now;
        }
      }
    }
  }, { passive: false });

  // --- Keyboard Arrows Navigation ---
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('registerModal');
    if (modal && modal.classList.contains('active')) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentSlide < totalSlides - 1) scrollToSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentSlide > 0) scrollToSlide(currentSlide - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToSlide(totalSlides - 1);
    }
  });

  // --- Top Navbar Links Click ---
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(link.getAttribute('data-slide'), 10);
      if (!isNaN(idx)) scrollToSlide(idx);
    });
  });

  // --- Mobile Dropdown Links Click ---
  mobileLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(link.getAttribute('data-slide'), 10);
      if (!isNaN(idx)) scrollToSlide(idx);
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.classList.remove('open');
    });
  });

  // --- Brand Logo click returns to Slide 0 ---
  const brandLogo = document.querySelector('.nav-brand');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSlide(0);
    });
  }

  // --- Scroll Cue in Hero ---
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      scrollToSlide(1);
    });
  }

  // --- Sync on Native Scroll / Touch Swipe ---
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = container.scrollLeft;
      const slideWidth = window.innerWidth;
      const index = Math.round(scrollLeft / slideWidth);
      if (index !== currentSlide && index >= 0 && index < totalSlides) {
        currentSlide = index;
        updateActiveState(currentSlide);
      }
    }, 50);
  }, { passive: true });

  // --- Dedicated Mobile Touch Swipe Gesture Detection ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  window.addEventListener('touchstart', (e) => {
    const modal = document.getElementById('registerModal');
    if (modal && modal.classList.contains('active')) return;
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    const modal = document.getElementById('registerModal');
    if (modal && modal.classList.contains('active')) return;
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const elapsedTime = Date.now() - touchStartTime;

      // Only trigger if horizontal swipe is dominant and fast
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && elapsedTime < 450) {
        if (deltaX < 0 && currentSlide < totalSlides - 1) {
          scrollToSlide(currentSlide + 1);
        } else if (deltaX > 0 && currentSlide > 0) {
          scrollToSlide(currentSlide - 1);
        }
      }
    }
  }, { passive: true });

  updateActiveState(0);
}

/* ==========================================================================
   Video Playback Assurance & High-Speed Fluidity Engine
   ========================================================================== */
function initVideoPlayback() {
  const allVideos = document.querySelectorAll('video');
  const SPEED_MULTIPLIER = 1.45;

  // Configure high playback rate and mute on all videos
  allVideos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.playbackRate = SPEED_MULTIPLIER;

    video.addEventListener('play', () => {
      video.playbackRate = SPEED_MULTIPLIER;
    });
    video.addEventListener('loadedmetadata', () => {
      video.playbackRate = SPEED_MULTIPLIER;
    });
  });

  // ONLY start Hero video on initial load (avoids 5 concurrent video decoders!)
  const heroSlide = document.getElementById('slide-hero');
  if (heroSlide) {
    const heroVideos = heroSlide.querySelectorAll('video');
    heroVideos.forEach((v) => {
      v.playbackRate = SPEED_MULTIPLIER;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlockHero = () => {
            v.playbackRate = SPEED_MULTIPLIER;
            v.play().catch(() => {});
            document.removeEventListener('click', unlockHero);
            document.removeEventListener('touchstart', unlockHero);
          };
          document.addEventListener('click', unlockHero, { once: true });
          document.addEventListener('touchstart', unlockHero, { once: true });
        });
      }
    });
  }

  // Preload next slide in background during browser idle time
  const warmupNext = () => {
    const slideAbout = document.getElementById('slide-about');
    if (slideAbout) {
      slideAbout.querySelectorAll('video').forEach((v) => {
        if (v.preload === 'none') v.preload = 'auto';
      });
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => setTimeout(warmupNext, 400));
  } else {
    setTimeout(warmupNext, 600);
  }
}

/* ==========================================================================
   Ambient Space Particle Dust Canvas
   ========================================================================== */
function initAmbientParticles() {
  const canvas = document.getElementById('ambient-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 40;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 0.4;
      this.speedX = (Math.random() - 0.5) * 0.22;
      this.speedY = (Math.random() - 0.5) * 0.22;
      this.opacity = Math.random() * 0.5 + 0.2;
      this.pulseSpeed = Math.random() * 0.015 + 0.005;
      this.pulseDir = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.reset();
      }

      this.opacity += this.pulseSpeed * this.pulseDir;
      if (this.opacity > 0.75) this.pulseDir = -1;
      else if (this.opacity < 0.15) this.pulseDir = 1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186, 230, 253, ${this.opacity})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   Modal Handling
   ========================================================================== */
function initModalHandling() {
  const modal = document.getElementById('registerModal');
  const openButtons = document.querySelectorAll('.open-modal-btn');
  const closeBtn = document.getElementById('modalCloseBtn');
  const registerForm = document.getElementById('registerForm');
  const successMsg = document.getElementById('formSuccessMessage');

  function openModal() {
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      if (successMsg) successMsg.classList.add('hidden');
      if (registerForm) registerForm.reset();
    }
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('.modal-submit-btn');
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Registering...</span>';
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.style.display = 'none';
        }
        if (successMsg) {
          successMsg.classList.remove('hidden');
        }
        setTimeout(() => {
          closeModal();
          if (submitBtn) {
            submitBtn.style.display = 'block';
            submitBtn.innerHTML = '<span>Join the Ecosystem</span>';
            submitBtn.disabled = false;
          }
        }, 2200);
      }, 700);
    });
  }
}

/* ==========================================================================
   Mobile Menu Toggle
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}

/* ==========================================================================
   3D Device & Cards Mouse Parallax Interactive Effects
   ========================================================================== */
function initInteractiveDeviceParallax() {
  const slideAbout = document.getElementById('slide-about');
  const card = document.querySelector('.tablet-mockup-card');
  if (!slideAbout || !card) return;

  let rafId = null;

  slideAbout.addEventListener('mousemove', (e) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rect = slideAbout.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotY = -6 + x * 18;
      const rotX = 2 - y * 14;

      card.style.transform = `perspective(1200px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) translateY(${(-y * 12).toFixed(1)}px)`;
    });
  });

  slideAbout.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    card.style.transform = '';
  });
}

function initInteractiveCardsTilt() {
  const cards = document.querySelectorAll('.glass-feature-card, .ecosystem-box, .industry-card, .principle-node');
  cards.forEach(card => {
    let rafId = null;

    card.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const x = (px / rect.width) - 0.5;
        const y = (py / rect.height) - 0.5;

        // Set dynamic spotlight CSS custom properties
        card.style.setProperty('--mouse-x', `${px.toFixed(1)}px`);
        card.style.setProperty('--mouse-y', `${py.toFixed(1)}px`);
        card.style.setProperty('--mouse-x-pct', `${((px / rect.width) * 100).toFixed(1)}%`);
        card.style.setProperty('--mouse-y-pct', `${((py / rect.height) * 100).toFixed(1)}%`);

        if (card.classList.contains('principle-node')) {
          card.style.transform = 'translateX(8px)';
        } else {
          card.style.transform = `translateY(-8px) perspective(900px) rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg) scale(1.025)`;
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.style.transform = '';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
      card.style.removeProperty('--mouse-x-pct');
      card.style.removeProperty('--mouse-y-pct');
    });
  });
}
