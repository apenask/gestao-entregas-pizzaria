// Função para calcular duração entre duas datas em segundos
export const calcularDuracaoSegundos = (dataInicio: Date, dataFim: Date): number => {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / 1000); // Retorna em segundos
};

// Função para formatar duração em segundos para string legível
export const formatarDuracaoSegundos = (segundos: number): string => {
  if (!segundos || segundos < 0) return '00:00';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const seg = segundos % 60;
  
  if (horas > 0) {
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }
  return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
};

// Função para formatar duração em formato mais legível (ex: "1h 30min 45s")
export const formatarDuracaoLegivel = (segundos: number): string => {
  console.log('🔧 formatarDuracaoLegivel recebeu:', segundos, typeof segundos);
  
  // Garantir que é um número válido
  const seg = Math.abs(Math.floor(Number(segundos) || 0));
  
  if (seg === 0) return '0s';
  
  const horas = Math.floor(seg / 3600);
  const minutos = Math.floor((seg % 3600) / 60);
  const segundosRestantes = seg % 60;
  
  console.log('🔧 Calculado:', { horas, minutos, segundosRestantes, totalSegundos: seg });
  
  // Se tem horas
  if (horas > 0) {
    if (minutos > 0 && segundosRestantes > 0) {
      return `${horas}h ${minutos}min ${segundosRestantes}s`;
    } else if (minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (segundosRestantes > 0) {
      return `${horas}h ${segundosRestantes}s`;
    }
    return `${horas}h`;
  }
  
  // Se tem minutos
  if (minutos > 0) {
    if (segundosRestantes > 0) {
      return `${minutos}min ${segundosRestantes}s`;
    }
    return `${minutos}min`;
  }
  
  // Só segundos (para entregas muito rápidas)
  return `${segundosRestantes}s`;
};

// Função alternativa mais compacta para espaços pequenos
export const formatarDuracaoCompacta = (segundos: number): string => {
  if (!segundos || segundos < 0) return '0s';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const seg = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}${seg > 0 && minutos === 0 ? ` ${seg}s` : ''}`;
  }
  
  if (minutos > 0) {
    return `${minutos}m${seg > 0 ? ` ${seg}s` : ''}`;
  }
  
  return `${seg}s`;
};

// Outras funções existentes...
export const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

export const formatarHora = (data: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
};

export const formatarDataHora = (data: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
};

export const formatarData = (data: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(data);
};