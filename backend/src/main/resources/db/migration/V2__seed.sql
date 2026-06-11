-- Test ma'lumotlar. O'z datang bo'lsa, shu faylni almashtirib qo'yishing mumkin.
-- Stsenariy: Lukaxin -> Rustexkompani (tugatilgan), bitta manzilda 7 ta firma,
-- firma-firmaning ta'sischisi (Texno Imkon -> Buxoro Agro Servis), tarixiy aloqalar.

-- ============ MANZILLAR ============
INSERT INTO address (id, full_text, region, city) VALUES
('adadadad-0000-0000-0000-000000000001', 'Toshkent sh., Chilonzor tumani, Bunyodkor ko''chasi 12', 'Toshkent', 'Toshkent'),
('adadadad-0000-0000-0000-000000000002', 'Toshkent sh., Yunusobod tumani, Amir Temur shoh ko''chasi 108', 'Toshkent', 'Toshkent'),
('adadadad-0000-0000-0000-000000000003', 'Samarqand sh., Registon ko''chasi 5', 'Samarqand', 'Samarqand');

-- ============ SHAXSLAR ============
INSERT INTO person (id, pinfl, full_name, birth_date) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', '30101850000011', 'Lukaxin Pavel Vladimirovich', '1985-01-01'),
('aaaaaaaa-0000-0000-0000-000000000002', '30202880000012', 'Karimov Aziz Baxtiyorovich',  '1988-02-02'),
('aaaaaaaa-0000-0000-0000-000000000003', '30303900000013', 'Saidova Nilufar Erkinovna',   '1990-03-03'),
('aaaaaaaa-0000-0000-0000-000000000004', '30404920000014', 'Rahimov Bobur Olimovich',     '1992-04-04'),
('aaaaaaaa-0000-0000-0000-000000000005', '30505950000015', 'Tosheva Madina Akmalovna',    '1995-05-05');

-- ============ KOMPANIYALAR ============
INSERT INTO company (id, stir, name, status, status_date, reg_date, address_id, capital) VALUES
('cccccccc-0000-0000-0000-000000000001', '305412345', 'OOO "Rustexkompani"',        'liquidated', '2023-05-20', '2016-02-10', 'adadadad-0000-0000-0000-000000000001', 100000000),
('cccccccc-0000-0000-0000-000000000002', '305998877', '"Texno Imkon" MChJ',         'active',     NULL,         '2018-07-01', 'adadadad-0000-0000-0000-000000000002', 50000000),
('cccccccc-0000-0000-0000-000000000003', '304556677', '"Buxoro Agro Servis" MChJ',  'active',     NULL,         '2020-03-15', 'adadadad-0000-0000-0000-000000000003', 200000000),
('cccccccc-0000-0000-0000-000000000004', '309112233', '"Digital Yulduz" MChJ',      'active',     NULL,         '2021-11-05', 'adadadad-0000-0000-0000-000000000001', 10000000),
('cccccccc-0000-0000-0000-000000000005', '301234501', '"Chilonzor Savdo" MChJ',     'active',     NULL,         '2019-01-10', 'adadadad-0000-0000-0000-000000000001', 5000000),
('cccccccc-0000-0000-0000-000000000006', '301234502', '"Orzu Logistik" MChJ',       'active',     NULL,         '2019-06-20', 'adadadad-0000-0000-0000-000000000001', 5000000),
('cccccccc-0000-0000-0000-000000000007', '301234503', '"Nur Qurilish Invest" MChJ', 'active',     NULL,         '2020-09-01', 'adadadad-0000-0000-0000-000000000001', 30000000),
('cccccccc-0000-0000-0000-000000000008', '301234504', '"Baraka Trade Group" MChJ',  'active',     NULL,         '2021-04-14', 'adadadad-0000-0000-0000-000000000001', 8000000),
('cccccccc-0000-0000-0000-000000000009', '301234505', '"Imkon Servis Plus" MChJ',   'liquidated', '2024-02-01', '2018-10-10', 'adadadad-0000-0000-0000-000000000001', 3000000);

-- ============ TA'SISCHILAR ============
-- date_to = NULL -> hozirgi aloqa; to'ldirilgan -> tarixiy (grafda "sobiq")
INSERT INTO founder (company_id, person_id, owner_company_id, share_percent, date_from, date_to) VALUES
('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, 100, '2016-02-10', NULL),
('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', NULL,  60, '2018-07-01', NULL),
('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', NULL,  40, '2018-07-01', NULL),
-- firma-firmaning ta'sischisi:
('cccccccc-0000-0000-0000-000000000003', NULL, 'cccccccc-0000-0000-0000-000000000002', 100, '2020-03-15', NULL),
('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', NULL, 100, '2022-12-01', NULL),
-- sobiq ta'sischi (tarixiy aloqa namunasi):
('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', NULL,  50, '2021-11-05', '2022-12-01'),
('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004', NULL, 100, '2019-01-10', NULL),
('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000004', NULL, 100, '2019-06-20', NULL),
('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000005', NULL, 100, '2020-09-01', NULL),
('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000005', NULL, 100, '2021-04-14', NULL),
('cccccccc-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000004', NULL, 100, '2018-10-10', '2024-02-01');

-- ============ RAHBARLAR ============
INSERT INTO director (company_id, person_id, position, date_from, date_to) VALUES
-- Rustexkompani: ikkala rahbar ham tarixiy (firma tugatilgan)
('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'direktor', '2016-02-10', '2021-08-30'),
('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'direktor', '2021-08-30', '2023-05-20'),
('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 'direktor', '2018-07-01', NULL),
('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000004', 'direktor', '2020-03-15', NULL),
('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'direktor', '2021-11-05', NULL),
('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004', 'direktor', '2019-01-10', NULL),
('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000004', 'direktor', '2019-06-20', NULL),
('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000005', 'direktor', '2020-09-01', NULL),
('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000005', 'direktor', '2021-04-14', NULL),
('cccccccc-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000004', 'direktor', '2018-10-10', '2024-02-01');

-- ============ MANZIL TARIXI ============
-- Hozirgi manzillar (company.address_id) bilan mos; bitta ko'chish namunasi:
INSERT INTO company_address_history (company_id, address_id, date_from, date_to) VALUES
('cccccccc-0000-0000-0000-000000000002', 'adadadad-0000-0000-0000-000000000001', '2018-07-01', '2019-12-31'),
('cccccccc-0000-0000-0000-000000000002', 'adadadad-0000-0000-0000-000000000002', '2020-01-01', NULL);
