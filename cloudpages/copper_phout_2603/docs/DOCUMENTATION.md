# SFMC OneClick CloudPage – Projektdokumentation

> Kampagne: **Copper Phaseout** (`copper_phout_2603`)
> Stand: Februar 2026
> Zielmarkt: Schweiz (DE), Sunrise Telecom

---

## 1. Projektübersicht

Diese CloudPage ist die zentrale Landing Page für die OneClick-Journey von Sunrise. Kunden erhalten eine E-Mail mit einem personalisierten Link, öffnen diese Seite und können dort ein Angebot bestätigen oder ablehnen.

In der aktuellen Kampagne **Copper Phaseout** gibt es einen neuen Schritt: Kunden müssen ihre **OTO-ID** (Glasfaser-Anschlussnummer) übermitteln – entweder durch Foto-Upload oder manuelle Eingabe.

---

## 2. Dateistruktur

```
/
├── index.html              ← Haupt-CloudPage (SSJS-Logik + Slots)
├── js/
│   └── oneclick.min.js     ← Clientseitiger Submit-Handler (gehostet auf jsDelivr)
├── slots/
│   ├── navbar.html         ← Header/Navigation (Sunrise Logo + MySunrise Link)
│   ├── slotsuccess.html    ← Schritt 1: OTO-ID Upload-Formular (NEU)
│   ├── slotphotocheck.html ← Schritt 2: OTO-ID Bestätigungsseite (NEU)
│   └── slotaccepted.html   ← Finaler Abschluss: "Danke für Ihre Mitarbeit"
├── blocks/
│   ├── OcHeadInclude.html  ← <head>-Includes: CSS, JS-Libraries
│   ├── UsefulLib.html      ← SSJS Server-Utility-Funktionen
│   ├── ocErrorDe.html      ← Fehlerseite (DE)
│   ├── ocTooLateDe.html    ← "Zu spät" Seite (DE)
│   ├── ocOfferExpiredDe.html ← "Angebot abgelaufen" (DE)
│   ├── ocOfferClosedDe.html  ← "Angebot geschlossen" (DE)
│   └── ocUndoSuccessDe.html  ← "Rückgängig erfolgreich" (DE)
└── docs/
    ├── Oneclick requests 2.docx  ← OneClick API Dokumentation (Original)
    └── DOCUMENTATION.md          ← Diese Datei
```

---

## 3. Technologie-Stack

### SFMC-Technologien
- **AMPscript** – für `RequestParameter()`, `ContentBlockByKey()`, `v()` u.ä.
- **SSJS (Server-Side JavaScript)** – Logik in `<script language="javascript" runat="server">`
- **Content Builder Slots** – `data-type="slot"` im index.html für kampagnen-spezifische Inhalte
- **Content Builder Blocks** – `ContentBlockByKey()` für wiederkehrende, kampagnen-unabhängige Seiten

### Client-seitige Libraries (via `OcHeadInclude`)
| Library | Version | Zweck |
|---|---|---|
| Bootstrap | 5.3.8 | CSS-Framework & Komponenten |
| jQuery | 3.7.1 | DOM-Manipulation, Event Handling |
| Toastify | latest | Toast-Benachrichtigungen (Fehlermeldungen) |
| GSAP + ScrollTrigger | 3 | Animationen |
| Google Tag Manager | GTM-WL9ZDH7, GTM-TZ48GTT | Tracking |
| **Sunrise Design System** | – | CSS-Variablen (`--sunriseRed`, `--white`, etc.) via SFMC-hosted CSS |
| **oneclick.min.js** | custom | Formular-Submit-Handler (jsDelivr CDN) |

---

## 4. OneClick API

### Endpunkte
| Umgebung | URL |
|---|---|
| **Test** | `https://t-bmde-as-01.swi.srse.net/t01/oco` |
| **Produktion** | `https://p-fpay-as-11/oco` |
| **Aktuell in index.html** | `https://sunrise-campaign-eapi-v1-80a220.crmd22.deu-c1.eu1.cloudhub.io/api/accounts/campaign-info` |

> **Hinweis:** Die URL in `index.html` ist ein EAPI-Proxy-Endpunkt, nicht der direkte OneClick-Endpunkt.

