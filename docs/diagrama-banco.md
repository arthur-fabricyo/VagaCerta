# Banco de dados

```mermaid
erDiagram
    USER ||--o{ SESSION : authenticates
    USER ||--o{ ACCOUNT : owns
    USER ||--o{ VISIT : registers_entry
    USER |o--o{ VISIT : registers_exit
    UNIT ||--o{ RATE : publishes
    UNIT ||--o{ VISIT : receives
    RATE ||--o{ VISIT : prices
    USER { text id PK }
    SESSION {
        text id PK
        text userId FK
    }
    ACCOUNT {
        text id PK
        text userId FK
    }
    VERIFICATION { text id PK }
    UNIT {
        uuid id PK
        text nome
        text fuso
    }
    RATE {
        uuid id PK
        uuid unidade_id FK
        integer preco_centavos
        timestamptz vigente_desde
    }
    VISIT {
        uuid id PK
        uuid unidade_id FK
        uuid tarifa_id FK
        text operador_entrada_id FK
        text operador_saida_id FK
        varchar placa
        timestamptz entrada_em
        text status
    }
```

No PostgreSQL, as tabelas de domínio são `unidades`, `tarifas` e `visitas`. A chave estrangeira composta `(unidade_id, tarifa_id)` exige que a tarifa pertença à unidade da visita. O índice único parcial impede mais de uma visita aberta para a mesma placa na mesma unidade.
