-- ============================================================================
--  V4 — KATTA HAJMLI MOCK MA'LUMOT (100K+ yozuv)
--  Maqsad: grafni real masshtabda sinash. Hammasi DB ichida generate_series
--  bilan yaratiladi (fayl kichik qoladi). O'zbekcha ism/firma nomlari,
--  klasterlar, holding zanjirlari, nominal direktorlar, umumiy manzil/telefon.
--
--  Generatsiya qilingan yozuvlarni ajratib turuvchi belgilar:
--    person.pinfl  '5...'   (seed: '3...')
--    company.stir  '7...'   (seed: '3...')
--    address       street IS NOT NULL  (seed manzillarda street NULL)
--    phone.number  '+99890...'
--
--  Hajm:  100k shaxs, 50k firma, 8k manzil, 30k telefon,
--         ~60k joriy direktor/ex, ~95k ta'sischilik, 50k firma-telefon.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) MANZILLAR (8 000)
-- ---------------------------------------------------------------------------
INSERT INTO address (full_text, region, city, street, house)
SELECT
    (ARRAY['Toshkent','Samarqand','Buxoro','Andijon','Namangan','Fargona','Qarshi',
           'Termiz','Navoiy','Jizzax','Guliston','Urganch','Nukus'])[1+(g%13)]
        || ' sh., '
        || (ARRAY['Amir Temur','Bunyodkor','Mustaqillik','Navoiy','Bobur','Registon',
                  'Buyuk Ipak Yuli','Chilonzor','Yunusobod','Shifokorlar','Mirobod','Sebzor'])[1+((g/13)%12)]
        || ' ko''chasi ' || g::text || '-uy'                                  AS full_text,
    (ARRAY['Toshkent','Samarqand','Buxoro','Andijon','Namangan','Fargona','Qashqadaryo',
           'Surxondaryo','Navoiy','Jizzax','Sirdaryo','Xorazm','Qoraqalpogiston'])[1+(g%13)]   AS region,
    (ARRAY['Toshkent','Samarqand','Buxoro','Andijon','Namangan','Fargona','Qarshi',
           'Termiz','Navoiy','Jizzax','Guliston','Urganch','Nukus'])[1+(g%13)]                  AS city,
    (ARRAY['Amir Temur','Bunyodkor','Mustaqillik','Navoiy','Bobur','Registon',
           'Buyuk Ipak Yuli','Chilonzor','Yunusobod','Shifokorlar','Mirobod','Sebzor'])[1+((g/13)%12)] AS street,
    g::text                                                                    AS house
FROM generate_series(1, 8000) g;

CREATE TEMP TABLE a_idx ON COMMIT DROP AS
SELECT id, row_number() OVER (ORDER BY full_text) AS n
FROM address WHERE street IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) SHAXSLAR (100 000)
-- ---------------------------------------------------------------------------
INSERT INTO person (pinfl, full_name, birth_date)
SELECT
    '5' || lpad(g::text, 13, '0'),
    CASE WHEN g % 2 = 0 THEN
        (ARRAY['Karimov','Rahimov','Yusupov','Tursunov','Abdullayev','Mirzayev','Ergashev',
               'Qodirov','Yuldashev','Nazarov','Sobirov','Olimov','Rashidov','Toshmatov',
               'Umarov','Saidov','Aliyev','Hamidov','Sultonov','Jalilov','Komilov','Mahmudov',
               'Nematov','Raxmonov'])[1+(g%24)]
        || ' ' ||
        (ARRAY['Aziz','Bobur','Sardor','Jasur','Otabek','Sanjar','Akmal','Bekzod','Dilshod',
               'Farrux','Sherzod','Javlon','Bahodir','Ulugbek','Davron','Ikrom','Tolib','Rustam',
               'Shavkat','Anvar','Botir','Said','Erkin','Olim'])[1+((g/24)%24)]
        || ' ' ||
        (ARRAY['Aziz','Bobur','Sardor','Jasur','Otabek','Sanjar','Akmal','Bekzod','Dilshod',
               'Farrux','Sherzod','Javlon','Bahodir','Ulugbek','Davron','Ikrom','Tolib','Rustam',
               'Shavkat','Anvar','Botir','Said','Erkin','Olim'])[1+((g/7)%24)] || 'ovich'
    ELSE
        (ARRAY['Karimova','Rahimova','Yusupova','Tursunova','Abdullayeva','Mirzayeva','Ergasheva',
               'Qodirova','Yuldasheva','Nazarova','Sobirova','Olimova','Rashidova','Toshmatova',
               'Umarova','Saidova','Aliyeva','Hamidova','Sultonova','Jalilova'])[1+(g%20)]
        || ' ' ||
        (ARRAY['Nilufar','Madina','Dilnoza','Kamola','Zarina','Gulnora','Sevara','Nigora',
               'Feruza','Malika','Shahnoza','Aziza','Munira','Dilfuza','Yulduz','Kumush'])[1+((g/20)%16)]
        || ' ' ||
        (ARRAY['Aziz','Bobur','Sardor','Jasur','Otabek','Sanjar','Akmal','Bekzod','Dilshod',
               'Farrux','Sherzod','Javlon','Bahodir','Ulugbek','Davron','Ikrom','Tolib','Rustam',
               'Shavkat','Anvar','Botir','Said','Erkin','Olim'])[1+((g/7)%24)] || 'ovna'
    END,
    DATE '1955-01-01' + (g % 18000)