### Authentifizierung
```
Header: client_id:     e5af6085e2e642eda419fd628f4324ec
Header: client_secret: 76425c167C104258a128231F792E9c0B
```

### Request-Struktur (POST, JSON)
```json
{
  "id": "<cicId oder siteId>",
  "campaign": "<product_key>",
  "action": "<init|accept|undo>",
  "level": "<SUBSCRIPTION|SITE>",
  "correlation_id": "<GUID>",
  "signature": {                  // optional, nur wenn sig-Parameter vorhanden
    "hash": "<sig>",
    "exp": "<exp>",
    "path": "/up4you-de"
  }
}
```

### Request-Parameter (Pflichtfelder)
| Feld | Beschreibung |
|---|---|
| `id` | `cicId` (Subscription-ID) oder `siteId` (Site-ID) – kommt als URL-Parameter |
| `campaign` | Produkt-Key (`products` URL-Parameter), z.B. `copper_phout_2603` |
| `action` | Aktion: `init` (Standard), `accept`, `undo` |
| `level` | `SUBSCRIPTION` (Standard) oder `SITE` – je nach Kampagne |
| `correlation_id` | GUID, wird per `Platform.Function.GUID()` generiert |

### URL-Parameter der CloudPage
| Parameter | Beschreibung |
|---|---|
| `cicId` | Subscription-ID des Kunden (häufigster Fall) |
| `siteId` | Alternativ zu cicId (Sonderfall, z.B. bei level=SITE) |
| `products` | Produkt-Key / Kampagnen-ID, z.B. `copper_phout_2603` |
| `action` | Aktion (`init`, `accept`, `undo`); Standard: `init` |
| `sig` | Signatur-Hash (optional, für Security) |
| `exp` | Ablaufzeit der Signatur (optional) |

> **Kampagnen-spezifisch (Copper Phaseout):**
> `products=copper_phout_2603`, `cicId=19384244` (Testdaten), `level=SUBSCRIPTION`
> Fallback-Wert für products: `my_sunrise_2511` (vor Deployment anpassen!)

### Status-Codes (OneClick-Response)
| Code | Name | Bedeutung | Seite |
|---|---|---|---|
| `OC0001` | SUCCESS | Kundendaten erfolgreich geladen | → Slot: `slotsuccess` |
| `OC0002` | NO_DATA_FOUND | Keine Daten gefunden | → (kein eigener Block, fällt in General Error) |
| `OC0003` | EXPIRED_OFFER | Angebot abgelaufen | → Block: `ocOfferExpiredDe` |
| `OC0004` | TOO_LATE | Zu spät zum Rückgängigmachen | → Block: `ocTooLateDe` |
| `OC0005` | CLOSED_OFFER | Angebot bereits geschlossen | → Block: `ocOfferClosedDe` |
| `OC0006` | SUCCESS_UNDO | Angebot erfolgreich storniert | → Block: `ocUndoSuccessDe` |
| `OC0007` | OFFER_ACCEPTED | Angebot angenommen | → Slot: `slotphotocheck` |
| `OC0008` | CREDIT_CHECK_FAILED | Kunde nicht berechtigt | → (fällt in General Error) |
| `OC0009` | GENERAL_EXCEPTION | Interner Fehler | → Block: `ocErrorDe` |
| Alle anderen | – | Unbekannter Fehler | → Block: `ocErrorDe` |

### Response-Daten (OC0001 – Felder im `data`-Objekt)
```json
{
  "salutation_string": "Lieber Herr Brown",
  "first_name": "Max",
  "last_name": "Brown",
  "language_code": "DE",
  "valid_until": "2024-07-01T00:00:00",
  "new_product": "Up Mobile M",
  "product_key": "copper_phout_2603",
  "cic_id": 34275986,
  "site_id": "8004004777",
  ...
}
```

---

## 5. SSJS-Logik in index.html

### Ablauf (Server-Side)
1. AMPscript liest URL-Parameter: `action`, `cicId`, `siteId`, `sig`, `exp`, `products`
2. SSJS setzt `cicId = siteId`, falls `cicId` leer
3. Wirft Fehler, wenn weder `cicId` noch `siteId` vorhanden
4. Setzt `products = "my_sunrise_2511"` als Fallback (kampagnen-spezifisch anpassen!)
5. Baut `reqconfig`-Objekt und sendet POST-Request an OneClick-API
6. Parsed Response, prüft `ocStatus.code`
7. Füllt AMPscript-Variablen (z.B. `@salutation_string`, `@first_name`, `@ALL_DATA`) je nach Status
8. Rendert entsprechenden Slot oder Block via if-else-Kaskade

