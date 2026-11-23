// Application State
let appState = {
  config: {},
  profiles: [],
  inquiries: [],
  media: [],
  currentAdminTab: 'inbox',
  currentImagePickerTarget: null,
  currentUser: null,
  tempGoogleUser: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  await Promise.all([
    fetchConfig(),
    fetchProfiles(),
    fetchInquiries()
  ]);
});

// -------------------------------------------------------------
// 1. CONFIG & COMPLETE DYNAMIC RENDERING
// -------------------------------------------------------------
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    appState.config = cfg;

    renderAllConfig(cfg);
    populateTextEditorForm(cfg);
  } catch (err) {
    console.error('Error fetching config:', err);
  }
}

function renderAllConfig(cfg) {
  if (!cfg) return;

  // Header
  const header = cfg.header || {};
  if (header.title) {
    document.title = header.title;
    safeSetText('nav-title', header.title);
    safeSetHTML('nav-title-mobile', header.title.replace(' ', '<br/>'));
  }
  if (header.subtitle) safeSetText('nav-subtitle', header.subtitle);
  if (header.logoUrl) {
    safeSetAttr('nav-logo-img', 'src', header.logoUrl);
    safeSetAttr('nav-logo-mobile', 'src', header.logoUrl);
  }
  if (header.ctaText) {
    const navBtn = document.getElementById('nav-cta-btn');
    if (navBtn) {
      const cta = header.ctaText.trim();
      const parts = cta.split(' ');
      if (parts.length > 1) {
        navBtn.innerHTML = `${parts[0]} <span class="font-bold tracking-[0.08em] uppercase">${parts.slice(1).join(' ')}</span>`;
      } else {
        navBtn.innerHTML = `<span class="font-bold tracking-[0.08em] uppercase">${cta}</span>`;
      }
    }
  }

  // Hero
  const hero = cfg.hero || {};
  if (hero.tag) safeSetText('hero-tag', hero.tag);
  if (hero.heading) safeSetHTML('hero-heading', hero.heading);
  if (hero.subtext) safeSetText('hero-subtext', hero.subtext);
  if (hero.bgImage) safeSetAttr('hero-img', 'src', hero.bgImage);
  if (hero.ctaButton) safeSetText('hero-cta-button', hero.ctaButton);
  if (hero.ctaLink) {
    const linkEl = document.getElementById('hero-cta-link');
    if (linkEl) linkEl.innerHTML = `<span>${hero.ctaLink}</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;
  }
  if (Array.isArray(hero.pills) && hero.pills.length > 0) {
    const pillsUl = document.getElementById('hero-pills');
    if (pillsUl) {
      const pillColors = ['bg-[#f6b7cf]', 'bg-[#f2c14e]', 'bg-[#5cc2b6]', 'bg-[#b3b4ea]'];
      pillsUl.innerHTML = hero.pills.map((pill, idx) => `
        <li class="text-ink rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase ${pillColors[idx % pillColors.length]} shadow-sm">
          ${pill}
        </li>
      `).join('');
    }
  }

  // Section 01: Letra
  const letra = cfg.letra || {};
  if (letra.tag) safeSetText('letra-tag', letra.tag);
  if (letra.title) {
    const highlight = letra.highlight || 'Pse krijohet';
    const cleanTitle = letra.title.replace(highlight, `<span class="text-red">${highlight}</span>`);
    safeSetHTML('letra-heading', cleanTitle);
  }
  if (letra.bgImage) safeSetAttr('letra-bg-img', 'src', letra.bgImage);
  if (letra.paragraph1) safeSetText('letra-p1', letra.paragraph1);
  if (letra.paragraph2) safeSetText('letra-p2', letra.paragraph2);
  if (letra.quote) safeSetText('letra-quote', letra.quote);
  if (letra.buttonText) {
    const btn = document.getElementById('letra-btn');
    if (btn) btn.innerHTML = `${letra.buttonText} <i class="fa-solid fa-arrow-right text-xs"></i>`;
  }

  // Section 02: Koncepti
  const koncepti = cfg.koncepti || {};
  if (koncepti.tag) safeSetText('koncepti-tag', koncepti.tag);
  if (koncepti.title) {
    const highlight = koncepti.highlight || 'te përgjigja';
    const cleanTitle = koncepti.title.replace(highlight, `<span class="text-red">${highlight}</span>`);
    safeSetHTML('koncepti-heading', cleanTitle);
  }
  if (koncepti.image) safeSetAttr('koncepti-img', 'src', koncepti.image);
  if (koncepti.quote) safeSetText('koncepti-quote', koncepti.quote);
  if (Array.isArray(koncepti.paragraphs)) {
    const pContainer = document.getElementById('koncepti-paragraphs');
    if (pContainer) {
      pContainer.innerHTML = koncepti.paragraphs.map(p => `<p>${p}</p>`).join('');
    }
  }

  // Section 03: Temat
  const temat = cfg.temat || {};
  if (temat.tag) safeSetText('temat-tag', temat.tag);
  if (temat.title) {
    const highlight = temat.highlight || 'të diskutojmë?';
    const cleanTitle = temat.title.replace(highlight, `<span class="text-red">${highlight}</span>`);
    safeSetHTML('temat-heading', cleanTitle);
  }
  if (temat.image) safeSetAttr('temat-img', 'src', temat.image);
  if (temat.subtitle) safeSetText('temat-subtitle', temat.subtitle);
  if (temat.description) safeSetHTML('temat-desc', `<p>${temat.description}</p>`);
  if (temat.buttonText) {
    const btn = document.getElementById('temat-btn');
    if (btn) btn.innerHTML = `${temat.buttonText} <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>`;
  }

  // Section 04: Garancitë (6 cards)
  const garancite = cfg.garancite || {};
  if (garancite.tag) safeSetText('garancite-tag', garancite.tag);
  if (garancite.title) safeSetText('garancite-heading', garancite.title);
  if (garancite.bgImage) safeSetAttr('garancite-bg-img', 'src', garancite.bgImage);
  if (Array.isArray(garancite.cards)) {
    const grid = document.getElementById('garancite-grid');
    if (grid) {
      grid.innerHTML = garancite.cards.map(c => `
        <li class="flex min-h-56 flex-col gap-4 rounded-lg p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8" style="background-color: ${c.color || '#8d8ff2'}; color: ${c.textColor === 'light' ? '#ffffff' : '#0b0b0a'};">
          <h3 class="font-display text-display-md font-medium">${c.title}</h3>
          <p class="text-base leading-relaxed md:text-[17px] opacity-90">${c.desc}</p>
        </li>
      `).join('');
    }
  }

  // Section 05: Shkruaj
  const shkruaj = cfg.shkruaj || {};
  if (shkruaj.tag) safeSetText('shkruaj-tag', shkruaj.tag);
  if (shkruaj.title) safeSetHTML('shkruaj-heading', shkruaj.title);
  if (shkruaj.subtitle) safeSetText('shkruaj-subtitle', shkruaj.subtitle);
  if (shkruaj.buttonText) safeSetText('shkruaj-submit-btn', shkruaj.buttonText);

  // Section 06: Procesi
  const procesi = cfg.procesi || {};
  if (procesi.tag) safeSetText('procesi-tag', procesi.tag);
  if (procesi.title) {
    const highlight = procesi.highlight || 'mesazhin tim?';
    const cleanTitle = procesi.title.replace(highlight, `<span class="text-red">${highlight}</span>`);
    safeSetHTML('procesi-heading', cleanTitle);
  }
  if (procesi.bgImage) safeSetAttr('procesi-bg-img', 'src', procesi.bgImage);
  if (Array.isArray(procesi.cards)) {
    const container = document.getElementById('procesi-cards-container');
    if (container) {
      container.innerHTML = procesi.cards.map((card, idx) => `
        <article class="text-ink shadow-card flex flex-col gap-3 p-7 sm:p-8 rounded-lg bg-white/90 border border-line xl:rounded-b-none ${idx >= 2 ? 'xl:row-span-2 xl:row-start-1' : 'xl:row-start-2'} xl:col-start-${idx + 1}">
          <h3 class="font-display text-display-md leading-tight font-medium">${card.title}</h3>
          <p class="text-ink/80 text-base leading-relaxed md:text-[17px]">${card.desc}</p>
        </article>
      `).join('');
    }
  }

  // Footer
  const footer = cfg.footer || {};
  if (footer.title) safeSetText('footer-brand-title', footer.title);
  if (footer.subtitle) safeSetText('footer-brand-sub', footer.subtitle);
  if (footer.description) safeSetText('footer-description', footer.description);
  if (footer.copyright) safeSetText('footer-copyright', footer.copyright);
  if (footer.disclaimer) safeSetText('footer-disclaimer', footer.disclaimer);
  if (header.logoUrl) safeSetAttr('footer-logo-img', 'src', header.logoUrl);
}

// Helper DOM Setters
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function safeSetHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function safeSetAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, val);
}

// Populate Text Editor Form in Admin Panel
function populateTextEditorForm(cfg) {
  const h = cfg.header || {};
  const he = cfg.hero || {};
  const l = cfg.letra || {};
  const k = cfg.koncepti || {};
  const t = cfg.temat || {};
  const g = cfg.garancite || {};
  const s = cfg.shkruaj || {};
  const pr = cfg.procesi || {};
  const f = cfg.footer || {};

  safeSetValue('cfg-header-title', h.title || '');
  safeSetValue('cfg-header-subtitle', h.subtitle || '');
  safeSetValue('cfg-hero-heading', he.heading || '');
  safeSetValue('cfg-hero-subtext', he.subtext || '');
  safeSetValue('cfg-hero-pills', Array.isArray(he.pills) ? he.pills.join(', ') : '');
  safeSetValue('cfg-hero-cta', he.ctaButton || '');
  safeSetValue('cfg-hero-link', he.ctaLink || '');

  safeSetValue('cfg-letra-title', l.title || '');
  safeSetValue('cfg-letra-p1', l.paragraph1 || '');
  safeSetValue('cfg-letra-p2', l.paragraph2 || '');
  safeSetValue('cfg-letra-quote', l.quote || '');

  safeSetValue('cfg-koncepti-title', k.title || '');
  safeSetValue('cfg-koncepti-paragraphs', Array.isArray(k.paragraphs) ? k.paragraphs.join('\n\n') : '');
  safeSetValue('cfg-koncepti-quote', k.quote || '');

  safeSetValue('cfg-temat-title', t.title || '');
  safeSetValue('cfg-temat-subtitle', t.subtitle || '');
  safeSetValue('cfg-temat-desc', t.description || '');

  safeSetValue('cfg-garancite-title', g.title || '');
  renderGaranciteCardsEditor(g.cards || []);

  safeSetValue('cfg-shkruaj-title', s.title || '');
  safeSetValue('cfg-shkruaj-subtitle', s.subtitle || '');

  safeSetValue('cfg-procesi-title', pr.title || '');
  renderProcesiCardsEditor(pr.cards || []);

  safeSetValue('cfg-footer-desc', f.description || '');
  safeSetValue('cfg-footer-copy', f.copyright || '');
  safeSetValue('cfg-footer-disc', f.disclaimer || '');
}

function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function renderGaranciteCardsEditor(cards) {
  const container = document.getElementById('cfg-garancite-cards-editor');
  if (!container) return;

  container.innerHTML = cards.map((c, i) => `
    <div class="p-3 bg-paper rounded-lg border border-line space-y-2 text-xs">
      <div class="flex items-center justify-between">
        <strong class="text-ink">Kartela ${i + 1}</strong>
        <input type="color" id="cfg-card-color-${i}" value="${c.color || '#8d8ff2'}" class="size-6 rounded border border-line cursor-pointer">
      </div>
      <div>
        <label class="block text-[10px] uppercase font-bold text-ash-2 mb-0.5">Titulli</label>
        <input type="text" id="cfg-card-title-${i}" value="${c.title || ''}" class="fol-input text-xs py-1">
      </div>
      <div>
        <label class="block text-[10px] uppercase font-bold text-ash-2 mb-0.5">Përshkrimi</label>
        <textarea id="cfg-card-desc-${i}" rows="2" class="fol-input text-xs py-1">${c.desc || ''}</textarea>
      </div>
    </div>
  `).join('');
}

function renderProcesiCardsEditor(cards) {
  const container = document.getElementById('cfg-procesi-cards-editor');
  if (!container) return;

  container.innerHTML = cards.map((c, i) => `
    <div class="p-3 bg-paper rounded-lg border border-line space-y-2 text-xs">
      <strong class="text-ink">Hapi ${i + 1}</strong>
      <div>
        <label class="block text-[10px] uppercase font-bold text-ash-2 mb-0.5">Titulli</label>
        <input type="text" id="cfg-proc-title-${i}" value="${c.title || ''}" class="fol-input text-xs py-1">
      </div>
      <div>
        <label class="block text-[10px] uppercase font-bold text-ash-2 mb-0.5">Përshkrimi</label>
        <textarea id="cfg-proc-desc-${i}" rows="2" class="fol-input text-xs py-1">${c.desc || ''}</textarea>
      </div>
    </div>
  `).join('');
}

// Save All Texts
async function handleSaveAllTexts(e) {
  e.preventDefault();

  const cfg = appState.config || {};

  // Header
  cfg.header = cfg.header || {};
  cfg.header.title = document.getElementById('cfg-header-title').value;
  cfg.header.subtitle = document.getElementById('cfg-header-subtitle').value;

  // Hero
  cfg.hero = cfg.hero || {};
  cfg.hero.heading = document.getElementById('cfg-hero-heading').value;
  cfg.hero.subtext = document.getElementById('cfg-hero-subtext').value;
  cfg.hero.ctaButton = document.getElementById('cfg-hero-cta').value;
  cfg.hero.ctaLink = document.getElementById('cfg-hero-link').value;
  const pillsRaw = document.getElementById('cfg-hero-pills').value;
  cfg.hero.pills = pillsRaw.split(',').map(s => s.trim()).filter(Boolean);

  // Letra
  cfg.letra = cfg.letra || {};
  cfg.letra.title = document.getElementById('cfg-letra-title').value;
  cfg.letra.paragraph1 = document.getElementById('cfg-letra-p1').value;
  cfg.letra.paragraph2 = document.getElementById('cfg-letra-p2').value;
  cfg.letra.quote = document.getElementById('cfg-letra-quote').value;

  // Koncepti
  cfg.koncepti = cfg.koncepti || {};
  cfg.koncepti.title = document.getElementById('cfg-koncepti-title').value;
  const rawP = document.getElementById('cfg-koncepti-paragraphs').value;
  cfg.koncepti.paragraphs = rawP.split('\n\n').map(s => s.trim()).filter(Boolean);
  cfg.koncepti.quote = document.getElementById('cfg-koncepti-quote').value;

  // Temat
  cfg.temat = cfg.temat || {};
  cfg.temat.title = document.getElementById('cfg-temat-title').value;
  cfg.temat.subtitle = document.getElementById('cfg-temat-subtitle').value;
  cfg.temat.description = document.getElementById('cfg-temat-desc').value;

  // Garancitë (6 cards)
  cfg.garancite = cfg.garancite || {};
  cfg.garancite.title = document.getElementById('cfg-garancite-title').value;
  cfg.garancite.cards = (cfg.garancite.cards || []).map((card, i) => {
    const tEl = document.getElementById(`cfg-card-title-${i}`);
    const dEl = document.getElementById(`cfg-card-desc-${i}`);
    const cEl = document.getElementById(`cfg-card-color-${i}`);
    return {
      title: tEl ? tEl.value : card.title,
      desc: dEl ? dEl.value : card.desc,
      color: cEl ? cEl.value : card.color,
      textColor: card.textColor || 'dark'
    };
  });

  // Shkruaj
  cfg.shkruaj = cfg.shkruaj || {};
  cfg.shkruaj.title = document.getElementById('cfg-shkruaj-title').value;
  cfg.shkruaj.subtitle = document.getElementById('cfg-shkruaj-subtitle').value;

  // Procesi
  cfg.procesi = cfg.procesi || {};
  cfg.procesi.title = document.getElementById('cfg-procesi-title').value;
  cfg.procesi.cards = (cfg.procesi.cards || []).map((card, i) => {
    const tEl = document.getElementById(`cfg-proc-title-${i}`);
    const dEl = document.getElementById(`cfg-proc-desc-${i}`);
    return {
      title: tEl ? tEl.value : card.title,
      desc: dEl ? dEl.value : card.desc
    };
  });

  // Footer
  cfg.footer = cfg.footer || {};
  cfg.footer.description = document.getElementById('cfg-footer-desc').value;
  cfg.footer.copyright = document.getElementById('cfg-footer-copy').value;
  cfg.footer.disclaimer = document.getElementById('cfg-footer-disc').value;

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    if (res.ok) {
      alert('Të gjitha tekstet e landing page u përditësuan me sukses!');
      await fetchConfig();
      closeModal('admin-modal');
    }
  } catch (err) {
    alert('Gabim gjatë ruajtjes së teksteve.');
  }
}

// -------------------------------------------------------------
// 2. MEDIA & IMAGE MANAGER (UPLOAD & LIVE ASSIGNMENT)
// -------------------------------------------------------------
async function loadMediaLibrary() {
  try {
    const res = await fetch('/api/media');
    const media = await res.json();
    appState.media = media;

    renderActiveImagesGrid();
    renderMediaGalleryGrid(media);
  } catch (err) {
    console.error('Error loading media:', err);
  }
}

function renderActiveImagesGrid() {
  const container = document.getElementById('active-images-grid');
  if (!container) return;

  const cfg = appState.config || {};
  const heroImg = (cfg.hero && cfg.hero.bgImage) || 'brand/rakip-suli-cover.jpeg';
  const logoImg = (cfg.header && cfg.header.logoUrl) || 'brand/logo-bashkia-kamez.png';
  const letraImg = (cfg.letra && cfg.letra.bgImage) || 'brand/Bashkia-kamez.webp';
  const konceptiImg = (cfg.koncepti && cfg.koncepti.image) || 'brand/kamez-takim-projekteve.jpg';
  const tematImg = (cfg.temat && cfg.temat.image) || 'brand/pastrimi-ok.jpg';
  const garanciteImg = (cfg.garancite && cfg.garancite.bgImage) || 'brand/maratona-kamzes.jpg';
  const procesiImg = (cfg.procesi && cfg.procesi.bgImage) || 'brand/Bashkia-kamez.webp';

  const sections = [
    { title: 'Hero Background (Rakip Suli - Kopertina)', field: 'hero.bgImage', currentUrl: heroImg, badge: 'Hero Banner', desc: 'Imazhi kryesor i kreut me Kryetarin Rakip Suli' },
    { title: 'Logo Bashkia Kamëz (Header Logo)', field: 'header.logoUrl', currentUrl: logoImg, badge: 'Stema Zyrtare', desc: 'Stema zyrtare e Bashkisë Kamëz në shiritin e sipërm' },
    { title: '01 · Letra (Bashkia Kamëz Sfondi)', field: 'letra.bgImage', currentUrl: letraImg, badge: '01 · Mesazhi', desc: 'Sfondi i seksionit "Pse krijohet kjo hapësirë për Kamzën"' },
    { title: '02 · Koncepti (Takimi i Projekteve)', field: 'koncepti.image', currentUrl: konceptiImg, badge: '02 · Qasja', desc: 'Imazhi i takimit të punës për investimet dhe infrastrukturën' },
    { title: '03 · Temat (Shërbimet & Pastrimi në Kamëz)', field: 'temat.image', currentUrl: tematImg, badge: '03 · Fushat', desc: 'Imazhi i shërbimeve publike dhe pastrimit urban në Kamëz' },
    { title: '04 · Garancitë (Komuniteti & Maratona e Kamzës)', field: 'garancite.bgImage', currentUrl: garanciteImg, badge: '04 · Garancitë', desc: 'Sfondi i maratonës dhe qytetarëve të Bashkisë Kamëz' },
    { title: '06 · Procesi (Godina e Bashkisë Kamëz)', field: 'procesi.bgImage', currentUrl: procesiImg, badge: '06 · Procesi', desc: 'Sfondi i hapave të shqyrtimit dhe zgjidhjes konkrete' }
  ];

  container.innerHTML = sections.map((s, idx) => `
    <div class="bg-paper rounded-2xl p-5 border border-line shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider bg-red/10 text-red px-2.5 py-0.5 rounded-full">
            ${s.badge}
          </span>
          <a href="${s.currentUrl}" target="_blank" class="text-xs text-ash-2 hover:text-ink font-semibold flex items-center gap-1.5 transition-colors" title="Hap foton me madhësi të plotë">
            <i class="fa-solid fa-up-right-from-square text-[10px]"></i> Shiko Plotë
          </a>
        </div>

        <h5 class="font-display font-bold text-sm text-ink mb-1">${s.title}</h5>
        <p class="text-xs text-ash-2 mb-3 leading-snug">${s.desc}</p>

        <!-- LIVE CURRENT PHOTO PREVIEW (E DUKSHME & QARTË) -->
        <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-cream border border-line mb-3 group shadow-inner flex items-center justify-center">
          <img id="active-preview-${idx}" src="${s.currentUrl}" alt="${s.title}" class="size-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow">
            <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Fotoja Aktuale në Faqe</span>
          </div>
        </div>

        <!-- Current File Path Indicator -->
        <div class="text-[11px] font-mono text-ash-2 bg-cream px-3 py-1.5 rounded-lg border border-line mb-4 truncate flex items-center gap-2">
          <span class="font-bold text-ink shrink-0">Skedari:</span>
          <span class="truncate" title="${s.currentUrl}">${s.currentUrl}</span>
        </div>
      </div>

      <!-- DIRECT ACTION CONTROLS TO CHANGE THIS PHOTO -->
      <div class="space-y-2 pt-3 border-t border-line">
        <div class="grid grid-cols-2 gap-2">
          <!-- Button 1: Direct File Upload & Replace for THIS section -->
          <label class="cursor-pointer bg-red hover:bg-red-deep text-paper py-2.5 px-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:translate-y-px flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>Ngarko të Re</span>
            <input type="file" accept="image/*" class="hidden" onchange="handleSectionDirectUpload(event, '${s.field}', ${idx})">
          </label>

          <!-- Button 2: Choose from Media Library -->
          <button type="button" onclick="openImagePickerFor('${s.field}')" class="bg-cream hover:bg-line text-ink py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-line flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-images"></i>
            <span>Zgjidh Galeri</span>
          </button>
        </div>

        <!-- Manual Path / URL input -->
        <div class="flex gap-1.5 pt-1">
          <input type="text" id="manual-path-${idx}" value="${s.currentUrl}" placeholder="Rruga e skedarit (brand/... ose uploads/...)" class="fol-input text-xs py-1.5 px-2.5">
          <button type="button" onclick="handleSaveManualImagePath('${s.field}', ${idx})" class="bg-ink hover:bg-ink/80 text-paper text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0 transition-colors">
            Ruaj
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Direct section upload handler
async function handleSectionDirectUpload(event, targetField, previewIdx) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: reader.result
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        // Update live preview in card
        const previewImg = document.getElementById(`active-preview-${previewIdx}`);
        if (previewImg) previewImg.src = data.url;

        // Save to config and update page
        await selectImageForTarget(data.url, targetField);
        await loadMediaLibrary();
      } else {
        alert(data.error || 'Gabim gjatë ngarkimit të fotos.');
      }
    } catch (err) {
      alert('Gabim gjatë ngarkimit të skedarit.');
    }
  };
  reader.readAsDataURL(file);
}

