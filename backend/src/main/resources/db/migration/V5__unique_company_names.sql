-- ============================================================================
--  V5 — FIRMA NOMLARINI NOYOB QILISH
--  V4 da nomlar atigi ~320 xil edi (ko'p takror). Bu yerda har bir generatsiya
--  qilingan firmaga (stir '7...') noyob nom beriladi.
--
--  Usul: 4 ta so'z pulidan aralash-radiks (mixed-radix) bijeksiya:
--        20 (brand) x 20 (root) x 16 (sektor) x 8 (qual) = 51 200 kombinatsiya
--        -> 50 000 firma uchun barchasi noyob.
-- ============================================================================

WITH cc AS (
    SELECT id, (row_number() OVER (ORDER BY stir) - 1) AS x
    FROM company
    WHERE stir LIKE '7%'
)
UPDATE company c
SET name = '"' || w.brand || ' ' || w.root || ' ' || w.sector || ' ' || w.qual || '" ' || w.form,
    short_name = w.brand || ' ' || w.root
FROM cc
CROSS JOIN LATERAL (
    SELECT
        (ARRAY['Oltin','Buyuk','Yangi','Zilol','Nur','Baraka','Orzu','Imkon','Markaz','Saxovat',
               'Hilol','Ziyo','Texno','Mega','Grand','Star','Universal','Optima','Premium','Standart']
        )[1 + (cc.x % 20)::int]                                  AS brand,
        (ARRAY['Sharq','Vatan','Ipak','Zamin','Bahor','Quyosh','Chashma','Lola','Anhor','Bogbon',
               'Diyor','Maydon','Shodlik','Yulduz','Gavhar','Marvarid','Sirdaryo','Zarafshon','Chirchiq','Amudaryo']
        )[1 + ((cc.x / 20) % 20)::int]                           AS root,
        (ARRAY['Savdo','Qurilish','Logistika','Agro','Tekstil','Invest','Servis','Trade','Group',
               'Holding','Industriya','Energo','Trans','Stroy','Komplekt','Eksport']
        )[1 + ((cc.x / 400) % 16)::int]                          AS sector,
        (ARRAY['Plus','Pro','Express','Global','Prime','Elit','Komfort','Tizim']
        )[1 + ((cc.x / 6400) % 8)::int]                          AS qual,
        (ARRAY['MChJ','MChJ','MChJ','AJ','XK']
        )[1 + (cc.x % 5)::int]                                   AS form
) w
WHERE c.id = cc.id;