### Slot/Block-Mapping
```
OC0001 → AMPscript-Variablen befüllen → <slot: slotsuccess>
OC0007 → @new_product setzen         → <slot: slotphotocheck>
OC00XX → (Placeholder, TBD)          → <slot: slotaccepted>
OC0003 →                              → ContentBlockByKey("ocOfferExpiredDe")
OC0004 →                              → ContentBlockByKey("ocTooLateDe")
OC0005 →                              → ContentBlockByKey("ocOfferClosedDe")
OC0006 →                              → ContentBlockByKey("ocUndoSuccessDe")
catch  →                              → ContentBlockByKey("ocErrorDe")
```

> **Wichtig:** `OC00XX` ist ein Placeholder! Der Intermediate-Step (OTO-ID Bestätigung) ist noch nicht final implementiert. Siehe Abschnitt 7.

### Logging
- Jeder Request wird via `logOneClick()` (aus UsefulLib) in die DE `ent.922_ONECLICKLOG` geloggt
- Felder: `cicId`, `siteId`, `action`, `products`, `additionalInfo` (JSON)

---

## 6. ContentBlocks (Wiederverwendbare Blöcke)

### OcHeadInclude
Wird im `<head>` via `%%=TreatAsContent(ContentBlockByKey("OcHeadInclude"))=%%` eingebunden.
Enthält alle CSS/JS-Includes (Bootstrap, jQuery, Sunrise CSS, oneclick.min.js, Toastify, GSAP, GTM).
`TreatAsContent` ist notwendig, damit AMPscript-Ausdrücke (`%%=Concat(...)=%%`) innerhalb des Blocks ausgewertet werden.

### UsefulLib
Wird ganz oben in index.html via `%%=ContentBlockByKey("UsefulLib")=%%` eingebunden (runat="server").
Enthält SSJS-Hilfsfunktionen:

| Funktion | Beschreibung |
|---|---|
| `isNotNullOrEmpty(value)` | Prüft ob Wert nicht null/undefined/leer/"null" ist |
| `logOneClick(logData, debug)` | Schreibt Log in DE `ent.922_ONECLICKLOG` |
| `log(message, debug)` | Allgemeines Logging in DE `ent.921_TEMPLOG` |
| `getSalutation(lang)` | Gibt Anrede je Sprache zurück (oder Wert aus Profil-Attribut) |
| `normalizeLang(lang)` | Normalisiert Sprachcode (de/fr/it/en) |
| `getValueByKeyName(key, name)` | Liest Wert aus DE `ent.911_TEMPLATE` |
| `formatUrl(url)` | Fügt `https://` hinzu falls kein Protokoll angegeben |

### Fehler-Blöcke (alle auf DE, jeweils eigene HTML-Seite)
| Block-Key | Wann angezeigt | Überschrift |
|---|---|---|
| `ocErrorDe` | Technischer Fehler / unbekannter Status | "Ups, hier stimmt etwas nicht!" |
| `ocTooLateDe` | OC0004 – zu spät zum Widerrufen | "Das Angebot ist nicht mehr gültig" |
| `ocOfferExpiredDe` | OC0003 – Angebot abgelaufen | "Entscheidungsfrist beendet" |
| `ocOfferClosedDe` | OC0005 – Angebot bereits aktiviert | "Ihre Bestellung wird aktiviert" |
| `ocUndoSuccessDe` | OC0006 – Undo erfolgreich | "Keine Änderungen vorgenommen" |

---

## 7. Slots (Kampagnen-spezifische Seiten)

### navbar.html
Einheitliche Navigation: Sunrise-Logo links, MySunrise-Login-Link rechts.

### slotsuccess.html – Schritt 1: OTO-ID Upload (NEU)
**Trigger:** OC0001 (erster Seitenaufruf, `action=init`)

