# Chá de Casa Nova — Yan & Nicolle · Design Spec

**Data:** 2026-06-27  
**Status:** Aprovado

---

## 1. Visão Geral

Site de convite e lista de presentes para o Chá de Casa Nova de Yan e Nicolle.  
Data do evento: **14/11/2026** (hora e local a definir via painel admin).

Site estático hospedado no **GitHub Pages**, com Firebase Realtime Database como storage para itens e dados do evento. Zero backend, zero framework — HTML + CSS + JS puro.

---

## 2. Arquitetura

```
cha-bar/
├── index.html          # Site público
├── admin.html          # Painel admin (protegido por senha)
├── css/
│   └── style.css       # Estilos globais
├── js/
│   ├── app.js          # Lógica do site público (countdown, lista, busca)
│   ├── admin.js        # Lógica do painel admin (CRUD Firebase)
│   └── firebase.js     # Inicialização e config Firebase
└── docs/
    └── superpowers/specs/
        └── 2026-06-27-cha-casa-nova-design.md
```

### Dependências externas
- **Firebase Realtime Database** — free tier (Google) — storage de itens e config do evento
- **Mercado Livre API** — `https://api.mercadolibre.com/sites/MLB/search?q={item}&limit=5` — sem auth, gratuita
- **Google Fonts** — Playfair Display (títulos) + Inter (corpo)

---

## 3. Paleta e Visual

| Token        | Valor     | Uso                          |
|--------------|-----------|------------------------------|
| `--olive`    | `#555934` | Headers, botões primários, acentos |
| `--cream`    | `#f2e6d8` | Background principal, cards  |
| `--white`    | `#ffffff` | Backgrounds secundários      |
| `--text`     | `#2e2c1e` | Texto principal              |

**Fontes:** Playfair Display (h1, h2) · Inter (body, labels, botões)  
**Estilo:** Elegante, orgânico, aconchegante. Cards com sombra suave, bordas arredondadas, animações leves de fade-in no scroll.

---

## 4. Seções — index.html

### 4.1 Hero
- Título: "Chá de Casa Nova"
- Subtítulo: "Yan & Nicolle"
- Frase curta (editável via admin)
- Background: textura sutil ou ilustração SVG de folhagens na paleta olive/cream

### 4.2 Contagem Regressiva
- Contador animado: dias · horas · minutos · segundos
- Target: 14/11/2026 (hora configurável via admin; default 12:00)
- Atualiza a cada segundo via `setInterval`
- Exibe mensagem especial quando chegar ao dia

### 4.3 Detalhes do Evento
- Data: 14/11/2026
- Hora: (a definir — placeholder até admin preencher)
- Local: (a definir — placeholder até admin preencher)
- Quando local preenchido: link "Ver no mapa" → Google Maps

### 4.4 Lista de Presentes
- Grid responsivo de cards (1 col mobile, 2-3 col desktop)
- Cada card exibe:
  - Nome do item (ex: "Panela de pressão")
  - Badge de cor preferida (ex: ■ Preta) — cor do badge reflete a cor escolhida
  - Categoria (Cozinha / Banheiro / Sala / Quarto / Outros)
  - Botão "Ver nas lojas"
- Clicar em "Ver nas lojas" → modal com:
  - Spinner de carregamento
  - Top 5 resultados Mercado Livre: thumbnail, título, preço, botão "Comprar" (link direto)
  - 4 botões de busca rápida: Magazine Luiza · Amazon.com.br · Americanas · Shopee
  - (busca rápida abre nova aba com URL de busca do respectivo site)

### 4.5 Footer
- Mensagem de Yan e Nicolle (editável via admin)
- Ano

---

## 5. Admin — admin.html

### Autenticação
- Senha hardcoded em `admin.js` (hash SHA-256 comparado no browser)
- Sem session storage — pede senha toda vez que abre a página
- Senha default: definida no momento da implementação, documentada no README

### Funcionalidades
1. **Itens da lista** — tabela com todos os itens + botões Editar / Excluir + botão Adicionar
2. **Formulário de item:**
   - Nome (texto obrigatório)
   - Categoria (select: Cozinha / Banheiro / Sala / Quarto / Outros)
   - Cor preferida (text input + color picker nativo HTML)
   - Observação (texto opcional, aparece como tooltip no card)
3. **Dados do evento:**
   - Hora do evento (time input)
   - Local (texto)
   - Endereço completo (texto — usado no link do Google Maps)
   - Frase do hero (textarea)
   - Mensagem do footer (textarea)
4. **Salvar** → grava no Firebase imediatamente → site público atualiza na próxima carga

---

## 6. Firebase — Estrutura de dados

```json
{
  "evento": {
    "hora": "14:00",
    "local": "Nome do local",
    "endereco": "Rua X, nº Y, Cidade",
    "frase_hero": "Venham celebrar conosco!",
    "mensagem_footer": "Com amor, Yan e Nicolle ♥"
  },
  "itens": {
    "-abc123": {
      "nome": "Panela de pressão",
      "categoria": "Cozinha",
      "cor": "#000000",
      "cor_nome": "Preta",
      "observacao": "5L ou maior"
    }
  }
}
```

---

## 7. Busca nas lojas

### Mercado Livre API
- Endpoint: `GET https://api.mercadolibre.com/sites/MLB/search?q={nome_item}&limit=5`
- Retorna: `results[].title`, `results[].price`, `results[].permalink`, `results[].thumbnail`
- Sem API key necessária para busca básica
- Chamada feita client-side no momento do clique (lazy load)

### Busca rápida nas outras lojas
| Loja | URL de busca |
|------|-------------|
| Magazine Luiza | `https://www.magazineluiza.com.br/busca/{query}` |
| Amazon.com.br | `https://www.amazon.com.br/s?k={query}` |
| Americanas | `https://www.americanas.com.br/busca/{query}` |
| Shopee | `https://shopee.com.br/search?keyword={query}` |

---

## 8. Responsividade

- Mobile-first
- Breakpoints: 480px, 768px, 1024px
- Grid da lista de presentes: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
- Modal de busca: fullscreen no mobile, dialog centralizado no desktop

---

## 9. Fora de escopo

- Autenticação real / OAuth
- Sistema de RSVP / confirmação de presença
- Notificações por email
- Pagamento integrado
- Histórico de quem comprou o quê
