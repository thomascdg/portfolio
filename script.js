const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const revealEls = document.querySelectorAll('[data-reveal]');
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('.form-status');

const motionCanvas = document.querySelector('.bg-motion');

function hexToRgba(hex, alpha) {
  const raw = hex.trim().replace('#', '');
  if (raw.length !== 6) {
    return `rgba(162, 44, 41, ${alpha})`;
  }

  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initInteractiveBackground() {
  if (!(motionCanvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = motionCanvas.getContext('2d');
  if (!context) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  const computed = getComputedStyle(document.documentElement);
  const brand = computed.getPropertyValue('--brand') || '#a22c29';
  const brandDark = computed.getPropertyValue('--brand-dark') || '#6b1917';
  const text = computed.getPropertyValue('--text') || '#17120f';

  const blobs = [];

  let width = 0;
  let height = 0;
  let dpr = 1;

  function createBlobs() {
    const count = width < 700 ? 10 : 18;
    blobs.length = 0;

    for (let i = 0; i < count; i += 1) {
      const radius = Math.min(width, height) * (0.12 + Math.random() * 0.16);
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: radius,
        baseR: radius,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        drift: Math.random() * Math.PI * 2,
        turnRate: (Math.random() - 0.5) * 0.018,
        color: i % 3 === 0 ? brand : i % 3 === 1 ? brandDark : text,
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    motionCanvas.width = Math.floor(width * dpr);
    motionCanvas.height = Math.floor(height * dpr);
    motionCanvas.style.width = `${width}px`;
    motionCanvas.style.height = `${height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createBlobs();
  }

  function draw(timestamp) {
    context.clearRect(0, 0, width, height);

    for (const blob of blobs) {
      blob.drift += blob.turnRate;
      blob.vx += Math.cos(blob.drift) * 0.01;
      blob.vy += Math.sin(blob.drift) * 0.01;

      const speed = Math.hypot(blob.vx, blob.vy);
      const maxSpeed = 1.25;
      if (speed > maxSpeed) {
        blob.vx = (blob.vx / speed) * maxSpeed;
        blob.vy = (blob.vy / speed) * maxSpeed;
      }

      blob.x += blob.vx;
      blob.y += blob.vy;

      if (blob.x < -blob.r) {
        blob.x = width + blob.r;
      } else if (blob.x > width + blob.r) {
        blob.x = -blob.r;
      }

      if (blob.y < -blob.r) {
        blob.y = height + blob.r;
      } else if (blob.y > height + blob.r) {
        blob.y = -blob.r;
      }

      const pulse = 1 + Math.sin(timestamp * 0.001 + blob.drift) * 0.03;
      blob.r = blob.baseR * pulse;

      const gx = blob.x;
      const gy = blob.y;

      const gradient = context.createRadialGradient(gx, gy, blob.r * 0.12, gx, gy, blob.r);
      gradient.addColorStop(0, hexToRgba(blob.color, 0.2));
      gradient.addColorStop(0.55, hexToRgba(blob.color, 0.09));
      gradient.addColorStop(1, hexToRgba(blob.color, 0));

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(gx, gy, blob.r, 0, Math.PI * 2);
      context.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });

  resize();
  requestAnimationFrame(draw);
}

initInteractiveBackground();

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

for (const link of navLinks) {
  link.addEventListener('click', () => {
    nav?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  },
  {
    threshold: 0.15,
  }
);

for (const el of revealEls) {
  observer.observe(el);
}

function setStatus(message, isError = false) {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.style.color = isError ? 'var(--brand-dark)' : 'var(--brand)';
}

async function sendEmail(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!name || !email || !message) {
    setStatus('Merci de remplir tous les champs.', true);
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Envoi...';
  }

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, message }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.details
        ? `${payload.error || 'Envoi impossible'} - ${payload.details}`
        : payload?.error || 'Envoi impossible';
      throw new Error(message);
    }

    form.reset();
    setStatus(payload?.message || 'Message envoyé directement à ma boîte mail.');
  } catch (error) {
    console.error('Email send failed:', error);
    setStatus('Impossible d’envoyer le message pour le moment.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Envoyer';
    }
  }
}

contactForm?.addEventListener('submit', sendEmail);
