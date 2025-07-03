import { useState, useEffect, useCallback } from 'react';
import { FileText, Users, BarChart3, Settings, UserCheck } from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Dashboard } from './components/Dashboard';
import { NovaEntrega } from './components/NovaEntrega';
import { EditarEntrega } from './components/EditarEntrega';
import { Relatorios } from './components/Relatorios';
import { Entregadores } from './components/Entregadores';
import { Clientes } from './components/Clientes';
import { MeuPerfil } from './components/MeuPerfil';
import { Aprovacoes } from './components/Aprovacoes';
import { Login } from './components/Login';
import { EntregadorDashboard } from './components/EntregadorDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { TelaAtiva, Entrega, Entregador, Cliente, Usuario } from './types';
import { entregaService, entregadorService, clienteService, usuarioService } from './services/database';
import { calcularDuracaoSegundos } from './utils/calculations';
import { supabase } from './lib/supabase';

type NovaEntregaDados = {
  numeroPedido: string;
  clienteId: number;
  clienteNovo?: { nome: string; ruaNumero: string; bairro: string; telefone?: string; };
  entregadorId: number;
  formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';
  valorTotalPedido: number;
  valorCorrida: number;
};

function AppContent() {
  const { isAuthenticated, isGerente, isEntregador, logout, usuario, atualizarUsuario } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard');
  const [mostrarNovaEntrega, setMostrarNovaEntrega] = useState(false);
  const [entregaParaEditar, setEntregaParaEditar] = useState<Entrega | null>(null);

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuariosPendentes, setUsuariosPendentes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const [entregasData, entregadoresData, clientesData, pendentesData] = await Promise.all([
        entregaService.buscarTodas(),
        entregadorService.buscarTodos(),
        clienteService.buscarTodos(),
        isGerente ? usuarioService.buscarPendentes() : Promise.resolve([]),
      ]);
      setEntregas(entregasData);
      setEntregadores(entregadoresData);
      setClientes(clientesData);
      setUsuariosPendentes(pendentesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (loading) setLoading(false);
    }
  }, [isGerente, loading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    carregarDados();

    // *** CORRIGIDO: O tipo 'any' foi substituído por 'unknown' para ser mais seguro ***
    const handleMudancaNoBanco = (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('Mudança recebida no banco de dados!', payload);
        carregarDados();
    };

    const entregasChannel = supabase.channel('entregas').on('postgres_changes', { event: '*', schema: 'public', table: 'entregas' }, handleMudancaNoBanco).subscribe();
    const usuariosChannel = supabase.channel('usuarios').on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, handleMudancaNoBanco).subscribe();
    const clientesChannel = supabase.channel('clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, handleMudancaNoBanco).subscribe();
    const entregadoresChannel = supabase.channel('entregadores').on('postgres_changes', { event: '*', schema: 'public', table: 'entregadores' }, handleMudancaNoBanco).subscribe();

    return () => {
      supabase.removeChannel(entregasChannel);
      supabase.removeChannel(usuariosChannel);
      supabase.removeChannel(clientesChannel);
      supabase.removeChannel(entregadoresChannel);
    };
  }, [isAuthenticated, isGerente, carregarDados]);
  
  const handleGerenciarAprovacao = async (id: number, status: 'aprovado' | 'recusado') => {
    try {
      const usuarioPendente = usuariosPendentes.find(u => u.id === id);
      if (!usuarioPendente) return;
      await usuarioService.atualizar(id, { status_aprovacao: status });
      if (status === 'recusado' && usuarioPendente.entregadorId) {
        await entregadorService.deletar(usuarioPendente.entregadorId);
      }
    } catch (error) { console.error(`Erro ao ${status} usuário:`, error); }
  };
  const handleAdicionarEntregador = async (nome: string, email: string) => {
    try {
      await entregadorService.criar({ nome, email });
    } catch (error) { console.error('Erro ao adicionar entregador:', error); }
  };
  const handleEditarEntregador = async (id: number, nome: string, email: string) => {
    try {
      await entregadorService.atualizar(id, { nome, email });
    } catch (error) { console.error('Erro ao editar entregador:', error); }
  };
  const handleRemoverEntregador = async (id: number) => {
    try {
      await entregadorService.deletar(id);
    } catch (error) { console.error('Erro ao remover entregador:', error); }
  };
  const handleAdicionarCliente = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      await clienteService.criar(cliente);
    } catch (error) { console.error('Erro ao adicionar cliente:', error); }
  };
  const handleEditarCliente = async (id: number, dadosCliente: Omit<Cliente, 'id'>) => {
    try {
      await clienteService.atualizar(id, dadosCliente);
    } catch (error) { console.error('Erro ao editar cliente:', error); }
  };
  const handleRemoverCliente = async (id: number) => {
    try {
      await clienteService.deletar(id);
    } catch (error) { console.error('Erro ao remover cliente:', error); }
  };
  const handleAtualizarPerfil = async (dados: Partial<Usuario>) => {
    if (usuario) { await atualizarUsuario(usuario.id, dados); }
  };
  
  // *** REMOVIDO: A variável 'entregasComClientes' não estava a ser utilizada ***

  const handleNovaEntrega = async (dadosEntrega: NovaEntregaDados) => {
    try {
      let clienteId = dadosEntrega.clienteId;
      if (dadosEntrega.clienteNovo) {
        const novoCliente = await clienteService.criar(dadosEntrega.clienteNovo);
        clienteId = novoCliente.id;
      }
      const payload = { ...dadosEntrega, clienteId };
      delete (payload as Partial<NovaEntregaDados>).clienteNovo;
      await entregaService.criar({ ...payload, dataHora: new Date(), status: 'Aguardando' });
      setMostrarNovaEntrega(false);
    } catch (error) { 
      console.error('Erro ao criar entrega:', error); 
    }
  };
  const handleEditarEntrega = (entrega: Entrega) => { setEntregaParaEditar(entrega); };
  const handleSalvarEdicaoEntrega = async (entregaEditada: Entrega) => {
    try {
      await entregaService.atualizar(entregaEditada.id, entregaEditada);
      setEntregaParaEditar(null);
    } catch (error) { console.error('Erro ao editar entrega:', error); }
  };
  const handleExcluirEntrega = async (id: number) => {
    try {
      await entregaService.deletar(id);
    } catch (error) { console.error('Erro ao excluir entrega:', error); }
  };

  const handleAtualizarStatus = async (id: number, status: Entrega['status']) => {
    const entregaOriginal = entregas.find((e) => e.id === id);
    if (!entregaOriginal) return;

    const agora = new Date();
    const dadosAtualizacao: Partial<Entrega> = { status };
    if (status === 'Em Rota') {
      dadosAtualizacao.dataHoraSaida = agora;
    } else if (status === 'Entregue' && entregaOriginal.dataHoraSaida) {
      dadosAtualizacao.dataHoraEntrega = agora;
      dadosAtualizacao.duracaoEntrega = calcularDuracaoSegundos(new Date(entregaOriginal.dataHoraSaida), agora);
    }

    const entregaOtimista: Entrega = {
      ...entregaOriginal,
      ...dadosAtualizacao,
    };

    setEntregas(prevEntregas =>
      prevEntregas.map(e => (e.id === id ? entregaOtimista : e))
    );

    try {
      await entregaService.atualizar(id, dadosAtualizacao);
    } catch (error) {
      console.error('Falha na atualização otimista, a reverter UI:', error);
      setEntregas(prevEntregas =>
        prevEntregas.map(e => (e.id === id ? entregaOriginal : e))
      );
    }
  };

  const NavButton = ({ tela, icone: Icone, nome, badge }: { tela: TelaAtiva, icone: React.ElementType, nome: string, badge?: number }) => (
    <button onClick={() => setTelaAtiva(tela)} className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${telaAtiva === tela ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
      <Icone size={16} />
      {nome}
      {typeof badge === 'number' && badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  if (!isAuthenticated) return <Login />;
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  
  if (isEntregador) {
    return (
      <EntregadorDashboard 
        entregas={entregas.filter(e => e.entregadorId === usuario?.entregadorId)} 
        clientes={clientes} 
        onAtualizarStatus={handleAtualizarStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0"><h1 className="text-xl font-bold text-white">Gestão de Entregas</h1></div>
            <div className="hidden md:flex md:items-center md:space-x-4">
              <NavButton tela="dashboard" icone={BarChart3} nome="Dashboard" />
              {isGerente && <NavButton tela="aprovacoes" icone={UserCheck} nome="Aprovações" badge={usuariosPendentes.length} />}
              <NavButton tela="relatorios" icone={FileText} nome="Relatórios" />
              <NavButton tela="entregadores" icone={Users} nome="Entregadores" />
              <NavButton tela="clientes" icone={Users} nome="Clientes" />
              {isGerente && <NavButton tela="perfil" icone={Settings} nome="Meu Perfil" />}
            </div>
            <div className="flex-shrink-0"><button onClick={logout} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Sair</button></div>
          </div>
        </div>
      </header>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {telaAtiva === 'dashboard' && <Dashboard onNovaEntrega={() => setMostrarNovaEntrega(true)} onEditarEntrega={handleEditarEntrega} {...{ entregas, entregadores, clientes, onAtualizarStatus: handleAtualizarStatus, onExcluirEntrega: handleExcluirEntrega }} />}
        {telaAtiva === 'relatorios' && <Relatorios entregas={entregas} entregadores={entregadores} />}
        {telaAtiva === 'entregadores' && <Entregadores onAdicionarEntregador={handleAdicionarEntregador} onEditarEntregador={handleEditarEntregador} onRemoverEntregador={handleRemoverEntregador} entregadores={entregadores}/>}
        {telaAtiva === 'clientes' && <Clientes onAdicionarCliente={handleAdicionarCliente} onEditarCliente={handleEditarCliente} onRemoverCliente={handleRemoverCliente} clientes={clientes}/>}
        {telaAtiva === 'perfil' && <MeuPerfil onVoltar={() => setTelaAtiva('dashboard')} onAtualizarPerfil={handleAtualizarPerfil} />}
        {telaAtiva === 'aprovacoes' && <Aprovacoes usuariosPendentes={usuariosPendentes} onAprovar={(id) => handleGerenciarAprovacao(id, 'aprovado')} onRecusar={(id) => handleGerenciarAprovacao(id, 'recusado')} />}
      </main>
      {mostrarNovaEntrega && <NovaEntrega entregadores={entregadores} clientes={clientes} onSalvar={handleNovaEntrega} onFechar={() => setMostrarNovaEntrega(false)} />}
      {entregaParaEditar && <EditarEntrega entrega={entregaParaEditar} entregadores={entregadores} clientes={clientes} onSalvar={handleSalvarEdicaoEntrega} onFechar={() => setEntregaParaEditar(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