// Manual path save handler
async function handleSaveManualImagePath(targetField, previewIdx) {
  const input = document.getElementById(`manual-path-${previewIdx}`);
  if (!input || !input.value.trim()) return;
  const newUrl = input.value.trim();
  await selectImageForTarget(newUrl, targetField);
  const previewImg = document.getElementById(`active-preview-${previewIdx}`);
  if (previewImg) previewImg.src = newUrl;
  await loadMediaLibrary();
}

function renderMediaGalleryGrid(media) {
  const container = document.getElementById('media-gallery-grid');
  if (!container) return;

  if (media.length === 0) {
    container.innerHTML = '<p class="text-xs text-ash col-span-full">Nuk ka ende foto të ngarkuara.</p>';
    return;
  }

  container.innerHTML = media.map(m => `
    <div class="group relative rounded-xl border border-line overflow-hidden bg-white shadow-sm flex flex-col justify-between">
      <div class="aspect-square w-full overflow-hidden bg-cream flex items-center justify-center">
        <img src="${m.url}" class="size-full object-cover group-hover:scale-105 transition-transform duration-200">
      </div>
      <div class="p-2 bg-paper text-[10px]">
        <div class="font-mono text-ink truncate font-bold">${m.name}</div>
        <span class="text-ash-2 uppercase font-semibold text-[9px]">${m.type}</span>
      </div>
    </div>
  `).join('');
}

