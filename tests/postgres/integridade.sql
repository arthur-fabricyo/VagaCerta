BEGIN;

DO $$
DECLARE
  unidade_a uuid;
  unidade_b uuid;
  tarifa_a uuid;
  tarifa_b uuid;
  visita_a uuid;
  restricao text;
BEGIN
  INSERT INTO "user" (id, name, email, "updatedAt")
  VALUES ('operador-teste', 'Operador Teste', 'operador-teste@example.invalid', now());

  IF (SELECT aprovado FROM "user" WHERE id = 'operador-teste') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Um cadastro novo deve ficar pendente';
  END IF;

  INSERT INTO unidades (nome, fuso)
  VALUES ('Unidade A', 'America/Sao_Paulo') RETURNING id INTO unidade_a;
  INSERT INTO unidades (nome, fuso)
  VALUES ('Unidade B', 'America/Sao_Paulo') RETURNING id INTO unidade_b;

  INSERT INTO tarifas (unidade_id, modo, preco_centavos)
  VALUES (unidade_a, 'proporcional', 800) RETURNING id INTO tarifa_a;

  BEGIN
    INSERT INTO tarifas (unidade_id, modo, preco_centavos)
    VALUES (unidade_a, 'proporcional', 900);
    RAISE EXCEPTION 'Apenas uma tarifa da unidade pode começar no mesmo instante';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'tarifas_unidade_id_vigente_desde_key' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    INSERT INTO tarifas (unidade_id, modo, preco_centavos)
    VALUES (unidade_b, 'blocos', 800);
    RAISE EXCEPTION 'Uma tarifa por blocos deve informar a duração do bloco';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'tarifas_bloco_valido' THEN
      RAISE;
    END IF;
  END;

  INSERT INTO tarifas (unidade_id, modo, preco_centavos, bloco_minutos)
  VALUES (unidade_b, 'blocos', 800, 60) RETURNING id INTO tarifa_b;

  BEGIN
    INSERT INTO visitas (unidade_id, tarifa_id, placa, operador_entrada_id)
    VALUES (unidade_a, tarifa_b, 'ABC1D23', 'operador-teste');
    RAISE EXCEPTION 'Uma visita deve usar tarifa da própria unidade';
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'visitas_tarifa_da_unidade_fkey' THEN
      RAISE;
    END IF;
  END;

  INSERT INTO visitas (unidade_id, tarifa_id, placa, operador_entrada_id)
  VALUES (unidade_a, tarifa_a, 'ABC1D23', 'operador-teste') RETURNING id INTO visita_a;
  INSERT INTO visitas (unidade_id, tarifa_id, placa, operador_entrada_id)
  VALUES (unidade_b, tarifa_b, 'ABC1D23', 'operador-teste');

  BEGIN
    UPDATE visitas SET status = 'encerrada' WHERE id = visita_a;
    RAISE EXCEPTION 'Uma visita encerrada deve ter os dados da saída';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'visitas_encerramento_valido' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    UPDATE tarifas SET preco_centavos = 1000 WHERE id = tarifa_a;
    RAISE EXCEPTION 'Uma versão de tarifa deve manter o preço original';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'tarifas_imutaveis' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    INSERT INTO visitas (unidade_id, tarifa_id, placa, operador_entrada_id)
    VALUES (unidade_a, tarifa_a, 'ABC1D23', 'operador-teste');
    RAISE EXCEPTION 'A unidade não deve aceitar uma segunda visita aberta da mesma placa';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS restricao = CONSTRAINT_NAME;
    IF restricao IS DISTINCT FROM 'visitas_placa_aberta_unidade_key' THEN
      RAISE;
    END IF;
  END;

  UPDATE visitas SET status = 'cancelada' WHERE id = visita_a;
  INSERT INTO visitas (unidade_id, tarifa_id, placa, operador_entrada_id)
  VALUES (unidade_a, tarifa_a, 'ABC1D23', 'operador-teste') RETURNING id INTO visita_a;

  UPDATE visitas
  SET status = 'encerrada',
      saida_em = entrada_em + interval '30 minutes',
      operador_saida_id = 'operador-teste',
      duracao_seg = 1800,
      cobravel_seg = 1800,
      valor_centavos = 400
  WHERE id = visita_a;
END;
$$;

ROLLBACK;
