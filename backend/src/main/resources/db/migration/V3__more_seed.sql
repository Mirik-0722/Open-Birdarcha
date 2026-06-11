-- Qo'shimcha test ma'lumotlari (V2 ustiga). Maqsad: grafni boyitish va turli
-- stsenariylarni sinash — nepotizm klasteri, egalik zanjiri, nominal direktor,
-- eski/tugatilgan aloqalar, mavjud (Lukaxin) grafiga ko'prik.
--
-- ID naqshlari:  shaxs = bbbb...  firma = dddd...  manzil = adad...004+

-- ============ MANZILLAR (yangi) ============
INSERT INTO address (id, full_text, region, city) VALUES
('adadadad-0000-0000-0000-000000000004', 'Toshkent sh., Mirzo Ulugbek tumani, Buyuk Ipak Yuli 45', 'Toshkent', 'Toshkent'),
('adadadad-0000-0000-0000-000000000005', 'Namangan sh., Navoiy kochasi 12', 'Namangan', 'Namangan'),
('adadadad-0000-0000-0000-000000000006', 'Andijon sh., Bobur shox kochasi 7', 'Andijon', 'Andijon');

-- ============ SHAXSLAR ============
INSERT INTO person (id, pinfl, full_name, birth_date) VALUES
('bbbbbbbb-0000-0000-0000-000000000001', '32010190000021', 'Yusupov Sardor Alisherovich',    '1980-01-10'),
('bbbbbbbb-0000-0000-0000-000000000002', '32020192000022', 'Yusupova Dilnoza Sardorovna',     '1992-02-12'),
('bbbbbbbb-0000-0000-0000-000000000003', '32030185000023', 'Tursunov Jasur Maqsudovich',      '1985-03-15'),
('bbbbbbbb-0000-0000-0000-000000000004', '32040188000024', 'Abdullayev Otabek Rustamovich',   '1988-04-18'),
('bbbbbbbb-0000-0000-0000-000000000005', '32050190000025', 'Mirzayeva Kamola Shavkatovna',    '1990-05-20'),
('bbbbbbbb-0000-0000-0000-000000000006', '32060186000026', 'Ergashev Sanjar Bahodirovich',    '1986-06-22'),
('bbbbbbbb-0000-0000-0000-000000000007', '32070191000027', 'Qodirov Akmal Tolibovich',        '1991-07-24'),
('bbbbbbbb-0000-0000-0000-000000000008', '32080193000028', 'Yuldasheva Zarina Farhodovna',    '1993-08-26'),
('bbbbbbbb-0000-0000-0000-000000000009', '32090187000029', 'Nazarov Bekzod Ulugbekovich',     '1987-09-28'),
('bbbbbbbb-0000-0000-0000-000000000010', '32100189000030', 'Sobirov Dilshod Anvarovich',      '1989-10-30'),
('bbbbbbbb-0000-0000-0000-000000000011', '32110184000031', 'Olimova Gulnora Qahramonovna',    '1984-11-02'),
('bbbbbbbb-0000-0000-0000-000000000012', '32120190000032', 'Rashidov Farrux Davronovich',     '1990-12-04'),
('bbbbbbbb-0000-0000-0000-000000000013', '32130186000033', 'Toshmatov Sherzod Ikromovich',    '1986-01-06'),
('bbbbbbbb-0000-0000-0000-000000000014', '32140192000034', 'Karimova Sevara Botirovna',       '1992-02-08'),
('bbbbbbbb-0000-0000-0000-000000000015', '32150188000035', 'Umarov Javlon Saidovich',         '1988-03-10');

