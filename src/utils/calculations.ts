// Funções de formatação de data e duração
export const formatarDataHora = (data: Date): string => {
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatarHora = (data: Date): string => {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatarDuracaoLegivel = (segundos: number): string => {
  if (isNaN(segundos) || segundos < 0) return '0s';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;

  const partes: string[] = [];
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}min`);
  if (segs > 0 || partes.length === 0) partes.push(`${segs}s`);

  return partes.join(' ');
};

// Funções de formatação de valores monetários
export const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export const formatarMoedaInput = (valor: string): string => {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros === '') return '';
  const numero = parseFloat(apenasNumeros) / 100;
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const paraNumero = (valor: string): number => {
  if (!valor) return 0;
  const numeroLimpo = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
};

// Funções de formatação de telefone e outras
export const formatarTelefone = (valor: string): string => {
  if (!valor) return "";
  valor = valor.replace(/\D/g, '');
  valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
  valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
  return valor.slice(0, 15);
};

export const calcularDuracaoSegundos = (dataInicio: Date, dataFim: Date): number => {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / 1000);
};