Inhalt:
- Hero-Banner (responsive, 3 Breakpoints: Mobile/Large/Desktop)
- Begrüssungstext mit `%%=v(@salutation_string)=%%`
- Dropzone für Foto-Upload (JPG/PNG, max. 8MB)
- Optionales Textfeld für manuelle OTO-ID-Eingabe (`A.XXX.XXX.XXX` oder `B.XXX.XXX.XXX.X`)
- "Senden"-Button (`dynamic-submit`, `data-action="accept"`, `data-cicid="%%=v(@cicId)=%%"`)
- FAQ-Sektion zu Glasfasersteckdosen
- Bild-Vorschau + Overlay-Zoom
- Client-seitige Validierung (Format-Check OTO-ID, Datei-Typ/-Grösse)

**Validierungsregeln:**
- Entweder Bild ODER OTO-ID muss angegeben werden
- OTO-ID Pattern: `/^(A|B|O|WP)\.\d{3}\.\d{3}\.\d{3}(\.(X|\d))?$/`
- Erlaubte Dateitypen: `image/jpeg`, `image/png`
- Max. Dateigrösse: 8 MB

### slotphotocheck.html – Schritt 2: OTO-ID Bestätigung (NEU)
**Trigger:** OC0007 (nach erstem `action=accept`)

Inhalt:
- Hero-Banner (gleiche Bilder wie slotsuccess)
- Hochgeladenes Foto in Dropzone-Ansicht (mit Preview-Logik)
- OTO-ID Textfeld (vorausgefüllt oder leer für manuelle Eingabe)
- "Bestätigen"-Button (`dynamic-submit`, `data-action="accept"`, `data-cicid="%%=v(@cicId)=%%"`)
- Dankestext

**Validierung:** OTO-ID muss gültiges Format haben (gleicher Pattern wie Schritt 1)

### slotaccepted.html – Finaler Abschluss
**Trigger:** OC00XX (Placeholder – noch nicht final implementiert)

Inhalt:
- Hero-Banner "Dank für Ihre Zusammenarbeit"
- Erfolgs-Icon + "Wir haben Ihre OTO-ID-Nummer erhalten"
- Dankestext + Grüsse von Sunrise
- Undo-Link (aktuell auskommentiert)

---

## 8. Dynamic-Submit Mechanismus (oneclick.min.js)

**Hosted:** `https://cdn.jsdelivr.net/gh/fabiogloor/sunrise@main/oneclick.min.js`
**Eingebunden:** in OcHeadInclude mit `defer`

### Wie es funktioniert

Der Handler reagiert auf **Klicks auf beliebige Elemente mit der Klasse `.dynamic-submit`** (Event-Bubbling).

Beim Klick wird ein verstecktes HTML-`<form>` mit `method="POST"` erstellt und sofort abgeschickt. Die Formfelder werden aus `data-*`-Attributen des geklickten Elements gelesen:

| data-Attribut | → Formfeld | Beschreibung |
|---|---|---|
| `data-action` | `action` | z.B. `accept`, `undo`, `init` |
| `data-cicid` | `cicId` | Kunden-ID (aus AMPscript befüllt) |
| `data-target` | `form.action` | Ziel-URL (leer = gleiche Seite) |
| `data-extra-*` | `*` (ohne Prefix) | Beliebige Zusatzdaten, z.B. `data-extra-otoid` → Feld `otoid` |

### Ablauf beim Klick auf "Senden" (slotsuccess)
1. `submitValidationForm`-Handler (inline jQuery) prüft Formular (Datei + OTO-ID)
2. Bei Erfolg: setzt `data-extra-otoid` und/oder `data-extra-otoimage` auf den Button
3. `dynamic-submit`-Handler (oneclick.min.js) erstellt verstecktes Formular mit:
   - `action=accept`
   - `cicId=<wert aus data-cicid>`
   - `otoid=<OTO-ID falls manuell eingegeben>`
   - `otoimage=uploaded` (falls Bild gewählt)
4. Formular wird per POST an dieselbe CloudPage gesendet
5. SFMC-Server verarbeitet den POST via SSJS, ruft OneClick auf, zeigt nächsten Schritt

---

## 9. Neue Journey – Copper Phaseout (OTO-ID Flow)

