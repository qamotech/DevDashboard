(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer:fine)');
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  };

  function boot() {
    const toast = document.createElement('div');
    toast.className = 'lmi-toast'; toast.id = 'lmi-toast'; toast.role = 'status'; toast.ariaLive = 'polite';
    document.body.append(toast);
    const notify = message => { toast.textContent = message; toast.classList.add('lmi-show'); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('lmi-show'), 2300); };

    // Responsive ambient lighting and compact navigation.
    const header = $('header');
    const updateHeader = () => header?.classList.toggle('lmi-compact', scrollY > 42);
    addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
    addEventListener('pointermove', event => {
      document.documentElement.style.setProperty('--lmi-pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--lmi-pointer-y', `${event.clientY + scrollY}px`);
    }, { passive: true });

    // High-density, visibility-aware hero particle canvas.
    const hero = $('.hero-banner');
    if (hero) {
      const canvas = document.createElement('canvas'); canvas.id = 'lmi-hero-canvas'; canvas.ariaHidden = 'true'; hero.prepend(canvas);
      const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      let width = 0, height = 0, dpr = 1, visible = true, raf = 0;
      const nodes = Array.from({ length: 64 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.6, v: .000035 + Math.random() * .00008, phase: i * 1.7 }));
      const resize = () => { const rect = hero.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); width = Math.max(1, rect.width); height = Math.max(1, rect.height); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      new ResizeObserver(resize).observe(hero); resize();
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible && !raf) draw(performance.now()); }, { rootMargin: '120px' }).observe(hero);
      const draw = time => {
        raf = 0; if (!visible || document.hidden) return;
        ctx.clearRect(0, 0, width, height);
        const glow = ctx.createRadialGradient(width * .5, height * .43, 5, width * .5, height * .43, width * .42);
        glow.addColorStop(0, 'rgba(236,72,153,.12)'); glow.addColorStop(1, 'rgba(168,85,247,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = .75; ctx.strokeStyle = 'rgba(225,190,255,.13)';
        for (let i = 0; i < 7; i++) { const x = width * (.18 + i * .105); ctx.beginPath(); ctx.moveTo(x, height * .1); ctx.bezierCurveTo(x - 45, height * .34, x + 50, height * .62, x - 15, height * .92); ctx.stroke(); }
        for (const node of nodes) {
          const drift = reduceMotion.matches ? 0 : time * node.v;
          const x = ((node.x + drift) % 1) * width, y = (node.y + Math.sin(time * .00035 + node.phase) * .018) * height;
          ctx.beginPath(); ctx.fillStyle = `rgba(255,${145 + (node.phase % 90)},230,.${.25 + node.r / 4})`; ctx.arc(x, y, node.r, 0, Math.PI * 2); ctx.fill();
        }
        if (!reduceMotion.matches) raf = requestAnimationFrame(draw);
      };
      document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) draw(performance.now()); });
      draw(performance.now());
    }

    // Staggered reveal choreography without changing document flow.
    const revealTargets = $$('.feature-card,.dashboard-grid>.card-panel,#gallery,.all-reviews,.lmi-lab,.lmi-tool');
    revealTargets.forEach((element, index) => { element.classList.add('lmi-reveal'); element.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`; });
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('lmi-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
      revealTargets.forEach(element => revealObserver.observe(element));
    } else revealTargets.forEach(element => element.classList.add('lmi-visible'));

    // Card lighting and restrained 3D response.
    if (finePointer.matches && !reduceMotion.matches) {
      $$('.feature-card,.card-panel,.lmi-tool').forEach(card => {
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
          card.style.setProperty('--lmi-card-x', `${x}px`); card.style.setProperty('--lmi-card-y', `${y}px`);
          const rx = ((y / rect.height) - .5) * -1.8, ry = ((x / rect.width) - .5) * 1.8;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      });
      $$('.btn-premium,.mini-action,.style-action').forEach(button => {
        button.addEventListener('pointermove', event => { const rect = button.getBoundingClientRect(); button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .07}px,${(event.clientY - rect.top - rect.height / 2) * .1}px)`; });
        button.addEventListener('pointerleave', () => { button.style.transform = ''; });
      });
    }

    // Tactile click ripples.
    $$('.btn-premium,.mini-action,.style-action,.lmi-tool button,.lmi-chip').forEach(button => button.addEventListener('pointerdown', event => {
      const rect = button.getBoundingClientRect(), ripple = document.createElement('i'); ripple.className = 'lmi-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`; ripple.style.top = `${event.clientY - rect.top}px`; button.append(ripple); ripple.addEventListener('animationend', () => ripple.remove());
    }));

    // Animated social-proof numbers.
    const countTo = (element, target, decimals = 0) => {
      if (!element || reduceMotion.matches) return;
      const start = performance.now(), duration = 900;
      const tick = now => { const p = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - p, 3); element.textContent = (target * eased).toFixed(decimals); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    countTo($('.review-score'), 5, 1);

    // Gallery performance, search, category filters, and persistent favorites.
    const gallery = $('#gallery'), galleryBlock = gallery?.querySelector('.gallery-block');
    const cards = galleryBlock ? $$('.gallery-card', galleryBlock) : [];
    const favoritesKey = 'loc-me-in-lookbook-favorites-v1';
    let favorites = new Set(store.get(favoritesKey, []));
    let activeFilter = 'all';
    const classify = title => /twist/i.test(title) ? 'twists' : /barrel|cross|braid/i.test(title) ? 'braids' : /bun|updo/i.test(title) ? 'updos' : 'details';
    const titleOf = (card, index) => card.querySelector('.gallery-title')?.textContent.trim() || `Portfolio look ${index + 1}`;
    cards.forEach((card, index) => {
      const image = card.querySelector('img'), title = titleOf(card, index); card.dataset.category = classify(title); card.dataset.look = title.toLowerCase();
      if (image) { if (index > 1) image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false; }
      const favorite = document.createElement('button'); favorite.type = 'button'; favorite.className = 'lmi-favorite'; favorite.innerHTML = '♥'; favorite.setAttribute('aria-label', `Save ${title} to favorites`); favorite.setAttribute('aria-pressed', favorites.has(title));
      favorite.addEventListener('click', event => { event.stopPropagation(); favorites.has(title) ? favorites.delete(title) : favorites.add(title); favorite.setAttribute('aria-pressed', favorites.has(title)); store.set(favoritesKey, [...favorites]); updateFavoriteFeature(); window.__lmiApplyGallery?.(); notify(favorites.has(title) ? `${title} saved to your lookbook.` : `${title} removed from your lookbook.`); });
      card.append(favorite);
    });
    if (galleryBlock) {
      const tools = document.createElement('div'); tools.className = 'lmi-gallery-tools'; tools.setAttribute('aria-label', 'Filter portfolio');
      tools.innerHTML = `<input class="lmi-gallery-search" id="lmi-gallery-search" type="search" placeholder="Search the lookbook…" aria-label="Search portfolio styles"><button class="lmi-chip" type="button" data-gallery-filter="all" aria-pressed="true">All</button><button class="lmi-chip" type="button" data-gallery-filter="twists" aria-pressed="false">Twists</button><button class="lmi-chip" type="button" data-gallery-filter="braids" aria-pressed="false">Braids</button><button class="lmi-chip" type="button" data-gallery-filter="updos" aria-pressed="false">Updos</button><button class="lmi-chip" type="button" data-gallery-filter="favorites" aria-pressed="false">♥ Favorites</button>`;
      galleryBlock.before(tools);
      const search = $('#lmi-gallery-search');
      const applyGallery = window.__lmiApplyGallery = () => { const query = search.value.trim().toLowerCase(); let visibleCount = 0; cards.forEach((card, index) => { const title = titleOf(card, index); const filterMatch = activeFilter === 'all' || (activeFilter === 'favorites' ? favorites.has(title) : card.dataset.category === activeFilter); const visible = filterMatch && (!query || card.dataset.look.includes(query)); card.hidden = !visible; if (visible) visibleCount++; }); tools.dataset.results = String(visibleCount); };
      tools.addEventListener('click', event => { const chip = event.target.closest('[data-gallery-filter]'); if (!chip) return; activeFilter = chip.dataset.galleryFilter; $$('.lmi-chip', tools).forEach(item => item.setAttribute('aria-pressed', item === chip)); applyGallery(); });
      search.addEventListener('input', applyGallery);
    }

    // Lightbox previous/next navigation and focus return.
    const lightbox = $('#lightbox'), lightboxImage = $('#lightbox-img'); let lightboxIndex = 0, lightboxReturn = null;
    if (lightbox && lightboxImage && cards.length) {
      const previous = document.createElement('button'), next = document.createElement('button');
      previous.id = 'lmi-lightbox-prev'; next.id = 'lmi-lightbox-next'; previous.className = next.className = 'lmi-lightbox-nav'; previous.type = next.type = 'button'; previous.textContent = '‹'; next.textContent = '›'; previous.ariaLabel = 'Previous portfolio image'; next.ariaLabel = 'Next portfolio image'; lightbox.append(previous, next);
      const showAt = delta => { const visibleCards = cards.filter(card => !card.hidden); if (!visibleCards.length) return; const current = visibleCards.indexOf(cards[lightboxIndex]); const pos = (Math.max(0, current) + delta + visibleCards.length) % visibleCards.length; const card = visibleCards[pos], image = card.querySelector('img'); lightboxIndex = cards.indexOf(card); lightboxImage.src = image.src; lightboxImage.alt = image.alt; $('#lightbox-caption').textContent = titleOf(card, lightboxIndex); };
      cards.forEach((card, index) => card.addEventListener('click', () => { lightboxIndex = index; lightboxReturn = card; }));
      previous.addEventListener('click', event => { event.stopPropagation(); showAt(-1); }); next.addEventListener('click', event => { event.stopPropagation(); showAt(1); });
      document.addEventListener('keydown', event => { if (!lightbox.classList.contains('open')) return; if (event.key === 'ArrowLeft') showAt(-1); if (event.key === 'ArrowRight') showAt(1); if (event.key === 'Escape' && lightboxReturn) setTimeout(() => lightboxReturn.focus(), 0); });
    }

    // Feature 1 — Style Concierge.
    const conciergeButton = $('#lmi-concierge-run');
    conciergeButton?.addEventListener('click', () => {
      const occasion = $('#lmi-occasion').value, priority = $('#lmi-priority').value, windowChoice = $('#lmi-time-window').value;
      const matches = {
        everyday: priority === 'longevity' ? 'Two-Strand Twist Flow' : 'Classic Updo Bun',
        event: priority === 'statement' ? 'Criss-Cross Barrel Braids' : 'Sleek Double French Braids',
        protective: 'Two-Strand Twist Flow',
        refresh: 'Retwist Only (≤100 Locs)'
      };
      const recommendation = matches[occasion];
      $('#lmi-concierge-output').textContent = `${recommendation} is your strongest match for a ${windowChoice} window, prioritizing ${priority}. Use this as your consultation starting point.`;
      const profile = $('#profile-select'); if (profile && [...profile.options].some(option => option.text === recommendation)) { profile.value = recommendation; profile.dispatchEvent(new Event('change')); }
      notify('Your personalized style match is ready.');
    });

    // Feature 2 — Budget Navigator.
    const budget = $('#lmi-budget'), budgetValue = $('#lmi-budget-value'), budgetOutput = $('#lmi-budget-output');
    const services = [
      [50, 'Deluxe Loc Shampoo'], [100, 'Retwist Only'], [125, 'Two-Strand Twist or Barrel styling'], [150, 'Premium long-tier styling'], [200, 'High-density style with accents']
    ];
    const updateBudget = () => { const amount = Number(budget?.value || 125); if (budgetValue) budgetValue.textContent = `$${amount}`; const available = services.filter(([price]) => price <= amount); const best = available.at(-1) || services[0]; if (budgetOutput) budgetOutput.textContent = `Around $${amount}, start with ${best[1]}. Final price depends on loc count, length, and accessories.`; };
    budget?.addEventListener('input', updateBudget); updateBudget();

    // Feature 3 — Maintenance Timeline.
    const visitDate = $('#lmi-last-visit'); if (visitDate && !visitDate.value) visitDate.valueAsDate = new Date();
    $('#lmi-timeline-run')?.addEventListener('click', () => {
      const date = new Date(`${visitDate.value}T12:00:00`), cadence = Number($('#lmi-cadence').value);
      if (Number.isNaN(date.getTime())) { $('#lmi-timeline-output').textContent = 'Choose your most recent maintenance date first.'; return; }
      const start = new Date(date), end = new Date(date); start.setDate(start.getDate() + cadence - 7); end.setDate(end.getDate() + cadence + 7);
      $('#lmi-timeline-output').textContent = `Your next planning window is ${start.toLocaleDateString(undefined,{month:'short',day:'numeric'})}–${end.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}. Adjust with your stylist if your scalp or roots need attention sooner.`;
      notify('Maintenance window calculated.');
    });

    // Feature 4 — Accent Color Studio.
    $$('.lmi-swatch').forEach(swatch => swatch.addEventListener('click', () => {
      $$('.lmi-swatch').forEach(item => item.setAttribute('aria-pressed', item === swatch));
      $('#lmi-strands').style.setProperty('--lmi-hair-color', swatch.dataset.color); $('#lmi-color-output').textContent = `${swatch.dataset.name} selected. Pair it with ${swatch.dataset.tip}.`;
      store.set('loc-me-in-accent-color', swatch.dataset.name); notify(`${swatch.dataset.name} added to your visual direction.`);
    }));
    const savedColor = store.get('loc-me-in-accent-color', 'Honey Gold'), savedSwatch = $$('.lmi-swatch').find(item => item.dataset.name === savedColor) || $('.lmi-swatch');
    if (savedSwatch) { $$('.lmi-swatch').forEach(item => item.setAttribute('aria-pressed', item === savedSwatch)); $('#lmi-strands').style.setProperty('--lmi-hair-color', savedSwatch.dataset.color); $('#lmi-color-output').textContent = `${savedSwatch.dataset.name} selected. Pair it with ${savedSwatch.dataset.tip}.`; }

    // Feature 5 — Persistent Lookbook Favorites.
    function updateFavoriteFeature() { const count = $('#lmi-favorites-count'); if (count) count.textContent = `${favorites.size} saved look${favorites.size === 1 ? '' : 's'}`; }
    $('#lmi-open-favorites')?.addEventListener('click', () => { activeFilter = 'favorites'; const favoritesChip = $('[data-gallery-filter="favorites"]'); $$('.lmi-chip').forEach(item => item.setAttribute('aria-pressed', item === favoritesChip)); window.__lmiApplyGallery?.(); gallery?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' }); });
    $('#lmi-clear-favorites')?.addEventListener('click', () => { favorites.clear(); store.set(favoritesKey, []); $$('.lmi-favorite').forEach(button => button.setAttribute('aria-pressed', 'false')); updateFavoriteFeature(); window.__lmiApplyGallery?.(); notify('Lookbook favorites cleared.'); });
    updateFavoriteFeature();

    // Feature 6 — Appointment Kit with copy and calendar file.
    const appointmentData = () => {
      const dateLabel = $('.calendar-cell.selected')?.dataset.date || new Date().toLocaleDateString();
      const timeLabel = $('.time-box.selected')?.textContent.trim() || '09:00 AM';
      const profile = $('#profile-select')?.value || 'Loc consultation', estimate = $('#estimate-price')?.textContent || 'final quote in consultation';
      const parsed = new Date(`${dateLabel} ${timeLabel}`); return { dateLabel, timeLabel, profile, estimate, parsed };
    };
    const kitText = () => { const data = appointmentData(); return `Loc Me In appointment request: ${data.dateLabel} at ${data.timeLabel}; ${data.profile}; estimated ${data.estimate}. Please confirm final availability and service details.`; };
    const copyText = async text => { try { await navigator.clipboard.writeText(text); } catch { const field = document.createElement('textarea'); field.value = text; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select(); document.execCommand('copy'); field.remove(); } };
    $('#lmi-kit-copy')?.addEventListener('click', async () => { await copyText(kitText()); $('#lmi-kit-output').textContent = kitText(); notify('Appointment kit copied.'); });
    $('#lmi-kit-calendar')?.addEventListener('click', () => {
      const data = appointmentData(); if (Number.isNaN(data.parsed.getTime())) { $('#lmi-kit-output').textContent = 'Select a calendar date and time first.'; return; }
      const stamp = date => `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}00`;
      const end = new Date(data.parsed.getTime() + 3 * 60 * 60 * 1000), escape = value => value.replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
      const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Loc Me In//Appointment Kit//EN\r\nBEGIN:VEVENT\r\nUID:${Date.now()}@locmein\r\nDTSTAMP:${stamp(new Date()) }\r\nDTSTART:${stamp(data.parsed)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escape(`Loc Me In — ${data.profile}`)}\r\nLOCATION:1928 Pulaski Hwy\\, Suite 5\\, Edgewood\\, MD 21040\r\nDESCRIPTION:${escape('Appointment request — final confirmation required. ' + kitText())}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); link.download = 'loc-me-in-appointment-request.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); $('#lmi-kit-output').textContent = 'Calendar hold downloaded. Your appointment is not final until Loc Me In confirms it.'; notify('Calendar hold downloaded.');
    });
    $('#lmi-kit-review')?.addEventListener('click', () => { $('#booking')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' }); });

    // Keep the appointment kit current when the existing planner changes.
    $('#booking')?.addEventListener('click', () => { const out = $('#lmi-kit-output'); if (out && out.textContent) out.textContent = kitText(); });
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