-- ============ KOMPANIYALAR ============
INSERT INTO company (id, stir, name, status, status_date, reg_date, address_id, capital) VALUES
-- Oltintog holding va shoxobchalari
('dddddddd-0000-0000-0000-000000000001', '306000001', '"Oltintog Holding" MChJ',     'active',     NULL,         '2015-03-01', 'adadadad-0000-0000-0000-000000000004', 5000000000),
('dddddddd-0000-0000-0000-000000000002', '306000002', '"Oltintog Qurilish" MChJ',    'active',     NULL,         '2016-04-10', 'adadadad-0000-0000-0000-000000000004', 800000000),
('dddddddd-0000-0000-0000-000000000003', '306000003', '"Oltintog Logistika" MChJ',   'active',     NULL,         '2016-06-15', 'adadadad-0000-0000-0000-000000000001', 400000000),
('dddddddd-0000-0000-0000-000000000004', '306000004', '"Oltintog Savdo" MChJ',       'active',     NULL,         '2017-02-20', 'adadadad-0000-0000-0000-000000000002', 300000000),
('dddddddd-0000-0000-0000-000000000005', '306000005', '"Oltintog Agro" MChJ',        'active',     NULL,         '2018-05-05', 'adadadad-0000-0000-0000-000000000003', 600000000),
('dddddddd-0000-0000-0000-000000000006', '306000006', '"Oltintog Tekstil" MChJ',     'reorganizing', '2024-09-01','2018-08-08', 'adadadad-0000-0000-0000-000000000005', 250000000),
('dddddddd-0000-0000-0000-000000000007', '306000007', '"Oltintog Media" MChJ',       'liquidated', '2023-06-01', '2019-01-12', 'adadadad-0000-0000-0000-000000000004', 50000000),
-- Egalik zanjiri (A -> B -> C -> D -> E)
('dddddddd-0000-0000-0000-000000000008', '306000008', '"Zanjir A Kapital" MChJ',     'active',     NULL,         '2017-03-03', 'adadadad-0000-0000-0000-000000000001', 200000000),
('dddddddd-0000-0000-0000-000000000009', '306000009', '"Zanjir B Invest" MChJ',      'active',     NULL,         '2018-03-03', 'adadadad-0000-0000-0000-000000000002', 150000000),
('dddddddd-0000-0000-0000-000000000010', '306000010', '"Zanjir C Trade" MChJ',       'active',     NULL,         '2019-03-03', 'adadadad-0000-0000-0000-000000000003', 120000000),
('dddddddd-0000-0000-0000-000000000011', '306000011', '"Zanjir D Servis" MChJ',      'active',     NULL,         '2020-03-03', 'adadadad-0000-0000-0000-000000000005', 90000000),
('dddddddd-0000-0000-0000-000000000012', '306000012', '"Zanjir E Group" MChJ',       'active',     NULL,         '2021-03-03', 'adadadad-0000-0000-0000-000000000006', 70000000),
-- Nominal direktor (Tursunov) boshqaradigan firmalar
('dddddddd-0000-0000-0000-000000000013', '306000013', '"Servis Plus 1" MChJ',        'active',     NULL,         '2019-04-04', 'adadadad-0000-0000-0000-000000000001', 30000000),
('dddddddd-0000-0000-0000-000000000014', '306000014', '"Servis Plus 2" MChJ',        'active',     NULL,         '2019-07-07', 'adadadad-0000-0000-0000-000000000002', 30000000),
('dddddddd-0000-0000-0000-000000000015', '306000015', '"Servis Plus 3" MChJ',        'active',     NULL,         '2020-09-09', 'adadadad-0000-0000-0000-000000000003', 30000000),
('dddddddd-0000-0000-0000-000000000016', '306000016', '"Servis Plus 4" MChJ',        'active',     NULL,         '2021-11-11', 'adadadad-0000-0000-0000-000000000004', 30000000),
-- Dilnoza klasteri
('dddddddd-0000-0000-0000-000000000017', '306000017', '"Dilnoza Trade" MChJ',        'active',     NULL,         '2019-06-06', 'adadadad-0000-0000-0000-000000000002', 100000000),
('dddddddd-0000-0000-0000-000000000018', '306000018', '"Dilnoza Invest" MChJ',       'active',     NULL,         '2020-10-10', 'adadadad-0000-0000-0000-000000000002', 80000000),
-- Mavjud (Lukaxin) grafiga ko'prik
('dddddddd-0000-0000-0000-000000000019', '306000019', '"Birlashgan Kapital" MChJ',   'active',     NULL,         '2020-01-15', 'adadadad-0000-0000-0000-000000000001', 500000000),
-- Mustaqil (past xavf) firma
('dddddddd-0000-0000-0000-000000000020', '306000020', '"Mustaqil Biznes" MChJ',      'active',     NULL,         '2021-05-05', 'adadadad-0000-0000-0000-000000000006', 40000000),
-- Mintaqaviy firmalar
('dddddddd-0000-0000-0000-000000000021', '306000021', '"Toshkent Stroy" MChJ',       'active',     NULL,         '2018-02-02', 'adadadad-0000-0000-0000-000000000004', 220000000),
('dddddddd-0000-0000-0000-000000000022', '306000022', '"Samarqand Textile" MChJ',    'active',     NULL,         '2017-08-08', 'adadadad-0000-0000-0000-000000000003', 180000000),
('dddddddd-0000-0000-0000-000000000023', '306000023', '"Buxoro Trans" MChJ',         'active',     NULL,         '2019-12-12', 'adadadad-0000-0000-0000-000000000005', 90000000),
('dddddddd-0000-0000-0000-000000000024', '306000024', '"Andijon Agro" MChJ',         'active',     NULL,         '2018-11-20', 'adadadad-0000-0000-0000-000000000006', 130000000),
('dddddddd-0000-0000-0000-000000000025', '306000025', '"Fargona Food" MChJ',         'bankrupt',   '2024-03-15', '2016-07-01', 'adadadad-0000-0000-0000-000000000005', 60000000);

