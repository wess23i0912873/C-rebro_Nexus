# Cérebro Nexus

Aplicação de controle financeiro em React/Vite. Os dados podem ser sincronizados entre dispositivos usando uma Planilha Google como armazenamento principal; o navegador mantém uma cópia local para abertura rápida e uso temporário offline.

## Conectar ao Google Sheets

1. Crie ou abra uma Planilha Google e acesse **Extensões → Apps Script**.
2. Cole o conteúdo completo de [`Code.gs`](./Code.gs). Substitua `API_TOKEN` por uma sequência longa e aleatória.
3. No editor do Apps Script, execute `setupSpreadsheet` uma vez e autorize o acesso à planilha. As abas e os cabeçalhos de contas, cartões, transações/parcelas, assinaturas e categorias também são criados automaticamente na primeira chamada do Web App.
4. Clique em **Implantar → Nova implantação → App da Web**. Execute como você e permita acesso a **Qualquer pessoa** para que o GitHub Pages possa chamar o Web App. Autorize a implantação.
5. Copie a URL terminada em `/exec`. No Cérebro Nexus, abra **Central de Controle → Google Sheets** e salve a URL e o mesmo token definido em `Code.gs`.
6. Ao publicar uma nova versão do Apps Script, atualize a implantação do Web App para usar essa versão.

O `localStorage` mantém o cache para a abertura imediata e o uso offline. Quando conectado, o app carrega e sincroniza alterações automaticamente; para receber mudanças de outros dispositivos, consulta a planilha a cada 15 segundos e ao voltar para a página ou recuperar a conexão. A leitura usa JSONP e a escrita usa uma requisição simples `no-cors`, evitando a necessidade de configurar cabeçalhos CORS no Apps Script. As escritas são aplicadas como diferenças sobre a última leitura, sob bloqueio, para reduzir conflitos entre dispositivos.

## Segurança

O Web App deve aceitar chamadas de qualquer pessoa para funcionar em um site estático sem autenticação Google. O token limita chamadas acidentais, mas não é uma proteção forte: ele fica no navegador e pode ser extraído por qualquer pessoa com acesso ao site. Não use esta implantação para dados que precisem de controle de acesso rigoroso; restrinja o acesso ao site e à planilha e não compartilhe a URL/token. Faça cópias de segurança periódicas da planilha.

## Desenvolvimento

```sh
npm install
npm run dev
npm run build
```
