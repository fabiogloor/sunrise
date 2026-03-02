# Implementation Plan: Manuelle OTO-ID Eingabe (Punkt 2)

> Status: Entwurf – zur Diskussion
> Datum: März 2026

---

## Problemstellung

Aktuell gibt es in **slotsuccess.html** (Step 1) den Text:
> «Klicken Sie hier, um Ihre OTO‑ID manuell einzugeben.»

Aber dahinter steckt **keine Funktionalität**. Es gibt kein sichtbares Eingabefeld und keinen Toggle. Der Kunde, der seine OTO-ID bereits kennt und kein Foto hochladen möchte, hat keine Möglichkeit sie direkt einzugeben.

**Gewünschtes Verhalten:** Wenn der Kunde die OTO-ID manuell eingibt, soll `slotphotocheck` (KI-Auswertung + Bestätigung) **komplett übersprungen** werden und der Flow direkt zu Branch B (`action=accept`) gehen.

---

## Aktueller Flow (IST)

```
slotsuccess (Step 1)
  │
  ├─ Foto hochladen → POST action=photocheck + imagedata
  │   │
  │   └─ index.html BRANCH A
  │       ├─ Phase 1: Upload → CDN → @ocPhase="loading"
  │       │   └─ slotphotocheck zeigt Spinner (30s Countdown)
  │       │       └─ Auto-POST Phase 2
  │       └─ Phase 2: Qolaba AI → @otoId → @ocPhase="confirm"
  │           └─ slotphotocheck zeigt Bestätigungsformular
  │               └─ User bestätigt → POST action=accept
  │                   └─ index.html BRANCH B → OneClick API
  │                       └─ slotaccepted (Step 3)
  │
  └─ Manuelle Eingabe → ❌ NICHT IMPLEMENTIERT
```

## Gewünschter Flow (SOLL)

```
slotsuccess (Step 1)
  │
  ├─ Foto hochladen → POST action=photocheck + imagedata
  │   └─ (wie bisher: Phase 1 → Phase 2 → Bestätigung → accept)
  │
  └─ Manuelle OTO-ID Eingabe → POST action=accept + otoid (DIREKT)
      │
      └─ index.html BRANCH B → OneClick API mit oto_id
          └─ slotaccepted (Step 3)
```

**Kernunterschied:** Bei manueller Eingabe wird `action=accept` statt `action=photocheck` gesendet, und der gesamte photocheck-Slot wird übersprungen.

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|-----------|
| `slots/slotsuccess.html` | Frontend: Toggle-Bereich für manuelle Eingabe + Submit-Logik |
| `index.html` | Keine SSJS-Änderung nötig – Branch B verarbeitet `oto_id` bereits |

---

## Detailplan

### 1. Frontend: slotsuccess.html

#### 1a. Collapsible OTO-ID Textfeld einbauen

Den bestehenden «Klicken Sie hier»-Text durch einen funktionalen Toggle ersetzen:

```html
<!-- Manuelle OTO-ID Eingabe (Toggle) -->
<div class="manual-oto-section xs-section">
    <a href="#" id="toggleManualOto" class="manual-oto-toggle">
        <span style="color: var(--sunriseRed); font-weight: 600;">
            OTO‑ID manuell eingeben ▾
        </span>
    </a>

    <div id="manualOtoPanel" class="manual-oto-panel" style="display: none;">
        <div class="xxs-section"></div>
        <div class="form-floating s20-form-input s20-form-input--otoId s20-form-input--md">
            <input class="form-control" id="input_otoId" name="input_otoId"
                   placeholder="A.XXX.XXX.XXX oder B.XXX.XXX.XXX.X"
                   type="text" value="">
            <label for="input_otoId">OTO-ID</label>
        </div>
        <div class="xxs-section"></div>
        <button type="button" class="btn-sr-primary" id="btnSubmitManualOto"
                data-action="accept"
                data-cicid="%%=v(@cicId)=%%">
            <p>OTO-ID absenden</p>
        </button>
    </div>
</div>
```

#### 1b. CSS für Toggle-Bereich

```css
.manual-oto-toggle {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}
.manual-oto-panel {
    padding: 1rem 0;
    animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

#### 1c. JavaScript: Toggle + Direct Submit

```javascript
// Toggle manuelle Eingabe
$("#toggleManualOto").on("click", function(e) {
    e.preventDefault();
    var panel = document.getElementById("manualOtoPanel");
    if (panel.style.display === "none") {
        panel.style.display = "block";
        document.getElementById("input_otoId")?.focus();
    } else {
        panel.style.display = "none";
    }
});

