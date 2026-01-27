### 4.3. Revisão de Conformidade de Requisitos
**Instruções para Verificação de Conformidade de Requisitos**

#### 4.3.1. Propósito
Verificar a qualidade dos requisitos e conformidade com padrões e melhores práticas.

#### 4.3.2. Fontes para Revisão
- User Stories (US)
- Use Cases (UC)
- Critérios de Aceitação (AC)
- Diagramas de Atividades
- Glossário do projeto
- Requisitos não-funcionais (NFR)

---

#### 4.3.3. Critérios de Revisão

##### 4.3.3.1. Completude

| Verificação | Descrição | Criticidade |
|---------|----------|----------------|
| Estrutura | Todos os elementos obrigatórios presentes | Alta |
| Cobertura | Todos os cenários de negócio cobertos | Alta |
| Detalhamento | Nível de detalhe suficiente | Média |
| Conectividade | Links entre artefatos | Alta |

##### 4.3.3.2. Consistência

| Verificação | Descrição | Criticidade |
|---------|----------|----------------|
| Terminologia | Uso uniforme de termos | Alta |
| Formato | Conformidade com templates | Média |
| Lógica | Sem contradições | Alta |
| Versionamento | Rastreabilidade de mudanças | Média |

##### 4.3.3.3. Clareza

| Verificação | Descrição | Criticidade |
|---------|----------|----------------|
| Formulações | Inequívoco | Alta |
| Exemplos | Disponibilidade e adequação | Média |
| Contexto | Suficiência de background | Média |

##### 4.3.3.4. Testabilidade

| Verificação | Descrição | Criticidade |
|---------|----------|----------------|
| Mensurabilidade | Métricas e indicadores disponíveis | Alta |
| Cenários de teste | Possibilidade de criar casos de teste | Alta |
| Critérios de sucesso | Clareza de condições de aceitação | Alta |

---

#### 4.3.4. Checklist de Verificação

##### 4.3.4.1. User Stories
- [ ] Formato "Como-Eu quero-Para que" seguido
- [ ] Papel corresponde a atores do sistema
- [ ] Ação é específica e mensurável
- [ ] Resultado contém benefício de negócio
- [ ] Link com Use Case existe
- [ ] Critérios de aceitação definidos

##### 4.3.4.2. Use Cases
- [ ] Todos os 9 elementos obrigatórios presentes
- [ ] Nome contém verbo de ação
- [ ] Cenário principal tem 5-15 passos
- [ ] Mínimo 2 cenários alternativos
- [ ] Pré e pós-condições definidas
- [ ] Atores correspondem à arquitetura

##### 4.3.4.3. Critérios de Aceitação
- [ ] Critérios mensuráveis e testáveis
- [ ] Valores específicos indicados
- [ ] Condições de verificação descritas
- [ ] Prioridade definida
- [ ] Justificativa de negócio disponível

##### 4.3.4.4. Glossário
- [ ] Todos os termos chave definidos
- [ ] Definições inequívocas
- [ ] Sem duplicados ou contradições
- [ ] Termos categorizados
- [ ] Fontes indicadas

---

#### 4.3.5. Formato do Relatório

##### 4.3.5.1. Estrutura do Relatório

# Relatório de Revisão de Requisitos

## 1. Informações Gerais
- Data da revisão: [data]
- Revisor: [Agente de IA]
- Artefatos verificados: [lista]
- Escopo da revisão: [descrição]

## 2. Resumo Executivo
- Total de achados: [número]
- Críticos: [número]
- Altos: [número]
- Médios: [número]
- Baixos: [número]

## 3. Achados Detalhados

### 3.1. Achado [ID]
**Artefato:** [nome do artefato]
**Categoria:** [categoria do achado]
**Criticidade:** [Crítica/Alta/Média/Baixa]
**Descrição:** [descrição detalhada do achado]
**Localização:** [onde encontrado]
**Recomendação:** [como corrigir]

## 4. Recomendações Gerais
[Lista de recomendações para melhoria]

## 5. Conclusão
[Avaliação geral de qualidade e próximos passos]


##### 4.3.5.2. Categorias de Achados

| Categoria | Descrição | Exemplos |
|----------|----------|---------|
| Completude | Elementos ou informações faltantes | Campo obrigatório ausente |
| Consistência | Contradições ou inconsistências | Terminologia diferente |
| Clareza | Formulações ambíguas | Requisito vago |
| Testabilidade | Impossibilidade de verificação | Sem métricas |
| Rastreabilidade | Links quebrados | Referência inexistente |

##### 4.3.5.3. Níveis de Criticidade

| Nível | Descrição | Impacto |
|--------|----------|--------|
| Crítico | Bloqueador para desenvolvimento | Impedimento imediato |
| Alto | Impacto significativo na qualidade | Retrabalho necessário |
| Médio | Impacto moderado | Correção recomendada |
| Baixo | Impacto menor | Correção desejável |

---

#### 4.3.6. Métricas de Qualidade

##### 4.3.6.1. Indicadores de Qualidade de Requisitos

| Métrica | Fórmula | Alvo |
|--------|--------|------|
| Completude | Elementos presentes / Total necessário | ≥ 95% |
| Consistência | Termos consistentes / Total de termos | ≥ 98% |
| Testabilidade | Requisitos testáveis / Total de requisitos | ≥ 90% |
| Rastreabilidade | Links válidos / Total de links | ≥ 100% |

##### 4.3.6.2. Critérios de Aprovação

- [ ] Nenhum achado Crítico pendente
- [ ] Achados Altos resolvidos ou com plano de ação
- [ ] Completude ≥ 95%
- [ ] Consistência ≥ 98%

---

#### 4.3.7. Processo de Revisão

##### 4.3.7.1. Passos de Execução
1. **Coleta de artefatos** - identificar documentos para revisão
2. **Análise estrutural** - verificar completude de templates
3. **Análise lógica** - verificar consistência e coerência
4. **Análise de qualidade** - verificar clareza e testabilidade
5. **Documentação** - registrar achados
6. **Relatório** - compilar relatório final

##### 4.3.7.2. Critérios de Conclusão
- Todos os artefatos no escopo foram revisados
- Todos os achados foram documentados
- Relatório foi gerado no formato especificado
- Recomendações foram fornecidas para cada achado
