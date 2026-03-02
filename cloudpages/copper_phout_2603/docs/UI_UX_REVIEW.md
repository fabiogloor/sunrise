# Senior UI/UX Review – Copper Phaseout Landing Page

> Reviewer-Rolle: Senior UI/UX Experte
> Prämisse: Im Sunrise-Look bleiben, modernisieren ohne alles umzukrempeln
> Referenz: sunrise.ch Design Language (Solar Design System)
> Stand: Februar 2026

---

## 1. Gesamteindruck

Die Seite ist **funktional solide** und nutzt das Sunrise-Farbschema (Navy `#00101D`, Rot `#E2002A`, Rosa `#D093A6` / `#F4D4DD` / `#FCF2F5`) korrekt. Die responsive Breakpoints (600px / 768px / 992px) sind sinnvoll. GSAP ist geladen, wird aber kaum genutzt.

**Stärken:**
- Klare Hierarchie: Header → Erklärung → Formular → FAQ
- Sunrise-Brand-Farben konsistent eingesetzt
- Accessibility-Basics vorhanden (aria-labels, role="button")
- Mobile-First-Ansatz korrekt umgesetzt

**Schwächen:**
- Visuell etwas «flat» und statisch – keine Micro-Interactions
- Viel duplizierter CSS-Code zwischen den Slots
- Einige UX-Patterns nicht optimal (z.B. Upload-Flow, manuelle Eingabe)
- Typografie könnte mehr Kontrast/Hierarchie haben
- Keine smooth scroll oder page-transition Effekte (obwohl GSAP geladen ist)

---

## 2. Slot-für-Slot Analyse

### 2.1 slotsuccess.html (Step 1: Upload-Formular)

#### ✅ Was gut funktioniert
- Dropzone mit Hover-Effekt und Preview
- Image-Overlay für Vollansicht
- Canvas-Kompression client-seitig (reduziert Server-Last)
- Loading-Overlay während SSJS-Verarbeitung
- FAQ-Accordion mit klaren Inhalten

#### 🔧 Verbesserungsvorschläge

**A) Upload-Bereich (Dropzone) – Priorität: HOCH**

| Problem | Vorschlag |
|---------|-----------|
| «Bild hochladen» ist der einzige Hinweis – kein visueller Drag-Indikator | Drag-over State: `border-color: #E2002A; background: rgba(226,0,42,0.05)` + Text wechselt zu «Foto hier ablegen» |
| Icon ist statisch (PNG) | SVG-Icon mit Hover-Animation (leichte Scale) oder Lottie-Animation |
| Preview ist auf max 190px beschränkt – bei Desktop zu klein | Preview-Höhe auf `max-height: 280px` auf Desktop (`@media 768px+`) erhöhen |
| Kein Datei-Info nach Upload (Name, Grösse) | Unter dem Preview: `Filename.jpg · 1.2 MB` als kleine Info-Zeile |

**B) Manuelle OTO-ID Eingabe – Priorität: HOCH**

| Problem | Vorschlag |
|---------|-----------|
| «Klicken Sie hier» – aber es gibt kein Eingabefeld sichtbar! | Das `input_otoId` Feld fehlt komplett in `slotsuccess.html`. Es wird nur in `slotphotocheck.html` referenziert. In Step 1 gibt es nur den Upload. Falls manuelle Eingabe in Step 1 gewünscht ist: Collapsible-Section mit dem Textfeld hinzufügen. |
| Der «hier»-Link hat keine Aktion hinterlegt | Entweder einen Toggle einbauen, der ein Textfeld einblendet, oder den Text entfernen |

**C) Header-Bereich – Priorität: MITTEL**

| Problem | Vorschlag |
|---------|-----------|
| Fester `height: 459px` – kann auf kleinen Mobilgeräten zu viel Platz einnehmen | `min-height: 280px; height: auto; aspect-ratio: 16/7` für flexibleres Verhalten |
| Text-Animation `lineUp` ist definiert aber wirkt subtil | GSAP ScrollTrigger nutzen für einen smoothen Fade-In mit leichtem Y-Translate |

