# Mapa de customização — busca e substituir

Este template é uma cópia funcional da landing da Agtec. Para criar uma LP
de outro cliente, faça **busca e substitui** pelos itens abaixo. A LP da
Agtec serve de referência viva — o conteúdo dela é exemplo concreto, não
placeholder rígido.

## Substituições puramente mecânicas (texto literal)

| Buscar | Substituir por | Onde aparece |
|---|---|---|
| `Agtec Usinagem` | Nome comercial completo | Title, OG, alt de logo, footer |
| `Agtec` | Nome curto/marca | Headline, copy, CTAs |
| `AGTEC USINAGEM LTDA` | Razão social | Footer |
| `14.450.927/0001-38` | CNPJ | Footer |
| `5541999090589` | WhatsApp E.164 (sem `+`) | Todos os links `wa.me/...` |
| `(41) 9 9909-0589` | WhatsApp formato display | Footer |
| `R. Pasteur, 175 — Guarani` | Endereço linha 1 | Footer |
| `Colombo/PR — CEP 83.408-020` | Endereço linha 2 | Footer |
| `Colombo/PR` | Cidade/UF | Várias |
| `Curitiba e região metropolitana` | Região atendida | Hero, FAQ |
| `RM Curitiba` | Versão curta da região | FAQ, footer |

## Conteúdo a reescrever do zero (não é busca/substitui)

São blocos de copy específicos do cliente — vai precisar pensar caso a caso:

### Hero
- **Badge** (linha "Curitiba e RM com bolinha verde")
- **Headline** + palavra-destaque em verde
- **Subheadline** + trecho com sublinhado neon
- **Imagem do hero** (em `img/`, recomendado 1600px largura, otimizada `.webp`)

### Barra de números
- 4 contadores: prazo, orçamento, % vs mercado, erros. Trocar `data-target` e `data-suffix`.

### Dor × Solução
- 5 itens em cada coluna (mercado em geral × cliente)

### Linha de produtos (6 cards)
Para cada um:
- Kicker (1 palavra: Resistência, Precisão, Qualidade…)
- Título do produto
- Descrição 2-3 linhas
- Imagem (`img/<produto>.webp`) — banco ou real
- Mensagem WhatsApp específica do produto (URL-encoded no `wa.me`)

### Diferenciais (4 cards)
Cada card: ícone SVG + título + 1 frase

### Como funciona (5 passos)
Nome curto + 1 frase pra cada passo

### Prova social
- Imagem destaque + cliente + descrição
- 1 depoimento + autor (ou marcar "em coleta")
- Setores atendidos (lista 4-5 itens)

### Formulário multi-step (qualificação)
Editar em `index.html` (perguntas 1 e 2) e em `js/app.js` (mapa de respostas
para texto que vai pro WhatsApp).

### FAQ (5 perguntas)
Reescrever conforme dúvidas típicas do segmento

### Footer
- Logo, descrição empresa, contatos, CNPJ, endereço

## Tokens visuais

Se o cliente tem identidade diferente do verde neon padrão, mude em **dois
lugares**:

**1) `css/styles.css` (topo):**
```css
:root {
  --neon: #A8E61C;       /* hex da cor primária do cliente */
  --neon-soft: rgba(168, 230, 28, 0.15);
}
```

**2) `index.html` (script `tailwind.config`):**
```js
neon: {
  DEFAULT: '#A8E61C',
  50:  '#F2FBDA',
  100: '#E5F7B5',
  /* gerar paleta 50-900 a partir da cor primária */
}
```

Pra gerar paleta 50-900 a partir de qualquer hex:
[uicolors.app/create](https://uicolors.app/create) ou similar.

## Imagens

### Logo
Coloque 2 versões em `img/`:
- `logo-cliente.png` (PNG transparente, full)
- `logo-cliente-tight.png` (recortar bordas verticais com `sips -c <h> <w>`)

```bash
# exemplo: imagem original 225x224, recortar pra 130 de altura mantendo conteúdo
sips -c 130 225 logo-cliente.png --out logo-cliente-tight.png
```

### Fotos
Otimizar todas pra `.webp`:

```bash
# converte HEIC do iPhone + redimensiona
sips -s format jpeg -Z 1600 foto.heic --out foto.jpg
# gera webp comprimido
cwebp -q 82 foto.jpg -o foto.webp
```

## Tracking

Editar `<head>` do `index.html` adicionando os snippets:

- **GTM** (Google Tag Manager): inserir antes de `</head>`
- **Meta Pixel**: snippet padrão da Meta com PIXEL_ID
- **GA4**: gtag.js com MEASUREMENT_ID

O `js/app.js` já dispara:
- `dataLayer.push({event: 'lead_qualificado', ...})` no submit do formulário
- `fbq('track', 'Lead')` no submit do formulário (se Pixel carregado)

Adicionar disparo de Lead/Contact em cada CTA WhatsApp também (cliques nos
botões "Eu quero!" + WhatsApp flutuante + CTAs do hero).

## Domínio

Padrão: `<cliente>.moreirads.cloud`

## Workflow recomendado

1. `cp -r templates/jornada-ads-pro-lp/ clientes/<cliente>/landing/`
2. Joga assets do cliente em `clientes/<cliente>/assets/` (originais) e
   otimizados em `clientes/<cliente>/landing/img/`
3. Aplica busca/substitui da tabela acima
4. Reescreve copy seção por seção
5. Ajusta tokens se a cor é diferente
6. Roda local: `cd <pasta> && python3 -m http.server 8765`
7. Abre `http://localhost:8765` e ajusta visualmente
8. Plug tracking (GTM/Pixel/GA4) e testa eventos
9. Cria repo GitHub `<cliente>-landing`, commit, push
10. Conecta Hostinger no domínio
