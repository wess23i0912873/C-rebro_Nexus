# Cérebro Nexus

Aplicação de controle financeiro em React/Vite. Os dados podem ser sincronizados entre dispositivos usando uma Planilha Google como armazenamento principal; o navegador mantém uma cópia local para abertura rápida e uso temporário offline.

## Conectar ao Google Sheets

1. Crie ou abra uma Planilha Google e acesse **Extensões → Apps Script**.
2. Cole o conteúdo de [`Code.gs`](./Code.gs) no editor. Troque o valor de `API_TOKEN` por uma sequência longa e aleatória.
3. Clique em **Implantar → Nova implantação → App da Web**. Execute como você e permita acesso a **Qualquer pessoa** para que o GitHub Pages consiga chamar o Web App sem login do Google. Autorize o script.
4. Copie a URL terminada em `/exec`. No Cérebro Nexus, abra **Central de Controle → Google Sheets** e salve a URL e o mesmo token configurado no script.
5. As abas `Accounts`, `Cards`, `Transactions`, `Subscriptions` e `Categories` são criadas automaticamente. A primeira linha contém os campos e cada linha seguinte um registro; objetos e listas aninhados são armazenados como JSON em uma célula.

O app carrega os dados ao conectar/abrir e verifica atualizações da planilha a cada 30 segundos. Alterações feitas no site são enviadas automaticamente; a cópia local continua disponível se a conexão falhar.

## Segurança

O Web App deve aceitar chamadas de qualquer pessoa para funcionar em um site estático sem autenticação Google. O token limita chamadas acidentais, mas não é uma proteção forte: ele fica no navegador e pode ser extraído por qualquer pessoa com acesso ao site. Não use esta implantação para dados que precisem de controle de acesso rigoroso; restrinja o acesso ao site e à planilha e não compartilhe a URL/token.

## Desenvolvimento

```sh
npm install
npm run dev
npm run build
```
