// ─── Predefinições de Ícones de Bancos e Imagens de Cartões ──────────────────

export const PRESET_BANK_ICONS = [
  {
    id: 'nubank',
    name: 'Nubank',
    shortName: 'Nu',
    path: '/imagens/icones_de_banco/icone_banco-nubank.png',
    bgColor: '#820AD1',
    textColor: '#ffffff'
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    shortName: 'MP',
    path: '/imagens/icones_de_banco/icone_banco-mercadopago.png',
    bgColor: '#009EE3',
    textColor: '#ffffff'
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    shortName: 'Inter',
    path: '/imagens/icones_de_banco/icone_banco-inter.png',
    bgColor: '#FF7A00',
    textColor: '#ffffff'
  },
  {
    id: 'itau',
    name: 'Itaú',
    shortName: 'Itaú',
    path: '/imagens/icones_de_banco/icone_banco-itau.png',
    bgColor: '#EC7000',
    textColor: '#ffffff'
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    shortName: 'Caixa',
    path: '/imagens/icones_de_banco/icone_banco-caixa.png',
    bgColor: '#005CA9',
    textColor: '#ffffff'
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    shortName: 'BB',
    path: '/imagens/icones_de_banco/icone_banco-bb.png',
    bgColor: '#0038A8',
    textColor: '#f8d117'
  },
  {
    id: 'picpay',
    name: 'PicPay',
    shortName: 'PicPay',
    path: '/imagens/icones_de_banco/icone_banco-picpay.png',
    bgColor: '#11C76F',
    textColor: '#ffffff'
  },
  {
    id: 'sicredi',
    name: 'Sicredi',
    shortName: 'Sicredi',
    path: '/imagens/icones_de_banco/icone_banco-sicredi.png',
    bgColor: '#006B3F',
    textColor: '#ffffff'
  },
  {
    id: 'santander',
    name: 'Santander',
    shortName: 'Santander',
    path: '/imagens/icones_de_banco/icone_banco-santander.png',
    bgColor: '#EC0000',
    textColor: '#ffffff'
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    shortName: 'Bradesco',
    path: '/imagens/icones_de_banco/icone_banco-bradesco.png',
    bgColor: '#CC092F',
    textColor: '#ffffff'
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    shortName: 'C6',
    path: '/imagens/icones_de_banco/icone_banco-c6.png',
    bgColor: '#242424',
    textColor: '#ffffff'
  },
  {
    id: 'dinheiro',
    name: 'Dinheiro Físico',
    shortName: '💵',
    path: '/imagens/icones_de_banco/icone_banco-dinheiro.png',
    bgColor: '#059669',
    textColor: '#ffffff'
  },
  {
    id: 'outros',
    name: 'Outros Bancos',
    shortName: 'Outros',
    path: '/imagens/icones_de_banco/icone_banco-outros.png',
    bgColor: '#1e293b',
    textColor: '#94a3b8'
  }
];