-- ============ TA'SISCHILAR ============
-- person_id orqali (odam ta'sischi)
INSERT INTO founder (company_id, person_id, owner_company_id, share_percent, date_from, date_to) VALUES
('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', NULL, 100, '2015-03-01', NULL),
('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', NULL,  20, '2017-02-20', NULL),
('dddddddd-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000001', NULL,  40, '2018-08-08', NULL),
('dddddddd-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000001', NULL, 100, '2017-03-03', NULL),
('dddddddd-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000004', NULL, 100, '2019-04-04', NULL),
('dddddddd-0000-0000-0000-000000000014', 'bbbbbbbb-0000-0000-0000-000000000005', NULL, 100, '2019-07-07', NULL),
('dddddddd-0000-0000-0000-000000000015', 'bbbbbbbb-0000-0000-0000-000000000006', NULL, 100, '2020-09-09', NULL),
('dddddddd-0000-0000-0000-000000000016', 'bbbbbbbb-0000-0000-0000-000000000007', NULL, 100, '2021-11-11', NULL),
('dddddddd-0000-0000-0000-000000000017', 'bbbbbbbb-0000-0000-0000-000000000002', NULL, 100, '2019-06-06', NULL),
('dddddddd-0000-0000-0000-000000000018', 'bbbbbbbb-0000-0000-0000-000000000002', NULL, 100, '2020-10-10', NULL),
('dddddddd-0000-0000-0000-000000000019', 'bbbbbbbb-0000-0000-0000-000000000001', NULL,  50, '2020-01-15', NULL),
('dddddddd-0000-0000-0000-000000000019', 'aaaaaaaa-0000-0000-0000-000000000001', NULL,  50, '2020-01-15', NULL),
('dddddddd-0000-0000-0000-000000000020', 'bbbbbbbb-0000-0000-0000-000000000008', NULL, 100, '2021-05-05', NULL),
('dddddddd-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000009', NULL,  60, '2018-02-02', NULL),
('dddddddd-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000010', NULL,  40, '2018-02-02', NULL),
('dddddddd-0000-0000-0000-000000000022', 'bbbbbbbb-0000-0000-0000-000000000011', NULL, 100, '2017-08-08', NULL),
('dddddddd-0000-0000-0000-000000000023', 'bbbbbbbb-0000-0000-0000-000000000013', NULL, 100, '2019-12-12', NULL),
('dddddddd-0000-0000-0000-000000000024', 'bbbbbbbb-0000-0000-0000-000000000014', NULL, 100, '2018-11-20', NULL),
-- eski (sobiq) ta'sischi namunalari
('dddddddd-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000003', NULL, 100, '2017-01-01', '2018-02-02'),
('dddddddd-0000-0000-0000-000000000025', 'bbbbbbbb-0000-0000-0000-000000000015', NULL, 100, '2016-07-01', '2024-03-15');

-- owner_company_id orqali (firma firmaning ta'sischisi)
INSERT INTO founder (company_id, person_id, owner_company_id, share_percent, date_from, date_to) VALUES
('dddddddd-0000-0000-0000-000000000002', NULL, 'dddddddd-0000-0000-0000-000000000001', 100, '2016-04-10', NULL),
('dddddddd-0000-0000-0000-000000000003', NULL, 'dddddddd-0000-0000-0000-000000000001', 100, '2016-06-15', NULL),
('dddddddd-0000-0000-0000-000000000004', NULL, 'dddddddd-0000-0000-0000-000000000001',  80, '2017-02-20', NULL),
('dddddddd-0000-0000-0000-000000000005', NULL, 'dddddddd-0000-0000-0000-000000000001', 100, '2018-05-05', NULL),
('dddddddd-0000-0000-0000-000000000006', NULL, 'dddddddd-0000-0000-0000-000000000001',  60, '2018-08-08', NULL),
('dddddddd-0000-0000-0000-000000000007', NULL, 'dddddddd-0000-0000-0000-000000000001', 100, '2019-01-12', '2023-06-01'),
('dddddddd-0000-0000-0000-000000000009', NULL, 'dddddddd-0000-0000-0000-000000000008', 100, '2018-03-03', NULL),
('dddddddd-0000-0000-0000-000000000010', NULL, 'dddddddd-0000-0000-0000-000000000009', 100, '2019-03-03', NULL),
('dddddddd-0000-0000-0000-000000000011', NULL, 'dddddddd-0000-0000-0000-000000000010', 100, '2020-03-03', NULL),
('dddddddd-0000-0000-0000-000000000012', NULL, 'dddddddd-0000-0000-0000-000000000011', 100, '2021-03-03', NULL);

-- ============ RAHBARLAR ============
INSERT INTO director (company_id, person_id, position, date_from, date_to) VALUES
('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'bosh direktor', '2015-03-01', NULL),
('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004', 'direktor',      '2016-04-10', NULL),
('dddddddd-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000005', 'direktor',      '2016-06-15', NULL),
('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', 'direktor',      '2017-02-20', NULL),
('dddddddd-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000006', 'direktor',      '2018-05-05', NULL),
('dddddddd-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000007', 'direktor',      '2018-08-08', NULL),
('dddddddd-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000003', 'direktor',      '2019-01-12', '2023-06-01'),
('dddddddd-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000009', 'direktor',      '2017-03-03', NULL),
('dddddddd-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000010', 'direktor',      '2018-03-03', NULL),
('dddddddd-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000011', 'direktor',      '2019-03-03', NULL),
('dddddddd-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000012', 'direktor',      '2020-03-03', NULL),
('dddddddd-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000013', 'direktor',      '2021-03-03', NULL),
-- nominal direktor Tursunov (b03) bir nechta firmada
('dddddddd-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000001', 'direktor',      '2019-04-04', '2020-01-01'),
('dddddddd-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000003', 'direktor',      '2020-01-01', NULL),
('dddddddd-0000-0000-0000-000000000014', 'bbbbbbbb-0000-0000-0000-000000000003', 'direktor',      '2019-07-07', NULL),
('dddddddd-0000-0000-0000-000000000015', 'bbbbbbbb-0000-0000-0000-000000000003', 'direktor',      '2020-09-09', NULL),
('dddddddd-0000-0000-0000-000000000016', 'bbbbbbbb-0000-0000-0000-000000000003', 'direktor',      '2021-11-11', NULL),
-- Dilnoza
('dddddddd-0000-0000-0000-000000000017', 'bbbbbbbb-0000-0000-0000-000000000002', 'direktor',      '2019-06-06', NULL),
('dddddddd-0000-0000-0000-000000000018', 'bbbbbbbb-0000-0000-0000-000000000002', 'direktor',      '2020-10-10', NULL),
-- ko'prik + mustaqil + mintaqaviy
('dddddddd-0000-0000-0000-000000000019', 'bbbbbbbb-0000-0000-0000-000000000001', 'direktor',      '2020-01-15', NULL),
('dddddddd-0000-0000-0000-000000000020', 'bbbbbbbb-0000-0000-0000-000000000008', 'direktor',      '2021-05-05', NULL),
('dddddddd-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000009', 'direktor',      '2018-02-02', NULL),
('dddddddd-0000-0000-0000-000000000022', 'bbbbbbbb-0000-0000-0000-000000000012', 'direktor',      '2017-08-08', NULL),
('dddddddd-0000-0000-0000-000000000023', 'bbbbbbbb-0000-0000-0000-000000000013', 'direktor',      '2019-12-12', NULL),
('dddddddd-0000-0000-0000-000000000024', 'bbbbbbbb-0000-0000-0000-000000000015', 'direktor',      '2018-11-20', NULL),
('dddddddd-0000-0000-0000-000000000025', 'bbbbbbbb-0000-0000-0000-000000000009', 'direktor',      '2016-07-01', '2024-03-15');
