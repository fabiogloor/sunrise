# Implementierungsplan: OTO-ID File Upload + Qolaba Integration

> Kampagne: copper_phout_2603
> Stand: Februar 2026

---

## Übersicht: Ziel-Journey

```
Schritt 1  →  Schritt 2  →  Schritt 3  →  Schritt 4
  Upload        Extract      Bestätigen    Abschluss
  Formular     OTO-ID aus   OTO-ID durch   Danke-Seite
  (Foto oder   Foto via       den Kunden
  manuell)     Qolaba API
```

---

## Kern-Entscheidung: Wie wird der Intermediate Step gesteuert?

Das aktuelle `index.html` ruft bei **jedem** POST OneClick auf. Der neue Schritt 2 (OTO-ID Bestätigung) soll aber **noch nicht** OneClick triggern – der Kunde muss zuerst die extrahierte OTO-ID bestätigen.

### Lösung: Neuer `action`-Wert `photocheck`

Ein neuer `action`-Parameter `photocheck` signalisiert, dass wir uns im Zwischenschritt befinden. In `index.html` wird **vor** dem OneClick-Call geprüft: Wenn `action=photocheck`, wird der OC-Call übersprungen und direkt `slotphotocheck` gerendert.

**Neuer Flow in index.html (SSJS):**
```
action=init       → OneClick (OC0001) → slotsuccess (Upload-Formular)
action=photocheck → KEIN OC-Call     → slotphotocheck (OTO-ID Bestätigung)
action=accept     → OneClick (OC0007) → slotaccepted (Danke-Seite)
action=undo       → OneClick (OC0006) → ocUndoSuccessDe
```

---

## Phase 1: SFMC File Upload (client-seitig, JavaScript)

### Ziel
Das hochgeladene Foto muss als öffentlich zugängliche URL vorliegen, bevor Qolaba aufgerufen werden kann.

### Ansatz: SFMC REST API – `/asset/v1/content/assets`

SFMC bietet einen Asset-Upload-Endpunkt. Der Upload erfolgt **client-seitig per JavaScript** direkt aus dem Browser (via OAuth-Token oder indirekt über einen SSJS-Proxy auf der CloudPage).

> **Empfehlung:** SSJS-Proxy auf derselben CloudPage (server-seitig), da OAuth-Tokens nicht client-seitig exponiert werden sollen.

### Umsetzung

**Option A: Vollständig server-seitig (empfohlen)**

1. Kunde wählt Foto im Browser
2. JavaScript-Submit schickt Bild als `multipart/form-data` POST an dieselbe CloudPage
3. SSJS in `index.html` empfängt das Bild (`RequestParameter("image_data")` als Base64)
4. SSJS macht API-Call an SFMC Asset API → erhält Asset-URL
5. SSJS ruft Qolaba API mit dieser URL auf → erhält OTO-ID
6. SSJS rendert `slotphotocheck` mit OTO-ID als AMPscript-Variable

**Technische Details für SFMC Asset Upload (SSJS):**
```javascript
var assetPayload = {
  "name": "oto_upload_" + Platform.Function.GUID(),
  "assetType": { "name": "jpg", "id": 20 },  // 20=jpg, 22=png
  "file": base64ImageData,  // Base64-encoded
  "category": { "id": <folder_id> }  // SFMC Content Builder Folder
};

var assetReq = new Script.Util.HttpRequest(
  "https://YOUR_SFMC_SUBDOMAIN.rest.marketingcloudapis.com/asset/v1/content/assets"
);
assetReq.method = "POST";
assetReq.contentType = "application/json";
assetReq.setHeader("Authorization", "Bearer " + accessToken);
assetReq.postData = Stringify(assetPayload);
var assetResp = assetReq.send();
// → Response enthält fileURL als öffentliche URL
```

> **Offen:** SFMC OAuth-Token für den Asset-Upload-Call. Entweder via installierten Package-Credentials oder via vorhandener Server-to-Server Integration.

**Option B: Externer Upload-Service**

Alternativ ein einfacher Upload-Proxy (z.B. als SFMC API Gateway oder separater Microservice), der das Bild entgegennimmt und eine URL zurückgibt.

---

## Phase 2: Qolaba API – OTO-ID Extraktion

### API-Endpunkt
`https://docs.qolaba.ai/api-platform/chat`

> Die genaue API-Dokumentation ist unter https://docs.qolaba.ai/api-platform/chat verfügbar.

### Erwarteter Request (SSJS, nach SFMC Upload)
```javascript
var qolabaPayload = {
  "image_url": sfmcAssetUrl,  // URL des hochgeladenen Fotos
  "prompt": "Extract the OTO-ID number from this fiber optic socket image. Return only the ID in format A.XXX.XXX.XXX or B.XXX.XXX.XXX.X"
};

var qolabaReq = new Script.Util.HttpRequest("https://api.qolaba.ai/...");
qolabaReq.method = "POST";
qolabaReq.contentType = "application/json";
qolabaReq.setHeader("Authorization", "Bearer " + QOLABA_API_KEY);
qolabaReq.postData = Stringify(qolabaPayload);
var qolabaResp = qolabaReq.send();
var extractedOtoId = ParseJSON(String(qolabaResp.content)).oto_id;
```