// Global Upload Handler in Media tab
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: reader.result
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Fotoja u ngarkua me sukses në galeri!');
        await loadMediaLibrary();
      } else {
        alert(data.error || 'Gabim gjatë ngarkimit.');
      }
    } catch (err) {
      alert('Gabim gjatë ngarkimit të skedarit.');
    }
  };
  reader.readAsDataURL(file);
}

// Image Picker Modal
function openImagePickerFor(targetField) {
  appState.currentImagePickerTarget = targetField;
  const targetFieldInput = document.getElementById('image-picker-target-field');
  const targetTitle = document.getElementById('image-picker-target-title');
  if (targetFieldInput) targetFieldInput.value = targetField;
  if (targetTitle) targetTitle.textContent = `Zgjidhni Foton për: ${targetField}`;

  const pickerGrid = document.getElementById('picker-gallery-grid');
  if (pickerGrid && appState.media) {
    pickerGrid.innerHTML = appState.media.map(m => `
      <div onclick="selectImageForTarget('${m.url}')" class="cursor-pointer group aspect-square rounded-xl border-2 border-line hover:border-red overflow-hidden relative shadow-sm">
        <img src="${m.url}" class="size-full object-cover group-hover:scale-105 transition-transform">
        <div class="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase transition-opacity">
          Zgjidh Këtë
        </div>
      </div>
    `).join('');
  }

  document.getElementById('image-picker-modal').classList.remove('hidden');
}