// Direkter Submit: OTO-ID → accept (überspringt photocheck)
$("#btnSubmitManualOto").on("click", function(e) {
    e.preventDefault();
    var otoInput = document.getElementById("input_otoId");
    var otoValue = (otoInput?.value || "").trim();

    if (!validateOto(otoValue)) {
        showErrorToast("Bitte geben Sie eine gültige OTO-ID ein");
        otoInput?.focus();
        otoInput?.select();
        return;
    }

    // Direkt als action=accept absenden → Branch B
    var form = document.createElement("form");
    form.method = "POST";

    function addField(name, value) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value || "";
        form.appendChild(input);
    }

    addField("action", "accept");
    addField("cicId",  this.getAttribute("data-cicid") || "");
    addField("otoid",  otoValue);
    // sig/exp/products falls nötig für Branch B
    // (müssen ggf. noch propagiert werden)

    document.body.appendChild(form);
    form.submit();
});
```

### 2. Backend: index.html (SSJS)

**Gute Nachricht:** Es sind **keine SSJS-Änderungen** nötig. Hier ist warum:

Der aktuelle SSJS-Code in Branch B (ab Zeile 339) macht bereits:
```javascript
var otoId = Variable.GetValue("@otoId");
if (otoId) reqconfig.oto_id = otoId;
```

Und `@otoId` wird in AMPscript bereits gelesen:
```
SET @otoId = RequestParameter("otoid")
```

Das heisst: Wenn wir `action=accept` + `otoid=B.123.456.789` POSTen, fliesst die OTO-ID automatisch in den OneClick-API-Request.

### 3. Stepper-Anpassung

Wenn der User manuell eingibt und direkt auf `slotaccepted` landet, überspringt er Step 2. Der Stepper sollte das reflektieren. Optionen:

**Option A:** Stepper in slotaccepted bleibt wie er ist (alle 3 Steps grün) – einfach, keine Änderung nötig. Der User sieht: «alles erledigt».

**Option B:** Spezieller Stepper für «manuellen Pfad» (nur Step 1 + 3 grün, Step 2 grau/übersprungen). Erfordert eine AMPscript-Variable `@manualEntry` und bedingte Anzeige.

**Empfehlung:** Option A – Keep it simple. Der User muss nicht wissen, dass es einen Phase-2-Schritt gibt.

---

## Risiken & Offene Fragen

### Risiko 1: sig/exp Parameter-Propagation
Branch B benötigt `sig` und `exp` für die Signatur-Validierung. In der aktuellen Journey kommen diese über den URL-Aufruf (`?siteId=...&sig=...&exp=...`). Bei manueller Eingabe muss sichergestellt sein, dass `sig` und `exp` im POST enthalten sind.

**Lösung:** Im Submit-Handler `sig`, `exp` und `products` als hidden fields propagieren (analog zum photocheck-Submit):
```javascript
addField("sig",      "%%=v(@sig)=%%");
addField("exp",      "%%=v(@exp)=%%");
addField("products", "%%=v(@products)=%%");
```

### Risiko 2: Validierung serverseitig
Client-seitig validieren wir das OTO-ID Format. Aber die OneClick-API könnte die OTO-ID trotzdem ablehnen (z.B. existiert nicht im System). Das ist ok – die API gibt einen Fehlercode zurück, der dann die Error-Page zeigt.

### Risiko 3: UX-Entscheidung – Foto ODER manuell?
~~Soll der User Foto **und** manuelle Eingabe gleichzeitig verwenden können?~~

**Entschieden (02.03.2026):** Jeder Button triggert seinen eigenen Pfad:
- **«Senden»-Button** (beim Foto) → `action=photocheck` → KI-Auswertung (wie bisher)
- **«OTO-ID absenden»-Button** (bei manueller Eingabe) → `action=accept` → direkt Branch B

Kein Konflikt, weil es zwei separate Buttons sind. Der User entscheidet selbst welchen Weg er geht.

### Offene Frage: Live-Test nötig
Die Parameter-Propagation (`sig`, `exp`, `products`) muss in der kompletten Journey live getestet werden. Das hatten wir bereits als «später testen» markiert (Punkt 10/11 aus dem Code Review).

---

## Aufwandsschätzung

| Aufgabe | Aufwand |
|---------|---------|
| Frontend: Toggle + Textfeld in slotsuccess | ~30 min |
| Frontend: Submit-Handler mit Validierung | ~20 min |
| Parameter-Propagation sicherstellen | ~15 min |
| Testing auf SFMC (manuell + Foto-Pfad) | ~45 min |
| **Gesamt** | **~2 Stunden** |

---

## Zusammenfassung

Die Implementierung ist **relativ einfach**, weil das Backend (SSJS + OneClick API) bereits alles unterstützt. Es geht hauptsächlich um Frontend-Arbeit in `slotsuccess.html`:

1. Collapsible Textfeld unter der Dropzone einbauen
2. Separaten Submit-Handler der direkt `action=accept` POSTet
3. Parameter-Propagation (`sig`, `exp`, `products`) sicherstellen
4. Live-Test in der kompletten Journey

Kein SSJS-Code muss geändert werden.
