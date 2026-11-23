-- Run with psql in a disposable database after applying sql/seed.sql.
\set ON_ERROR_STOP on

SELECT v.id, v.placa, u.nome AS unit_name, t.modo, t.preco_centavos, v.valor_centavos
FROM visitas v
JOIN unidades u ON u.id = v.unidade_id
JOIN tarifas t ON t.id = v.tarifa_id AND t.unidade_id = v.unidade_id
WHERE v.id = 'ccda82a6-cdd5-4606-ac4d-3483318b0001';

SELECT EXTRACT(ISODOW FROM v.entrada_em AT TIME ZONE u.fuso) AS weekday,
       EXTRACT(HOUR FROM v.entrada_em AT TIME ZONE u.fuso) AS hour,
       COUNT(*) AS visits
FROM visitas v JOIN unidades u ON u.id = v.unidade_id
WHERE v.placa = 'ABC1D23' AND v.status = 'encerrada'
  AND u.id = '622bd09a-f970-4c95-937a-d2d63120fca4'
GROUP BY 1, 2
ORDER BY visits DESC, weekday, hour;

BEGIN;
ANALYZE visitas;

DROP INDEX visitas_unidade_id_placa_entrada_em_idx;
EXPLAIN (ANALYZE, BUFFERS)
SELECT entrada_em FROM visitas
WHERE unidade_id = '622bd09a-f970-4c95-937a-d2d63120fca4' AND placa = 'ABC1D23'
  AND status = 'encerrada'
ORDER BY entrada_em DESC;

CREATE INDEX visitas_unidade_id_placa_entrada_em_idx ON visitas (unidade_id, placa, entrada_em);
EXPLAIN (ANALYZE, BUFFERS)
SELECT entrada_em FROM visitas
WHERE unidade_id = '622bd09a-f970-4c95-937a-d2d63120fca4' AND placa = 'ABC1D23'
  AND status = 'encerrada'
ORDER BY entrada_em DESC;

ROLLBACK;
