# Ma'lumotlarni import qilish (Open Birdarcha)

Bu hujjat tizimga biznes-ma'lumotlarni (firmalar, shaxslar, ta'sischilik/rahbarlik aloqalari, manzillar, telefonlar) qanday yuklashni tushuntiradi.

> **Asosiy tamoyil:** import **SQL orqali** amalga oshiriladi — to'g'ridan-to'g'ri PostgreSQL'ga (Flyway migration, `psql` yoki `COPY`/CSV). Hozircha REST upload, fayl yuklash yoki ETL protsessori **yo'q** (`raw_record` jadvali bor, lekin uni qayta ishlovchi kod hali yozilmagan). Backend bazadan **jonli** o'qiydi (JdbcClient) — INSERT qilingan zahoti ma'lumot qidiruv va grafda ko'rinadi, hech narsani qayta indekslash shart emas.

---

## 1. Ma'lumotlar modeli

### "Narsa" jadvallari

| Jadval | Asosiy ustunlar | Izoh |
|--------|-----------------|------|
| `person` | `id` UUID PK, `pinfl` VARCHAR(14) **UNIQUE** (null bo'lishi mumkin), `full_name` TEXT **NOT NULL**, `birth_date` DATE | Jismoniy shaxs |
| `address` | `id` UUID PK, `full_text` TEXT **NOT NULL UNIQUE**, `region`, `city`, `street`, `house` TEXT | Manzil. `full_text` — noyob kalit |
| `company` | `id` UUID PK, `stir` VARCHAR(14) **UNIQUE NOT NULL**, `name` TEXT **NOT NULL**, `short_name`, `status`, `status_date`, `reg_date`, `address_id` → `address`, `capital` NUMERIC(18,2) | Yuridik shaxs |

`company.status` faqat shu qiymatlardan biri (default `active`):
`'active'`, `'liquidated'`, `'reorganizing'`, `'bankrupt'`.

### "Aloqa" jadvallari

| Jadval | Asosiy ustunlar | Qoida |
|--------|-----------------|-------|
| `founder` | `company_id` **NOT NULL** → company, `person_id` → person, `owner_company_id` → company, `share_percent` NUMERIC(5,2), `share_amount`, `date_from`, `date_to`, `source` | Ta'sischilik. **`person_id` YOKI `owner_company_id` — aniq bittasi to'ldiriladi** (ikkalasi emas, ikkalasi bo'sh ham emas) |
| `director` | `company_id` **NOT NULL** → company, `person_id` **NOT NULL** → person, `position` (default `direktor`), `date_from`, `date_to`, `source` | Rahbarlik |
| `company_address_history` | `company_id`, `address_id`, `date_from`, `date_to` | Manzil tarixi (firma ko'chsa) |
| `phone` | `id` UUID PK, `number` VARCHAR(20) **UNIQUE NOT NULL** | Telefon raqami |
| `company_phone` | `company_id`, `phone_id`, `date_from`, `date_to`, PK(`company_id`,`phone_id`) | Firma ↔ telefon |
| `raw_record` | `source` NOT NULL, `external_id`, `payload` JSONB NOT NULL, `fetched_at`, `processed` BOOL | **ETL staging** (xom manba). Hozircha protsessor yo'q |

### Bog'lanishlar (FK) sxemasi

```
address ──< company ──< founder >── person
                   │         └────< (owner_company_id) ── company  (firma-firmaning ta'sischisi)
                   ├──< director >── person
                   ├──< company_address_history >── address
                   └──< company_phone >── phone
```

---

## 2. Muhim qoidalar (import'dan oldin o'qing)

1. **UUID `id`** avtomatik (`gen_random_uuid()`). Ikki variant:
   - `id` ni **bermaslik** → baza o'zi generatsiya qiladi (oddiy, lekin keyin bog'lash uchun qaytarib olish kerak).
   - `id` ni **o'zingiz berish** (seed fayllaridagidek `'cccccccc-...'`) → aloqalarni shu UUID'lar bilan bog'lash oson.
   - Real (CSV) import'da odatda UUID o'rniga **tabiiy kalit** (firma `stir`, shaxs `pinfl`) bilan ishlaymiz — pastdagi "Ommaviy import" bo'limiga qarang.

2. **Yozuvlar O'CHIRILMAYDI.** Aloqa tugasa — `date_to` to'ldiriladi:
   - `date_to = NULL` → **hozirgi** aloqa.
   - `date_to` to'ldirilgan → **tarixiy** ("sobiq", grafda shunday ko'rinadi).

3. **`founder` da XOR:** har satrda `person_id` **yoki** `owner_company_id` — faqat bittasi. (CHECK buni majburlaydi.)

4. **Bitta juftlik uchun ikkita "hozirgi" aloqa bo'lmaydi** (qisman unique indekslar, `WHERE date_to IS NULL`):
   - `director(company_id, person_id)`
   - `founder(company_id, person_id)`
   - `founder(company_id, owner_company_id)`
   Eski aloqani avval `date_to` bilan yoping, keyin yangisini qo'shing.

5. **Noyob maydonlar** (qayta import idempotentligi uchun kalitlar):
   `company.stir`, `person.pinfl`, `address.full_text`, `phone.number`.
   - Format: `stir` odatda **9 raqam**, `pinfl` **14 raqam** (ikkalasi ham `VARCHAR(14)`).

6. **Import tartibi (FK bog'liqligi tufayli):**
   `address` + `person` → `company` (manzilga ishora qiladi) → `founder` / `director` (firma+shaxsga ishora qiladi) → `company_address_history` / `phone` / `company_phone`.

7. **Ixtiyoriy ustunlar:** `founder` da `share_amount`, `source`; `director` da `source` — manba yoki summa kerak bo'lsa qo'shing.

---

## 3. Import usullari

### Usul A — Flyway migration (boshlang'ich/seed data uchun, tavsiya etiladi)

Versiyalangan, takrorlanadigan. Yangi fayl yarating:
`backend/src/main/resources/db/migration/V7__import_<nom>.sql` — ichiga INSERT'larni yozing. Keyingi deploy/startup'da Flyway avtomatik qo'llaydi.

> ⚠️ Migration **bir martalik**: qo'llangandan keyin o'sha faylni o'zgartirmang (checksum buziladi). Doimiy/ko'p marta import uchun **Usul B yoki C** ni ishlating.

### Usul B — `psql` orqali to'g'ridan-to'g'ri (ad-hoc / kichik hajm)

```bash
# .env dagi DATABASE_URL bilan ulanib, SQL faylni bajaring
psql "postgres://USER:PASSWORD@DB_HOST:5432/DB_NAME" -f import.sql
# yoki interaktiv:
psql "postgres://USER:PASSWORD@DB_HOST:5432/DB_NAME"
```

### Usul C — CSV / `COPY` (ommaviy, katta hajm)

Eng tez yo'l. Pastdagi "Ommaviy import (CSV)" bo'limiga qarang.

---

## 4. INSERT namunalari (har bir jadval)

Quyidagi namunalar `V2__seed.sql` uslubiga mos. (Apostrofni ikkilantiring: `ko''chasi`.)

### Manzillar
```sql
INSERT INTO address (full_text, region, city, street, house) VALUES
('Toshkent sh., Chilonzor t., Bunyodkor ko''chasi 12', 'Toshkent', 'Toshkent', 'Bunyodkor', '12');
```

### Shaxslar
```sql
INSERT INTO person (pinfl, full_name, birth_date) VALUES
('30101850000011', 'Lukaxin Pavel Vladimirovich', '1985-01-01'),
('30202880000012', 'Karimov Aziz Baxtiyorovich',  '1988-02-02');
```

### Kompaniyalar (manzilga `stir`/`full_text` orqali bog'lash)
```sql
INSERT INTO company (stir, name, status, reg_date, address_id, capital)
SELECT '305998877', '"Texno Imkon" MChJ', 'active', '2018-07-01', a.id, 50000000
FROM address a
WHERE a.full_text = 'Toshkent sh., Chilonzor t., Bunyodkor ko''chasi 12';
```

### Ta'sischilik (shaxs → firma), `stir`+`pinfl` orqali bog'lab
```sql
INSERT INTO founder (company_id, person_id, share_percent, date_from, date_to)
SELECT c.id, p.id, 60, '2018-07-01', NULL
FROM company c, person p
WHERE c.stir = '305998877' AND p.pinfl = '30202880000012';
```

### Firma-firmaning ta'sischisi (firma → firma)
```sql
INSERT INTO founder (company_id, owner_company_id, share_percent, date_from)
SELECT child.id, owner.id, 100, '2020-03-15'
FROM company child, company owner
WHERE child.stir = '304556677' AND owner.stir = '305998877';
```

### Rahbarlik (shaxs → firma)
```sql
INSERT INTO director (company_id, person_id, position, date_from)
SELECT c.id, p.id, 'direktor', '2018-07-01'
FROM company c, person p
WHERE c.stir = '305998877' AND p.pinfl = '30202880000012';
```

### Telefon
```sql
INSERT INTO phone (number) VALUES ('+998901234567');
INSERT INTO company_phone (company_id, phone_id, date_from)
SELECT c.id, ph.id, '2018-07-01'
FROM company c, phone ph
WHERE c.stir = '305998877' AND ph.number = '+998901234567';
```

---

## 5. Ommaviy import (CSV) — tabiiy kalitlar bilan

Real ma'lumotda UUID emas, `stir`/`pinfl` bo'ladi. Strategiya: CSV'ni **vaqtinchalik (staging)** jadvalga yuklab, keyin asosiy jadvallarga `INSERT ... SELECT` bilan ko'chirish (FK'larni join orqali hal qilib).

### 5.1. Shaxslar (persons.csv: `pinfl,full_name,birth_date`)
```sql
CREATE TEMP TABLE stg_person (pinfl text, full_name text, birth_date date);
\copy stg_person FROM 'persons.csv' WITH (FORMAT csv, HEADER true)

INSERT INTO person (pinfl, full_name, birth_date)
SELECT pinfl, full_name, birth_date FROM stg_person
ON CONFLICT (pinfl) DO UPDATE
  -- COALESCE: CSV'dagi bo'sh katak (NULL) mavjud qiymatni o'chirib yubormaydi
  SET full_name  = COALESCE(EXCLUDED.full_name, person.full_name),
      birth_date = COALESCE(EXCLUDED.birth_date, person.birth_date),
      updated_at = now();
```

### 5.2. Kompaniyalar (companies.csv: `stir,name,status,reg_date,address_full_text,capital`)
```sql
CREATE TEMP TABLE stg_company (stir text, name text, status text, reg_date date, address_full_text text, capital numeric);
\copy stg_company FROM 'companies.csv' WITH (FORMAT csv, HEADER true)

-- avval yangi manzillarni qo'shamiz (full_text noyob)
INSERT INTO address (full_text)
SELECT DISTINCT address_full_text FROM stg_company WHERE address_full_text IS NOT NULL
ON CONFLICT (full_text) DO NOTHING;

-- keyin kompaniyalar (address_id ni join bilan)
INSERT INTO company (stir, name, status, reg_date, address_id, capital)
SELECT s.stir, s.name, COALESCE(s.status,'active'), s.reg_date, a.id, s.capital
FROM stg_company s
LEFT JOIN address a ON a.full_text = s.address_full_text
ON CONFLICT (stir) DO UPDATE
  -- COALESCE: qayta import'da CSV'dagi bo'sh katak mavjud qiymatni O'CHIRIB yubormaydi
  SET name       = COALESCE(EXCLUDED.name, company.name),
      status     = COALESCE(EXCLUDED.status, company.status),
      address_id = COALESCE(EXCLUDED.address_id, company.address_id),
      capital    = COALESCE(EXCLUDED.capital, company.capital),
      updated_at = now();
```

> ⚠️ **Qayta import xavfi:** `DO UPDATE SET x = EXCLUDED.x` to'g'ridan-to'g'ri yozsangiz, CSV'dagi **bo'sh katak** mavjud qiymatni `NULL` qilib o'chiradi. Shuning uchun yuqorida `COALESCE(EXCLUDED.x, company.x)` ishlatilgan — faqat yangi qiymat bo'lsa yangilanadi.

### 5.3. Ta'sischilar (founders.csv: `company_stir,person_pinfl,share_percent,date_from,date_to`)
```sql
CREATE TEMP TABLE stg_founder (company_stir text, person_pinfl text, share_percent numeric, date_from date, date_to date);
\copy stg_founder FROM 'founders.csv' WITH (FORMAT csv, HEADER true)

INSERT INTO founder (company_id, person_id, share_percent, date_from, date_to)
SELECT c.id, p.id, s.share_percent, s.date_from, s.date_to
FROM stg_founder s
JOIN company c ON c.stir = s.company_stir
JOIN person  p ON p.pinfl = s.person_pinfl
-- bir xil "hozirgi" aloqani ikki marta qo'shmaslik uchun:
ON CONFLICT (company_id, person_id) WHERE date_to IS NULL DO NOTHING;
```
> **Diqqat (founder):** bu `ON CONFLICT` target faqat **shaxs** ta'sischilari uchun (`person_id`). **Firma-firma** ta'sischisi (`owner_company_id`) bo'lsa `ON CONFLICT (company_id, owner_company_id) WHERE date_to IS NULL` ishlating va ikki holatni **alohida** import qiling (aks holda firma-firma duplikatlari ushlamay xato beradi).
>
> **Rahbarlar** (`director`) da esa `(company_id, person_id)` indeksi bor — shu shaxs naqshi to'g'ridan-to'g'ri ishlaydi.

> **Maslahat:** har CSV faylda sarlavha (HEADER) bo'lsin, sana formati `YYYY-MM-DD`, raqamlarda o'nlik nuqta (`.`). Bo'sh qiymat uchun CSV'da bo'sh katak qoldiring (NULL bo'ladi).

---

## 6. Qayta import / yangilash (idempotentlik)

- **Narsa jadvallari** noyob kalit orqali xavfsiz qayta import qilinadi:
  `ON CONFLICT (stir|pinfl|full_text|number) DO UPDATE/NOTHING`.
- **Aloqa jadvallari** (founder/director) da "hozirgi" aloqa uchun qisman unique bor —
  `ON CONFLICT (company_id, person_id) WHERE date_to IS NULL DO NOTHING` ishlating
  (yoki avval eski aloqani `UPDATE ... SET date_to = ...` bilan yoping).

Aloqa tugaganini belgilash (o'chirish O'RNIGA):
```sql
UPDATE founder SET date_to = '2024-02-01'
WHERE company_id = (SELECT id FROM company WHERE stir = '305412345')
  AND person_id  = (SELECT id FROM person  WHERE pinfl = '30101850000011')
  AND date_to IS NULL;
```

---

## 7. Import'dan keyin tekshirish

```sql
SELECT count(*) FROM company;
SELECT count(*) FROM person;
SELECT count(*) FROM founder WHERE date_to IS NULL;   -- hozirgi ta'sischilar

-- bitta firma bog'lanishlari to'g'ri kelganini ko'rish:
SELECT c.name, p.full_name, f.share_percent
FROM founder f JOIN company c ON c.id=f.company_id JOIN person p ON p.id=f.person_id
WHERE c.stir = '305998877';
```
Keyin saytda qidiruv (`/`) yoki graf (`/company/<id>`) orqali ko'rinishini tasdiqlang. Trigram indekslari (`name`, `full_name`) avtomatik yangilanadi — qayta indekslash shart emas.

---

## 8. `raw_record` (ETL staging) — kelajak uchun

`raw_record` manbadan kelgan **xom javobni** (JSON) o'zgartirmasdan saqlash uchun:
```sql
INSERT INTO raw_record (source, external_id, payload)
VALUES ('soliq_qomitasi', '305998877', '{"stir":"305998877","name":"...","founders":[...]}'::jsonb);
```
Hozircha bu jadvalni **normalizatsiya qiladigan kod yo'q** (`processed` har doim `false`). Manbadan avtomatik yig'ish (ETL) kerak bo'lsa — alohida xizmat/protsessor yozish kerak (kelajakdagi ish).

---

## 9. Tez-tez uchraydigan xatolar

| Xato | Sabab / yechim |
|------|----------------|
| `duplicate key value ... company_stir_key` | `stir` allaqachon bor → `ON CONFLICT (stir) DO UPDATE/NOTHING` |
| `new row for relation "company" violates check constraint` | `status` ruxsat etilgan 4 qiymatdan emas |
| `violates check constraint` (founder) | `person_id` va `owner_company_id` ikkalasi to'ldirilgan yoki ikkalasi bo'sh — aniq bittasi bo'lsin |
| `null value in column "company_id"` | FK join natija bermadi (firma `stir` topilmadi) — avval `company` ni import qiling |
| `duplicate key ... uq_founder_person_current` | Shu juftlik uchun allaqachon "hozirgi" aloqa bor — eski `date_to` ni yoping yoki `ON CONFLICT ... WHERE date_to IS NULL` |
| Apostrof xatosi | SQL string ichida `'` ni `''` qiling |

---

## Qisqacha

1. Tartib: **address + person → company → founder/director → telefon/tarix**.
2. Bog'lash: tabiiy kalit (`stir`, `pinfl`, `full_text`) orqali `INSERT ... SELECT ... JOIN`.
3. `date_to = NULL` = hozirgi, to'ldirilgan = tarixiy. Yozuv o'chirilmaydi.
4. Qayta import: `ON CONFLICT` bilan idempotent.
5. Boshlang'ich data — Flyway migration (`V7__...`); ommaviy/doimiy — `psql` + CSV `\copy`.
