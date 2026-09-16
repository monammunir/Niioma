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
      if (idx === index) {
        if (!slide.classList.contains('slide-active')) {
          slide.classList.add('slide-active');
        } else {
          // Re-trigger animations by briefly removing and adding class with reflow
          slide.classList.remove('slide-active');
          void slide.offsetWidth;
          slide.classList.add('slide-active');
        }

        // Animate counter numbers on Slide 4
        if (slide.classList.contains('slide-how-it-works')) {
          animateCounters(slide);
        }
      } else {
        slide.classList.remove('slide-active');
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

  updateActiveState(0);
}

/* ==========================================================================
   Video Playback Assurance
   ========================================================================== */
function initVideoPlayback() {
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const startVideos = () => {
          videos.forEach(v => v.play().catch(() => {}));
          document.removeEventListener('click', startVideos);
          document.removeEventListener('touchstart', startVideos);
        };
        document.addEventListener('click', startVideos, { once: true });
        document.addEventListener('touchstart', startVideos, { once: true });
      });
    }
  });
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

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
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
  const cards = document.querySelectorAll('.glass-feature-card, .ecosystem-box, .industry-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(800px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
