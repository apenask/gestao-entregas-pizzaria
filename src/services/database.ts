import { supabase } from '../lib/supabase';
import { Entrega, Entregador, Cliente, Usuario } from '../types';

// Interfaces para dados que vêm do Supabase
interface EntregaSupabase {
  id: number;
  data_hora: string;
  numero_pedido: string;
  cliente_id: number;
  entregador_id: number;
  forma_pagamento: string;
  valor_total_pedido: string;
  valor_corrida: string;
  status: string;
  data_hora_saida?: string;
  data_hora_entrega?: string;
  duracao_entrega?: number;
  cliente?: { id: number; nome: string; rua_numero: string; bairro: string; telefone?: string; };
  entregador?: { id: number; nome: string; email: string; latitude?: number; longitude?: number; ultimo_update?: string; };
}

interface EntregadorSupabase {
  id: number;
  nome: string;
  email: string;
  latitude?: number;
  longitude?: number;
  ultimo_update?: string;
}

interface ClienteSupabase {
  id: number;
  nome: string;
  rua_numero: string;
  bairro: string;
  telefone?: string;
}

interface UsuarioSupabase {
  id: number;
  email: string;
  senha: string;
  nome_completo: string;
  cargo: 'gerente' | 'entregador';
  entregador_id?: number;
  email_verificado?: boolean;
  token_recuperacao?: string;
  token_expiracao?: string;
  status_aprovacao?: 'pendente' | 'aprovado' | 'recusado';
}

const mapToEntregador = (item: EntregadorSupabase): Entregador => ({
    id: item.id, 
    nome: item.nome, 
    email: item.email,
    latitude: item.latitude,
    longitude: item.longitude,
    ultimo_update: item.ultimo_update
});

const mapToEntrega = (item: EntregaSupabase): Entrega => ({
    id: item.id,
    dataHora: new Date(item.data_hora),
    numeroPedido: item.numero_pedido,
    clienteId: item.cliente_id,
    cliente: item.cliente ? { id: item.cliente.id, nome: item.cliente.nome, ruaNumero: item.cliente.rua_numero, bairro: item.cliente.bairro, telefone: item.cliente.telefone } : undefined,
    entregadorId: item.entregador_id,
    entregador: item.entregador ? mapToEntregador(item.entregador) : undefined,
    formaPagamento: item.forma_pagamento as Entrega['formaPagamento'],
    valorTotalPedido: parseFloat(item.valor_total_pedido),
    valorCorrida: parseFloat(item.valor_corrida),
    status: item.status as Entrega['status'],
    dataHoraSaida: item.data_hora_saida ? new Date(item.data_hora_saida) : undefined,
    dataHoraEntrega: item.data_hora_entrega ? new Date(item.data_hora_entrega) : undefined,
    duracaoEntrega: item.duracao_entrega,
});

const mapToUsuario = (item: UsuarioSupabase): Usuario => ({
    id: item.id,
    email: item.email,
    senha: item.senha,
    nomeCompleto: item.nome_completo,
    cargo: item.cargo,
    entregadorId: item.entregador_id,
    emailVerificado: item.email_verificado,
    tokenRecuperacao: item.token_recuperacao,
    tokenExpiracao: item.token_expiracao ? new Date(item.token_expiracao) : undefined,
    status_aprovacao: item.status_aprovacao,
});

const mapToUsuarioSupabase = (usuario: Partial<Usuario>): Partial<UsuarioSupabase> => {
  const data: Partial<UsuarioSupabase> = {};
  if (usuario.email !== undefined) data.email = usuario.email;
  if (usuario.senha !== undefined) data.senha = usuario.senha;
  if (usuario.nomeCompleto !== undefined) data.nome_completo = usuario.nomeCompleto;
  if (usuario.cargo !== undefined) data.cargo = usuario.cargo;
  if (usuario.entregadorId !== undefined) data.entregador_id = usuario.entregadorId;
  if (usuario.emailVerificado !== undefined) data.email_verificado = usuario.emailVerificado;
  if (usuario.tokenRecuperacao !== undefined) data.token_recuperacao = usuario.tokenRecuperacao;
  if (usuario.tokenExpiracao !== undefined) data.token_expiracao = usuario.tokenExpiracao?.toISOString();
  if (usuario.status_aprovacao !== undefined) data.status_aprovacao = usuario.status_aprovacao;
  return data;
};

// *** ALTERADO: O tipo 'any' foi removido e substituído por um tipo específico ***
const mapToEntregaSupabase = (entrega: Partial<Entrega>): Partial<EntregaSupabase> => {
    const data: Partial<EntregaSupabase> = {};

    if (entrega.dataHora !== undefined) data.data_hora = entrega.dataHora.toISOString();
    if (entrega.numeroPedido !== undefined) data.numero_pedido = entrega.numeroPedido;
    if (entrega.clienteId !== undefined) data.cliente_id = entrega.clienteId;
    if (entrega.entregadorId !== undefined) data.entregador_id = entrega.entregadorId;
    if (entrega.formaPagamento !== undefined) data.forma_pagamento = entrega.formaPagamento;
    if (entrega.valorTotalPedido !== undefined) data.valor_total_pedido = entrega.valorTotalPedido.toString();
    if (entrega.valorCorrida !== undefined) data.valor_corrida = entrega.valorCorrida.toString();
    if (entrega.status !== undefined) data.status = entrega.status;
    if (entrega.dataHoraSaida !== undefined) data.data_hora_saida = entrega.dataHoraSaida.toISOString();
    if (entrega.dataHoraEntrega !== undefined) data.data_hora_entrega = entrega.dataHoraEntrega.toISOString();
    if (entrega.duracaoEntrega !== undefined) data.duracao_entrega = entrega.duracaoEntrega;

    return data;
}

