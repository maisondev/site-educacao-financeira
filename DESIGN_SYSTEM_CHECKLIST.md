# Design System - Checklist de Implementação ✅

## Status da Padronização do Projeto (2026-08-25)

### ✅ Concluído

#### 1. **CSS Design System**
- [x] Paleta de cores definida (primária, secundárias, neutras)
- [x] Tipografia padronizada (h1-h3, display scales)
- [x] Variáveis CSS para espaçamento, border-radius, sombras
- [x] 30+ variáveis reutilizáveis em `:root`

#### 2. **Componentes CSS Reutilizáveis**
- [x] `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-large`
- [x] `.badge-nivel` com três níveis (básico, intermediário, avançado)
- [x] `.maxima` (caixa de insight)
- [x] `.caixa-ferramenta` (container interativo)
- [x] `.table-highlight-*` (linhas destacadas de tabelas)
- [x] `hr` com estilos padrão
- [x] Transições suaves (0.2s) para hover states

#### 3. **Remoção de Estilos Inline**
- [x] Remover `style="background-color: ..."` de tabelas
- [x] Remover `style="..."` de divs
- [x] Remover `☰` emoji do menu (usar `<span>` animadas)
- [x] Remover emojis dos textos de navegação (📚 → Aprender, 💡 → Máximas, etc.)
- [x] Remover emojis das máximas (💡 → apenas texto)

#### 4. **Documentação**
- [x] `DESIGN_SYSTEM.md` — guia completo
- [x] `TEMPLATE_PAGINA.html` — template para novas páginas
- [x] `design-system-demo.html` — playground visual
- [x] `CLAUDE.md` atualizado com padrão
- [x] Este arquivo de checklist

#### 5. **Páginas Padronizadas**
- [x] `index.html` — homepage
- [x] `maximas.html` — máximas (remover emojis)
- [x] `temas/index.html` — índice de temas
- [x] `temas/orcamento-pessoal/index.html` — tema index
- [x] `temas/orcamento-pessoal/o-que-e-orcamento-pessoal.html` — artigo (remover emojis + tabela)
- [x] `temas/orcamento-pessoal/metodo-50-30-20.html` — artigo (remover emojis + tabela)
- [x] `temas/reserva-de-emergencia/index.html` — tema index
- [x] `temas/juros-e-investimentos/index.html` — tema index
- [ ] `temas/reserva-de-emergencia/o-que-e-reserva-de-emergencia.html` — artigo (pendente: remover emojis)
- [ ] `temas/juros-e-investimentos/juros-compostos-na-pratica.html` — artigo (pendente: remover emojis)
- [ ] `ferramentas/calculadora-juros-compostos.html` — ferramenta (pendente: remover emojis)
- [ ] `metas.html` — gerenciador de metas (pendente: remover emojis se houver)

### 🔄 Em Andamento / Pendente

- [ ] Remover emojis dos 3 artigos restantes (reserva-de-emergencia, juros, calculadora)
- [ ] Revisar `metas.html` e `design-system-demo.html` para emojis

## 📋 Instruções para Novas Páginas

### Usar **SEMPRE** o template: `TEMPLATE_PAGINA.html`

1. **Copie** `TEMPLATE_PAGINA.html` → `temas/seu-tema/novo-artigo.html`
2. **Ajuste** o `href` do CSS conforme profundidade de pasta
3. **Substitua** placeholders (título, breadcrumb, conteúdo)
4. **Valide**:
   - ❌ Sem emojis no menu/navegação
   - ❌ Sem `style="color: ..."` inline
   - ✅ Classes `.btn-primary`, `.badge-nivel badge-basico`, `.maxima`
   - ✅ Cores via variáveis `var(--cor-*)`
   - ✅ Espaçamento via `var(--espacamento-*)`

## 🎨 Variáveis CSS Principais

```css
/* Cores */
--cor-primaria: #4a154b
--cor-azul: #1264a3
--cor-verde: #2d7e3c
--cor-amarelo: #c88c00
--cor-vermelho: #a63030

/* Espaçamento */
--espacamento-md: 16px
--espacamento-lg: 24px
--espacamento-xl: 32px

/* Tipografia */
--fonte-peso-bold: 700
--fonte-tamanho-h1: 50px
--fonte-tamanho-h2: 32px

/* Border Radius */
--border-radius-pill: 24px
--border-radius-md: 8px
```

## ✨ Benefícios Conquistados

1. ✅ **Consistência visual** — mesmo padrão em todas as páginas
2. ✅ **Manutenibilidade** — mudar cor global é 1 linha de CSS
3. ✅ **Escalabilidade** — template reutilizável para 100+ artigos
4. ✅ **Profissionalismo** — design limpo, sem clutter (sem emojis)
5. ✅ **Acessibilidade** — cores contrastantes, tipografia clara
6. ✅ **Performance** — sem dependencies, apenas CSS/HTML/JS puro

## 📚 Referências Rápidas

- Cores: `DESIGN_SYSTEM.md`
- Componentes: `design-system-demo.html`
- Template: `TEMPLATE_PAGINA.html`
- CSS: `assets/css/style.css`

---

**Última atualização**: 2026-08-25
**Status**: 70% concluído (artigos principais padronizados, 3 pendentes)
