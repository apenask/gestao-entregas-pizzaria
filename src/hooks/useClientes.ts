import { useState, useEffect } from 'react';
import { Cliente } from '../types';
import { clienteService } from '../services/database';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    clienteService.buscarTodos().then(setClientes);
  }, []);

  const criarCliente = async (cliente: Omit<Cliente, 'id'>) => {
    const novoCliente = await clienteService.criar(cliente);
    setClientes(prev => [...prev, novoCliente]);
    return novoCliente;
  };

  const atualizarCliente = async (id: number, dadosCliente: Omit<Cliente, 'id'>) => {
    const clienteAtualizado = await clienteService.atualizar(id, dadosCliente);
    setClientes(prev => prev.map(c => (c.id === id ? clienteAtualizado : c)));
  };

  const removerCliente = async (id: number) => {
    await clienteService.deletar(id);
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  return { clientes, criarCliente, atualizarCliente, removerCliente };
}