FROM generate_series(1, 100000) g;

CREATE TEMP TABLE p_idx ON COMMIT DROP AS
SELECT id, row_number() OVER (ORDER BY pinfl) AS n
FROM person WHERE pinfl LIKE '5%';

-- ---------------------------------------------------------------------------
-- 3) KOMPANIYALAR (50 000)
-- ---------------------------------------------------------------------------
INSERT INTO company (stir, name, short_name, status, status_date, reg_date, address_id, capital)
SELECT
    '7' || lpad(g::text, 10, '0'),
    '"' ||
        (ARRAY['Oltin','Buyuk','Yangi','Zilol','Nur','Baraka','Orzu','Imkon','Markaz','Saxovat',
               'Hilol','Ziyo','Texno','Mega','Grand','Star','Universal','Optima','Premium','Standart'])[1+(g%20)]
        || ' ' ||
        (ARRAY['Savdo','Qurilish','Logistika','Agro','Tekstil','Invest','Servis','Trade','Group',
               'Holding','Industriya','Energo','Trans','Stroy','Komplekt','Eksport'])[1+((g/20)%16)]
        || '" ' ||
        (ARRAY['MChJ','MChJ','MChJ','AJ','XK'])[1+(g%5)]                       AS name,
    (ARRAY['Oltin','Buyuk','Yangi','Zilol','Nur','Baraka','Orzu','Imkon','Markaz','Saxovat',
           'Hilol','Ziyo','Texno','Mega','Grand','Star','Universal','Optima','Premium','Standart'])[1+(g%20)] AS short_name,
    st.status,
    CASE WHEN st.status = 'active' THEN NULL ELSE DATE '2018-01-01' + (g % 2000) END,
    DATE '2008-01-01' + (g % 5000),
    a.id,
    ((1 + (g % 500)) * 1000000)::numeric
FROM generate_series(1, 50000) g
JOIN a_idx a ON a.n = 1 + (g % 8000)
CROSS JOIN LATERAL (
    SELECT CASE (g % 20)
               WHEN 0 THEN 'liquidated'
               WHEN 1 THEN 'reorganizing'
               WHEN 2 THEN 'bankrupt'
               ELSE 'active'
           END AS status
) st;

CREATE TEMP TABLE c_idx ON COMMIT DROP AS
SELECT id, row_number() OVER (ORDER BY stir) AS n
FROM company WHERE stir LIKE '7%';

-- ---------------------------------------------------------------------------
-- 4) JORIY DIREKTORLAR (har firmaga 1 ta)
--    90% — 1:1 (egasi=rahbar realizmi),  10% — 1500 ta nominal direktor puli
-- ---------------------------------------------------------------------------
INSERT INTO director (company_id, person_id, position, date_from)
SELECT c.id, p.id,
       (ARRAY['direktor','bosh direktor','direktor','direktor'])[1+(c.n%4)],
       DATE '2012-01-01' + (c.n % 3000)::int