export const entregaService = {
  async buscarTodas(): Promise<Entrega[]> {
    const { data, error } = await supabase.from('entregas').select(`*, cliente:clientes(*), entregador:entregadores(*)`).order('data_hora', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapToEntrega);
  },
  async criar(entrega: Partial<Omit<Entrega, 'id'>>): Promise<Entrega> {
    const dadosParaBanco = mapToEntregaSupabase(entrega);
    const { data, error } = await supabase.from('entregas').insert(dadosParaBanco).select(`*, cliente:clientes(*), entregador:entregadores(*)`).single();
    if (error) throw error;
    return mapToEntrega(data as EntregaSupabase);
  },
  async atualizar(id: number, entrega: Partial<Entrega>): Promise<Entrega> {
    const dadosParaBanco = mapToEntregaSupabase(entrega);
    const { data, error } = await supabase.from('entregas').update(dadosParaBanco).eq('id', id).select(`*, cliente:clientes(*), entregador:entregadores(*)`).single();
    if (error) {
        console.error("Erro ao atualizar entrega:", error);
        throw error;
    }
    return mapToEntrega(data as EntregaSupabase);
  },
  async deletar(id: number): Promise<void> {
    const { error } = await supabase.from('entregas').delete().eq('id', id);
    if (error) throw error;
  },
};

export const entregadorService = {
  async buscarTodos(): Promise<Entregador[]> {
    const { data, error } = await supabase.from('entregadores').select('*').order('nome');
    if (error) throw error;
    return (data || []).map(mapToEntregador);
  },
  async buscarPorEmail(email: string): Promise<Entregador | null> {
    const { data, error } = await supabase.from('entregadores').select('*').eq('email', email.toLowerCase()).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapToEntregador(data) : null;
  },
  async criar(entregador: Omit<Entregador, 'id'>): Promise<Entregador> {
    const { data, error } = await supabase.from('entregadores').insert(entregador).select().single();
    if (error) throw error;
    return mapToEntregador(data);
  },
  async atualizar(id: number, entregador: Partial<Entregador>): Promise<Entregador> {
    const { data, error } = await supabase.from('entregadores').update(entregador).eq('id', id).select().single();
    if (error) throw error;
    return mapToEntregador(data);
  },
  async deletar(id: number): Promise<void> {
    const { error } = await supabase.from('entregadores').delete().eq('id', id);
    if (error) throw error;
  }
};

export const clienteService = {
  async buscarTodos(): Promise<Cliente[]> {
    const { data, error } = await supabase.from('clientes').select('*').order('nome');
    if (error) throw error;
    return (data || []).map((item: ClienteSupabase) => ({ id: item.id, nome: item.nome, ruaNumero: item.rua_numero, bairro: item.bairro, telefone: item.telefone }));
  },
  async criar(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').insert({ nome: cliente.nome, rua_numero: cliente.ruaNumero, bairro: cliente.bairro, telefone: cliente.telefone }).select().single();
    if (error) throw error;
    return { id: data.id, nome: data.nome, ruaNumero: data.rua_numero, bairro: data.bairro, telefone: data.telefone };
  },
  async atualizar(id: number, cliente: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').update({ nome: cliente.nome, rua_numero: cliente.ruaNumero, bairro: cliente.bairro, telefone: cliente.telefone }).eq('id', id).select().single();
    if (error) throw error;
    return { id: data.id, nome: data.nome, ruaNumero: data.rua_numero, bairro: data.bairro, telefone: data.telefone };
  },
  async deletar(id: number): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  }
};

export const usuarioService = {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase()).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapToUsuario(data) : null;
  },
  async buscarPorToken(token: string): Promise<Usuario | null> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('token_recuperacao', token).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapToUsuario(data) : null;
  },
  async buscarPendentes(): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('status_aprovacao', 'pendente');
    if (error) throw error;
    return (data || []).map(mapToUsuario);
  },
  async criar(usuario: Partial<Omit<Usuario, 'id'>>): Promise<Usuario> {
    const { data, error } = await supabase.from('usuarios').insert(mapToUsuarioSupabase(usuario)).select().single();
    if (error) throw error;
    return mapToUsuario(data);
  },
  async atualizar(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const { data, error } = await supabase.from('usuarios').update(mapToUsuarioSupabase(usuario)).eq('id', id).select().single();
    if (error) throw error;
    return mapToUsuario(data);
  },
};