async function selectImageForTarget(imageUrl, explicitTarget) {
  const targetField = explicitTarget || appState.currentImagePickerTarget;
  if (!targetField) return;

  // Handle profile avatar special case
  if (targetField === 'profile-avatar') {
    const avatarInput = document.getElementById('edit-profile-avatar');
    if (avatarInput) avatarInput.value = imageUrl;
    closeModal('image-picker-modal');
    return;
  }

  // Assign image in config
  const cfg = appState.config || {};
  const parts = targetField.split('.');
  if (parts.length === 2) {
    cfg[parts[0]] = cfg[parts[0]] || {};
    cfg[parts[0]][parts[1]] = imageUrl;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    if (res.ok) {
      closeModal('image-picker-modal');
      await fetchConfig();
      renderActiveImagesGrid();
      alert(`Fotoja u vendos me sukses në faqen kryesore!`);
    }
  } catch (err) {
    alert('Gabim gjatë caktimit të fotos.');
  }
}

async function handlePickerDirectUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: reader.result
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadMediaLibrary();
        await selectImageForTarget(data.url);
      } else {
        alert(data.error || 'Gabim gjatë ngarkimit.');
      }
    } catch (err) {
      alert('Gabim gjatë ngarkimit të skedarit.');
    }
  };
  reader.readAsDataURL(file);
}

// -------------------------------------------------------------
// 3. PROFILES MANAGEMENT
// -------------------------------------------------------------
async function fetchProfiles() {
  try {
    const res = await fetch('/api/profiles');
    const profiles = await res.json();
    appState.profiles = profiles;

    renderProfileShowcase(profiles);
    populateProfileSelect(profiles);
    renderAdminProfilesList(profiles);
  } catch (err) {
    console.error('Error fetching profiles:', err);
  }
}

