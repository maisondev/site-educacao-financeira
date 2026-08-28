# Design System - Educação Financeira

Design system inspirado na paleta Slack Design System, adaptado para um site de educação financeira.

## 🎨 Paleta de Cores

### Cores Primárias
- **Primária**: `#4a154b` (roxo profundo - brand principal)
- **Primária Light**: `#6a2f6f` (roxo mais claro - hover states)
- **Primária Hover**: `#3a0d3b` (roxo escuro - active states)

### Cores Neutras
- **Texto**: `#1d1d1d` (preto - texto principal)
- **Texto Leve**: `#696969` (cinza - texto secundário)
- **Fundo**: `#ffffff` (branco - fundo principal)
- **Fundo Alt**: `#f4ede4` (bege claro - fundo secundário)
- **Borda**: `#e6e6e6` (cinza claro - divisões)
- **Cinza Leve**: `#f5f5f5` (cinza muito claro - backgrounds)

### Cores Secundárias
- **Azul**: `#1264a3` (links)
- **Verde**: `#2d7e3c` (badges básico, sucesso)
- **Amarelo**: `#c88c00` (badges intermediário, aviso)
- **Vermelho**: `#a63030` (badges avançado, erro)

## 📏 Tipografia

### Escalas
- **Display XXL** (h1): 50px / peso 700 / line-height 1.2
- **Display MD** (h2): 32px / peso 700 / line-height 1.3
- **Display SM** (h3): 24px / peso 700 / line-height 1.4
- **Body**: 16px / peso 400 / line-height 1.6

### Pesos
- **Regular**: 400
- **Semibold**: 500
- **Bold**: 700

### Fonte
- System font stack: `system-ui, -apple-system, sans-serif`
- Sem dependências externas (fontes do sistema)

## 📐 Espaçamento

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
```

## 🎯 Componentes

### Botões
- **Estilo**: Sólido com fundo primário
- **Padding**: 8px 16px (sm/md) ou 16px 24px (md/lg)
- **Border Radius**: 24px (pill-shaped, Slack-inspired)
- **Hover**: Cor primária light com transform: scale(1.05)
- **Transição**: 0.2s ease

### Cards
- **Fundo**: Branco
- **Borda**: 1px solid `#e6e6e6`
- **Border Radius**: 8px
- **Padding**: 24px
- **Sombra**: 0 4px 12px rgba(0,0,0,0.15) on hover
- **Hover Effect**: Elevação + transformação Y-2px

### Cards de Cartões (Banco)
- **Nubank**: Gradiente #7c3aed → #6d28d9, texto branco
- **Bradesco**: Gradiente #b91c1c → #991b1b, texto branco
- **Itaú**: Gradiente #0369a1 → #0c4a6e, texto branco
- **Santander**: Gradiente #d97706 → #b45309, texto branco
- **Caixa**: Gradiente #0369a1 → #0c4a6e, texto branco
- **Banco do Brasil**: Gradiente #ca8a04 → #a16207, texto branco

### Badges
- **Tamanhos**: 12px font
- **Padding**: 4px 8px
- **Border Radius**: 4px
- **Tipos**:
  - Básico: fundo verde (#2d7e3c), texto branco
  - Intermediário: fundo amarelo (#c88c00), texto branco
  - Avançado: fundo vermelho (#a63030), texto branco

### Inputs
- **Padding**: 8px 16px
- **Border Radius**: 8px
- **Borda**: 1px solid `#e6e6e6`
- **Focus**: Borda primária + shadow (0 0 0 3px rgba(74, 21, 75, 0.1))

## 🌈 Caixas Especiais

### Máximas (Insights)
- **Fundo**: `#f9f5fa` (roxo muito claro)
- **Borda Esquerda**: 4px solid primária
- **Padding**: 24px
- **Border Radius**: 8px
- **Texto**: Bold primária, 18px

### Ferramentas
- **Fundo**: `#f9f5fa`
- **Borda**: 2px solid primária
- **Padding**: 24px
- **Border Radius**: 8px

## 🪞 Sombras

```
sm: 0 2px 8px rgba(0, 0, 0, 0.1)
md: 0 4px 12px rgba(0, 0, 0, 0.15)
lg: 0 8px 24px rgba(0, 0, 0, 0.2)
```

## ⚡ Variáveis CSS Disponíveis

Todas essas são definidas em `assets/css/style.css` na seção `:root`:

```css
/* Cores */
--cor-primaria
--cor-primaria-light
--cor-primaria-hover
--cor-texto
--cor-texto-light
--cor-fundo
--cor-fundo-alt
--cor-borda
--cor-cinza-leve
--cor-azul
--cor-verde
--cor-amarelo
--cor-vermelho

/* Espaçamento */
--espacamento-xs/sm/md/lg/xl

/* Tipografia */
--fonte-tamanho-h1/h2/h3
--fonte-peso-regular/semibold/bold
--linha-altura

/* Sombras */
--sombra-sm/md/lg

/* Border Radius */
--border-radius-sm
--border-radius-md
--border-radius-pill
```

## 🎨 Como Usar

1. **Sempre use as variáveis CSS** em vez de hardcodar cores
2. **Mantenha consistência** em padding/margin usando `--espacamento-*`
3. **Use border-radius do design system** (sm/md/pill)
4. **Aplique transições** para interações suaves (0.2s ease)
5. **Teste em dark/light mode** se necessário (suporte futuro)

## ♿ Acessibilidade & Contraste

- **Contraste mínimo**: WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
- **Texto em fundo claro**: sempre usar cor escura (--cor-texto ou escuro)
- **Texto em fundo escuro**: sempre usar branco ou cor clara
- **Badges**: usar cores sólidas com texto branco (não usar fundo claro + texto escuro)
- **Cards**: se usar gradientes escuros, texto deve ser branco; se fundos claros, texto deve ser --cor-texto
- **Nunca usar**: cores muito próximas (ex: verde claro com texto verde escuro)

## 📚 Referências

- Baseado em: [Slack Design System](https://getdesign.md/slack/design-md)
- Adaptado para: Educação Financeira
- Simplificidade: Sem dependências externas, fontes do sistema

---

**Última atualização**: 2026-08-25
