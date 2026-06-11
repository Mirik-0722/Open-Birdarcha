-- Aloqalar grafi: asosiy sxema
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ "NARSA" JADVALLARI ============

CREATE TABLE person (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pinfl       VARCHAR(14) UNIQUE,
    full_name   TEXT NOT NULL,
    birth_date  DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE address (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_text  TEXT NOT NULL UNIQUE,
    region     TEXT,
    city       TEXT,
    street     TEXT,
    house      TEXT
);

CREATE TABLE company (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stir        VARCHAR(14) UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    short_name  TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'liquidated', 'reorganizing', 'bankrupt')),
    status_date DATE,
    reg_date    DATE,
    address_id  UUID REFERENCES address(id),
    capital     NUMERIC(18,2),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ "ALOQA" JADVALLARI ============
-- Qoida: yozuv o'chirilmaydi; aloqa tugasa date_to to'ldiriladi.

-- Ta'sischilik. Ta'sischi YO odam (person_id), YO firma (owner_company_id).
CREATE TABLE founder (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID NOT NULL REFERENCES company(id),
    person_id        UUID REFERENCES person(id),
    owner_company_id UUID REFERENCES company(id),
    share_percent    NUMERIC(5,2),
    share_amount     NUMERIC(18,2),
    date_from        DATE,
    date_to          DATE,
    source           TEXT,
    CHECK (
        (person_id IS NOT NULL AND owner_company_id IS NULL) OR
        (person_id IS NULL AND owner_company_id IS NOT NULL)
    )
);

-- Rahbarlik
CREATE TABLE director (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company(id),
    person_id  UUID NOT NULL REFERENCES person(id),
    position   TEXT DEFAULT 'direktor',
    date_from  DATE,
    date_to    DATE,
    source     TEXT
);

-- Manzil tarixi (firma ko'chsa, eski manzil shu yerda qoladi)
CREATE TABLE company_address_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company(id),
    address_id UUID NOT NULL REFERENCES address(id),
    date_from  DATE,
    date_to    DATE
);

-- Telefonlar (keyinroq ishlatiladi, naqsh bir xil)
CREATE TABLE phone (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE company_phone (
    company_id UUID NOT NULL REFERENCES company(id),
    phone_id   UUID NOT NULL REFERENCES phone(id),
    date_from  DATE,
    date_to    DATE,
    PRIMARY KEY (company_id, phone_id)
);

-- ETL: manbadan kelgan xom javob, o'zgartirilmasdan saqlanadi
CREATE TABLE raw_record (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source      TEXT NOT NULL,
    external_id TEXT,
    payload     JSONB NOT NULL,
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed   BOOLEAN NOT NULL DEFAULT false
);

-- ============ INDEKSLAR ============

CREATE INDEX idx_founder_company  ON founder(company_id);
CREATE INDEX idx_founder_person   ON founder(person_id);
CREATE INDEX idx_founder_owner    ON founder(owner_company_id);
CREATE INDEX idx_director_company ON director(company_id);
CREATE INDEX idx_director_person  ON director(person_id);
CREATE INDEX idx_company_address  ON company(address_id);
CREATE INDEX idx_cah_address      ON company_address_history(address_id);

-- Nom bo'yicha tezkor qidiruv (ILIKE '%...%' uchun)
CREATE INDEX idx_company_name_trgm ON company USING gin (name gin_trgm_ops);
CREATE INDEX idx_person_name_trgm  ON person  USING gin (full_name gin_trgm_ops);

-- Bitta juftlik uchun ikkita "hozirgi" aloqa bo'lmasin
CREATE UNIQUE INDEX uq_director_current
    ON director(company_id, person_id) WHERE date_to IS NULL;
CREATE UNIQUE INDEX uq_founder_person_current
    ON founder(company_id, person_id) WHERE date_to IS NULL;
CREATE UNIQUE INDEX uq_founder_company_current
    ON founder(company_id, owner_company_id) WHERE date_to IS NULL;