**D) FAQ-Accordion – Priorität: NIEDRIG**

| Problem | Vorschlag |
|---------|-----------|
| Harter `display: none/block` Toggle | CSS `max-height` + `transition` für smooth open/close Animation |
| Chevron-Icon rotiert nicht | CSS Transform `rotate(180deg)` auf `.active .icon` statt Icon-Swap |
| Globaler `button`-Selector (Zeile 250–260) beeinflusst ALLE Buttons | Scope auf `.accordion-faq` oder nutze spezifischere Klasse |

**E) Spacing & Layout – Priorität: MITTEL**

| Problem | Vorschlag |
|---------|-----------|
| Viele leere `div class="xxs-section"` / `xs-section` / `m-section` als Spacer | Durch `gap` auf Flex/Grid-Containern ersetzen – cleaner und wartbarer |
| `.contact-section` nutzt `width: 90%` statt `max-width` + `padding` | Besser: `width: 100%; max-width: 1280px; padding: 0 5%;` – vermeidet horizontales Abschneiden |

---

### 2.2 slotphotocheck.html (Step 2: Bestätigung)

#### Phase 1 (Loading-Screen)

#### ✅ Was gut funktioniert
- Spinner ist brand-konform (Sunrise Red)
- Countdown gibt dem User Transparenz über Wartezeit
- Auto-Submit nach 30s ist clever für die CDN-Propagation

#### 🔧 Verbesserungsvorschläge

| Problem | Vorschlag |
|---------|-----------|
| Der Loading-Screen ist sehr kahl – nur Spinner + Text | Aufwertung: Das hochgeladene Foto in reduzierter Grösse (120px) unter dem Spinner zeigen + «Wir analysieren Ihr Foto…» – gibt dem User visuelles Feedback |
| «Bitte warten (30 s)» wirkt technisch | Besser: Progress-Bar statt numerischer Countdown. Oder: «Analyse läuft…» ohne exakte Sekunden (etwas polierter) |
| Kein Fallback wenn JS deaktiviert | `<noscript>` Hinweis: «Bitte aktivieren Sie JavaScript» |

#### Phase 2 (Bestätigungsformular)

#### ✅ Was gut funktioniert
- AI-Feedback Banner (grün = erkannt, gelb = nicht erkannt) ist super UX
- OTO-ID Feld ist vorausgefüllt aus Qolaba
- Foto wird angezeigt (Base64 oder CDN-URL)

#### 🔧 Verbesserungsvorschläge

| Problem | Vorschlag |
|---------|-----------|
| «Wir haben Ihre OTO-ID-Nummer erhalten» steht über dem Formular – obwohl der User die ID erst noch bestätigen muss | Text ändern zu: «Bitte überprüfen Sie die erkannte OTO-ID» |
| Erfolgs-Banner + Warn-Banner nutzen inline Styles mit absoluten Farben | In die `<style>` Section auslagern als `.oc-ai-success` / `.oc-ai-warning` Klassen |
| Der Text am Ende «Vielen Dank. Wir werden Ihnen bald weitere Informationen...» steht auf der Bestätigungsseite, obwohl noch nichts bestätigt wurde | Diesen Text entfernen oder auf slotaccepted verschieben – hier wirkt er verfrüht |
| Foto-Display hat `pointer-events: none` → Klick auf Foto öffnet Overlay nicht | Entweder `pointer-events` entfernen (nur auf den Container, nicht auf `#uploadedPhoto`), oder den Overlay-Code entfernen wenn nicht gewünscht |
| Kein «Zurück»-Button | Optional: Link «← Erneut hochladen» der zurück zu slotsuccess navigiert |

---

### 2.3 slotaccepted.html (Step 3: Danke-Seite)

#### ✅ Was gut funktioniert
- Klar und simpel – gute finale Bestätigung
- Sunrise-Brand Header konsistent

#### 🔧 Verbesserungsvorschläge

