import { useState, useEffect } from 'react';
import { Entrega } from '../types';
import { entregaService } from '../services/database';
import { calcularDuracaoSegundos } from '../utils/calculations';

export function useEntregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);

  useEffect(() => {
    entregaService.buscarTodas().then(setEntregas);
  }, []);

  const criarEntrega = async (dadosEntrega: Omit<Entrega, 'id' | 'dataHora' | 'status'>) => {
    const novaEntregaPayload = {
      ...dadosEntrega,
      dataHora: new Date(),
      status: 'Aguardando' as const,
    };
    const novaEntrega = await entregaService.criar(novaEntregaPayload);
    setEntregas((prev) => [novaEntrega, ...prev]);
  };

  const atualizarEntrega = async (id: number, dados: Partial<Entrega>) => {
    const entregaAtualizada = await entregaService.atualizar(id, dados);
    setEntregas((prev) => prev.map((e) => (e.id === id ? entregaAtualizada : e)));
    return entregaAtualizada;
  };

  const excluirEntrega = async (id: number) => {
    await entregaService.deletar(id);
    setEntregas((prev) => prev.filter((e) => e.id !== id));
  };

  const atualizarStatusEntrega = async (id: number, status: Entrega['status']) => {
    const entregaAtual = entregas.find((e) => e.id === id);
    if (!entregaAtual) return;

    const agora = new Date();
    const updateData: Partial<Entrega> = { status };

    if (status === 'Em Rota') {
      updateData.dataHoraSaida = agora;
    } else if (status === 'Entregue' && entregaAtual.dataHoraSaida) {
      updateData.dataHoraEntrega = agora;
      updateData.duracaoEntrega = calcularDuracaoSegundos(new Date(entregaAtual.dataHoraSaida), agora);
    }

    await atualizarEntrega(id, updateData);
  };

  return { entregas, criarEntrega, atualizarEntrega, excluirEntrega, atualizarStatusEntrega };
}