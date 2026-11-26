# zoi84.ba

Nova web stranica KJP ZOI'84 Olimpijski centar Sarajevo. Dizajn i razvoj: MANZEN.

Statična stranica (Eleventy), bez WordPressa. Sadržaj se uređuje kroz **Pages CMS**.

## Uređivanje sadržaja (za ZOI)

1. Otvori **https://app.pagescms.org** i prijavi se (GitHub račun ili e-mail pozivnica).
2. Izaberi `zoi84` i u meniju lijevo: **Novosti**, **Konkursi**, **Dokumenti**, **Kapitalna ulaganja** ili **Uprava**.
3. Dodaj ili izmijeni stavku, priloži PDF i klikni **Save**. Stranica se sama ponovo izgradi za minutu-dvije.

Konkursi se sami prebacuju u „Zatvorene“ kad prođe rok za prijave.

## Struktura

| Putanja | Šta je |
|---|---|
| `src/novosti/*.md` | novosti, oglasi, nabavke, akti (naslovna + stranica Novosti) |
| `src/natjecaji/*.md` | konkursi i javni pozivi |
| `src/dokumenti/*.md` | dokumenti; kategorije su u `src/_data/kategorije.json` |
| `src/ulaganja/*.md` | kapitalna ulaganja na stranici O nama (BS + EN) |
| `src/_data/uprava.json` | direktor i rukovodstvo na stranici O nama (BS + EN) |
| `src/uploads/` | fajlovi koji se uploadaju kroz CMS |
| `src/*.njk` | stranice (BS i `-en` verzije) |
| `eleventy.config.js` | kako se podaci pretvaraju u kartice i liste |
| `.pages.yml` | forme u Pages CMS-u |

## Lokalno (za developere)

```
npm install
npm start        # http://localhost:8080
npm run build    # izlaz u _site/
```

## Objava

GitHub Actions (`.github/workflows/deploy.yml`) gradi stranicu na svaki push na `main`.
Za automatski upload na hosting dodati FTP secrets (vidi komentar u workflowu).
Za testnu adresu u međuvremenu: Cloudflare Pages → Connect to Git → build `npm run build`, output `_site`.