FROM c_idx c
JOIN p_idx p ON p.n = CASE WHEN c.n % 10 < 9 THEN c.n ELSE 1 + (c.n % 1500) END;

-- ---------------------------------------------------------------------------
-- 5) TA'SISCHILAR — shaxs (asosiy ulush, 70% firma)
-- ---------------------------------------------------------------------------
INSERT INTO founder (company_id, person_id, share_percent, date_from)
SELECT c.id, p.id,
       CASE WHEN c.n % 10 < 5 THEN 60 ELSE 100 END,
       DATE '2012-01-01' + (c.n % 3000)::int
FROM c_idx c
JOIN p_idx p ON p.n = CASE WHEN c.n % 10 < 5 THEN c.n ELSE 1 + (c.n % 1200) END
WHERE c.n % 10 <= 6;

-- ---------------------------------------------------------------------------
-- 6) TA'SISCHILAR — ikkinchi shaxs (ulush bo'linishi, 40%)
-- ---------------------------------------------------------------------------
INSERT INTO founder (company_id, person_id, share_percent, date_from)
SELECT c.id, p.id, 40, DATE '2012-01-01' + (c.n % 3000)::int
FROM c_idx c
JOIN p_idx p ON p.n = 1 + ((c.n * 3 + 7) % 100000)
WHERE c.n % 10 < 5 AND (1 + ((c.n * 3 + 7) % 100000)) <> c.n;

-- ---------------------------------------------------------------------------
-- 7) TA'SISCHILAR — firma firmaning egasi (holding zanjirlari)
--    2000 ta holding ko'plab firmaning egasi -> yirik klasterlar
-- ---------------------------------------------------------------------------
INSERT INTO founder (company_id, owner_company_id, share_percent, date_from)
SELECT c.id, o.id, 100, DATE '2012-01-01' + (c.n % 3000)::int
FROM c_idx c
JOIN c_idx o ON o.n = 1 + (c.n % 2000)
WHERE c.n % 10 IN (7, 8) AND (1 + (c.n % 2000)) <> c.n;

-- ---------------------------------------------------------------------------
-- 8) SOBIQ (tarixiy) DIREKTORLAR — date_to to'ldirilgan (10k firma)
-- ---------------------------------------------------------------------------
INSERT INTO director (company_id, person_id, position, date_from, date_to)
SELECT c.id, p.id, 'direktor',
       DATE '2009-01-01' + (c.n % 1000)::int,
       DATE '2012-01-01' + (c.n % 500)::int
FROM c_idx c
JOIN p_idx p ON p.n = 1 + ((c.n * 13 + 5) % 100000)
WHERE c.n % 5 = 0;

-- ---------------------------------------------------------------------------
-- 9) SOBIQ (tarixiy) TA'SISCHILAR — date_to to'ldirilgan
-- ---------------------------------------------------------------------------
INSERT INTO founder (company_id, person_id, share_percent, date_from, date_to)
SELECT c.id, p.id, 50,
       DATE '2009-01-01' + (c.n % 1000)::int,
       DATE '2013-01-01' + (c.n % 500)::int
FROM c_idx c
JOIN p_idx p ON p.n = 1 + ((c.n * 17 + 3) % 100000)
WHERE c.n % 7 = 0;

-- ---------------------------------------------------------------------------
-- 10) TELEFONLAR (30 000) + firma-telefon (umumiy raqamlar = signal)
-- ---------------------------------------------------------------------------
INSERT INTO phone (number)
SELECT '+99890' || lpad(g::text, 7, '0')
FROM generate_series(1, 30000) g;

CREATE TEMP TABLE ph_idx ON COMMIT DROP AS
SELECT id, row_number() OVER (ORDER BY number) AS n
FROM phone WHERE number LIKE '+99890%';

INSERT INTO company_phone (company_id, phone_id, date_from)
SELECT c.id, ph.id, DATE '2012-01-01' + (c.n % 3000)::int
FROM c_idx c
JOIN ph_idx ph ON ph.n = 1 + (c.n % 30000);