| Problem | Vorschlag |
|---------|-----------|
| Sehr minimalistisch – kein visuelles «Erfolgserlebnis» | Dezente Erfolgs-Animation: Check-Icon mit GSAP Scale-In + Konfetti-Effekt (optional, aber modern) |
| «Dank für Ihre Zusammenarbeit» klingt steif | «Vielen Dank – alles erledigt!» oder «Geschafft – vielen Dank!» (freundlicher, moderner) |
| Kein Hinweis was als nächstes passiert (Timeline) | Kurze Schritte-Übersicht: «1. ✅ OTO-ID erhalten → 2. Wir prüfen Ihren Anschluss → 3. Sie erhalten Post mit dem neuen Gerät» |
| Undo-Link ist auskommentiert | Falls gewünscht: sichtbar machen mit Timer «Innerhalb von 24h widerrufbar» |

---

## 3. Übergreifende UX-Empfehlungen

### 3.1 Stepper/Progress-Indikator (Priorität: HOCH)

Der User durchläuft 3 Schritte (Upload → Bestätigung → Danke), aber es gibt keinen visuellen Progress-Indikator. Ein simpler **3-Step-Stepper** am oberen Rand (unter dem Header) würde die Journey deutlich klarer machen:

```
  ① Upload        ② Bestätigung      ③ Erledigt
  ●────────────────○────────────────────○
```

Umsetzung: Reines CSS + AMPscript Variable `@currentStep` (oder einfach per Slot hardcoded).

### 3.2 Typografie-Hierarchie verfeinern

- `h1` wird nur in slotsuccess verwendet, nie in den anderen Slots → Inkonsistent
- Sunrise.ch nutzt eine klare Typografie-Leiter mit viel Whitespace
- Empfehlung: `h1` für Haupttitel, `h2` für Sektions-Headlines, `h3` für Unter-Headlines – durchgehend

### 3.3 Micro-Interactions mit GSAP (Priorität: NIEDRIG)

GSAP + ScrollTrigger sind geladen, werden aber nicht eingesetzt. Quick Wins:
- **Fade-in-up** für Content-Sections beim Scrollen
- **Scale-Bounce** auf dem «Senden»-Button beim Hover
- **Smooth Accordion** statt hartem Toggle
- **Staggered reveal** für FAQ-Items

### 3.4 CSS-Deduplizierung (Priorität: MITTEL)

Die Header-Styles (`.img-responsive`, `.header-container-inner`, `.text-container`) sind in allen drei Slots fast identisch kopiert. Empfehlung:
- In das globale OneClick-Stylesheet auslagern (oder als eigener Content Block)
- Spart ~80 Zeilen pro Slot und vermeidet Inkonsistenzen

### 3.5 Dark Mode / Reduced Motion (Priorität: NIEDRIG)

- `@media (prefers-reduced-motion: reduce)` sollte Animationen deaktivieren
- Dark Mode ist für diese SFMC-Page nicht nötig, aber der `prefers-reduced-motion` Support zeigt Accessibility-Bewusstsein

---

## 4. Priorisierte Massnahmen-Liste

| # | Massnahme | Aufwand | Impact | Priorität |
|---|-----------|---------|--------|-----------|
| 1 | **3-Step Progress-Indikator** hinzufügen | Klein | Hoch | 🔴 Hoch |
| 2 | **Manuelle OTO-ID Eingabe** in slotsuccess fixen (Toggle/Collapsible) | Klein | Hoch | 🔴 Hoch |
| 3 | **Drag-over State** für Dropzone | Klein | Mittel | 🟡 Mittel |
| 4 | **slotphotocheck Text** korrigieren (noch nicht «erhalten» sondern «prüfen») | Klein | Mittel | 🟡 Mittel |
| 5 | **«Vielen Dank»-Text** von slotphotocheck nach slotaccepted verschieben | Klein | Mittel | 🟡 Mittel |
| 6 | **Smooth Accordion** (CSS max-height statt display toggle) | Klein | Mittel | 🟡 Mittel |
| 7 | **CSS-Deduplizierung** (Header-Styles in globales Sheet) | Mittel | Mittel | 🟡 Mittel |
| 8 | **AI-Feedback Banner** in CSS-Klassen statt inline Styles | Klein | Klein | 🟢 Niedrig |
| 9 | **GSAP Micro-Interactions** (Fade-in, Button-Hover) | Mittel | Klein | 🟢 Niedrig |
| 10 | **slotaccepted aufwerten** (Next-Steps Übersicht, Erfolgs-Animation) | Mittel | Mittel | 🟢 Niedrig |
| 11 | **Loading-Screen aufwerten** (Foto-Thumbnail, Progress-Bar statt Countdown) | Klein | Klein | 🟢 Niedrig |
| 12 | **prefers-reduced-motion** Media Query hinzufügen | Klein | Klein | 🟢 Niedrig |

