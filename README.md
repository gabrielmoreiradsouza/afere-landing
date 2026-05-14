# Template — Landing Page Jornada Ads PRO

Template-base para landings de clientes do pacote **Jornada Ads PRO**.
Estética dark + verde neon, parallax CSS suave, formulário multi-step
que dispara WhatsApp com mensagem qualificada.

## Origem

Extraído da landing **Agtec Usinagem** (`clientes/agtec/landing/`) após
aprovação visual em 2026-04-29. Validado contra a referência
[polytoldosrbs.com.br](https://polytoldosrbs.com.br/) na seção de produtos.

## Estrutura de seções (na ordem em que aparecem)

1. **Nav fixa** — logo + links âncora + CTA principal
2. **Hero** — headline com palavra-destaque em neon, subheadline com sublinhado
   neon, foto full-bleed à direita com parallax (`background-attachment: fixed`)
3. **Barra de números** — 4 contadores animados ao entrar na viewport
4. **Dor × Solução** — 2 colunas contrastadas (vermelho × neon)
5. **Linha de produtos** — 6 faixas full-width zig-zag com fotos parallax
   e CTA "Eu quero!" → wa.me com mensagem específica por produto
6. **Diferenciais** — 4 cards com ícone
7. **Como funciona** — timeline horizontal de 5 passos com borda neon
8. **Prova social** — destaque visual + depoimento + setores atendidos
9. **Formulário multi-step** — 3 etapas (qualificação 1 → qualificação 2 → contato)
   que abrem WhatsApp com mensagem pré-preenchida
10. **FAQ accordion** — 5 perguntas
11. **CTA final** — bloco de fechamento com gradient
12. **Footer** — contato + CNPJ + créditos

## Stack

- HTML estático (zero build)
- Tailwind via CDN (config customizado inline com tokens neon/ink)
- Alpine.js (nav mobile, FAQ, formulário multi-step)
- AOS (scroll reveal) — **importante:** não aplicar `data-aos` em ancestrais
  diretos de elementos com `background-attachment: fixed`, isso quebra o
  parallax (transform residual fica no ancestor).
- Google Fonts: Inter + Space Grotesk

## Como customizar para um novo cliente

### 1. Copie o template para a pasta do cliente

```bash
cp -r templates/jornada-ads-pro-lp/ clientes/<cliente>/landing/
```

### 2. Substitua os placeholders no `index.html`

Procure por `{{` e substitua. Lista canônica de placeholders:

| Placeholder | Onde aparece | Exemplo |
|---|---|---|
| `{{CLIENTE_NOME}}` | Title, footer, alt de logo | "Agtec Usinagem" |
| `{{CLIENTE_NOME_CURTO}}` | Headline, copy | "Agtec" |
| `{{CLIENTE_TAGLINE}}` | Subheadline | "Serviços de usinagem, tornearia e solda" |
| `{{CLIENTE_REGIAO}}` | Badge no hero, FAQ | "Curitiba e RM" |
| `{{CLIENTE_WHATSAPP_E164}}` | Todos os links wa.me | "5541999090589" |
| `{{CLIENTE_WHATSAPP_DISPLAY}}` | Footer | "(41) 9 9909-0589" |
| `{{CLIENTE_CNPJ}}` | Footer | "14.450.927/0001-38" |
| `{{CLIENTE_RAZAO_SOCIAL}}` | Footer | "AGTEC USINAGEM LTDA" |
| `{{CLIENTE_ENDERECO_LINHA1}}` | Footer | "R. Pasteur, 175 — Guarani" |
| `{{CLIENTE_ENDERECO_LINHA2}}` | Footer | "Colombo/PR — CEP 83.408-020" |
| `{{HEADLINE}}` | H1 do hero | "Especialistas em projetar e produzir estruturas metálicas" |
| `{{HEADLINE_DESTAQUE}}` | Trecho do H1 que vira neon | "estruturas metálicas" |
| `{{SUBHEADLINE_PRE}}` | Antes do trecho sublinhado | "Enquanto o mercado leva 15 dias," |
| `{{SUBHEADLINE_DESTAQUE}}` | Trecho com `<u>` neon | "a Agtec entrega em 10" |
| `{{SUBHEADLINE_POS}}` | Depois | ". Orçamento em 24h..." |
| `{{PROMESSA_PRAZO}}` | Múltiplos lugares | "10 dias" |
| `{{PROMESSA_ORCAMENTO}}` | Múltiplos lugares | "24h" |

Para os 6 cards de produto, cada bloco tem:
`{{PROD_N_KICKER}}`, `{{PROD_N_TITULO}}`, `{{PROD_N_DESCRICAO}}`,
`{{PROD_N_IMG}}`, `{{PROD_N_ALT}}`, `{{PROD_N_WA_MSG}}`.

### 3. Tokens visuais (cores)

Em `css/styles.css` topo + `index.html` no `<script>tailwind.config`,
ajuste as cores se o cliente tiver identidade diferente:

```css
:root {
  --neon: #A8E61C;       /* cor de destaque do cliente */
  --neon-soft: rgba(168, 230, 28, 0.15);
}
```

E no Tailwind config:
```js
colors: { neon: { DEFAULT: '#A8E61C', ... }, ink: { ... } }
```

Para clientes com identidade clara (ex: laranja Orion), regenerar a paleta
`neon.50–900` partindo da cor principal.

### 4. Imagens

Coloque em `img/` (mesmo nome dos placeholders ou novos):

- **Logo:** `logo-cliente.png` (PNG transparente) e versão recortada
  `logo-cliente-tight.png` (cortar bordas vazias com `sips -c <h> <w> in --out out`).
- **Hero:** foto principal do cliente, otimizada em `.webp`.
- **6 produtos:** fotos `.webp` (banco ou reais).
- **Prova social:** foto adicional pra seção de cases.

Receita de otimização (Mac):
```bash
sips -Z 1600 foto.heic --out foto.jpg     # converte HEIC + redimensiona
cwebp -q 82 foto.jpg -o foto.webp          # gera webp
```

### 5. Mensagens do WhatsApp por produto

Cada CTA "Eu quero!" deve ter URL `wa.me/<E164>?text=<encoded>` com a
mensagem certa do produto. Dispara conversa direta com contexto.

### 6. Tracking (GA4 + Meta Pixel)

Aplicar o playbook de tracking salvo na memória
(`reference_playbook_tracking_lp.md`):
- GTM no `<head>`
- Meta Pixel no `<head>`
- O `js/app.js` já dispara `dataLayer.push({event: 'lead_qualificado', ...})`
  e `fbq('track', 'Lead')` no envio do formulário.

## Atenções importantes

### Parallax (`background-attachment: fixed`)

- **NÃO** aplicar `data-aos` em ancestrais diretos de `.prod-img-bg`.
  Qualquer `transform` num ancestor anula o `fixed` (vira relativo ao ancestor).
  Bug encontrado e corrigido na v7 do Agtec — caso surja regressão, verificar
  `getComputedStyle(parent).transform` na imagem com problema.
- Em mobile/touch (`@media (hover: none)` e `(max-width: 1023px)`), o CSS já
  cai pra `background-attachment: scroll` automaticamente. iOS bugа no fixed.

### Hero full-bleed

O hero **sai do container `max-w-7xl`**. O texto à esquerda usa
`padding-left: max(2rem, calc((100vw - 1280px) / 2 + 2rem))` pra alinhar com
o eixo do max-w-7xl da nav. A imagem direita vai até a borda da viewport.

### Logo no header

Versão `logo-tight.png` (com bordas verticais cortadas via `sips -c`) permite
a logo aparecer ~3x maior sem inflar a altura do header.

## Pendências típicas em cada novo projeto

- [ ] Logo do cliente (PNG + versão tight)
- [ ] 5–6 fotos de produto/serviço (reais ou banco)
- [ ] Foto principal do hero
- [ ] Headline + subheadline com palavra-destaque definidos
- [ ] Mensagens WhatsApp por produto (texto)
- [ ] CNPJ, endereço, contatos para footer
- [ ] Cor primária (se diferente do verde neon padrão)
- [ ] Depoimentos/cases (se houver)
- [ ] Pixel ID (Meta) e GTM ID (Google)
