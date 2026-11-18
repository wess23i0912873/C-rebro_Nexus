function requestJsonp(url, token) {
  return new Promise((resolve, reject) => {
    const callbackName = `nexusSheets_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tempo esgotado ao ler a planilha.'));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      if (!response || response.success !== true) {
        reject(new Error(response?.error || 'A API da planilha retornou uma resposta inválida.'));
        return;
      }
      resolve(response.data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível acessar a API da planilha.'));
    };

    const endpoint = new URL(url);
    endpoint.searchParams.set('callback', callbackName);
    endpoint.searchParams.set('token', token);
    endpoint.searchParams.set('_', String(Date.now()));
    script.src = endpoint.toString();
    document.head.appendChild(script);
  });
}

export async function readSheetData(url, token) {
  return requestJsonp(url, token);
}

export async function writeSheetData(url, token, data, base) {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'sync', token, base, data }),
  });
  return readSheetData(url, token);
}
