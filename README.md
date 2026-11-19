# Cérebro Nexus

Aplicação de controle financeiro pessoal desenvolvida em **React 19**, **Vite** e **Tailwind CSS 4**. Utiliza uma Planilha Google vinculada ao Google Apps Script como banco de dados principal seguro e serverless, com cópia local em cache no navegador para abertura instantânea e uso offline.

---

## 🚀 Arquitetura de Autenticação e Sincronização (v2.0)

- **Login com Google (Google Identity Services):** Acesso restrito via OAuth 2.0. O frontend obtém o Google ID Token e o envia ao Apps Script.
- **Sessão Assinada HMAC-SHA256:** O backend valida o ID Token com a API do Google (`https://oauth2.googleapis.com/tokeninfo`), confere o Client ID, e-mail verificado e lista de e-mails autorizados (`ALLOWED_EMAILS`), emitindo um token de sessão próprio assinado válido por 30 dias.
- **Sem Tokens Manuais no Frontend:** Não é necessário digitar URLs ou tokens na interface. As credenciais públicas (`VITE_SHEETS_URL` e `VITE_GOOGLE_CLIENT_ID`) são injetadas em tempo de build via variáveis de ambiente.
- **Comunicação Confiável via POST:** Todas as operações (login, leitura e escrita) utilizam `fetch` com método `POST` e `Content-Type: text/plain`, permitindo respostas CORS limpas em JSON sem necessidade de JSONP ou requisições cegas `no-cors`.
- **Sincronização em Três Vias sob Bloqueio:** As alterações locais são calculadas como diff sobre o baseline sincronizado e gravadas atomicamente com `LockService` no Apps Script.
- **Indicador de Salvamento em Tempo Real:** O header exibe o estado da sincronização em tempo real:
  - `Salvo às HH:MM ✓`: confirmação recebida da planilha.
  - `Salvando…`: gravação em andamento.
  - `Pendente (não salvo ainda)`: alterações locais aguardando envio.
  - `Sem conexão (salvo só neste aparelho)`: modo offline seguro.
  - `Erro ao salvar`: com botão de nova tentativa imediata e recálculo com backoff exponencial automático.

---

## 🛠️ Passo a Passo de Configuração

### 1. Criar Credenciais no Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e selecione ou crie um projeto.
2. Em **APIs e serviços → Tela de permissão OAuth**, configure a tela como *Externa* (ou *Interna* se usar Google Workspace), defina o nome do app e informe seus e-mails de suporte.
3. Em **APIs e serviços → Credenciais**, clique em **Criar credenciais → ID do cliente OAuth**:
   - **Tipo de aplicativo:** *Aplicativo da Web*
   - **Nome:** `Cérebro Nexus Web`
   - **Origens JavaScript autorizadas:**
     - `http://localhost:5173` (para desenvolvimento local)
     - `https://wess23i0912873.github.io` (URL de produção no GitHub Pages)
4. Copie o **ID do cliente** gerado (terminado em `.apps.googleusercontent.com`).

### 2. Configurar o Apps Script na Planilha Google
1. Abra a sua Planilha Google e acesse **Extensões → Apps Script**.
2. Substitua o conteúdo do arquivo `Código.gs` pelo conteúdo atualizado de [`Code.gs`](./Code.gs).
3. No menu lateral do Apps Script, acesse **Configurações do Projeto (ícone de engrenagem) → Propriedades do script** e adicione:
   - `GOOGLE_CLIENT_ID`: Cole o seu Client ID gerado no passo 1.
   - `ALLOWED_EMAILS`: Lista de e-mails autorizados separados por vírgula (ex.: `seuemail@gmail.com`).
   - *(Opcional)* `SESSION_SECRET`: Chave secreta longa para assinatura HMAC-SHA256 (se não definida, o script gerará uma chave única automaticamente na primeira execução).
4. No menu superior do editor, selecione a função `setupSpreadsheet` e clique em **Executar** uma vez para conceder as permissões necessárias e criar os cabeçalhos das abas.
5. Clique em **Implantar → Nova implantação**:
   - **Tipo:** *App da Web*
   - **Executar como:** *Eu (seu e-mail)*
   - **Quem pode acessar:** *Qualquer pessoa*
6. Copie a **URL do app da Web** gerada (terminada em `/exec`).

### 3. Configurar as Variáveis no GitHub (Deploy Automático)
1. No repositório no GitHub, acesse **Settings → Secrets and variables → Actions → Variables** (aba **Variables**, não Secrets).
2. Adicione as seguintes variáveis:
   - `VITE_SHEETS_URL`: A URL do Web App do Apps Script copiada no passo 2.
   - `VITE_GOOGLE_CLIENT_ID`: O Google Client ID copiado no passo 1.
3. O workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) compilará automaticamente e injetará essas variáveis a cada push para o branch `main`.

---

## 💻 Desenvolvimento Local

1. Instale as dependências:
   ```sh
   npm install
   ```
2. Crie um arquivo `.env` na raiz baseado no [`.env.example`](./.env.example):
   ```sh
   cp .env.example .env
   ```
3. Preencha `VITE_SHEETS_URL` e `VITE_GOOGLE_CLIENT_ID` com os seus valores.
4. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```
5. Para testar o build de produção:
   ```sh
   npm run build
   npm run preview
   ```