export const PRESET_CARD_IMAGES = [
  {
    id: 'nubank',
    name: 'Nubank Tradicional / Ultravioleta',
    bank: 'Nubank',
    path: '/imagens/cartoes/cartao-nubank.png',
    gradient: 'from-purple-950 via-slate-950 to-black',
    accent: '#a855f7',
    border: 'border-purple-500/40'
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago Black',
    bank: 'Mercado Pago',
    path: '/imagens/cartoes/cartao-mercadopago.png',
    gradient: 'from-sky-950 via-blue-950 to-black',
    accent: '#009EE3',
    border: 'border-cyan-500/30'
  },
  {
    id: 'itau-extra-gold',
    name: 'Itaú Extra Gold / Personnalité',
    bank: 'Itaú',
    path: '/imagens/cartoes/cartao-itau.png',
    gradient: 'from-amber-950 via-neutral-950 to-black',
    accent: '#f59e0b',
    border: 'border-amber-500/30'
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    bank: 'Caixa',
    path: '/imagens/cartoes/cartao-caixa.png',
    gradient: 'from-blue-950 via-slate-950 to-black',
    accent: '#3b82f6',
    border: 'border-blue-500/30'
  },
  {
    id: 'picpay-verde',
    name: 'PicPay Verde',
    bank: 'PicPay',
    path: '/imagens/cartoes/cartao-picpay.png',
    gradient: 'from-emerald-950 via-slate-950 to-black',
    accent: '#11C76F',
    border: 'border-emerald-500/30'
  },
  {
    id: 'sicredi-black',
    name: 'Sicredi Black',
    bank: 'Sicredi',
    path: '/imagens/cartoes/cartao-sicredi-black.png',
    gradient: 'from-neutral-950 via-zinc-950 to-black',
    accent: '#00ff87',
    border: 'border-emerald-500/30'
  },
  {
    id: 'sicredi',
    name: 'Sicredi Tradicional',
    bank: 'Sicredi',
    path: '/imagens/cartoes/cartao-sicredi.png',
    gradient: 'from-emerald-950 via-green-950 to-black',
    accent: '#006B3F',
    border: 'border-green-500/30'
  },
  {
    id: 'magalu-azul',
    name: 'Magalu Azul',
    bank: 'Magalu',
    path: '/imagens/cartoes/cartao-magalu-azul.png',
    gradient: 'from-blue-950 via-cyan-950 to-black',
    accent: '#0086FF',
    border: 'border-blue-500/30'
  },
  {
    id: 'magalu-prata',
    name: 'Magalu Prata',
    bank: 'Magalu',
    path: '/imagens/cartoes/cartao-magalu-prata.png',
    gradient: 'from-slate-900 via-neutral-950 to-black',
    accent: '#cbd5e1',
    border: 'border-slate-400/30'
  },
  {
    id: 'magalu-ouro',
    name: 'Magalu Ouro',
    bank: 'Magalu',
    path: '/imagens/cartoes/cartao-magalu-ouro.png',
    gradient: 'from-amber-950 via-yellow-950 to-black',
    accent: '#f59e0b',
    border: 'border-amber-500/30'
  },
  {
    id: 'inter-black',
    name: 'Banco Inter Black',
    bank: 'Inter',
    path: '/imagens/cartoes/cartao-inter.png',
    gradient: 'from-orange-950 via-neutral-950 to-black',
    accent: '#FF7A00',
    border: 'border-orange-500/30'
  },
  {
    id: 'cartao-generico',
    name: 'Cartão Genérico',
    bank: 'Outros',
    path: '/imagens/cartoes/cartao-generico.png',
    gradient: 'from-slate-900 via-slate-950 to-black',
    accent: '#00ff87',
    border: 'border-emerald-500/30'
  }
];

export function findBankPreset(pathOrName) {
  if (!pathOrName) return PRESET_BANK_ICONS[PRESET_BANK_ICONS.length - 1];
  const str = String(pathOrName).toLowerCase();
  return PRESET_BANK_ICONS.find(b => 
    b.path.toLowerCase() === str || 
    str.includes(b.id) || 
    str.includes(b.name.toLowerCase()) || 
    str.includes(b.shortName.toLowerCase())
  ) || PRESET_BANK_ICONS[PRESET_BANK_ICONS.length - 1];
}

export function findCardPreset(pathOrName) {
  if (!pathOrName) return PRESET_CARD_IMAGES[PRESET_CARD_IMAGES.length - 1];
  const str = String(pathOrName).toLowerCase();
  return PRESET_CARD_IMAGES.find(c => 
    c.path.toLowerCase() === str || 
    str.includes(c.id) || 
    str.includes(c.name.toLowerCase()) ||
    str.includes(c.bank.toLowerCase())
  ) || PRESET_CARD_IMAGES[PRESET_CARD_IMAGES.length - 1];
}
