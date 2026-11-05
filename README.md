# Tagesplaner

Ein ruhiger, übersichtlicher Tagesplaner als Web-App fürs iPhone.
Alle Daten bleiben lokal auf dem Gerät.

## Funktionen

- **Heute:** Aufgaben des Tages zum Abhaken. Offene Aufgaben von gestern erscheinen oben und lassen sich übernehmen oder weglassen.
- **Woche:** sieben Tage mit Terminen und Aufgaben. Aufgaben können direkt für einen anderen Tag eingetragen werden.
- **Monat:** Kalender für wichtige Termine (Uhrzeit freiwillig).
- **Notizen:** ein Zettel, der automatisch speichert.
- **Sichern:** alle Daten als Datei sichern und wiederherstellen. Nach 14 Tagen ohne Sicherung erscheint eine ruhige Erinnerung.
- Funktioniert **offline**, heller und dunkler Modus folgen dem iPhone.

## Datenschutz und Sicherheit

- Keine Konten, kein Server, keine Synchronisation, keine Cookies, kein Tracking.
- Keine externen Bibliotheken, Schriften oder CDNs. Alles liegt in diesem Repo.
- Eine Content-Security-Policy blockiert alle Netzwerkanfragen aus dem Code.
- Eingaben werden nur als reiner Text angezeigt (`textContent`), nie als HTML.
- Sicherungsdateien werden beim Import streng geprüft. Nur bekannte Felder werden übernommen.

## Veröffentlichen mit GitHub Pages

1. Auf github.com das Repo öffnen → **Settings** → **Pages**.
2. Bei „Build and deployment“: Source **Deploy from a branch**, Branch **main**, Ordner **/ (root)** → **Save**.
3. Nach ein bis zwei Minuten ist die App unter `https://<benutzername>.github.io/tagesplaner-app/` erreichbar.

Hinweis: Bei einem **privaten** Repo funktioniert GitHub Pages nur mit einem kostenpflichtigen GitHub-Konto. Alternativ das Repo öffentlich machen. Der Code enthält keine persönlichen Daten; die Einträge liegen ohnehin nur auf dem iPhone.

## Auf dem iPhone zum Home-Bildschirm hinzufügen

1. Die Adresse in **Safari** öffnen.
2. Unten auf **Teilen** (Quadrat mit Pfeil) tippen → **Zum Home-Bildschirm**.
3. Ab jetzt die App **nur noch über das Icon** öffnen.

Wichtig:
- Die App auf dem Home-Bildschirm hat einen **eigenen Speicher**, getrennt von Safari. Einträge, die in Safari gemacht wurden, erscheinen dort nicht.
- Safari kann Daten normaler Webseiten nach einigen Wochen ohne Besuch löschen. Apps auf dem Home-Bildschirm sind davon ausgenommen. Trotzdem regelmäßig über **Sichern** eine Sicherung erstellen, z. B. in iCloud Drive.
- Alle Projekte unter derselben `github.io`-Adresse teilen sich den Browser-Speicher. Am besten dort keine fremden Seiten hosten.

## Lokal testen

Im Projektordner:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

## Änderungen veröffentlichen

Nach jeder Änderung in `sw.js` die Zahl bei `VERSION` erhöhen (z. B. `'1'` → `'2'`).
Nur dann lädt das iPhone beim nächsten Öffnen die neuen Dateien. Die Daten bleiben dabei erhalten.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Grundgerüst, Reiter, Angaben für den Home-Bildschirm |
| `css/style.css` | Gestaltung |
| `js/app.js` | Startpunkt, Wechsel zwischen den Ansichten |
| `js/storage.js` | Speichern im Browser, Prüfung von Daten |
| `js/dates.js` | Datumshilfen |
| `js/ui.js` | Bausteine für die Oberfläche |
| `js/today.js`, `week.js`, `month.js`, `notes.js`, `backup.js` | die einzelnen Ansichten |
| `sw.js` | Offline-Betrieb |
| `manifest.webmanifest`, `icons/` | App-Name und Icons |
| `tools/make_icons.py` | erzeugt die Icons neu: `python3 tools/make_icons.py` |