function renderProfileShowcase(profiles) {
  const container = document.getElementById('profiles-container');
  if (!container) return;

  container.innerHTML = profiles.map(p => `
    <div class="bg-cream rounded-xl p-6 border border-line flex flex-col justify-between shadow-sm hover:border-ink transition-colors">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <img src="${p.avatarUrl || 'brand/km-eagle-black.png'}" alt="${p.fullName}" class="size-14 rounded-full object-cover border border-line bg-white p-0.5">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.isAvailable ? 'bg-[#5cc2b6]/20 text-[#13675f]' : 'bg-ash/20 text-ash'}">
              ${p.isAvailable ? 'I Disponueshëm' : 'Jo Aktiv'}
            </span>
            <h4 class="font-display font-medium text-base text-ink mt-1">${p.fullName}</h4>
            <p class="text-xs text-ash-2">${p.role}</p>
          </div>
        </div>
        <p class="text-xs text-ink-2 line-clamp-2 mb-4 leading-relaxed">${p.bio || ''}</p>
        <div class="flex flex-wrap gap-1 mb-4">
          ${(p.categories || []).map(cat => `
            <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-paper border border-line text-ash-2">
              ${cat}
            </span>
          `).join('')}
        </div>
      </div>
      <div class="flex gap-2">
        <a href="#shkruaj" onclick="selectProfileForInquiry('${p.id}')" class="flex-grow inline-flex items-center justify-center gap-1.5 bg-paper hover:bg-ink hover:text-paper text-ink border border-line py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors">
          <span>Hap Dialog</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </a>
        <button type="button" onclick="openEditProfileModal('${p.id}')" class="p-2 border border-line rounded-full bg-paper hover:text-red transition-colors" title="Modifiko Profilin">
          <i class="fa-solid fa-pen text-xs"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderAdminProfilesList(profiles) {
  const container = document.getElementById('admin-profiles-list');
  if (!container) return;

  container.innerHTML = profiles.map(p => `
    <div class="bg-cream rounded-xl p-4 border border-line flex items-center justify-between text-xs">
      <div class="flex items-center gap-3">
        <img src="${p.avatarUrl || 'brand/km-eagle-black.png'}" class="size-12 rounded-full object-cover border border-line bg-white">
        <div>
          <h5 class="font-display font-medium text-sm text-ink">${p.fullName}</h5>
          <p class="text-ash-2">${p.role}</p>
          <div class="text-[11px] text-ash mt-0.5">${(p.categories || []).join(', ')}</div>
        </div>
      </div>
      <div class="flex gap-2">
        <button type="button" onclick="openEditProfileModal('${p.id}')" class="bg-paper hover:bg-ink hover:text-paper border border-line px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] transition-colors">
          Modifiko
        </button>
        <button type="button" onclick="deleteProfile('${p.id}')" class="text-ash hover:text-red px-2 py-1">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function populateProfileSelect(profiles) {
  const select = document.getElementById('main-profileId');
  if (!select) return;

  select.innerHTML = profiles.map(p => `
    <option value="${p.id}">${p.fullName} (${p.role})</option>
  `).join('');

  syncCategoriesWithProfile();
}

function syncCategoriesWithProfile() {
  const select = document.getElementById('main-profileId');
  const catSelect = document.getElementById('main-category');
  if (!select || !catSelect) return;

  const profile = appState.profiles.find(p => p.id === select.value);
  if (profile && profile.categories && profile.categories.length > 0) {
    catSelect.innerHTML = profile.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    catSelect.innerHTML = '<option value="Të Përgjithshme">Të Përgjithshme</option>';
  }
}

function selectProfileForInquiry(profileId) {
  const select = document.getElementById('main-profileId');
  if (select) {
    select.value = profileId;
    syncCategoriesWithProfile();
  }
}

function openProfileEditModal() {
  document.getElementById('edit-profile-id').value = '';
  document.getElementById('edit-profile-name').value = '';
  document.getElementById('edit-profile-role').value = '';
  document.getElementById('edit-profile-avatar').value = '';
  document.getElementById('edit-profile-bio').value = '';
  document.getElementById('edit-profile-categories').value = '';
  document.getElementById('profile-edit-title').textContent = 'Shto Profil të Ri';
  document.getElementById('profile-edit-modal').classList.remove('hidden');
}

function openEditProfileModal(id) {
  const p = appState.profiles.find(x => x.id === id);
  if (!p) return;

  document.getElementById('edit-profile-id').value = p.id;
  document.getElementById('edit-profile-name').value = p.fullName;
  document.getElementById('edit-profile-role').value = p.role;
  document.getElementById('edit-profile-avatar').value = p.avatarUrl || '';
  document.getElementById('edit-profile-bio').value = p.bio || '';
  document.getElementById('edit-profile-categories').value = (p.categories || []).join(', ');
  document.getElementById('profile-edit-title').textContent = `Modifiko: ${p.fullName}`;
  document.getElementById('profile-edit-modal').classList.remove('hidden');
}

async function handleSaveCustomProfile(e) {
  e.preventDefault();
  const id = document.getElementById('edit-profile-id').value;
  const rawCats = document.getElementById('edit-profile-categories').value;
  const categories = rawCats.split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    fullName: document.getElementById('edit-profile-name').value,
    role: document.getElementById('edit-profile-role').value,
    avatarUrl: document.getElementById('edit-profile-avatar').value,
    bio: document.getElementById('edit-profile-bio').value,
    categories: categories.length > 0 ? categories : ['Të Përgjithshme']
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      alert(id ? 'Profili u përditësua me sukses!' : 'Profili i ri u shtua me sukses!');
      closeModal('profile-edit-modal');
      await fetchProfiles();
    }
  } catch (err) {
    alert('Gabim gjatë ruajtjes së profilit.');
  }
}

async function deleteProfile(id) {
  if (!confirm('A jeni i sigurt që dëshironi ta fshini këtë profil?')) return;
  try {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    await fetchProfiles();
  } catch (err) {
    alert('Gabim gjatë fshirjes.');
  }
}

// -------------------------------------------------------------
// 4. INQUIRIES & PUBLIC FEED
// -------------------------------------------------------------
async function fetchInquiries() {
  try {
    const res = await fetch('/api/inquiries');
    const inqs = await res.json();
    appState.inquiries = inqs;

    renderPublicFeed();
    renderAdminInbox();
  } catch (err) {
    console.error('Error fetching inquiries:', err);
  }
}

