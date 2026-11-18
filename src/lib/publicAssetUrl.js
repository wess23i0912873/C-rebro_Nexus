export function publicAssetUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/imagens/')) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}
