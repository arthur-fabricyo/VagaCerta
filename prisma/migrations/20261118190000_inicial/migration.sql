BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "fuso" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unidade_id" UUID NOT NULL,
    "modo" TEXT NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "bloco_minutos" INTEGER,
    "tolerancia_minutos" INTEGER NOT NULL DEFAULT 0,
    "tolerancia_modo" TEXT NOT NULL DEFAULT 'cobra_total',
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unidade_id" UUID NOT NULL,
    "tarifa_id" UUID NOT NULL,
    "placa" VARCHAR(7) NOT NULL,
    "placa_sugerida_ia" VARCHAR(7),
    "confianca_ia" TEXT,
    "foto" BYTEA,
    "foto_mime" TEXT,
    "observacao" TEXT,
    "operador_entrada_id" TEXT NOT NULL,
    "operador_saida_id" TEXT,
    "entrada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saida_em" TIMESTAMPTZ(3),
    "duracao_seg" DECIMAL(15,3),
    "cobravel_seg" DECIMAL(15,3),
    "blocos" INTEGER,
    "valor_centavos" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_nome_key" ON "unidades"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_unidade_id_vigente_desde_key" ON "tarifas"("unidade_id", "vigente_desde");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_unidade_id_id_key" ON "tarifas"("unidade_id", "id");

-- CreateIndex
CREATE INDEX "visitas_unidade_id_placa_entrada_em_idx" ON "visitas"("unidade_id", "placa", "entrada_em");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_placa_aberta_unidade_key" ON "visitas"("unidade_id", "placa") WHERE ("status" = 'aberta');

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_tarifa_da_unidade_fkey" FOREIGN KEY ("unidade_id", "tarifa_id") REFERENCES "tarifas"("unidade_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_operador_entrada_id_fkey" FOREIGN KEY ("operador_entrada_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_operador_saida_id_fkey" FOREIGN KEY ("operador_saida_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restrições de negócio que o Prisma Schema não representa.
ALTER TABLE "tarifas"
    ADD CONSTRAINT "tarifas_modo_valido" CHECK ("modo" IN ('proporcional', 'blocos')),
    ADD CONSTRAINT "tarifas_preco_positivo" CHECK ("preco_centavos" > 0),
    ADD CONSTRAINT "tarifas_bloco_valido" CHECK (
        ("modo" = 'blocos' AND "bloco_minutos" IS NOT NULL AND "bloco_minutos" > 0)
        OR ("modo" = 'proporcional' AND "bloco_minutos" IS NULL)
    ),
    ADD CONSTRAINT "tarifas_tolerancia_nao_negativa" CHECK ("tolerancia_minutos" >= 0),
    ADD CONSTRAINT "tarifas_tolerancia_modo_valido" CHECK ("tolerancia_modo" IN ('cobra_total', 'desconta'));

ALTER TABLE "visitas"
    ADD CONSTRAINT "visitas_placa_valida" CHECK ("placa" ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
    ADD CONSTRAINT "visitas_confianca_valida" CHECK ("confianca_ia" IN ('alta', 'media', 'baixa')),
    ADD CONSTRAINT "visitas_status_valido" CHECK ("status" IN ('aberta', 'encerrada', 'cancelada')),
    ADD CONSTRAINT "visitas_encerramento_valido" CHECK (
        "status" <> 'encerrada' OR (
            "operador_saida_id" IS NOT NULL
            AND "saida_em" IS NOT NULL AND "saida_em" >= "entrada_em"
            AND "duracao_seg" IS NOT NULL AND "duracao_seg" >= 0
            AND "cobravel_seg" IS NOT NULL AND "cobravel_seg" BETWEEN 0 AND "duracao_seg"
            AND "valor_centavos" IS NOT NULL AND "valor_centavos" >= 0
            AND ("blocos" IS NULL OR "blocos" >= 0)
        )
    );

CREATE FUNCTION "impedir_edicao_tarifa"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Crie uma nova versão para alterar a tarifa.'
        USING ERRCODE = '23514', CONSTRAINT = 'tarifas_imutaveis';
END;
$$;

CREATE TRIGGER "tarifas_imutaveis"
BEFORE UPDATE ON "tarifas"
FOR EACH ROW WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION "impedir_edicao_tarifa"();

COMMIT;
