# Scripts de Análise de Keywords

Este diretório contém scripts para análise e monitoramento das keywords geradas automaticamente pelo sistema.

## 📊 analyze-keywords.js

Script que analisa todas as keywords geradas para todas as páginas do site.

### Como usar:

```bash
# Executar análise manual
npm run analyze-keywords

# Executar após build (automático)
npm run build
```

### O que o script faz:

1. **Gera keywords para diferentes tipos de páginas:**
   - Homepage (EN/PT-BR)
   - Páginas de produtos com diferentes parâmetros
   - Páginas de versões do jogo
   - Páginas de ligas
   - Páginas de produtos por categoria/dificuldade

2. **Analisa estatísticas:**
   - Total de páginas analisadas
   - Distribuição por idioma
   - Distribuição por tipo de página
   - Top 20 keywords mais comuns
   - Keywords de compra específicas
   - Keywords de liga específicas

3. **Mostra exemplos:**
   - Exemplos de páginas específicas com suas keywords
   - Demonstra como as keywords são geradas com parâmetros

### Exemplo de output:

```
🔍 ANÁLISE DE KEYWORDS - TODAS AS PÁGINAS
================================================================================

📊 ESTATÍSTICAS GERAIS:
Total de páginas: 132
Páginas em inglês: 66
Páginas em português: 66

🏆 TOP 20 KEYWORDS MAIS COMUNS:
 1. orb                             72x ████████████████████████████████████
 2. league                          63x ███████████████████████████████
 3. season                          63x ███████████████████████████████
 4. comprar moedas liga             60x ██████████████████████████████
 5. hardcore                        50x █████████████████████████
 ...

💰 KEYWORDS DE COMPRA (22):
  buy divine orbs: 6x (EN: 6, PT-BR: 0)
  comprar divine orb poe: 6x (EN: 0, PT-BR: 6)
  ...

🏆 KEYWORDS DE LIGA (10):
  league: 63x (EN: 63, PT-BR: 0)
  comprar moedas liga: 60x (EN: 0, PT-BR: 60)
  ...
```

### Configuração no package.json:

```json
{
  "scripts": {
    "postbuild": "next-sitemap && node scripts/analyze-keywords.js",
    "analyze-keywords": "node scripts/analyze-keywords.js"
  }
}
```

### Benefícios:

- ✅ **Monitoramento automático** das keywords após cada build
- ✅ **Análise completa** de cobertura SEO
- ✅ **Identificação de gaps** em keywords
- ✅ **Verificação de consistência** entre idiomas
- ✅ **Métricas de performance** SEO

### Personalização:

Para adicionar novos tipos de páginas ou modificar a análise, edite o arquivo `scripts/analyze-keywords.js` e ajuste a função `generatePageKeywords()`.
