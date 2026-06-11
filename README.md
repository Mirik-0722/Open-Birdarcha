# Aloqalar grafi — MVP skelet

Rusprofile uslubidagi biznes aloqalar servisi: kompaniya/shaxs qidiruvi, kartochkalar va interaktiv aloqalar grafi (Sigma.js).

Stack: Spring Boot 3 (Java 17, JdbcClient, Flyway) + PostgreSQL 16 + React (Vite + TypeScript).

## Talablar

- Docker (PostgreSQL uchun)
- JDK 17+
- Maven 3.9+ (yoki IntelliJ IDEA — o'zi Maven bilan ochadi)
- Node.js 18+

## Ishga tushirish

**1. Baza:**

```bash
docker compose up -d
```

**2. Backend** (birinchi ishga tushishda Flyway o'zi sxema + test datani yuklaydi):

```bash
cd backend
mvn spring-boot:run
```

yoki IntelliJ'da `GrafiApplication` ni run qil. Backend: http://localhost:8080

**3. Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Ochish: http://localhost:5173 — dev-server `/api` so'rovlarini 8080'ga o'zi proksilaydi.

## Demo yo'li

1. Qidiruvga **Rustex** deb yoz.
2. `OOO "Rustexkompani"` (tugatilgan) sahifasini och.
3. Grafda ko'rasan: ta'sischi Lukaxin (qizil chiziq), sobiq rahbarlar (och kulrang, "sobiq"), manzil tuguni `(+7)` — bitta manzilda 7 firma, shuning uchun yig'ilgan.
4. Manzil tugunini bossang — qolgan firmalar ochiladi. Istalgan tugunni bosish uning aloqalarini qo'shadi.
5. `Lukaxin` sahifasiga o'tsang — "Texno Imkon" → "Buxoro Agro Servis" zanjirida firma-firmaning ta'sischisi bo'lgan holatni ham ko'rasan.

## API

| Endpoint | Tavsif |
|---|---|
| `GET /api/search?q=...` | nom/STIR/PINFL bo'yicha qidiruv |
| `GET /api/company/{uuid}` | kompaniya kartochkasi |
| `GET /api/person/{uuid}` | shaxs kartochkasi |
| `GET /api/graph?node=company:UUID&depth=2` | graf JSON (nodes + edges) |
| `GET /api/graph/expand?node=address:UUID` | yig'ilgan manzilni ochish |

## O'z test datangni yuklash

`backend/src/main/resources/db/migration/V2__seed.sql` — demo data shu yerda. Ikkita yo'l:

- shu faylni o'z INSERT'laring bilan almashtir (toza bazada), yoki
- bazani ko'tarib bo'lgach to'g'ridan-to'g'ri SQL bilan quy — sxema `V1__init.sql`'da.

Muhim qoidalar: aloqa (founder/director) yozuvlari o'chirilmaydi — tugagan aloqada `date_to` to'ldiriladi; `date_to IS NULL` = hozirgi aloqa.

## Sozlamalar

- `GraphService.MAX_NODES = 200` — grafdagi maksimal tugun.
- `GraphService.MAX_ADDRESS_NEIGHBORS = 5` — manzilda bundan ko'p firma bo'lsa, tugun yig'iladi va `(+N)` badge chiqadi.
- DB ulanish: `backend/src/main/resources/application.yml`.

## Keyingi qadamlar (yo'riqnomadagi 9-bo'lim)

Redis kesh (`@Cacheable`), rate limit (bucket4j), parser/`@Scheduled` ETL, SEO uchun SSR.
# Open-Birdarcha