### Aktueller Stand / Implementiertes
```
Schritt 1 (Implementiert):
  GET ?cicId=...&products=copper_phout_2603
     → SSJS: action=init → OneClick → OC0001
     → Seite: slotsuccess (Upload-Formular)

Schritt 2a (Teilweise implementiert, Logik fehlt noch):
  POST action=accept, cicId=..., otoimage=uploaded / otoid=...
     → Bild-Upload zu SFMC (TODO)
     → Qolaba API-Call zur OTO-ID-Extraktion (TODO)
     → OneClick-Call oder direkter Redirect (TODO – Flow unklar)
     → Seite: slotphotocheck (OTO-ID Anzeige zur Bestätigung)

Schritt 2b (Bestätigung – Placeholder):
  POST action=accept, cicId=..., otoid=<bestätigte ID>
     → OC0007 → Seite: slotphotocheck (aktuell) oder slotaccepted (geplant?)
     → OC00XX (Placeholder) → Seite: slotaccepted
```

### Offene Punkte / TODOs
1. **SFMC File Upload:** Bild-Upload-Mechanismus zu SFMC (braucht eine öffentliche URL für Qolaba)
2. **Qolaba API Integration:** `https://docs.qolaba.ai/api-platform/chat` – OTO-ID aus Bild extrahieren
3. **Intermediate Step Flow:** Wie wird slotphotocheck ohne OneClick-Response angezeigt? Optionen:
   - Neuer action-Parameter (z.B. `action=photocheck`) → SSJS prüft diesen ohne OC-Call
   - Direktes client-seitiges Redirect nach Extraktion mit otoId als Parameter
4. **OC00XX Placeholder ersetzen:** Entweder echter Status-Code definieren oder Logik umbauen
5. **level-Korrektur:** `level="SITE"` im index.html auf `SUBSCRIPTION` ändern für diese Kampagne

### Klassische OneClick-Journey (Referenz – andere Kampagnen)
```
GET ?cicId=...&products=... → OC0001 → Angebots-Slot anzeigen
POST action=accept         → OC0007 → Bestätigungs-Slot anzeigen
POST action=undo           → OC0006 → UndoSuccess-Block anzeigen
```

---

## 10. Sunrise Design System

Die Sunrise-CSS-Variablen werden über einen SFMC-hosted CSS-Link eingebunden:
`https://mcpwtx3tq0h63306gmq1cz4r728q.pub.sfmc-content.com/snmx3d3z4km`

Häufig verwendete Variablen:
| Variable | Bedeutung |
|---|---|
| `--sunriseRed` | Sunrise Primärfarbe (Rot) |
| `--white` | Weiss |
| `--greyBackground` | Grauer Hintergrund |
| `--lightBackground` | Helles Background |
| `--textColor` | Standard Textfarbe |
| `--bs-gray-100` | Bootstrap Grey 100 |
| `--Ruby-Glow` | Gradient für Error/Status-Header |
| `--bs-breakpoint-lg/md` | Bootstrap Breakpoints |
| `--lineBreak` | Linienelement |

Spacing-Klassen (eigenes System):
- `.xxs-section`, `.xs-section`, `.s-section`, `.m-section`, `.l-section` → Abstände
- `.l-center-l`, `.l-center-md`, `.l-center-m`, `.l-centre-lg` → Zentrierte Container mit max-width

---

## 11. Kampagnen-Checkliste (Deployment)

Für jede neue Kampagne folgende Werte anpassen:

- [ ] `products`-Fallback in `index.html` (Zeile ~38): `my_sunrise_2511` → kampagnen-key
- [ ] `level` in `index.html` (Zeile ~47): `SITE` oder `SUBSCRIPTION` je nach Kampagne
- [ ] `signature.path` in `index.html` (Zeile ~61): `/up4you-de` → kampagnen-pfad
- [ ] Hero-Bilder in Slots aktualisieren (mobile/large/desktop)
- [ ] Texte (Überschriften, Beschreibungen) in Slots anpassen
- [ ] Slots im Content Builder dem richtigen Slot-Key zuweisen

---

*Dokument erstellt auf Basis der Code-Analyse aller Projektdateien inkl. `oneclick.min.js`, `UsefulLib`, `OcHeadInclude` und der OneClick API Dokumentation.*
