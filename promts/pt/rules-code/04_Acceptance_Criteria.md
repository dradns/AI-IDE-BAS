### 4.6. Critérios de Aceitação (AC) 
**Template de Critérios de Aceitação**

#### 4.6.1. Importante: Formato de Saída

Todos os resultados (templates, exemplos, checklists) devem ser gerados em formato markdown. Use marcação para listas, tabelas, código e títulos.

#### 4.6.2. Conteúdo
1. [Introdução](#introdução)
2. [Estrutura AC](#estrutura-ac)
3. [Template Universal AC](#template-universal-ac)
4. [Exemplos de Formulações e Preenchimento](#exemplos-de-formulações-e-preenchimento)
5. [Checklist de Qualidade AC](#checklist-de-qualidade-ac)
6. [Recomendações e Erros Típicos](#recomendações-e-erros-típicos)
7. [Glossário e Links Úteis](#glossário-e-links-úteis)

---

#### 4.6.3. Introdução
Critérios de Aceitação (AC) são condições claras e mensuráveis que devem ser atendidas para que um requisito seja considerado implementado e aceito. AC servem como base para testes, aceitação e controle de qualidade.

##### Características Chave de AC de Qualidade:
- **Mensurabilidade** — indicadores específicos para verificação
- **Testabilidade** — possibilidade de verificação objetiva
- **Especificidade** — formulações claras e inequívocas
- **Completude** — cobertura de todos os cenários de uso
- **Orientação ao Usuário** — descrição da perspectiva do usuário
- **Realismo** — alcançabilidade dentro do escopo do projeto

---

#### 4.6.4. Estrutura AC

##### 4.6.4.1. Importância de Pré-condições e Pós-condições

**Pré-condições** descrevem o que deve ser cumprido ou em que estado o sistema deve estar antes de iniciar a verificação do AC. **Pós-condições** registram o que deve mudar ou em que estado o sistema deve estar após a execução do AC. Essas seções tornam os critérios de aceitação completos, inequívocos e adequados para automação de testes.

##### 4.6.4.2. Cabeçalho e Identificação
- **ID do Critério**: AC-XXX
- **Nome do Critério**: reflete brevemente a essência da verificação
- **Link do Requisito**: ID User Story, Use Case, NFR
- **Versão e Data de Criação**
- **Autor e Responsáveis**

##### 4.6.4.3. Elementos Principais
- **Descrição**: descrição clara e inequívoca do resultado esperado
- **Pré-condições**: o que deve ser cumprido antes de iniciar a verificação
- **Condições de Verificação**: condições específicas e mensuráveis que devem ser atendidas
- **Pós-condições**: estado do sistema após conclusão da verificação
- **Prioridade**: Crítica/Alta/Média/Baixa
- **Justificativa**: por que este critério é importante para negócio/projeto
- **Métodos e Ferramentas de Verificação**: o que e como é verificado
- **Critérios de Sucesso**: o que é considerado conclusão bem-sucedida

---

#### 4.6.5. Template Universal AC

AC-XXX: [Nome do Critério]
Link do Requisito: [ID User Story / Use Case / NFR]
Versão: [número]  Data: [data]
Autor: [Nome Completo]  Responsável: [Nome Completo/Papéis]

Descrição: [Descrição clara e inequívoca do resultado esperado]

Pré-condições:
- [O que deve ser cumprido antes de iniciar a verificação]

Condições de Verificação:
- [Condição 1: condição mensurável específica]
- [Condição 2: condição mensurável específica]
- [Condição 3: condição mensurável específica]

Pós-condições:
- [Estado do sistema após conclusão da verificação]

Prioridade: [Crítica/Alta/Média/Baixa]
Justificativa: [Por que este critério é importante para negócio/projeto]

Métodos e Ferramentas de Verificação:
- [Ferramenta/método 1]
- [Ferramenta/método 2]

Critérios de Sucesso:
- [O que é considerado conclusão bem-sucedida]
- [Critérios de falha, valores limite]

---

#### 4.6.6. Exemplos de Formulações e Preenchimento

##### 4.6.6.1. Exemplo 1: Critério Funcional (Aplicação Web)

AC-001: Criação de Usuário
Link do Requisito: US-001
Versão: 1.0  Data: 2024-06-01
Autor: João Silva  Responsável: Equipe de Desenvolvimento

Descrição: Sistema deve permitir criar um novo usuário com campos obrigatórios.

Pré-condições:
- Formulário de registro está disponível para usuários não autorizados
- Banco de dados está disponível para escrita

Condições de Verificação:
- Usuário preenche formulário de registro (email, senha, nome)
- Sistema valida email para formato correto
- Sistema verifica unicidade do email no banco de dados
- Após registro bem-sucedido, registro é criado no BD
- Usuário recebe email de confirmação
- Em caso de erro, mensagem clara é exibida

Pós-condições:
- Novo usuário criado no sistema
- Email de confirmação enviado
- Usuário pode fazer login no sistema

Prioridade: Crítica
Justificativa: Registro de usuário é a base para operação do sistema

Métodos e Ferramentas de Verificação:
- Teste manual: preenchimento de formulário, verificação de email
- Automação: Selenium para testes de UI, testes de API para validação

Critérios de Sucesso:
- Usuário criado, email enviado, sem erros
- Erro de validação, duplicação de email, indisponibilidade do BD — critérios de falha

##### 4.6.6.2. Exemplo 2: Critério Não-funcional (Desempenho)

AC-002: Tempo de Carregamento de Página
Link do Requisito: NFR-001
Versão: 1.0  Data: 2024-06-01
Autor: Maria Santos  Responsável: QA

Descrição: Página principal deve carregar dentro do tempo especificado sob vários níveis de carga.

Pré-condições:
- Servidor operando em modo normal
- Conexão de rede estável

Condições de Verificação:
- Sob carga normal (até 100 usuários): não mais que 2 segundos
- Sob carga alta (até 1000 usuários): não mais que 5 segundos
- Sob carga crítica (até 5000 usuários): não mais que 10 segundos
- Desempenho medido com ferramenta Apache JMeter
- Tempo medido da requisição ao carregamento completo do DOM

Pós-condições:
- Página totalmente carregada e funcional
- Todos os recursos (CSS, JS, imagens) carregados

Prioridade: Alta
Justificativa: Velocidade de carregamento afeta diretamente conversão e retenção de usuários

Métodos e Ferramentas de Verificação:
- Apache JMeter para teste de carga
- Lighthouse para análise de desempenho
- Monitoramento de ambiente de produção

Critérios de Sucesso:
- Tempo de carregamento dentro dos limites para todos os níveis de carga
- Exceder limites de tempo de carregamento — critério de falha

##### 4.6.6.3. Exemplo 3: Critério de Integração (API)

AC-003: Endpoint REST API
Link do Requisito: NFR-API-001
Versão: 1.0  Data: 2024-06-01
Autor: Pedro Oliveira  Responsável: Backend

Descrição: API deve processar corretamente requisições HTTP.

Pré-condições:
- Servidor API disponível
- Dados de teste preparados

Condições de Verificação:
- Requisição GET retorna dados em formato JSON
- Requisição POST cria novo registro e retorna status 201
- Requisição PUT atualiza registro existente
- Requisição DELETE deleta registro e retorna status 204
- Em erro, status HTTP apropriado é retornado (400, 404, 500)
- Resposta contém header Content-Type: application/json
- Paginação suportada via parâmetros page e limit
- API retorna erros em formato unificado com code e message
- Tempo de resposta não excede 1 segundo para requisições simples

Pós-condições:
- Dados corretamente processados
- Erros corretamente retornados

Prioridade: Alta
Justificativa: API é a base para integração com sistemas externos

Métodos e Ferramentas de Verificação:
- Postman, Insomnia para teste manual
- Automação: Testes de API no pipeline CI/CD

Critérios de Sucesso:
- Todas as requisições e respostas em conformidade com especificação
- Erros corretamente tratados

---

#### 4.6.7. Checklist de Qualidade AC
- [ ] Critério é mensurável e testável
- [ ] Valores e condições específicas especificados
- [ ] Prioridade definida
- [ ] Critério não contradiz outros
- [ ] Critério é realista e alcançável
- [ ] Justificativa fornecida
- [ ] Pré-condições e pós-condições descritas
- [ ] Métodos e ferramentas de verificação especificados
- [ ] Critério compreensível para todos os participantes do projeto
- [ ] Critério cobre todos os cenários (positivo, negativo, limite)

---

#### 4.6.8. Recomendações e Erros Típicos

##### 4.6.8.1. Erros Comuns:
1. **Formulações Vagas**: "rápido" em vez de "não mais que 2 segundos"
2. **Unidades de Medida Faltando**: "1000 usuários" em vez de "1000 usuários concorrentes"
3. **Requisitos Irrealistas**: "10 milissegundos" em vez de "100 milissegundos"
4. **Justificativa Faltando**: AC sem indicar importância de negócio
5. **Cobertura de Cenário Incompleta**: apenas cenários positivos
6. **Orientação Técnica em vez de Orientação ao Usuário**: "Sistema salva dados no BD" em vez de "Usuário recebe confirmação de salvamento"

##### 4.6.8.2. Recomendações Práticas:
- Use formulações específicas e mensuráveis
- Inclua cenários negativos e de limite
- Especifique métodos e ferramentas de verificação
- Vincule AC com requisitos (US, UC, NFR)
- Revise e atualize AC regularmente
- Garanta consistência com outros artefatos

**Use este template como padrão para escrever critérios de aceitação — é adequado para criação automatizada e manual de AC, garante conformidade com padrões e resultados de alta qualidade.**
