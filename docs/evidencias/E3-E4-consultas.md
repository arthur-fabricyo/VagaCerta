# E3 e E4 — consultas em PostgreSQL 18

Execução local de `docs/consultas.sql` com quatro visitas fictícias. A saída contém o JOIN, a agregação e os planos sem e com o índice, nessa ordem.

```text
                  id                  |  placa  |        unit_name         |     modo     | preco_centavos | valor_centavos
--------------------------------------+---------+--------------------------+--------------+----------------+----------------
 ccda82a6-cdd5-4606-ac4d-3483318b0001 | ABC1D23 | Unidade Centro (exemplo) | proporcional |            800 |            800
(1 row)

 weekday | hour | visits
---------+------+--------
       1 |    8 |      2
       1 |   14 |      2
(2 rows)

                                                                      QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=1.11..1.12 rows=4 width=8) (actual time=0.016..0.016 rows=4.00 loops=1)
   Sort Key: entrada_em DESC
   Sort Method: quicksort  Memory: 25kB
   Buffers: shared hit=1
   ->  Seq Scan on visitas  (cost=0.00..1.07 rows=4 width=8) (actual time=0.009..0.010 rows=4.00 loops=1)
         Filter: ((unidade_id = '622bd09a-f970-4c95-937a-d2d63120fca4'::uuid) AND ((placa)::text = 'ABC1D23'::text) AND (status = 'encerrada'::text))
         Buffers: shared hit=1
 Planning:
   Buffers: shared hit=22
 Planning Time: 0.680 ms
 Execution Time: 0.027 ms
(11 rows)

                                                                      QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=1.11..1.12 rows=4 width=8) (actual time=0.024..0.024 rows=4.00 loops=1)
   Sort Key: entrada_em DESC
   Sort Method: quicksort  Memory: 25kB
   Buffers: shared hit=1
   ->  Seq Scan on visitas  (cost=0.00..1.07 rows=4 width=8) (actual time=0.015..0.016 rows=4.00 loops=1)
         Filter: ((unidade_id = '622bd09a-f970-4c95-937a-d2d63120fca4'::uuid) AND ((placa)::text = 'ABC1D23'::text) AND (status = 'encerrada'::text))
         Buffers: shared hit=1
 Planning:
   Buffers: shared hit=5 read=1
 Planning Time: 1.214 ms
 Execution Time: 0.041 ms
(11 rows)

```
