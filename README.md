# VagaCerta

Sistema web de operação de estacionamento para o Projeto Integrador de Desenvolvimento Web, IA e Banco de Dados.

**Integrante informado:** Arthur Fabricyo. **Produção:** [VagaCerta](https://vaga-certa-six.vercel.app/entrar). O edital prevê um trio; a composição individual deve ser confirmada com os docentes.

Operadores aprovados registram reservas, localizam veículos no pátio, encerram visitas com cobrança simulada e consultam o histórico por placa. A leitura por foto usa IA pela Groq para sugerir uma placa que o operador pode corrigir antes de confirmar a reserva.

## Fluxo de operação

```mermaid
flowchart TD
    A[Operador aprovado acessa o sistema] --> B[Seleciona a unidade]
    B --> C{Como informar a placa?}
    C -->|Digitação| D[Informa a placa]
    C -->|Foto| E[Solicita leitura pela IA]
    E --> F{Leitura disponível?}
    F -->|Sim| G[Confere ou corrige a sugestão]
    F -->|Não| D
    D --> H[Confirma a entrada]
    G --> H
    H --> I[API valida e registra a visita no banco]
    I --> J[Consulta o veículo no pátio]
    J --> K{Próxima operação}
    K -->|Saída| L[Calcula e registra a cobrança simulada]
    K -->|Cancelamento| M[Cancela a visita]
    L --> N[Consulta o histórico por placa]
    M --> N
```

## Modelo do banco de dados

O banco é PostgreSQL, acessado via Prisma (`prisma/schema.prisma`). O modelo tem sete tabelas e se divide em dois grupos:

- **Autenticação** (`user`, `session`, `account`, `verification`): tabelas usadas pelo Better Auth. A coluna `aprovado` em `user` controla quais cadastros podem operar o sistema.
- **Operação** (`unidades`, `tarifas`, `visitas`): unidades de estacionamento, tarifas versionadas por vigência e o registro de cada visita de veículo.

A tabela `verification` é independente e armazena dados de verificação.

### Diagrama entidade-relacionamento

```mermaid
erDiagram
    USER ||--o{ SESSION : "autentica"
    USER ||--o{ ACCOUNT : "possui"
    USER ||--o{ VISITAS : "registra entrada"
    USER |o--o{ VISITAS : "registra saída"
    UNIDADES ||--o{ TARIFAS : "possui"
    UNIDADES ||--o{ VISITAS : "recebe"
    TARIFAS ||--o{ VISITAS : "define o valor"

    USER {
        text id PK
        text name
        text email UK
        boolean emailVerified
        text image "opcional"
        timestamp createdAt
        timestamp updatedAt
        boolean aprovado "default false"
    }
    SESSION {
        text id PK
        text token UK
        timestamp expiresAt
        text ipAddress "opcional"
        text userAgent "opcional"
        timestamp createdAt
        timestamp updatedAt
        text userId FK
    }
    ACCOUNT {
        text id PK
        text accountId
        text providerId
        text accessToken "opcional"
        text refreshToken "opcional"
        timestamp accessTokenExpiresAt "opcional"
        timestamp refreshTokenExpiresAt "opcional"
        text scope "opcional"
        text idToken "opcional"
        text password "opcional"
        timestamp createdAt
        timestamp updatedAt
        text userId FK
    }
    VERIFICATION {
        text id PK
        text identifier
        text value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
    UNIDADES {
        uuid id PK
        text nome UK
        text fuso
        timestamptz criado_em
    }
    TARIFAS {
        uuid id PK
        uuid unidade_id FK
        text modo
        integer preco_centavos
        integer bloco_minutos "opcional"
        integer tolerancia_minutos "default 0"
        text tolerancia_modo "default cobra_total"
        timestamptz vigente_desde
        timestamptz criado_em
    }
    VISITAS {
        uuid id PK
        uuid unidade_id FK
        uuid tarifa_id FK
        varchar placa "7 caracteres"
        varchar placa_sugerida_ia "opcional"
        text confianca_ia "opcional"
        bytea foto "opcional"
        text foto_mime "opcional"
        text observacao "opcional"
        text operador_entrada_id FK
        text operador_saida_id FK "opcional"
        timestamptz entrada_em
        timestamptz saida_em "opcional"
        numeric duracao_seg "opcional"
        numeric cobravel_seg "opcional"
        integer blocos "opcional"
        integer valor_centavos "opcional"
        text status "default aberta"
        timestamptz criado_em
    }
```

As relações `TARIFAS → VISITAS` e `UNIDADES → VISITAS` se combinam numa chave estrangeira composta (`unidade_id`, `tarifa_id`), descrita em [Restrições e índices](#restrições-e-índices). Veja também o [diagrama detalhado](docs/diagrama-banco.md).

### Tabelas de autenticação

Os nomes das colunas seguem o padrão do Better Auth (camelCase). Datas sem fuso são `timestamp(3)`.

#### `user`

Operadores do sistema.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | text | PK | Identificador do usuário |
| `name` | text | obrigatório | Nome |
| `email` | text | único | E-mail de login |
| `emailVerified` | boolean | default `false` | E-mail verificado |
| `image` | text | opcional | Imagem de perfil |
| `createdAt` | timestamp(3) | default `now()` | Criação |
| `updatedAt` | timestamp(3) | atualizado automaticamente | Última alteração |
| `aprovado` | boolean | default `false` | Indica se um operador aprovado liberou o cadastro |

#### `session`

Sessões ativas de login.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | text | PK | Identificador da sessão |
| `token` | text | único | Token da sessão |
| `expiresAt` | timestamp(3) | obrigatório | Expiração |
| `ipAddress` | text | opcional | IP de origem |
| `userAgent` | text | opcional | Navegador/dispositivo |
| `createdAt` / `updatedAt` | timestamp(3) | default `now()` / automático | Auditoria |
| `userId` | text | FK → `user.id`, `ON DELETE CASCADE` | Dono da sessão |

#### `account`

Credenciais e vínculos de provedores de autenticação.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | text | PK | Identificador |
| `accountId` | text | obrigatório | Identificador da conta no provedor |
| `providerId` | text | obrigatório | Provedor de autenticação |
| `accessToken`, `refreshToken`, `idToken` | text | opcionais | Tokens do provedor |
| `accessTokenExpiresAt`, `refreshTokenExpiresAt` | timestamp(3) | opcionais | Expiração dos tokens |
| `scope` | text | opcional | Escopo autorizado |
| `password` | text | opcional | Hash da senha (login por e-mail e senha) |
| `createdAt` / `updatedAt` | timestamp(3) | default `now()` / automático | Auditoria |
| `userId` | text | FK → `user.id`, `ON DELETE CASCADE` | Dono da conta |

#### `verification`

Tokens de verificação (tabela independente, sem relações).

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | text | PK | Identificador |
| `identifier` | text | obrigatório, indexado | O que está sendo verificado |
| `value` | text | obrigatório | Valor/código de verificação |
| `expiresAt` | timestamp(3) | obrigatório | Expiração |
| `createdAt` / `updatedAt` | timestamp(3) | default `now()` / automático | Auditoria |

### Tabelas de operação

Os identificadores usam snake_case, UUID gerado pelo banco (`gen_random_uuid()`) e datas com fuso (`timestamptz(3)`).

#### `unidades`

Unidades de estacionamento.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` | Identificador |
| `nome` | text | único | Nome da unidade |
| `fuso` | text | obrigatório | Fuso horário da unidade, usado para exibir e filtrar horários |
| `criado_em` | timestamptz(3) | default `now()` | Criação |

#### `tarifas`

Tarifas de cada unidade. Uma nova tarifa não altera as anteriores: cada uma vale a partir de `vigente_desde`, e as visitas guardam a tarifa aplicada.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` | Identificador |
| `unidade_id` | uuid | FK → `unidades.id`, `ON DELETE RESTRICT` | Unidade da tarifa |
| `modo` | text | obrigatório | Modo de cobrança |
| `preco_centavos` | integer | obrigatório | Preço em centavos |
| `bloco_minutos` | integer | opcional | Duração do bloco de cobrança, em minutos |
| `tolerancia_minutos` | integer | default `0` | Tolerância antes de cobrar, em minutos |
| `tolerancia_modo` | text | default `cobra_total` | Como a tolerância é tratada na cobrança |
| `vigente_desde` | timestamptz(3) | default `now()` | Início da vigência |
| `criado_em` | timestamptz(3) | default `now()` | Criação |

#### `visitas`

Cada entrada de veículo na unidade, da reserva até a saída ou o cancelamento.

| Coluna | Tipo | Regra | Descrição |
| --- | --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` | Identificador |
| `unidade_id` | uuid | FK → `unidades.id`, `ON DELETE RESTRICT` | Unidade da visita |
| `tarifa_id` | uuid | FK composta com `unidade_id` → `tarifas` | Tarifa aplicada à visita |
| `placa` | varchar(7) | obrigatório | Placa confirmada pelo operador |
| `placa_sugerida_ia` | varchar(7) | opcional | Placa sugerida pela leitura da foto |
| `confianca_ia` | text | opcional | Confiança informada pela IA |
| `foto` | bytea | opcional | Foto do veículo |
| `foto_mime` | text | opcional | Tipo MIME da foto |
| `observacao` | text | opcional | Observação do operador |
| `operador_entrada_id` | text | FK → `user.id`, `ON DELETE RESTRICT` | Operador que registrou a entrada |
| `operador_saida_id` | text | FK → `user.id`, `ON DELETE RESTRICT`, opcional | Operador que registrou a saída |
| `entrada_em` | timestamptz(3) | default `now()` | Momento da entrada |
| `saida_em` | timestamptz(3) | opcional | Momento da saída |
| `duracao_seg` | numeric(15,3) | opcional | Duração total, em segundos |
| `cobravel_seg` | numeric(15,3) | opcional | Segundos considerados na cobrança |
| `blocos` | integer | opcional | Quantidade de blocos cobrados |
| `valor_centavos` | integer | opcional | Valor cobrado em centavos |
| `status` | text | default `aberta` | Situação da visita |
| `criado_em` | timestamptz(3) | default `now()` | Criação |

Os campos `saida_em`, `duracao_seg`, `cobravel_seg`, `blocos`, `valor_centavos` e `operador_saida_id` ficam vazios enquanto a visita está aberta e são preenchidos no registro da saída.

### Restrições e índices

| Tabela | Restrição / índice | Finalidade |
| --- | --- | --- |
| `user` | único em `email` | Um cadastro por e-mail |
| `session` | único em `token`; índice em `userId` | Busca de sessão pelo token e por usuário |
| `account` | único em (`providerId`, `accountId`); índice em `userId` | Uma conta por provedor e busca por usuário |
| `verification` | índice em `identifier` | Busca de verificações |
| `unidades` | único em `nome` | Nomes de unidade não se repetem |
| `tarifas` | único em (`unidade_id`, `vigente_desde`) | Uma única tarifa por unidade em cada instante de vigência |
| `tarifas` | único em (`unidade_id`, `id`) | Alvo da chave estrangeira composta de `visitas` |
| `visitas` | FK composta `visitas_tarifa_da_unidade_fkey` (`unidade_id`, `tarifa_id`) → `tarifas` (`unidade_id`, `id`) | A tarifa de uma visita sempre pertence à mesma unidade da visita |
| `visitas` | índice único parcial `visitas_placa_aberta_unidade_key` em (`unidade_id`, `placa`) onde `status = 'aberta'` | Impede duas visitas abertas para a mesma placa na unidade |
| `visitas` | índice em (`unidade_id`, `placa`, `entrada_em`) | Consulta do histórico por placa, unidade e período |

### Regras de exclusão

- `session` e `account` são removidas junto com o `user` (`CASCADE`).
- `tarifas` e `visitas` usam `RESTRICT`: não é possível excluir uma unidade com tarifas ou visitas, nem uma tarifa ou um operador referenciados por visitas. Isso preserva o histórico e a cobrança já calculada.

### Observações de implementação

- O índice único parcial usa o recurso de preview `partialIndexes` do Prisma, habilitado no `generator client`.
- Valores monetários ficam em centavos (`integer`) para evitar erro de arredondamento; durações usam `numeric(15,3)`.
- A foto fica no próprio banco (`bytea`) e é servida por `GET /api/visits/[id]/photo`.
- O cliente Prisma é gerado em `generated/prisma`.

## Arquitetura

O padrão adotado para código novo e refatorações do backend é MVC com três camadas. O fluxo de dependências é `Controller → Service → Repository`.

- **Controller** recebe a requisição pelos Route Handlers do Next.js, valida os dados de entrada, chama o serviço e monta a resposta HTTP.
- **Service** implementa os casos de uso e as regras de negócio e coordena o acesso aos repositórios.
- **Repository** concentra a persistência e as consultas ao PostgreSQL, incluindo o acesso via Prisma e SQL.

Escreva o código e os identificadores técnicos em inglês, incluindo entidades, campos do banco, rotas do backend, nomes de classes e métodos, testes e comentários de código. Na criação de classes, aplique Clean Code, SOLID e orientação a objetos, com responsabilidades claras, encapsulamento e dependências explícitas. [Convenções para agentes e colaboradores](AGENTS.md)

## Branches e deploy

- `origin/develop` é a branch de integração. Crie branches de trabalho a partir de `develop` e abra os PRs de funcionalidades, correções e documentação com destino a `develop`.
- `origin/prod` é a branch reservada para produção. Para publicar uma versão validada, abra um PR de `develop` para `prod` e faça o merge após a revisão.

No GitHub, um administrador deve definir `develop` como branch padrão do repositório. No projeto Vercel conectado ao repositório, selecione `prod` em **Settings → Environments → Production → Branch Tracking**. Com essa configuração ativa, o merge em `prod` dispara o deploy de produção. Consulte a [documentação do Vercel](https://vercel.com/docs/git#customizing-the-production-branch).

## Desenvolvimento local

Requer pnpm 10.34.9 e Node.js 22 a partir da versão 22.12, ou Node.js 24 em diante.

```bash
pnpm install --frozen-lockfile
```

## Banco de dados e primeiro acesso

Para iniciar um PostgreSQL 18 com `pgvector` em Docker, rode `docker compose up -d --wait`. O banco local fica em `127.0.0.1:55440`, com dados em um volume persistente. A extensão `vector` é ativada na criação do volume. Para usar essa base na aplicação, configure `DATABASE_URL` em `.env.local` como `postgresql://vagacerta:vagacerta-local@127.0.0.1:55440/vagacerta?schema=public` e execute as migrações e o seed abaixo. A porta e a senha de inicialização podem ser definidas no ambiente do Compose com `VAGACERTA_DB_PORT` e `VAGACERTA_DB_PASSWORD`.

Copie `.env.example` para `.env.local` e preencha as variáveis abaixo.

- `DATABASE_URL` com a conexão do PostgreSQL de desenvolvimento.
- `BETTER_AUTH_URL` com a origem da aplicação, por exemplo `http://localhost:3000`.
- `BETTER_AUTH_SECRET` com um segredo aleatório. Gere um com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` com as credenciais do primeiro operador.
- `GROQ_API_KEY` e `GROQ_MODEL` para sugerir placas a partir de fotos. Configure um modelo Groq com visão. A reserva manual está disponível mesmo quando a leitura por foto falha.

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abra a origem configurada e entre com a conta do seed. Em **Usuários**, um operador aprovado pode aprovar ou recusar os cadastros feitos pela tela **Criar conta**.

Na operação, cadastre uma unidade com seu fuso horário e publique uma tarifa. Confirme uma reserva com placa digitada ou conferida a partir de uma foto. Abra a visita pelo pátio para registrar a saída ou cancelar. Consulte **Histórico** para ver chegadas de uma placa na unidade e no período escolhidos.

Para preparar uma base de demonstração, aplique as migrações, crie o primeiro operador e execute `psql` com `sql/seed.sql`. O arquivo `sql/schema.sql` reproduz o esquema num banco vazio via `psql` como alternativa para a demonstração SQL isolada. O deploy usa as migrações do Prisma.

| Área | Rotas da API |
| --- | --- |
| Unidades e tarifas | `GET /api/units`, `POST /api/units`, `POST /api/units/[id]/rates` |
| Entradas e pátio | `GET /api/visits?unitId=…`, `POST /api/visits` |
| Detalhe, saída e cancelamento | `GET /api/visits/[id]`, `PATCH /api/visits/[id]` |
| Fotos e leitura | `POST /api/ai/plate`, `GET /api/visits/[id]/photo` |
| Histórico | `GET /api/history?unitId=…&plate=…` com `start` e `end` opcionais |

O teste de integridade usa um banco de teste com a migração aplicada e desfaz os dados que cria.

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/integridade.sql
```

## Verificação

```bash
pnpm test
pnpm typecheck
pnpm build
```

Para verificar login, cadastro e aprovação via HTTP, use um banco de teste separado. Aplique a migração e o seed e inicie a aplicação com a mesma configuração usada pela suíte. A suíte lê `.env.local` ou as variáveis do terminal e cria contas fictícias no banco de teste.

```bash
pnpm test:acesso
pnpm test:operations
pnpm test:photo
```

O [relatório técnico](docs/relatorio-tecnico.md) reúne o diagrama, as consultas, os resultados locais e o procedimento de validação para a entrega.

Consulte [as regras do estacionamento](kb/KB-ESTACIONAMENTO.md), [as decisões técnicas](kb/DECISOES-TECNICAS.md) e [o plano inicial](docs/superpowers/plans/2026-11-18-vagacerta-fundacao.md).
