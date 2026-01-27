### 4.8. Informações de Stakeholders do Projeto
**Instruções para Coleta da Lista de Stakeholders do Projeto**

#### 4.8.1. Propósito
Fornecer ao agente de IA um processo passo a passo para identificar e documentar todos os stakeholders de uma iniciativa de projeto.

#### 4.8.2. Entradas Necessárias
1.  **Visão do Projeto / Termo de Abertura** – objetivos, escopo, critérios de sucesso.
2.  **Estrutura Organizacional** – organograma, lista de departamentos ou informações públicas da empresa.
3.  **Artefatos de Requisitos Existentes** – BRD, User Story, RFP, etc.
4.  **Contexto Regulatório e de Conformidade** (se aplicável).

> **Dica:** Se algum dado estiver faltando, peça ao usuário para fornecê-lo ou esclareça suposições.

#### 4.8.3. Categorias de Stakeholders

| Categoria        | Papéis Típicos                                  | Exemplos                           |
|-----------------|------------------------------------------------|------------------------------------|
| **Patrocinadores**    | Patrocinador Executivo, Membro do Comitê Diretor   | CFO, CTO                          |
| **Gestão**  | Product Owner, Gerente de Programa, Chefe de Departamento| Chefe de Operações                |
| **Usuários**       | Usuário Final, Usuário Avançado, Serviço de Suporte          | Caixa, Usuário de App Mobile          |
| **Técnico**   | Arquitetos, Desenvolvedores, QA, DevOps             | Desenvolvedor Backend Líder            |
| **Conformidade**  | Jurídico, Segurança, Gestão de Riscos, Auditoria        | DPO, CISO                         |
| **Externo**    | Fornecedores, Parceiros, Reguladores                | Provedor de Pagamentos, Banco Central    |
| **Outros**       | Treinamento, Marketing, Sucesso do Cliente          | Gerente de T&D                       |

#### 4.8.4. Passos de Coleta de Informações

1.  **Escaneamento Inicial**
    -   Analise os documentos fornecidos para nomes, departamentos e cargos.
    -   Forme uma lista preliminar de candidatos.

2.  **Classificação de Papéis**
    -   Atribua cada candidato a uma das categorias acima.
    -   Marque duplicados ou aliases (ex., "TI" vs "Tecnologia da Informação").

3.  **Análise de Lacunas**
    -   Verifique a lista contra o checklist de categorias; encontre as que faltam.
    -   Solicite esclarecimento se uma categoria crítica estiver vazia.

4.  **Enriquecimento de Atributos**
    -   Para cada stakeholder, registre:
        -   `Nome`
        -   `Cargo`
        -   `Departamento`
        -   `Nível de Influência (A/M/B)`
        -   `Nível de Interesse (A/M/B)`
        -   `Contatos (se disponível)`

5.  **Validação**
    -   Crie uma tabela final e mostre ao usuário para confirmação.
    -   Esclareça edições e atualize a lista até aprovação.

#### 4.8.5. 📄 Formato de Saída (Tabela Markdown)

| Nome         | Cargo       | Categoria   | Influência | Interesse | Notas             |
|--------------|-----------------|------------|-----------|----------|-------------------|
| João Silva  | Product Owner   | Gestão | A         | A        | Principal Tomador de Decisão|

#### 4.8.6. Critérios de Aceitação
- [ ] Todas as sete categorias de stakeholders foram avaliadas.
- [ ] Seis atributos estão preenchidos para cada stakeholder.
- [ ] Não há duplicados em nomes ou papéis.
- [ ] Usuário confirma completude.
- [ ] Lista final é exportada em formato de tabela Markdown.

#### 4.8.7. Recomendações e Padrões
- BABOK v3 – Análise de Stakeholders
- PMBOK – Processo de Identificação de Stakeholders
- ISO 21500 – Orientações sobre Gestão de Projetos

*Última atualização: {{DATA}}*
