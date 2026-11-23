# FOL ME - Platforma e Hapur e Dialogut & Transparencës

Një sistem i plotë, modern dhe i personalizueshëm për dialog të drejtpërdrejtë ndërmjet qytetarëve/bashkëpunëtorëve dhe profileve tuaja (i frymëzuar nga arkitektura e `folmekm.al`).

---

## 🌟 Karakteristikat Kryesore

1. **Mbështetje për Shumë Profile (Multi-Profile Support):**
   * Mundësi për të shtuar dhe menaxhuar disa profile/figura të ndryshme (p.sh. Drejtori, Zyra Ligjore, Zëdhënësi, Departamenti IT, etj.).
   * Çdo profil ka foton, biografinë, fushat/kategoritë përkatëse, statusin e disponueshmërisë dhe mesazhin e mirëseardhjes.

2. **Dërgimi i Pyetjeve & Siguria e Anonimatit:**
   * Qytetarët mund të zgjedhin profilin dhe kategorinë specifike.
   * Mundësi për dërgim me emër ose **Anonim** (emri mbrohet dhe nuk publikohet).
   * **Gjenerim automatik i Kodit të Ndjekjes** (p.sh. `FOL-10492`).

3. **Ndiq Statusin në Kohë Reale:**
   * Çdo qytetar mund të vendosë kodin e tij për të parë nëse pyetja është:
     * `Në Pritje`
     * `Në Shqyrtim nga Ekipi`
     * `E Përgjigjur Zyrtarisht`

4. **Feed Publik i Transparencës (Pyetje & Përgjigje):**
   * Publikim i dialogjeve me interes të gjerë.
   * Filtra sipas profilit, kërkim me fjalë kyçe dhe data.
   * Përgjigje zyrtare me tekst dhe opsion video (YouTube/Loom).

5. **Paneli i Administrimit (Admin Dashboard):**
   * Inbox i plotë për menaxhimin e pyetjeve të ardhura.
   * Filtra sipas statusit (`Në Pritje`, `Në Shqyrtim`, `Të Përgjigjura`).
   * Përgjigje e menjëhershme me opsion: *Publiko në Feed* ose *Mbaje Private*.
   * Shtim dhe modifikim profilesh.

6. **Përshtatja e Faqes Kryesore (Live Customizer):**
   * Ndryshim në kohë reale i Emrit të Platformës, Titullit kryesor të Hero Banner, Nëntitullit, Shiritit të Njoftimeve (Announcement Bar), Email-it dhe Telefonit të kontaktit.
   * Të gjitha ndryshimet ruhen automatikisht në skedarin e konfigurimit (`data/config.json`).

---

## 🚀 Si ta nisësh projektin

Në terminal, brenda dosjes `fol-me`:

```powershell
# Nis serverin
node server.js
```

Ose duke përdorur Node.js v22 të sapo konfiguruar:
```powershell
& "C:\Users\user\nodejs-22\node.exe" server.js
```

Hap shfletuesin në adresën:
👉 **`http://localhost:3000`**

---

## 📁 Struktura e Dosjeve

```text
fol-me/
├── data/
│   ├── config.json      # Konfigurimi i faqes (titujt, njoftimet, ngjyrat)
│   ├── profiles.json    # Lista e profileve tuaja me të dhënat dhe statistikat
│   └── inquiries.json   # Databaza e pyetjeve, përgjigjeve dhe kodeve të ndjekjes
├── public/
│   ├── css/
│   │   └── styles.css   # Stilet dhe animacionet e ndërfaqes
│   ├── js/
│   │   └── app.js       # Logjika e plotë e frontend-it dhe thirrjet API
│   └── index.html       # Faqja kryesore responsive (Tailwind + FontAwesome)
├── package.json
├── server.js            # Serveri HTTP dhe REST API i plotë (pa varësi të jashtme)
└── README.md
```

---

## 🌐 Opsionet e Vendosjes Online (Production Deployment)

* **Opsioni 1 (Më i thjeshtë):** Mund ta hostoni këtë server direkt në çdo VPS, Docker ose shërbim si Render / Railway.
* **Opsioni 2 (Serverless / Next.js):** Skema e të dhënave mund të lidhet drejtpërdrejt me **Supabase** (PostgreSQL) dhe të publikohet në **Vercel**.