function renderPublicFeed() {
  const container = document.getElementById('public-feed-container');
  if (!container) return;

  const searchBox = document.getElementById('public-feed-search');
  const query = searchBox ? searchBox.value.toLowerCase() : '';

  let publicItems = appState.inquiries.filter(i => i.isPublic === true);
  if (query) {
    publicItems = publicItems.filter(i => 
      i.subject.toLowerCase().includes(query) ||
      i.message.toLowerCase().includes(query) ||
      (i.response && i.response.answerText.toLowerCase().includes(query))
    );
  }

  if (publicItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-paper rounded-xl border border-line text-ash">
        <p class="text-sm">Nuk ka ende pyetje publike në këtë rubrikë.</p>
      </div>`;
    return;
  }

  container.innerHTML = publicItems.map(item => {
    const profile = appState.profiles.find(p => p.id === item.profileId) || { fullName: 'Kryetari i Bashkisë Kamëz' };
    const dateStr = new Date(item.createdAt).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
      <div class="bg-paper rounded-xl p-6 sm:p-8 border border-line shadow-card space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div class="flex items-center gap-2">
            <span class="text-ink rounded-full px-3 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-[#5cc2b6]">
              ${item.category || 'Dialog'}
            </span>
            <span class="text-xs text-ash-2">${dateStr}</span>
          </div>
          <span class="text-xs font-mono font-bold text-ash-2">${item.trackingCode}</span>
        </div>

        <h3 class="font-display text-xl font-medium text-ink">${item.subject}</h3>
        <p class="text-ink-2 text-sm leading-relaxed">${item.message}</p>

        <div class="text-xs text-ash-2 pt-1">
          Dërguar nga: <strong class="text-ink">${item.isAnonymous ? 'Qytetar Anonim' : item.senderName}</strong> · Drejtuar: <strong class="text-red">${profile.fullName}</strong>
        </div>

        ${item.response ? `
          <div class="bg-cream rounded-xl p-5 border-l-4 border-red mt-4 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold uppercase tracking-wider text-red">Përgjigje Zyrtare nga ${item.response.responderName}</span>
              <span class="text-ash-2">${new Date(item.response.answeredAt).toLocaleDateString('sq-AL')}</span>
            </div>
            <p class="text-ink-2 text-sm leading-relaxed">${item.response.answerText}</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Submitting an inquiry
async function handleMainInquirySubmit(e) {
  e.preventDefault();

  const typeEl = document.querySelector('input[name="contributionType"]:checked');
  const contributionType = typeEl ? typeEl.value : 'Pyetje';

  const senderNameVal = document.getElementById('main-senderName').value.trim() || (appState.currentUser && appState.currentUser.fullName) || 'Qytetar';
  const senderEmailVal = document.getElementById('main-senderEmail').value.trim() || (appState.currentUser && appState.currentUser.email) || '';
  const senderPhoneVal = (document.getElementById('main-senderPhone') && document.getElementById('main-senderPhone').value.trim()) || (appState.currentUser && appState.currentUser.phone) || '';

  if (!senderEmailVal) {
    alert('Ju lutem vendosni një email të vlefshëm kontakti ose identifikohuni me Google.');
    return;
  }

  const payload = {
    profileId: document.getElementById('main-profileId').value,
    category: `${contributionType} · ${document.getElementById('main-category').value}`,
    subject: document.getElementById('main-subject').value,
    message: document.getElementById('main-message').value,
    senderName: senderNameVal,
    senderEmail: senderEmailVal,
    senderPhone: senderPhoneVal,
    phone: senderPhoneVal,
    userId: (appState.currentUser && appState.currentUser.id) || null,
    isAnonymous: document.getElementById('main-isAnonymous').checked
  };

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      alert(`Faleminderit! Mesazhi juaj u regjistrua me sukses në Dialog.\n\nKodi juaj i ndjekjes është: ${result.trackingCode}\n\nRuajeni këtë kod për të kontrolluar statusin e përgjigjes në seksionin "Ndiq Statusin" ose te "Mesazhet e Mia".`);
      document.getElementById('main-inquiry-form').reset();
      syncCategoriesWithProfile();
      renderAuthState(); // Reprefill if logged in
      await fetchInquiries();
    } else {
      alert(result.error || 'Ndodhi një gabim');
    }
  } catch (err) {
    alert('Gabim gjatë komunikimit me serverin.');
  }
}