---

## 5. Quick-Win CSS-Vorschläge (direkt umsetzbar)

### Drag-over State
```css
.dropzone-section.drag-over {
    border-color: #E2002A;
    background: rgba(226, 0, 42, 0.05);
    transform: scale(1.01);
}
```

### Smooth Accordion
```css
.inneraccordion {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-out;
}
.faq-item.active .inneraccordion {
    max-height: 800px; /* gross genug für den Content */
}
.faq-item .icon {
    transition: transform 0.3s ease;
}
.faq-item.active .icon {
    transform: rotate(180deg);
}
```

### AI-Banner Klassen
```css
.oc-ai-success {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px;
    background: #EBF7EE; border-radius: 8px; border: 1px solid #A0D9B0;
    color: #2E7D52; font-size: 13px; font-weight: 600;
}
.oc-ai-warning {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px;
    background: #FFF7E6; border-radius: 8px; border: 1px solid #F0C050;
    color: #B86E00; font-size: 13px; font-weight: 600;
}
```

### Progress-Stepper
```css
.oc-stepper {
    display: flex;
    justify-content: center;
    gap: 0;
    padding: 1.5rem 1rem;
    max-width: 480px;
    margin: 0 auto;
}
.oc-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    color: #999;
    font-weight: 500;
}
.oc-step.is-active {
    color: #E2002A;
    font-weight: 700;
}
.oc-step.is-done {
    color: #2E7D52;
}
.oc-step-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 2px solid #ccc;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
}
.oc-step.is-active .oc-step-dot {
    border-color: #E2002A;
    background: #E2002A;
    color: #fff;
}
.oc-step.is-done .oc-step-dot {
    border-color: #2E7D52;
    background: #2E7D52;
    color: #fff;
}
.oc-step-line {
    flex: 1;
    height: 2px;
    background: #ddd;
    margin: 0 0.5rem;
}
.oc-step.is-done + .oc-step-line {
    background: #2E7D52;
}
```

```html
<!-- Step 1 (slotsuccess) -->
<div class="oc-stepper">
    <div class="oc-step is-active"><span class="oc-step-dot">1</span> Upload</div>
    <div class="oc-step-line"></div>
    <div class="oc-step"><span class="oc-step-dot">2</span> Prüfung</div>
    <div class="oc-step-line"></div>
    <div class="oc-step"><span class="oc-step-dot">3</span> Erledigt</div>
</div>

<!-- Step 2 (slotphotocheck) -->
<div class="oc-stepper">
    <div class="oc-step is-done"><span class="oc-step-dot">✓</span> Upload</div>
    <div class="oc-step-line"></div>
    <div class="oc-step is-active"><span class="oc-step-dot">2</span> Prüfung</div>
    <div class="oc-step-line"></div>
    <div class="oc-step"><span class="oc-step-dot">3</span> Erledigt</div>
</div>

<!-- Step 3 (slotaccepted) -->
<div class="oc-stepper">
    <div class="oc-step is-done"><span class="oc-step-dot">✓</span> Upload</div>
    <div class="oc-step-line"></div>
    <div class="oc-step is-done"><span class="oc-step-dot">✓</span> Prüfung</div>
    <div class="oc-step-line"></div>
    <div class="oc-step is-active"><span class="oc-step-dot">3</span> Erledigt</div>
</div>
```

---

*Dieses Review dient als Diskussionsgrundlage. Vorgeschlagene Massnahmen sollen schrittweise umgesetzt werden – du bestimmst die Reihenfolge, Fabio.*
