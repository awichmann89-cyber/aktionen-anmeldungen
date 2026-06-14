# Aktionen & Anmeldungen – Setup-Anleitung

## Lokale Entwicklung

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen einrichten
Kopiere `.env.example` zu `.env.local` und trage deine Werte ein:
```bash
cp .env.example .env.local
```

Erforderliche Variablen:
| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL Connection String (Pooled!) |
| `ADMIN_PASSWORD` | Admin-Passwort (beliebiger Text) |
| `SESSION_SECRET` | Zufälliger String (min. 32 Zeichen) |
| `NEXT_PUBLIC_BASE_URL` | Für lokale Entwicklung: `http://localhost:3000` |

Session Secret generieren:
```bash
openssl rand -base64 32
```

### 3. Datenbank einrichten
```bash
npx prisma migrate dev --name init
# oder für eine frische Produktions-DB:
npx prisma db push
```

### 4. App starten
```bash
npm run dev
```

Öffne http://localhost:3000 → wird zu /admin weitergeleitet.

---

## Deployment auf Vercel + Neon

### Neon Datenbank

1. Registriere dich auf [neon.tech](https://neon.tech)
2. Erstelle ein neues Projekt
3. Kopiere den **Pooled connection string** (unter Connection Details → "Pooled connection" aktivieren)

### Vercel Deployment

1. Pushe das Projekt zu GitHub
2. Importiere das Repository in [vercel.com](https://vercel.com)
3. Setze folgende Umgebungsvariablen in Vercel (Settings → Environment Variables):

```
DATABASE_URL        = postgresql://...neon.tech/neondb?sslmode=require&pgbouncer=true
ADMIN_PASSWORD      = dein-sicheres-passwort
SESSION_SECRET      = (mit openssl rand -base64 32 generieren)
NEXT_PUBLIC_BASE_URL = https://deine-app.vercel.app
```

4. Datenbank migrieren (einmalig nach erstem Deploy):
```bash
# Lokal mit Neon DATABASE_URL ausführen:
npx prisma db push
```

5. Deploy!

---

## Funktionen

### Admin-Bereich (`/admin`)
- Passwortgeschützter Login
- Aktionen erstellen, bearbeiten, löschen
- Öffentliche Links kopieren
- Teilnehmerliste als Excel (.xlsx) exportieren

### Öffentliche Anmeldung (`/anmeldung/[slug]`)
- Aktion-Infos (Name, Beschreibung, Datum)
- Anmeldeschluss wird angezeigt
- Formular: Name + Optionen (Checkboxen)
- Nach Anmeldeschluss: Anmeldung gesperrt

### Datenbankschema
- **Aktion**: Name, Beschreibung, Start/End-Datum, Anmeldeschluss, öffentlicher Slug
- **Option**: Ankreuzbare Option pro Aktion
- **Anmeldung**: Name des Teilnehmers, Zeitstempel
- **AnmeldungOption**: Verknüpfung Anmeldung ↔ Option