### Fallback bei Fehlschlag
Wenn Qolaba die OTO-ID nicht lesen kann:
- Fehlermeldung anzeigen: "Wir konnten die OTO-ID nicht automatisch erkennen."
- Manuelles Eingabefeld bleibt offen (wie aktuell in `slotsuccess.html` vorhanden)
- Kunde kann OTO-ID trotzdem manuell eingeben und auf "Senden" klicken

---

## Phase 3: index.html Anpassungen (SSJS)

### Neuer Parameter
```ampscript
SET @otoId = RequestParameter("otoid")
```

### Neue Logik-Struktur
```
IF @action == "photocheck"
  → KEIN OneClick-Call
  → Variable @otoId setzen
  → Slot slotphotocheck rendern
ELSE
  → OneClick-Call wie bisher
  IF OC0001
    → slotsuccess
  IF OC0007
    → slotaccepted  ← GEÄNDERT: war slotphotocheck
  IF OC0003 ... → Fehlerblöcke
ENDIF
```

> **Wichtig:** `OC00XX` Placeholder wird entfernt. Die Mapping-Tabelle wird:
> - `OC0001` → `slotsuccess`
> - `OC0007` → `slotaccepted` (Danke-Seite, wie in anderen Kampagnen)
> - `action=photocheck` → `slotphotocheck` (ausserhalb des OC-Flows)

### OTO-ID an OneClick übergeben
Im `action=accept`-Request muss die `otoId` an OneClick übergeben werden. Gemäss OneClick-API als zusätzliches Feld im Request-Body:
```javascript
reqconfig.oto_id = Variable.GetValue("@otoId");  // aus POST-Parameter
```
> **Offen:** Genaues Feldname muss mit dem OneClick-Team abgeklärt werden (z.B. `oto_id`, `fiberSocketId`, etc.)

---

## Phase 4: Client-side Anpassungen

### slotsuccess.html
- Submit-Handler muss das Bild als Base64 an den POST anhängen (via `data-extra-imagedata` oder als separates hidden field)
- Alternative: Bild via `FormData` + `fetch()` hochladen, dann Redirect mit extrahierter OTO-ID

### slotphotocheck.html
- OTO-ID aus AMPscript-Variable `@otoId` ins Textfeld einsetzen: `value="%%=v(@otoId)=%%"`
- Bild-Preview: URL aus AMPscript-Variable `@imageUrl` laden: `src="%%=v(@imageUrl)=%%"`
- Button-Submit: `data-action="accept"`, OTO-ID via `data-extra-otoid`

### slotaccepted.html (bisherige Confirmation-Seite)
- Wird jetzt bei `OC0007` gezeigt (final, kein weiterer Step)
- Kann OTO-ID als Bestätigung anzeigen: `%%=v(@otoId)=%%`

---

## Implementierungsreihenfolge (Schritt für Schritt)

### Schritt A – Qolaba API verstehen (Vorarbeit)
- [ ] Qolaba API-Dokumentation lesen (https://docs.qolaba.ai)
- [ ] API-Key besorgen / vorhanden?
- [ ] Test-Request machen mit einem Bild einer Glasfaserdose

### Schritt B – index.html: `photocheck`-Logik einbauen
- [ ] Neuen `@otoId`-Parameter lesen
- [ ] `action=photocheck`-Branch vor dem OC-Call einbauen
- [ ] `OC00XX`-Placeholder durch `OC0007`→`slotaccepted` ersetzen
- [ ] `oto_id` an OneClick-Request anhängen

### Schritt C – SFMC File Upload
- [ ] SFMC OAuth-Credentials für Asset-API klären
- [ ] Upload-Logik als SSJS in index.html einbauen (Base64-Handling)
- [ ] Ziel-Ordner in Content Builder definieren (Folder-ID)
- [ ] Rückgabe der Asset-URL sicherstellen

### Schritt D – Qolaba API Integration (SSJS)
- [ ] Qolaba API-Call nach erfolgtem SFMC-Upload
- [ ] OTO-ID aus Response extrahieren und in AMPscript-Variable setzen
- [ ] Fehlerhandling bei fehlgeschlagener Erkennung

### Schritt E – Slots aktualisieren
- [ ] `slotphotocheck.html`: OTO-ID-Feld vorausfüllen (`%%=v(@otoId)=%%`)
- [ ] `slotphotocheck.html`: Bild-Preview aus URL laden
- [ ] `slotaccepted.html`: Optional OTO-ID anzeigen

### Schritt F – Test & Deployment
- [ ] Testlauf mit `cicId=19384244` und `products=copper_phout_2603`
- [ ] Edge Cases prüfen: kein Bild erkannt, zu grosse Datei, ungültige OTO-ID
- [ ] Staging → Production

---

## Offene Fragen / Abzuklären

| # | Frage | An wen |
|---|---|---|
| 1 | Wie heisst das OTO-ID-Feld im OneClick Request genau? | OneClick-Team |
| 2 | Welche SFMC OAuth-Credentials für Asset-Upload verwenden? | SFMC-Admin |
| 3 | Welcher Content Builder Folder für Upload-Assets? | SFMC-Admin |
| 4 | Qolaba API-Key vorhanden? Request-Format bestätigen? | Fabio |
| 5 | Soll das Bild nach dem Upload in SFMC verbleiben oder gelöscht werden? | Fabio |

---

*Dieser Plan wird nach jeder Phase aktualisiert.*
