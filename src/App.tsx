import { useState, useEffect } from 'react';
import { FileText, Users, BarChart3, UserCheck, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { NovaEntrega } from './components/NovaEntrega';
import { EditarEntrega } from './components/EditarEntrega';
import { Relatorios } from './components/Relatorios';
import { Entregadores } from './components/Entregadores';
import { Clientes } from './components/Clientes';
import { MeuPerfil } from './components/MeuPerfil';
import { Login } from './components/Login';
import { EntregadorDashboard } from './components/EntregadorDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { TelaAtiva, Entrega, Entregador, Cliente } from './types';
// AQUI ESTÁ A CORREÇÃO: 'formatarDuracaoLegivel' foi removido
import { calcularDuracaoSegundos } from './utils/calculations'; 
import { entregaService, entregadorService, clienteService } from './services/database';

function AppContent() {
  const { isAuthenticated, isGerente, isEntregador, logout, usuario } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard');
  const [mostrarNovaEntrega, setMostrarNovaEntrega] = useState(false);
  const [entregaParaEditar, setEntregaParaEditar] = useState<Entrega | null>(null);
  
  // Estados dos dados
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [entregasData, entregadoresData, clientesData] = await Promise.all([
          entregaService.buscarTodas(),
          entregadorService.buscarTodos(),
          clienteService.buscarTodos()
        ]);
        
        setEntregas(entregasData);
        setEntregadores(entregadoresData);
        setClientes(clientesData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      carregarDados();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const entregasComClientes = entregas.map(entrega => ({
    ...entrega,
    cliente: clientes.find(c => c.id === entrega.clienteId)
  }));

  const handleNovaEntrega = async (dadosEntrega: {
    numeroPedido: string;
    clienteId: number;
    clienteNovo?: {
      nome: string;
      ruaNumero: string;
      bairro: string;
      telefone?: string;
    };
    entregadorId: number;
    formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';
    valorTotalPedido: number;
    valorCorrida: number;
  }) => {
    try {
      let clienteId = dadosEntrega.clienteId;
      
      if (dadosEntrega.clienteNovo) {
        const novoCliente = await clienteService.criar({
          nome: dadosEntrega.clienteNovo.nome,
          ruaNumero: dadosEntrega.clienteNovo.ruaNumero,
          bairro: dadosEntrega.clienteNovo.bairro,
          telefone: dadosEntrega.clienteNovo.telefone
        });
        
        setClientes(prev => [...prev, novoCliente]);
        clienteId = novoCliente.id;
      }

      const novaEntrega = await entregaService.criar({
        dataHora: new Date(),
        numeroPedido: dadosEntrega.numeroPedido,
        clienteId: clienteId,
        entregadorId: dadosEntrega.entregadorId,
        entregador: entregadores.find(e => e.id === dadosEntrega.entregadorId)?.nome || '',
        formaPagamento: dadosEntrega.formaPagamento,
        valorTotalPedido: dadosEntrega.valorTotalPedido,
        valorCorrida: dadosEntrega.valorCorrida,
        status: 'Aguardando'
      });

      setEntregas(prev => [novaEntrega, ...prev]);
      setMostrarNovaEntrega(false);
    } catch (error) {
      console.error('Erro ao criar entrega:', error);
    }
  };

  const handleEditarEntrega = (entrega: Entrega) => {
    setEntregaParaEditar(entrega);
  };

  const handleSalvarEdicaoEntrega = async (entregaEditada: Entrega) => {
    try {
      const entregaAtualizada = await entregaService.atualizar(entregaEditada.id, entregaEditada);
      setEntregas(prev => prev.map(e => e.id === entregaEditada.id ? entregaAtualizada : e));
      setEntregaParaEditar(null);
    } catch (error) {
      console.error('Erro ao editar entrega:', error);
    }
  };

  const handleExcluirEntrega = async (id: number) => {
    try {
      await entregaService.deletar(id);
      setEntregas(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Erro ao excluir entrega:', error);
    }
  };

  const handleAtualizarStatus = async (id: number, status: Entrega['status'], dataHora?: Date) => {
    try {
      const entregaAtual = entregas.find(e => e.id === id);
      if (!entregaAtual) return;

      const agora = dataHora || new Date();
      const updateData: Partial<Entrega> = { status };
      
      if (status === 'Em Rota') {
        updateData.dataHoraSaida = agora;
      } else if (status === 'Entregue') {
        updateData.dataHoraEntrega = agora;
        
        const dataHoraSaida = entregaAtual.dataHoraSaida;
        if (dataHoraSaida) {
          const duracaoSegundos = calcularDuracaoSegundos(dataHoraSaida, agora);
          updateData.duracaoEntrega = duracaoSegundos;
        }
      }

      const entregaAtualizada = await entregaService.atualizar(id, updateData);
      setEntregas(prev => prev.map(entrega => entrega.id === id ? entregaAtualizada : entrega));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleAdicionarEntregador = async (nome: string, email: string) => {
    try {
      const novoEntregador = await entregadorService.criar({ nome, email });
      setEntregadores(prev => [...prev, novoEntregador]);
    } catch (error) {
      console.error('Erro ao adicionar entregador:', error);
    }
  };

  const handleEditarEntregador = async (id: number, nome: string, email: string) => {
    try {
      const entregadorAtualizado = await entregadorService.atualizar(id, { nome, email });
      setEntregadores(prev => prev.map(e => e.id === id ? entregadorAtualizado : e));
    } catch (error) {
      console.error('Erro ao editar entregador:', error);
    }
  };

  const handleRemoverEntregador = async (id: number) => {
    try {
      await entregadorService.deletar(id);
      setEntregadores(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Erro ao remover entregador:', error);
    }
  };

  const handleAdicionarCliente = async (cliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => {
    try {
      const novoCliente = await clienteService.criar(cliente);
      setClientes(prev => [...prev, novoCliente]);
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
    }
  };

  const handleEditarCliente = async (id: number, dadosCliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => {
    try {
      const clienteAtualizado = await clienteService.atualizar(id, dadosCliente);
      setClientes(prev => prev.map(cliente => cliente.id === id ? clienteAtualizado : cliente));
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
    }
  };

  const handleRemoverCliente = async (id: number) => {
    try {
      await clienteService.deletar(id);
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
    }
  };

  const handleAtualizarPerfil = (email: string, senha: string, nomeCompleto: string) => {
    console.log('Atualizando perfil:', { email, senha, nomeCompleto });
  };


  if (!isAuthenticated) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados...</div>
      </div>
    );
  }

  if (isEntregador) {
    return (
      <EntregadorDashboard
        entregas={entregasComClientes.filter(e => e.entregadorId === usuario?.entregadorId)}
        clientes={clientes}
        onAtualizarStatus={handleAtualizarStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Gestão de Entregas</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTelaAtiva('perfil')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <UserCheck size={20} />
                <span className="hidden sm:inline">{usuario?.nomeCompleto || 'Administrador'}</span>
              </button>
              
              <button
                onClick={logout}
                className="text-gray-300 hover:text-red-400 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setTelaAtiva('dashboard')}
              className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                telaAtiva === 'dashboard'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Dashboard
            </button>
            
            <button
              onClick={() => setTelaAtiva('relatorios')}
              className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                telaAtiva === 'relatorios'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Relatórios
            </button>
            
            <button
              onClick={() => setTelaAtiva('entregadores')}
              className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                telaAtiva === 'entregadores'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Entregadores
            </button>
            
            <button
              onClick={() => setTelaAtiva('clientes')}
              className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                telaAtiva === 'clientes'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Clientes
            </button>

            {isGerente && (
              <button
                onClick={() => setTelaAtiva('perfil')}
                className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  telaAtiva === 'perfil'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Settings size={16} className="inline mr-2" />
                Meu Perfil
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {telaAtiva === 'dashboard' && (
          <Dashboard
            entregas={entregasComClientes}
            entregadores={entregadores}
            clientes={clientes}
            onNovaEntrega={() => setMostrarNovaEntrega(true)}
            onAtualizarStatus={handleAtualizarStatus}
            onEditarEntrega={handleEditarEntrega}
            onExcluirEntrega={handleExcluirEntrega}
          />
        )}
        
        {telaAtiva === 'relatorios' && (
          <Relatorios
            entregas={entregasComClientes}
            entregadores={entregadores}
          />
        )}
        
        {telaAtiva === 'entregadores' && (
          <Entregadores
            entregadores={entregadores}
            onAdicionarEntregador={handleAdicionarEntregador}
            onEditarEntregador={handleEditarEntregador}
            onRemoverEntregador={handleRemoverEntregador}
          />
        )}
        
        {telaAtiva === 'clientes' && (
          <Clientes
            clientes={clientes}
            onAdicionarCliente={handleAdicionarCliente}
            onEditarCliente={handleEditarCliente}
            onRemoverCliente={handleRemoverCliente}
          />
        )}

        {telaAtiva === 'perfil' && (
          <MeuPerfil
            onVoltar={() => setTelaAtiva('dashboard')}
            onAtualizarPerfil={handleAtualizarPerfil}
          />
        )}
      </main>

      {mostrarNovaEntrega && (
        <NovaEntrega
          entregadores={entregadores}
          clientes={clientes}
          onSalvar={handleNovaEntrega}
          onFechar={() => setMostrarNovaEntrega(false)}
        />
      )}

      {entregaParaEditar && (
        <EditarEntrega
          entrega={entregaParaEditar}
          entregadores={entregadores}
          clientes={clientes}
          onSalvar={handleSalvarEdicaoEntrega}
          onFechar={() => setEntregaParaEditar(null)}
        />
      )}
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