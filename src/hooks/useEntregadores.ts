import { useState, useEffect } from 'react';
import { Entregador } from '../types';
import { entregadorService } from '../services/database';

export function useEntregadores() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);

  useEffect(() => {
    entregadorService.buscarTodos().then(setEntregadores);
  }, []);

  const criarEntregador = async (nome: string, email: string) => {
    const novoEntregador = await entregadorService.criar({ nome, email });
    setEntregadores(prev => [...prev, novoEntregador]);
  };

  const atualizarEntregador = async (id: number, nome: string, email: string) => {
    const entregadorAtualizado = await entregadorService.atualizar(id, { nome, email });
    setEntregadores(prev => prev.map(e => (e.id === id ? entregadorAtualizado : e)));
  };

  const removerEntregador = async (id: number) => {
    await entregadorService.deletar(id);
    setEntregadores(prev => prev.filter(e => e.id !== id));
  };

  return { entregadores, criarEntregador, atualizarEntregador, removerEntregador };
}