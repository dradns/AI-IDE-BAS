### 4.8. Requisitos Não-Funcionais

**Template de Requisitos Não-Funcionais (NFR)**

#### 4.8.1. Conteúdo
1. [Introdução](#introdução)
2. [Estrutura NFR](#estrutura-nfr)
3. [Principais Categorias NFR](#principais-categorias-nfr)
4. [Templates por Categorias](#templates-por-categorias)
5. [Métricas e Medições](#métricas-e-medições)
6. [Ferramentas e Métodos](#ferramentas-e-métodos)
7. [Checklists](#checklists)
8. [Exemplos de Preenchimento](#exemplos-de-preenchimento)

#### 4.8.2. Introdução

Requisitos Não-Funcionais (NFR) definem as características qualitativas de um sistema que afetam desempenho, segurança, confiabilidade e usabilidade. Diferente dos requisitos funcionais, NFR descrevem não *o que* o sistema faz, mas *como* ele faz.

##### 4.8.2.1. Características chave de NFR de qualidade:
1.  **Mensurabilidade** - indicadores numéricos específicos
2.  **Testabilidade** - verificação objetiva
3.  **Realismo** - alcançável dentro do projeto
4.  **Priorização** - prioridade definida
5.  **Justificativa** - importância para o negócio

#### 4.8.3. Estrutura NFR

##### 4.8.3.1. Elementos Obrigatórios:
1.  **Identificador Único** - formato: NFR-XXX
2.  **Nome da Categoria** - tipo de requisito (Desempenho, Segurança, etc.)
3.  **Descrição** - descrição clara do que o sistema deve fornecer
4.  **Critérios de Medição** - indicadores mensuráveis específicos com unidades de medida
5.  **Prioridade** - Crítica/Alta/Média/Baixa
6.  **Justificativa** - importância para o negócio

##### 4.8.3.2. Template Universal NFR:

NFR-XXX: [Nome do Requisito]
Descrição: [Descrição clara do que o sistema deve fornecer]
Critérios de Medição:
- [Critério 1 com valores específicos e unidades de medida]
- [Critério 2 com valores específicos e unidades de medida]
- [Condições de medição e teste]
Prioridade: [Crítica/Alta/Média/Baixa]
Justificativa: [Por que este requisito é importante para o negócio]


#### 4.8.4. Principais Categorias NFR

##### 4.8.4.1. Desempenho
- **Tempo de Resposta**: não mais que 2 segundos sob carga de até 1000 usuários
- **Throughput**: pelo menos 500 transações por segundo
- **Uso de Recursos**: CPU não mais que 70%, memória não mais que 2 GB

##### 4.8.4.2. Segurança
- **Autenticação**: multifator, bloqueio após 5 tentativas falhas
- **Proteção de Dados**: criptografia AES-256, TLS 1.3
- **Autorização**: verificação de papel para cada requisição

##### 4.8.4.3. Confiabilidade
- **Disponibilidade**: pelo menos 99.9% por mês
- **Tempo de Recuperação**: não mais que 15 minutos após falha
- **Tolerância a Falhas**: redundância de componentes críticos

##### 4.8.4.4. Escalabilidade
- **Horizontal**: aumento linear ao adicionar servidores
- **Vertical**: aumento de recursos dá ganho proporcional de desempenho
- **Autoscaling**: dependendo da carga

##### 4.8.4.5. Usabilidade
- **Tempo de Aprendizado**: não mais que 2 horas para novo usuário
- **Número de Cliques**: não mais que 3 para operações principais
- **Acessibilidade**: conformidade com WCAG 2.1 AA

##### 4.8.4.6. Compatibilidade
- **Navegador**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Integração**: REST API, JSON/XML, SSO
- **Plataforma**: Windows Server 2019+, Linux Ubuntu 20.04+

##### 4.8.4.7. Portabilidade
- **Multiplataforma**: Windows, Linux, Docker, Kubernetes
- **Implantação Cloud**: AWS, Azure, GCP

##### 4.8.4.8. Manutenibilidade
- **Modularidade**: limites claros de componentes
- **Documentação**: API, cobertura de testes pelo menos 80%
- **Implantação**: não mais que 30 minutos para nova versão

#### 4.8.5. Templates por Categorias

##### 4.8.5.1. Desempenho

###### 4.8.5.1.1. Template NFR de Desempenho:

NFR-PERF-XXX: [Nome do Requisito de Desempenho]
Descrição: [Descrição do desempenho requerido do sistema]
Critérios de Medição:
- Tempo de Resposta: [valor] [unidade] sob [condições de carga]
- Throughput: [valor] [unidade]
- Uso de Recursos: CPU não mais que [%], memória não mais que [GB]
- Tempo de Carregamento de Página: não mais que [segundos]
Condições de Medição:
- Ambiente: [características do ambiente de teste]
- Carga: [número de usuários/requisições]
- Duração: [tempo de teste]
Ferramentas: [lista de ferramentas de medição]
Prioridade: [Crítica/Alta/Média/Baixa]
Justificativa: [importância para o negócio]


###### 4.8.5.1.2. Exemplo NFR de Desempenho:

NFR-PERF-001: Desempenho de Busca de Produtos
Descrição: O sistema de busca de produtos deve fornecer resposta rápida sob alta carga
Critérios de Medição:
- Tempo de Busca: não mais que 1 segundo sob 1000 requisições simultâneas
- Throughput: 2000 consultas de busca por segundo
- Tempo de Carregamento de Resultados: não mais que 500 ms (percentil 95)
- Uso de CPU: não mais que 60% sob carga de pico
Condições de Medição:
- Ambiente: 8 CPU, 16 GB RAM, SSD, rede 100 Mbps
- Carga: 1000 usuários simultâneos
- Dados: 1.000.000 produtos, 10.000 categorias
Ferramentas: Apache JMeter, Gatling, Prometheus
Prioridade: Crítica
Justificativa: Velocidade de busca é crítica para conversão de vendas


##### 4.8.5.2. Segurança

###### 4.8.5.2.1. Template NFR de Segurança:

NFR-SEC-XXX: [Nome do Requisito de Segurança]
Descrição: [Descrição das medidas de segurança requeridas]
Critérios de Medição:
- Autenticação: [métodos e parâmetros]
- Autorização: [mecanismos de controle de acesso]
- Proteção de Dados: [métodos de criptografia e proteção]
- Auditoria: [logging e monitoramento]
Condições de Teste:
- Cenários: [lista de cenários de teste]
- Ferramentas: [ferramentas de teste de segurança]
- Padrões: [conformidade com padrões]
Prioridade: [Crítica/Alta/Média/Baixa]
Justificativa: [importância para o negócio]


###### 4.8.5.2.2. Exemplo NFR de Segurança:

NFR-SEC-001: Autenticação de Usuário
Descrição: O sistema deve fornecer autenticação segura de usuários
Critérios de Medição:
- Autenticação Multifator: obrigatória para administradores
- Bloqueio de Conta: após 5 tentativas falhas por 30 minutos
- Complexidade de Senha: mínimo 8 caracteres, letras+números+caracteres especiais
- Timeout de Sessão: não mais que 8 horas de inatividade
- Criptografia de Senha: bcrypt com salt, mínimo 12 rounds
Condições de Teste:
- Cenários: ataques de força bruta, quebra de senha, injeções SQL
- Ferramentas: OWASP ZAP, Burp Suite, Metasploit
- Padrões: OWASP Top 10, NIST Cybersecurity Framework
Prioridade: Crítica
Justificativa: Proteção de dados pessoais de usuários


##### 4.8.5.3. Confiabilidade

###### 4.8.5.3.1. Template NFR de Confiabilidade:

NFR-REL-XXX: [Nome do Requisito de Confiabilidade]
Descrição: [Descrição da confiabilidade requerida do sistema]
Critérios de Medição:
- Disponibilidade: [percentual de uptime] em [período]
- Tempo de Recuperação (MTTR): não mais que [tempo]
- Tempo Médio Entre Falhas (MTBF): pelo menos [tempo]
- Tolerância a Falhas: [descrição dos mecanismos]
Condições de Teste:
- Cenários de Falha: [lista de cenários de teste]
- Planos de Recuperação: [procedimentos de recuperação]
- Monitoramento: [métricas e alertas]
Prioridade: [Crítica/Alta/Média/Baixa]
Justificativa: [importância para o negócio]


###### 4.8.5.3.2. Exemplo NFR de Confiabilidade:

NFR-REL-001: Disponibilidade do Sistema
Descrição: O sistema deve fornecer alta disponibilidade para usuários
Critérios de Medição:
- Disponibilidade: pelo menos 99.9% por mês (máximo 43 minutos de downtime)
- Tempo de Recuperação (MTTR): não mais que 15 minutos após falha
- Tempo Médio Entre Falhas (MTBF): pelo menos 720 horas (30 dias)
- Manutenção Programada: não mais que 4 horas por mês fora do horário comercial
- Monitoramento: 24/7 com alertas se indisponível por mais de 1 minuto
Condições de Teste:
- Cenários: falha de servidor, falha de banco de dados, falha de rede
- Planos de Recuperação: failover automático, backups
- Monitoramento: Pingdom, New Relic, health checks customizados
Prioridade: Crítica
Justificativa: Indisponibilidade do sistema leva a perda de vendas


#### 4.8.6. Métricas e Medições

##### 4.8.6.1. Regras para Descrever Métricas

###### 4.8.6.1.1 ✅ Correto:

- Tempo de Carregamento: não mais que 2 segundos sob carga de até 1000 usuários
- Disponibilidade: pelo menos 99.9% por mês
- Throughput: 1000 requisições por segundo
- Segurança: bloqueio após 5 tentativas falhas por 30 minutos


###### 4.8.6.1.2 ❌ Incorreto:

- Tempo de Carregamento: rápido
- Disponibilidade: alta
- Throughput: muitas requisições
- Segurança: sistema seguro


##### 4.8.6.2. Condições de Teste

Condições de Medição:
- Ambiente: Similar à produção (8 CPU, 16 GB RAM, SSD)
- Carga: 1000 usuários simultâneos
- Duração: 1 hora
- Dados: 100.000 registros
- Rede: 100 Mbps, latência 50 ms


#### 4.8.7. Ferramentas e Métodos

##### 4.8.7.1. Ferramentas Chave por Categoria:
- **Desempenho**: Apache JMeter, Lighthouse, New Relic
- **Segurança**: OWASP ZAP, SonarQube, Burp Suite
- **Confiabilidade**: Nagios, Zabbix, Prometheus
- **Usabilidade**: Google Analytics, Hotjar, UserTesting

##### 4.8.7.2. Métodos de Medição:
- **Teste de Carga**: Apache JMeter, Gatling
- **Monitoramento**: Prometheus + Grafana, New Relic
- **Análise de Segurança**: OWASP ZAP, Nessus
- **Teste de Usabilidade**: testes A/B, gravações de sessão

#### 4.8.8. Checklists

##### 4.8.8.1. Checklist Geral NFR:
- [ ] Requisito é mensurável e testável
- [ ] Valores numéricos específicos com unidades de medida especificados
- [ ] Prioridade do requisito definida
- [ ] Requisito não contradiz outros NFRs
- [ ] Requisito é realista para o projeto
- [ ] Justificativa de importância para o negócio fornecida
- [ ] Condições de medição e teste definidas
- [ ] Ferramentas de medição especificadas

##### 4.8.8.2. Checklists por Categorias:

###### 4.8.8.2.1. Desempenho
- [ ] Valores alvo e limite de tempo de resposta especificados
- [ ] Condições de carga e teste descritas
- [ ] Ferramentas de medição fornecidas

###### 4.8.8.2.2. Segurança
- [ ] Métodos e ferramentas de proteção descritos
- [ ] Padrões e conformidade especificados
- [ ] Cenários de teste fornecidos

###### 4.8.8.2.3. Confiabilidade
- [ ] Métricas de disponibilidade e recuperação especificadas
- [ ] Planos de redundância descritos
- [ ] Cenários de falha fornecidos

###### 4.8.8.2.4. Escalabilidade
- [ ] Estratégias de escalonamento descritas
- [ ] Valores limite especificados
- [ ] Decisões arquiteturais fornecidas

##### 4.8.8.3. Erros Comuns:
1.  **Formulações Vagas**: "rápido" em vez de "não mais que 2 segundos"
2.  **Unidades de Medida Faltando**: "1000 usuários" em vez de "1000 usuários simultâneos"
3.  **Requisitos Irrealistas**: "10 milissegundos" em vez de "100 milissegundos"
4.  **Justificativa Faltando**: NFR sem especificar importância de negócio
5.  **Requisitos Contraditórios**: NFRs que contradizem um ao outro

##### 4.8.8.4. Recomendações Práticas:
- Inclua métodos e ferramentas de medição para cada NFR
- Especifique condições de teste e ambiente
- Defina valores limite e cenários de degradação
- Documente conflitos e compromissos
- Use versionamento e controle de mudanças
- Vincule NFRs a decisões arquiteturais
- Atualize documentação regularmente

Use estes exemplos como referência para criar requisitos não-funcionais de alta qualidade.
