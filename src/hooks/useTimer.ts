import { useState, useEffect } from 'react';

/**
 * Hook personalizado que retorna a hora atual, atualizada a cada segundo.
 * Isso força o componente que o utiliza a renderizar novamente a cada segundo.
 * @returns {Date} A data e hora atual.
 */
export const useTimer = (): Date => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return time;
};