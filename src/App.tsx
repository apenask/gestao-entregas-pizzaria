import { useState, useEffect } from 'react';
import { FileText, Users, BarChart3, Settings, UserCheck } from 'lucide-react';
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
import { supabase } from './lib/supabase'; // Importe o supabase client

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

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const carregarDados = async () => {
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
    };

    carregarDados();

    const canalDeEntregas = supabase
      .channel('mudancas_entregas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entregas' },
        (payload) => {
          console.log('Mudança recebida!', payload);
          carregarDados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalDeEntregas);
    };
  }, [isAuthenticated, isGerente, loading]);

  const handleGerenciarAprovacao = async (id: number, status: 'aprovado' | 'recusado') => {
    try {
      await usuarioService.atualizar(id, { status_aprovacao: status });
      setUsuariosPendentes(prev => prev.filter(u => u.id !== id));
    } catch (error) { console.error(`Erro ao ${status} usuário:`, error); }
  };
  
  const handleAdicionarEntregador = async (nome: string, email: string) => {
    try {
      const novoEntregador = await entregadorService.criar({ nome, email });
      setEntregadores(prev => [...prev, novoEntregador]);
    } catch (error) { console.error('Erro ao adicionar entregador:', error); }
  };
  
  const handleEditarEntregador = async (id: number, nome: string, email: string) => {
    try {
      const entregadorAtualizado = await entregadorService.atualizar(id, { nome, email });
      setEntregadores(prev => prev.map(e => (e.id === id ? entregadorAtualizado : e)));
    } catch (error) { console.error('Erro ao editar entregador:', error); }
  };

  const handleRemoverEntregador = async (id: number) => {
    try {
      await entregadorService.deletar(id);
      setEntregadores(prev => prev.filter(e => e.id !== id));
    } catch (error) { console.error('Erro ao remover entregador:', error); }
  };
  
  const handleAdicionarCliente = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      const novoCliente = await clienteService.criar(cliente);
      setClientes(prev => [...prev, novoCliente]);
    } catch (error) { console.error('Erro ao adicionar cliente:', error); }
  };
  
  const handleEditarCliente = async (id: number, dadosCliente: Omit<Cliente, 'id'>) => {
    try {
      const clienteAtualizado = await clienteService.atualizar(id, dadosCliente);
      setClientes(prev => prev.map(c => (c.id === id ? clienteAtualizado : c)));
    } catch (error) { console.error('Erro ao editar cliente:', error); }
  };

  const handleRemoverCliente = async (id: number) => {
    try {
      await clienteService.deletar(id);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (error) { console.error('Erro ao remover cliente:', error); }
  };
  
  const handleAtualizarPerfil = async (dados: Partial<Usuario>) => {
    if (usuario) { await atualizarUsuario(usuario.id, dados); }
  };
  
  const entregasComClientes = entregas.map((entrega) => ({ ...entrega, cliente: clientes.find((c) => c.id === entrega.clienteId) }));
  
  const handleNovaEntrega = async (dadosEntrega: NovaEntregaDados) => {
    try {
      let clienteId = dadosEntrega.clienteId;
      if (dadosEntrega.clienteNovo) {
        const novoCliente = await clienteService.criar(dadosEntrega.clienteNovo);
        setClientes((prev) => [...prev, novoCliente]);
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
    try {
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
      await entregaService.atualizar(id, updateData);
    } catch (error) { console.error('Erro ao atualizar status:', error); }
  };

  const NavButton = ({ tela, icone: Icone, nome, badge }: { tela: TelaAtiva, icone: React.ElementType, nome: string, badge?: number }) => (
    <button onClick={() => setTelaAtiva(tela)} className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${telaAtiva === tela ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
      <Icone size={16} />
      {nome}
      {/* *** ALTERAÇÃO AQUI: Condição corrigida para ser segura com TypeScript *** */}
      {typeof badge === 'number' && badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  if (!isAuthenticated) return <Login />;
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  if (isEntregador) return <EntregadorDashboard entregas={entregasComClientes.filter(e => e.entregadorId === usuario?.entregadorId)} clientes={clientes} onAtualizarStatus={handleAtualizarStatus} />;

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
        {telaAtiva === 'dashboard' && <Dashboard onNovaEntrega={() => setMostrarNovaEntrega(true)} onEditarEntrega={handleEditarEntrega} {...{ entregas: entregasComClientes, entregadores, clientes, onAtualizarStatus: handleAtualizarStatus, onExcluirEntrega: handleExcluirEntrega }} />}
        {telaAtiva === 'relatorios' && <Relatorios entregas={entregasComClientes} entregadores={entregadores} />}
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