// Public tracking
async function handlePublicTrack(e) {
  e.preventDefault();
  const code = document.getElementById('track-code-box').value.trim();
  const resultBox = document.getElementById('public-track-result');

  try {
    const res = await fetch(`/api/inquiries/track/${encodeURIComponent(code)}`);
    const data = await res.json();

    resultBox.classList.remove('hidden');

    if (data.error) {
      resultBox.innerHTML = `
        <div class="text-red font-medium text-sm">
          <i class="fa-solid fa-circle-exclamation mr-1.5"></i> ${data.error}
        </div>`;
      return;
    }

    const profile = appState.profiles.find(p => p.id === data.profileId) || { fullName: 'Kryetari i Bashkisë Kamëz' };
    let statusLabel = 'Në Pritje';
    let statusColor = 'bg-[#f2c14e] text-ink';
    if (data.status === 'answered') {
      statusLabel = 'E Përgjigjur Zyrtarisht';
      statusColor = 'bg-[#5cc2b6] text-ink';
    } else if (data.status === 'under_review') {
      statusLabel = 'Në Shqyrtim nga Ekipi';
      statusColor = 'bg-[#b3b4ea] text-ink';
    }

    resultBox.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span class="text-xs font-mono font-bold text-ash-2">${data.trackingCode}</span>
            <h4 class="font-display font-medium text-lg text-ink mt-0.5">${data.subject}</h4>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}">
            ${statusLabel}
          </span>
        </div>

        <div class="text-xs text-ash-2 space-y-1">
          <p>Drejtuar: <strong class="text-ink">${profile.fullName}</strong></p>
          <p>Kategoria: <strong class="text-ink">${data.category}</strong></p>
          <p>Data: ${new Date(data.createdAt).toLocaleString('sq-AL')}</p>
        </div>

        <div class="bg-paper p-4 rounded-xl border border-line text-xs text-ink-2">
          <strong>Përmbajtja e mesazhit tuaj:</strong>
          <p class="mt-1">${data.message}</p>
        </div>

        ${data.response ? `
          <div class="bg-paper p-5 rounded-xl border-l-4 border-red">
            <span class="text-xs font-bold uppercase tracking-wider text-red">Përgjigja Zyrtare nga ${data.response.responderName}:</span>
            <p class="text-sm text-ink-2 mt-2 leading-relaxed">${data.response.answerText}</p>
            <div class="text-[11px] text-ash mt-3">Data e kthimit: ${new Date(data.response.answeredAt).toLocaleString('sq-AL')}</div>
          </div>
        ` : `
          <p class="text-xs text-ash italic">
            Mesazhi juaj është marrë dhe po trajtohet me prioritet nga ekipi përkatës.
          </p>
        `}
      </div>
    `;
  } catch (err) {
    alert('Gabim gjatë kërkimit.');
  }
}

// -------------------------------------------------------------
// 5. ADMIN INBOX & REPLY MODAL
// -------------------------------------------------------------
function renderAdminInbox() {
  const container = document.getElementById('admin-inbox-list');
  const countBadge = document.getElementById('admin-inbox-count');
  if (!container) return;

  if (countBadge) countBadge.textContent = appState.inquiries.length;

  if (appState.inquiries.length === 0) {
    container.innerHTML = '<p class="text-xs text-ash">Nuk ka mesazhe të ardhura.</p>';
    return;
  }

  container.innerHTML = appState.inquiries.map(item => {
    const profile = appState.profiles.find(p => p.id === item.profileId) || { fullName: 'I panjohur' };

    return `
      <div class="bg-cream rounded-xl p-4 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div class="space-y-1 max-w-lg">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-red">${item.trackingCode}</span>
            <span class="text-ash">·</span>
            <span class="font-semibold text-ink">${item.senderName} (${item.senderEmail})</span>
            <span class="text-ash">·</span>
            <span class="text-ash-2">${new Date(item.createdAt).toLocaleDateString('sq-AL')}</span>
          </div>
          <div class="font-bold text-ink text-sm">${item.subject}</div>
          <p class="text-ash-2 line-clamp-2">${item.message}</p>
          <div class="text-[11px] text-ash">Drejtuar: <strong class="text-ink">${profile.fullName}</strong> | Status: <strong>${item.status}</strong></div>
        </div>

        <div class="flex sm:flex-col gap-2 shrink-0">
          <button onclick="openReplyModal('${item.id}')" class="bg-red text-paper hover:bg-red-deep px-4 py-2 rounded-full font-bold uppercase tracking-wider text-[11px]">
            Përgjigju
          </button>
          <button onclick="deleteInquiryItem('${item.id}')" class="text-ash hover:text-red px-2 py-1 text-center text-xs">
            Fshi
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openReplyModal(inquiryId) {
  const item = appState.inquiries.find(i => i.id === inquiryId);
  if (!item) return;

  document.getElementById('reply-inquiry-id').value = item.id;
  document.getElementById('reply-subject').textContent = item.subject;
  document.getElementById('reply-question-text').textContent = item.message;

  if (item.response) {
    document.getElementById('reply-text').value = item.response.answerText || '';
  } else {
    document.getElementById('reply-text').value = '';
  }

  document.getElementById('reply-isPublic').checked = Boolean(item.isPublic);
  document.getElementById('reply-modal').classList.remove('hidden');
}

async function handleSendReply(e) {
  e.preventDefault();
  const id = document.getElementById('reply-inquiry-id').value;
  const payload = {
    answerText: document.getElementById('reply-text').value,
    status: 'answered',
    isPublic: document.getElementById('reply-isPublic').checked
  };

  try {
    const res = await fetch(`/api/inquiries/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Përgjigja zyrtare u regjistrua me sukses!');
      closeModal('reply-modal');
      await fetchInquiries();
    }
  } catch (err) {
    alert('Gabim gjatë dërgimit të përgjigjes.');
  }
}

async function deleteInquiryItem(id) {
  if (!confirm('Dëshironi ta fshini këtë dialog?')) return;
  try {
    await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
    await fetchInquiries();
  } catch (err) {
    alert('Gabim gjatë fshirjes.');
  }
}

// -------------------------------------------------------------
// 6. MODALS & ADMIN TABS HELPERS
// -------------------------------------------------------------
function openAdminModal() {
  const isAuth = sessionStorage.getItem('folme_admin_auth');
  if (isAuth === 'true') {
    document.getElementById('admin-modal').classList.remove('hidden');
    switchAdminTab('inbox');
    return;
  }
  openAdminLoginModal();
}

function openAdminLoginModal() {
  const m = document.getElementById('admin-login-modal');
  if (m) {
    m.classList.remove('hidden');
    const err = document.getElementById('admin-login-error');
    if (err) err.classList.add('hidden');
    const input = document.getElementById('admin-login-pass');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  }
}

function verifyAdminLogin(e) {
  if (e) e.preventDefault();
  const pass = (document.getElementById('admin-login-pass')?.value || '').trim();
  if (pass === 'kamez2026' || pass === 'admin2026' || pass === 'admin') {
    sessionStorage.setItem('folme_admin_auth', 'true');
    closeModal('admin-login-modal');
    document.getElementById('admin-modal').classList.remove('hidden');
    switchAdminTab('inbox');
  } else {
    const err = document.getElementById('admin-login-error');
    if (err) err.classList.remove('hidden');
    else alert('Fjalëkalimi i administratorit nuk është i saktë.');
  }
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

function switchAdminTab(tab) {
  appState.currentAdminTab = tab;
  const tabs = ['inbox', 'media', 'texts', 'profiles'];

  tabs.forEach(t => {
    const v = document.getElementById(`adm-view-${t}`);
    const b = document.getElementById(`adm-tab-${t}`);
    if (v) {
      if (t === tab) v.classList.remove('hidden');
      else v.classList.add('hidden');
    }
    if (b) {
      if (t === tab) b.className = 'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-ink text-paper';
      else b.className = 'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-ash-2 hover:text-ink';
    }
  });

  if (tab === 'media') {
    loadMediaLibrary();
  } else if (tab === 'texts') {
    populateTextEditorForm(appState.config);
  }
}

// -------------------------------------------------------------
// 7. GOOGLE AUTHENTICATION & FULL REGISTRATION SYSTEM
// -------------------------------------------------------------
function initAuth() {
  try {
    const saved = localStorage.getItem('folme_user');
    if (saved) {
      appState.currentUser = JSON.parse(saved);
      renderAuthState();
    }
  } catch (e) {
    console.error('Error loading saved user:', e);
  }
}

function renderAuthState() {
  const user = appState.currentUser;
  const userContainer = document.getElementById('nav-user-container');
  const loginBtn = document.getElementById('nav-login-btn');
  const authBanner = document.getElementById('form-auth-banner');

  if (user && user.fullName) {
    // Show logged-in pill in header
    if (userContainer) userContainer.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');

    safeSetText('nav-user-name', user.fullName.split(' ')[0]);
    safeSetAttr('nav-user-avatar', 'src', user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80');
    safeSetText('user-menu-fullname', user.fullName);
    safeSetText('user-menu-email', user.email);
    safeSetText('user-menu-phone', user.phone || 'I paplotësuar');

    // Update Form Banner
    if (authBanner) {
      const heading = document.getElementById('form-auth-heading');
      const desc = document.getElementById('form-auth-desc');
      const actionBtn = document.getElementById('form-auth-action-btn');
      if (heading) heading.innerHTML = `<span class="text-emerald-700">✓ I Kyçur si:</span> ${user.fullName}`;
      if (desc) desc.textContent = `Tel: ${user.phone} · Email: ${user.email}`;
      if (actionBtn) {
        actionBtn.textContent = 'Ndrysho';
        actionBtn.onclick = () => openAuthModal();
      }
    }

    // Prefill form inputs
    const nameInput = document.getElementById('main-senderName');
    const emailInput = document.getElementById('main-senderEmail');
    const phoneInput = document.getElementById('main-senderPhone');
    if (nameInput) nameInput.value = user.fullName;
    if (emailInput) emailInput.value = user.email;
    if (phoneInput && user.phone) phoneInput.value = user.phone;
  } else {
    // Logged out
    if (userContainer) userContainer.classList.add('hidden');
    if (loginBtn) loginBtn.classList.remove('hidden');

    if (authBanner) {
      const heading = document.getElementById('form-auth-heading');
      const desc = document.getElementById('form-auth-desc');
      const actionBtn = document.getElementById('form-auth-action-btn');
      if (heading) heading.textContent = 'Identifikohuni me Google';
      if (desc) desc.textContent = 'Për të garantuar regjistrimin e saktë dhe përgjigjen zyrtare';
      if (actionBtn) {
        actionBtn.textContent = 'Kyçu me Google';
        actionBtn.onclick = () => openAuthModal();
      }
    }
  }
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('nav-user-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

// Close user dropdown when clicking outside
window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('nav-user-dropdown');
  const userContainer = document.getElementById('nav-user-container');
  if (dropdown && !dropdown.classList.contains('hidden') && userContainer && !userContainer.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  backToAuthStep1();
  modal.classList.remove('hidden');
}

function handleNavCtaClick() {
  if (appState.currentUser) {
    const shkruaj = document.getElementById('shkruaj');
    if (shkruaj) shkruaj.scrollIntoView({ behavior: 'smooth' });
  } else {
    openAuthModal();
  }
}

function handleGoogleSignInPrompt() {
  const emailInput = document.getElementById('auth-custom-email');
  let email = emailInput ? emailInput.value.trim() : '';
  if (!email) {
    const inputEmail = window.prompt('Ju lutem vendosni adresën tuaj të email-it Google (Gmail):');
    if (inputEmail && inputEmail.trim() && inputEmail.includes('@')) {
      email = inputEmail.trim();
      if (emailInput) emailInput.value = email;
    } else {
      if (emailInput) emailInput.focus();
      return;
    }
  }
  selectQuickEmail(email, '');
}

function selectQuickEmail(email, sampleName) {
  const emailInput = document.getElementById('auth-custom-email');
  if (emailInput) emailInput.value = email;

  appState.tempGoogleUser = {
    email: email,
    fullName: sampleName || '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    googleId: `google-${Date.now()}`
  };

  checkExistingGoogleUser(email);
}

async function proceedToRegistrationStep() {
  const emailInput = document.getElementById('auth-custom-email');
  const email = (emailInput && emailInput.value.trim());
  if (!email || !email.includes('@')) {
    alert('Ju lutem vendosni një email të vlefshëm.');
    return;
  }
  selectQuickEmail(email, '');
}

async function checkExistingGoogleUser(email) {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success && !data.needsCompletion && data.user) {
      // User is already fully registered! Log them in immediately
      loginUser(data.user);
      closeModal('auth-modal');
      alert(`Mirëseerdhët sërish, ${data.user.fullName}!`);
    } else {
      // Needs completion: show step 2 where they enter exact name and phone number
      const temp = (data && data.tempUser) || appState.tempGoogleUser || { email };
      appState.tempGoogleUser = temp;

      safeSetText('auth-step2-email', temp.email);
      safeSetAttr('auth-step2-avatar', 'src', temp.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80');

      const nameInput = document.getElementById('auth-reg-fullname');
      if (nameInput) nameInput.value = temp.fullName || '';

      document.getElementById('auth-step-1').classList.add('hidden');
      document.getElementById('auth-step-2').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Auth error:', err);
  }
}

function backToAuthStep1() {
  const s1 = document.getElementById('auth-step-1');
  const s2 = document.getElementById('auth-step-2');
  if (s1) s1.classList.remove('hidden');
  if (s2) s2.classList.add('hidden');
}

async function handleCompleteRegistration(e) {
  e.preventDefault();
  const fullName = document.getElementById('auth-reg-fullname').value.trim();
  const phone = document.getElementById('auth-reg-phone').value.trim();
  const city = document.getElementById('auth-reg-city').value.trim();
  const temp = appState.tempGoogleUser || {};

  if (!fullName || !phone) {
    alert('Emri i saktë dhe Numri i telefonit janë të detyrueshëm.');
    return;
  }

  const payload = {
    email: temp.email,
    fullName,
    phone,
    city,
    avatarUrl: temp.avatarUrl,
    googleId: temp.googleId
  };

  try {
    const res = await fetch('/api/auth/complete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.user) {
      loginUser(data.user);
      closeModal('auth-modal');
      alert(`Regjistrimi u krye me sukses të plotë!\nMirësevini në Dialog, ${data.user.fullName}.`);
    } else {
      alert(data.error || 'Gabim gjatë regjistrimit.');
    }
  } catch (err) {
    alert('Gabim gjatë komunikimit me serverin.');
  }
}

function loginUser(user) {
  appState.currentUser = user;
  localStorage.setItem('folme_user', JSON.stringify(user));
  renderAuthState();
}

function handleLogout() {
  appState.currentUser = null;
  localStorage.removeItem('folme_user');
  renderAuthState();
  const dropdown = document.getElementById('nav-user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  alert('Ju u çkyçët nga llogaria.');
}

async function openMyInquiriesModal() {
  const user = appState.currentUser;
  if (!user) {
    openAuthModal();
    return;
  }
  const modal = document.getElementById('my-inquiries-modal');
  const list = document.getElementById('my-inquiries-list');
  if (list) list.innerHTML = '<p class="text-xs text-ash-2">Po ngarkohen mesazhet tuaja...</p>';
  if (modal) modal.classList.remove('hidden');

  try {
    const res = await fetch(`/api/user/my-inquiries?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8 bg-cream/50 rounded-2xl border border-line">
          <i class="fa-solid fa-envelope-open-text text-3xl text-ash-2 mb-2"></i>
          <h4 class="font-display font-medium text-base text-ink">Nuk keni dërguar ende asnjë mesazh</h4>
          <p class="text-xs text-ash-2 mt-1 mb-4">Shkruani pyetjen, kritikën apo propozimin tuaj në formularin e dialogut.</p>
          <a href="#shkruaj" onclick="closeModal('my-inquiries-modal')" class="bg-red text-paper px-4 py-2 rounded-full text-xs font-bold uppercase">
            Shkruaj Mesazh Tani
          </a>
        </div>
      `;
      return;
    }

    list.innerHTML = data.map(inq => `
      <div class="bg-cream rounded-2xl p-4 border border-line space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-mono font-bold text-red bg-red/10 px-2 py-0.5 rounded">${inq.trackingCode}</span>
          <span class="text-ash-2">${new Date(inq.createdAt).toLocaleDateString('sq-AL')}</span>
        </div>
        <h5 class="font-bold text-sm text-ink">${inq.subject}</h5>
        <p class="text-xs text-ink-2">${inq.message}</p>
        <div class="pt-2 border-t border-line flex items-center justify-between text-xs">
          <span class="font-semibold ${inq.status === 'answered' ? 'text-emerald-700' : 'text-amber-700'}">
            Statusi: ${inq.status === 'answered' ? '✓ Përgjigjur' : '⏳ Në Shqyrtim'}
          </span>
          ${inq.response ? `<span class="font-bold text-ink">${inq.response.responderName}</span>` : ''}
        </div>
        ${inq.response ? `
          <div class="bg-white p-3 rounded-xl border border-line text-xs mt-2">
            <span class="font-bold text-red block mb-1">Përgjigjja Zyrtare:</span>
            <p>${inq.response.answerText}</p>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    if (list) list.innerHTML = '<p class="text-xs text-red">Gabim gjatë ngarkimit të mesazheve.</p>';
  }
}
