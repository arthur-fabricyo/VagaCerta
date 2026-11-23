-- Sample data for an isolated demonstration database.
BEGIN;

INSERT INTO "user" (id, name, email, aprovado, "updatedAt")
VALUES ('demo-sql-operator', 'Operador de exemplo', 'operador@example.invalid', true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO unidades (id, nome, fuso)
VALUES ('622bd09a-f970-4c95-937a-d2d63120fca4', 'Unidade Centro (exemplo)', 'America/Sao_Paulo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tarifas (id, unidade_id, modo, preco_centavos, vigente_desde)
VALUES ('9c80db1d-1a36-4eac-9dfa-03ad90d4cf63', '622bd09a-f970-4c95-937a-d2d63120fca4',
        'proporcional', 800, '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO visitas (id, unidade_id, tarifa_id, placa, operador_entrada_id, operador_saida_id,
                     entrada_em, saida_em, duracao_seg, cobravel_seg, valor_centavos, status)
SELECT ('ccda82a6-cdd5-4606-ac4d-3483318b000' || sample.number)::uuid,
       '622bd09a-f970-4c95-937a-d2d63120fca4', '9c80db1d-1a36-4eac-9dfa-03ad90d4cf63',
       'ABC1D23', 'demo-sql-operator', 'demo-sql-operator', sample.entry,
       sample.entry + interval '1 hour', 3600, 3600, 800, 'encerrada'
FROM (VALUES (1, '2026-11-02 08:05-03'::timestamptz), (2, '2026-11-09 08:25-03'::timestamptz),
             (3, '2026-11-16 14:35-03'::timestamptz), (4, '2026-11-23 14:45-03'::timestamptz)) AS sample(number, entry)
ON CONFLICT (id) DO NOTHING;

COMMIT;
