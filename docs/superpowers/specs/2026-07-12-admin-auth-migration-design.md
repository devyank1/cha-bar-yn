# Migração do login admin para Firebase Authentication

## Contexto

Login do painel admin (`admin.html`) hoje usa senha fixa com hash SHA-256 hardcoded em `js/admin.js` (`PASSWORD_HASH`). Sem recuperação de senha — trocar a senha exige editar o código e fazer redeploy. Usuário quer um fluxo real de "esqueci minha senha" por email.

## Decisão

Migrar para Firebase Authentication (provider Email/Password), usando o recurso nativo `sendPasswordResetEmail` para recuperação. Conta única: `yancarlostrab@gmail.com`, criada manualmente no console Firebase (Authentication > Users).

## Mudanças

### 1. `admin.html`
- Adiciona script `firebase-auth-compat.js` (mesmo CDN gstatic já usado, sem mudança de CSP).
- Form de login ganha campo `email` além de `senha`.
- Adiciona link "Esqueci minha senha?" abaixo do form de login.

### 2. `js/admin.js`
- Remove `PASSWORD_HASH` e função `sha256()`.
- Login: `firebase.auth().signInWithEmailAndPassword(email, senha)`, erro mostra mensagem amigável conforme código de erro (`auth/wrong-password`, `auth/user-not-found`, `auth/invalid-email`, etc).
- `onAuthStateChanged`: se houver usuário logado, mostra painel direto (persiste sessão entre reloads); senão mostra tela de login.
- "Esqueci minha senha": prompt/campo pede email, chama `sendPasswordResetEmail(email)`, mostra alerta de sucesso ou erro.
- Botão "Sair": `firebase.auth().signOut()`.

### 3. Realtime Database Rules
Site público (`app.js`) só lê `/evento` e `/itens`, nunca escreve. Regras mudam de aberto total para leitura pública + escrita autenticada:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

## Fora de escopo
- Múltiplas contas de admin (Yan e Nicolle) — decidido usar só uma conta.
- Customização de template de email de reset (fica com o padrão do Firebase).
- MFA / SMS.

## Teste manual
1. Login com email/senha correta → entra no painel.
2. Login com senha errada → mensagem de erro amigável, não trava.
3. "Esqueci minha senha" → email chega, link funciona, troca senha, novo login funciona.
4. Sair → volta pra tela de login; reload não reabre painel sem sessão.
5. Tentar escrever em `/evento` ou `/itens` via console do navegador sem estar logado → falha (regra `auth != null`).
