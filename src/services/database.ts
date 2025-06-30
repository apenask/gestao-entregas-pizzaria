import { supabase } from '../lib/supabase'
import { Entrega, Entregador, Cliente, Usuario } from '../types'

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
  cliente?: {
    id: number;
    nome: string;
    rua_numero: string;
    bairro: string;
    telefone?: string;
  };
  entregador?: {
    nome: string;
  };
}

interface EntregadorSupabase {
  id: number;
  nome: string;
  email: string;
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
  cargo: string;
  entregador_id?: number;
  email_verificado?: boolean;
  token_recuperacao?: string;
  token_expiracao?: string;
}

// Serviços para Entregas
export const entregaService = {
  async buscarTodas(): Promise<Entrega[]> {
    const { data, error } = await supabase
      .from('entregas')
      .select(`
        *,
        cliente:clientes(*),
        entregador:entregadores(nome)
      `)
      .order('data_hora', { ascending: false })
    
    if (error) throw error
    
    // Transformar dados do Supabase para o formato da aplicação
    const entregas: Entrega[] = (data || []).map((item: EntregaSupabase) => ({
      id: item.id,
      dataHora: new Date(item.data_hora),
      numeroPedido: item.numero_pedido,
      clienteId: item.cliente_id,
      cliente: item.cliente ? {
        id: item.cliente.id,
        nome: item.cliente.nome,
        ruaNumero: item.cliente.rua_numero,
        bairro: item.cliente.bairro,
        telefone: item.cliente.telefone
      } : undefined,
      entregadorId: item.entregador_id,
      entregador: item.entregador?.nome,
      formaPagamento: item.forma_pagamento as 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito',
      valorTotalPedido: parseFloat(item.valor_total_pedido),
      valorCorrida: parseFloat(item.valor_corrida),
      status: item.status as 'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado',
      dataHoraSaida: item.data_hora_saida ? new Date(item.data_hora_saida) : undefined,
      dataHoraEntrega: item.data_hora_entrega ? new Date(item.data_hora_entrega) : undefined,
      duracaoEntrega: item.duracao_entrega
    }))
    
    return entregas
  },

  async criar(entrega: Omit<Entrega, 'id'>): Promise<Entrega> {
    const { data, error } = await supabase
      .from('entregas')
      .insert({
        data_hora: entrega.dataHora.toISOString(),
        numero_pedido: entrega.numeroPedido,
        cliente_id: entrega.clienteId,
        entregador_id: entrega.entregadorId,
        forma_pagamento: entrega.formaPagamento,
        valor_total_pedido: entrega.valorTotalPedido,
        valor_corrida: entrega.valorCorrida,
        status: entrega.status,
        data_hora_saida: entrega.dataHoraSaida?.toISOString(),
        data_hora_entrega: entrega.dataHoraEntrega?.toISOString(),
        duracao_entrega: entrega.duracaoEntrega
      })
      .select(`
        *,
        cliente:clientes(*),
        entregador:entregadores(nome)
      `)
      .single()
    
    if (error) throw error
    
    const item = data as EntregaSupabase;
    
    return {
      id: item.id,
      dataHora: new Date(item.data_hora),
      numeroPedido: item.numero_pedido,
      clienteId: item.cliente_id,
      cliente: item.cliente ? {
        id: item.cliente.id,
        nome: item.cliente.nome,
        ruaNumero: item.cliente.rua_numero,
        bairro: item.cliente.bairro,
        telefone: item.cliente.telefone
      } : undefined,
      entregadorId: item.entregador_id,
      entregador: item.entregador?.nome,
      formaPagamento: item.forma_pagamento as 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito',
      valorTotalPedido: parseFloat(item.valor_total_pedido),
      valorCorrida: parseFloat(item.valor_corrida),
      status: item.status as 'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado',
      dataHoraSaida: item.data_hora_saida ? new Date(item.data_hora_saida) : undefined,
      dataHoraEntrega: item.data_hora_entrega ? new Date(item.data_hora_entrega) : undefined,
      duracaoEntrega: item.duracao_entrega
    }
  },

  async atualizar(id: number, entrega: Partial<Entrega>): Promise<Entrega> {
    const updateData: Record<string, unknown> = {}
    
    if (entrega.dataHora) updateData.data_hora = entrega.dataHora.toISOString()
    if (entrega.numeroPedido) updateData.numero_pedido = entrega.numeroPedido
    if (entrega.clienteId) updateData.cliente_id = entrega.clienteId
    if (entrega.entregadorId) updateData.entregador_id = entrega.entregadorId
    if (entrega.formaPagamento) updateData.forma_pagamento = entrega.formaPagamento
    if (entrega.valorTotalPedido !== undefined) updateData.valor_total_pedido = entrega.valorTotalPedido
    if (entrega.valorCorrida !== undefined) updateData.valor_corrida = entrega.valorCorrida
    if (entrega.status) updateData.status = entrega.status
    if (entrega.dataHoraSaida) updateData.data_hora_saida = entrega.dataHoraSaida.toISOString()
    if (entrega.dataHoraEntrega) updateData.data_hora_entrega = entrega.dataHoraEntrega.toISOString()
    if (entrega.duracaoEntrega !== undefined) updateData.duracao_entrega = entrega.duracaoEntrega

    const { data, error } = await supabase
      .from('entregas')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(*),
        entregador:entregadores(nome)
      `)
      .single()
    
    if (error) throw error
    
    const item = data as EntregaSupabase;
    
    return {
      id: item.id,
      dataHora: new Date(item.data_hora),
      numeroPedido: item.numero_pedido,
      clienteId: item.cliente_id,
      cliente: item.cliente ? {
        id: item.cliente.id,
        nome: item.cliente.nome,
        ruaNumero: item.cliente.rua_numero,
        bairro: item.cliente.bairro,
        telefone: item.cliente.telefone
      } : undefined,
      entregadorId: item.entregador_id,
      entregador: item.entregador?.nome,
      formaPagamento: item.forma_pagamento as 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito',
      valorTotalPedido: parseFloat(item.valor_total_pedido),
      valorCorrida: parseFloat(item.valor_corrida),
      status: item.status as 'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado',
      dataHoraSaida: item.data_hora_saida ? new Date(item.data_hora_saida) : undefined,
      dataHoraEntrega: item.data_hora_entrega ? new Date(item.data_hora_entrega) : undefined,
      duracaoEntrega: item.duracao_entrega
    }
  },

  async deletar(id: number): Promise<void> {
    const { error } = await supabase
      .from('entregas')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Serviços para Entregadores
export const entregadorService = {
  async buscarTodos(): Promise<Entregador[]> {
    const { data, error } = await supabase
      .from('entregadores')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return (data || []).map((item: EntregadorSupabase) => ({
      id: item.id,
      nome: item.nome,
      email: item.email
    }))
  },

  async buscarPorEmail(email: string): Promise<Entregador | null> {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        nome: data.nome,
        email: data.email
      };
    } catch (error) {
      console.error('Erro ao buscar entregador por email:', error);
      return null;
    }
  },

  async criar(entregador: Omit<Entregador, 'id'>): Promise<Entregador> {
    const { data, error } = await supabase
      .from('entregadores')
      .insert(entregador)
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as EntregadorSupabase;
    return {
      id: item.id,
      nome: item.nome,
      email: item.email
    }
  },

  async atualizar(id: number, entregador: Partial<Entregador>): Promise<Entregador> {
    const { data, error } = await supabase
      .from('entregadores')
      .update(entregador)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as EntregadorSupabase;
    return {
      id: item.id,
      nome: item.nome,
      email: item.email
    }
  },

  async deletar(id: number): Promise<void> {
    const { error } = await supabase
      .from('entregadores')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Serviços para Clientes
export const clienteService = {
  async buscarTodos(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return (data || []).map((item: ClienteSupabase) => ({
      id: item.id,
      nome: item.nome,
      ruaNumero: item.rua_numero,
      bairro: item.bairro,
      telefone: item.telefone
    }))
  },

  async criar(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: cliente.nome,
        rua_numero: cliente.ruaNumero,
        bairro: cliente.bairro,
        telefone: cliente.telefone
      })
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as ClienteSupabase;
    return {
      id: item.id,
      nome: item.nome,
      ruaNumero: item.rua_numero,
      bairro: item.bairro,
      telefone: item.telefone
    }
  },

  async atualizar(id: number, cliente: Partial<Cliente>): Promise<Cliente> {
    const updateData: Record<string, unknown> = {}
    if (cliente.nome) updateData.nome = cliente.nome
    if (cliente.ruaNumero) updateData.rua_numero = cliente.ruaNumero
    if (cliente.bairro) updateData.bairro = cliente.bairro
    if (cliente.telefone !== undefined) updateData.telefone = cliente.telefone

    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as ClienteSupabase;
    return {
      id: item.id,
      nome: item.nome,
      ruaNumero: item.rua_numero,
      bairro: item.bairro,
      telefone: item.telefone
    }
  },

  async deletar(id: number): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Serviços para Usuários
export const usuarioService = {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (!data) return null
    
    const item = data as UsuarioSupabase;
    
    return {
      id: item.id,
      email: item.email,
      senha: item.senha,
      nomeCompleto: item.nome_completo,
      cargo: item.cargo as 'gerente' | 'entregador',
      entregadorId: item.entregador_id,
      emailVerificado: item.email_verificado,
      tokenRecuperacao: item.token_recuperacao,
      tokenExpiracao: item.token_expiracao ? new Date(item.token_expiracao) : undefined
    }
  },

  async buscarPorToken(token: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('token_recuperacao', token)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (!data) return null
    
    const item = data as UsuarioSupabase;
    
    return {
      id: item.id,
      email: item.email,
      senha: item.senha,
      nomeCompleto: item.nome_completo,
      cargo: item.cargo as 'gerente' | 'entregador',
      entregadorId: item.entregador_id,
      emailVerificado: item.email_verificado,
      tokenRecuperacao: item.token_recuperacao,
      tokenExpiracao: item.token_expiracao ? new Date(item.token_expiracao) : undefined
    }
  },

  async criar(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        email: usuario.email.toLowerCase(),
        senha: usuario.senha,
        nome_completo: usuario.nomeCompleto,
        cargo: usuario.cargo,
        entregador_id: usuario.entregadorId,
        email_verificado: usuario.emailVerificado
      })
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as UsuarioSupabase;
    return {
      id: item.id,
      email: item.email,
      senha: item.senha,
      nomeCompleto: item.nome_completo,
      cargo: item.cargo as 'gerente' | 'entregador',
      entregadorId: item.entregador_id,
      emailVerificado: item.email_verificado,
      tokenRecuperacao: item.token_recuperacao,
      tokenExpiracao: item.token_expiracao ? new Date(item.token_expiracao) : undefined
    }
  },

  async atualizar(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const updateData: Record<string, unknown> = {}
    if (usuario.senha) updateData.senha = usuario.senha
    if (usuario.nomeCompleto) updateData.nome_completo = usuario.nomeCompleto
    if (usuario.tokenRecuperacao !== undefined) {
      updateData.token_recuperacao = usuario.tokenRecuperacao || null
    }
    if (usuario.tokenExpiracao !== undefined) {
      updateData.token_expiracao = usuario.tokenExpiracao?.toISOString() || null
    }
    if (usuario.emailVerificado !== undefined) updateData.email_verificado = usuario.emailVerificado

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    const item = data as UsuarioSupabase;
    return {
      id: item.id,
      email: item.email,
      senha: item.senha,
      nomeCompleto: item.nome_completo,
      cargo: item.cargo as 'gerente' | 'entregador',
      entregadorId: item.entregador_id,
      emailVerificado: item.email_verificado,
      tokenRecuperacao: item.token_recuperacao,
      tokenExpiracao: item.token_expiracao ? new Date(item.token_expiracao) : undefined
    }
  }
}