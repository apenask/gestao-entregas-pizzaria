export const formatarValor = (valor: number): string => {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
};

export const formatarDataHora = (data: Date): string => {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatarHora = (data: Date): string => {
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// FUNÇÃO PRINCIPAL: Calcular duração em segundos entre duas datas
export const calcularDuracaoSegundos = (dataInicio: Date, dataFim: Date): number => {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / 1000); // Converter para segundos
};

// FUNÇÃO PRINCIPAL: Formatar duração salva (em segundos) para exibição amigável
export const formatarDuracaoSegundos = (duracaoSegundos?: number): string => {
  if (!duracaoSegundos || duracaoSegundos < 0) {
    return 'N/A';
  }

  // Menos de 1 minuto - mostrar em segundos
  if (duracaoSegundos < 60) {
    return `${duracaoSegundos} seg`;
  }
  
  // 1 minuto ou mais - calcular minutos e segundos restantes
  const minutos = Math.floor(duracaoSegundos / 60);
  const segundosRestantes = duracaoSegundos % 60;
  
  // Se não há segundos restantes, mostrar apenas minutos
  if (segundosRestantes === 0) {
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      if (minutosRestantes === 0) {
        return `${horas}h`;
      }
      return `${horas}h ${minutosRestantes}min`;
    }
  }
  
  // Há segundos restantes
  if (minutos < 60) {
    return `${minutos} min ${segundosRestantes} seg`;
  } else {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    if (minutosRestantes === 0) {
      return `${horas}h ${segundosRestantes} seg`;
    }
    return `${horas}h ${minutosRestantes}min ${segundosRestantes}seg`;
  }
};

// FUNÇÃO DEPRECATED - mantida para compatibilidade, mas não deve ser usada para entregas finalizadas
export const calcularDuracaoMinutos = (dataInicio: Date, dataFim: Date): number => {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / 60000); // Converter para minutos
};

// FUNÇÃO DEPRECATED - mantida para compatibilidade, mas não deve ser usada para entregas finalizadas
export const formatarDuracaoSalva = (duracaoMinutos?: number): string => {
  if (!duracaoMinutos || duracaoMinutos < 0) {
    return 'N/A';
  }

  if (duracaoMinutos < 60) {
    return `${duracaoMinutos} min`;
  }
  
  const horas = Math.floor(duracaoMinutos / 60);
  const minutosRestantes = duracaoMinutos % 60;
  
  if (minutosRestantes === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${minutosRestantes}min`;
};

// FUNÇÃO DEPRECATED - mantida para compatibilidade, mas não deve ser usada para entregas finalizadas
export const calcularTempoEntrega = (dataHoraSaida?: Date, dataHoraEntrega?: Date): string => {
  if (!dataHoraSaida || !dataHoraEntrega) {
    return 'N/A';
  }

  const diffMs = dataHoraEntrega.getTime() - dataHoraSaida.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  
  if (diffMinutos < 60) {
    return `${diffMinutos} min`;
  }
  
  const horas = Math.floor(diffMinutos / 60);
  const minutosRestantes = diffMinutos % 60;
  
  if (minutosRestantes === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${minutosRestantes}min`;
};