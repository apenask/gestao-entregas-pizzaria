import React, { useState, useEffect } from 'react';
import { Truck, FileText, Users, BarChart3, UserCheck, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { NovaEntrega } from './components/NovaEntrega';
import { EditarEntrega } from './components/EditarEntrega';
import { Relatorios } from './components/Relatorios';
import { Entregadores } from './components/Entregadores';
import { Clientes } from './components/Clientes';
import { MeuPerfil } from './components/MeuPerfil';
import { Login } from './components/Login';
import { EntregadorDashboard } from './components/EntregadorDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TelaAtiva, Entrega, Entregador, Cliente, Usuario } from './types';
import { calcularDuracaoSegundos } from './utils/calculations';

function AppContent() {
  const { isAuthenticated, isGerente, isEntregador, logout, usuario } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard');
  const [mostrarNovaEntrega, setMostrarNovaEntrega] = useState(false);
  const [mostrarMeuPerfil, setMostrarMeuPerfil] = useState(false);
  const [entregaParaEditar, setEntregaParaEditar] = useState<Entrega | null>(null);
  
  // Estados dos dados
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  const [proximoIdEntrega, setProximoIdEntrega] = useState(1);
  const [proximoIdEntregador, setProximoIdEntregador] = useState(1);
  const [proximoIdCliente, setProximoIdCliente] = useState(1);

  // Dados de exemplo iniciais
  const dadosIniciais = {
    entregadores: [
      { id: 1, nome: 'João Silva', email: 'joao@bordadefogo.com' },
      { id: 2, nome: 'Maria Santos', email: 'maria@bordadefogo.com' },
      { id: 3, nome: 'Pedro Costa', email: 'pedro@bordadefogo.com' }
    ],
    clientes: [
      { id: 1, nome: 'Ana Paula', ruaNumero: 'Rua das Flores, 123', bairro: 'Centro', telefone: '(11) 99999-1111' },
      { id: 2, nome: 'Ricardo Mendes', ruaNumero: 'Av. Principal, 456', bairro: 'Jardim América', telefone: '(11) 99999-2222' },
      { id: 3, nome: 'Fernanda Lima', ruaNumero: 'Rua do Comércio, 789', bairro: 'Vila Nova', telefone: '(11) 99999-3333' },
      { id: 4, nome: 'Lucas Souza', ruaNumero: 'Rua da Paz, 321', bairro: 'Bela Vista', telefone: '(11) 99999-4444' },
      { id: 5, nome: 'Mariana Costa', ruaNumero: 'Rua das Palmeiras, 654', bairro: 'Parque das Árvores', telefone: '(11) 99999-5555' },
      { id: 6, nome: 'José Alves', ruaNumero: 'Av. dos Trabalhadores, 987', bairro: 'Industrial', telefone: '(11) 99999-6666' }
    ],
    entregas: [
      // Entregas do João Silva
      {
        id: 1,
        dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
        numeroPedido: '001',
        clienteId: 1,
        entregadorId: 1,
        entregador: 'João Silva',
        formaPagamento: 'Dinheiro' as const,
        valorTotalPedido: 60.00,
        valorCorrida: 6.00,
        status: 'Entregue' as const,
        dataHoraSaida: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // 10 min depois
        dataHoraEntrega: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000), // 25 min depois
        duracaoEntrega: 900 // 15 minutos = 900 segundos
      },
      {
        id: 2,
        dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        numeroPedido: '002',
        clienteId: 2,
        entregadorId: 1,
        entregador: 'João Silva',
        formaPagamento: 'Pix' as const,
        valorTotalPedido: 85.00,
        valorCorrida: 7.00,
        status: 'Entregue' as const,
        dataHoraSaida: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 min depois
        dataHoraEntrega: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 27 * 60 * 1000), // 27 min depois
        duracaoEntrega: 1320 // 22 minutos = 1320 segundos
      },
      // Entregas da Maria Santos
      {
        id: 3,
        dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        numeroPedido: '003',
        clienteId: 3,
        entregadorId: 2,
        entregador: 'Maria Santos',
        formaPagamento: 'Cartão de Débito' as const,
        valorTotalPedido: 45.50,
        valorCorrida: 6.00,
        status: 'Entregue' as const,
        dataHoraSaida: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000), // 8 min depois
        dataHoraEntrega: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000), // 20 min depois
        duracaoEntrega: 720 // 12 minutos = 720 segundos
      },
      {
        id: 4,
        dataHora: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
        numeroPedido: '004',
        clienteId: 4,
        entregadorId: 2,
        entregador: 'Maria Santos',
        formaPagamento: 'Cartão de Crédito' as const,
        valorTotalPedido: 110.00,
        valorCorrida: 7.00,
        status: 'Entregue' as const,
        dataHoraSaida: new Date(Date.now() - 12 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 min depois
        dataHoraEntrega: new Date(Date.now() - 12 * 60 * 60 * 1000 + 48 * 60 * 1000), // 48 min depois
        duracaoEntrega: 1980 // 33 minutos = 1980 segundos
      },
      // Entregas do Pedro Costa
      {
        id: 5,
        dataHora: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        numeroPedido: '005',
        clienteId: 5,
        entregadorId: 3,
        entregador: 'Pedro Costa',
        formaPagamento: 'Dinheiro' as const,
        valorTotalPedido: 52.00,
        valorCorrida: 6.00,
        status: 'Entregue' as const,
        dataHoraSaida: new Date(Date.now() - 6 * 60 * 60 * 1000 + 12 * 60 * 1000), // 12 min depois
        dataHoraEntrega: new Date(Date.now() - 6 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min depois
        duracaoEntrega: 1080 // 18 minutos = 1080 segundos
      },
      {
        id: 6,
        dataHora: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        numeroPedido: '006',
        clienteId: 6,
        entregadorId: 3,
        entregador: 'Pedro Costa',
        formaPagamento: 'Pix' as const,
        valorTotalPedido: 78.00,
        valorCorrida: 7.00,
        status: 'Aguardando' as const
      }
    ]
  };

  // Carregar dados do localStorage ou usar dados iniciais
  useEffect(() => {
    const entregasSalvas = localStorage.getItem('pizzaria-entregas');
    const entregadoresSalvos = localStorage.getItem('pizzaria-entregadores');
    const clientesSalvos = localStorage.getItem('pizzaria-clientes');
    
    if (entregasSalvas && entregadoresSalvos && clientesSalvos) {
      // Carregar dados salvos
      const entregas = JSON.parse(entregasSalvas).map((e: any) => ({
        ...e,
        dataHora: new Date(e.dataHora),
        dataHoraSaida: e.dataHoraSaida ? new Date(e.dataHoraSaida) : undefined,
        dataHoraEntrega: e.dataHoraEntrega ? new Date(e.dataHoraEntrega) : undefined
      }));
      setEntregas(entregas);
      
      const entregadores = JSON.parse(entregadoresSalvos);
      setEntregadores(entregadores);
      
      const clientes = JSON.parse(clientesSalvos);
      setClientes(clientes);
      
      if (entregas.length > 0) {
        setProximoIdEntrega(Math.max(...entregas.map((e: Entrega) => e.id)) + 1);
      }
      
      if (entregadores.length > 0) {
        setProximoIdEntregador(Math.max(...entregadores.map((e: Entregador) => e.id)) + 1);
      }
      
      if (clientes.length > 0) {
        setProximoIdCliente(Math.max(...clientes.map((c: Cliente) => c.id)) + 1);
      }
    } else {
      // Usar dados iniciais
      setEntregadores(dadosIniciais.entregadores);
      setClientes(dadosIniciais.clientes);
      setEntregas(dadosIniciais.entregas);
      setProximoIdEntrega(7); // Próximo ID após os dados iniciais
      setProximoIdEntregador(4); // Próximo ID após os entregadores iniciais
      setProximoIdCliente(7); // Próximo ID após os clientes iniciais
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    if (entregas.length > 0) {
      localStorage.setItem('pizzaria-entregas', JSON.stringify(entregas));
    }
  }, [entregas]);

  useEffect(() => {
    if (entregadores.length > 0) {
      localStorage.setItem('pizzaria-entregadores', JSON.stringify(entregadores));
    }
  }, [entregadores]);

  useEffect(() => {
    if (clientes.length > 0) {
      localStorage.setItem('pizzaria-clientes', JSON.stringify(clientes));
    }
  }, [clientes]);

  // Função para enriquecer entregas com dados do cliente
  const entregasComClientes = entregas.map(entrega => ({
    ...entrega,
    cliente: clientes.find(c => c.id === entrega.clienteId)
  }));

  const handleNovaEntrega = (dadosEntrega: {
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
    const agora = new Date();
    const entregador = entregadores.find(e => e.id === dadosEntrega.entregadorId);
    
    let clienteId = dadosEntrega.clienteId;
    
    // Se é um cliente novo, criar primeiro
    if (dadosEntrega.clienteNovo) {
      const novoCliente: Cliente = {
        id: proximoIdCliente,
        nome: dadosEntrega.clienteNovo.nome,
        ruaNumero: dadosEntrega.clienteNovo.ruaNumero,
        bairro: dadosEntrega.clienteNovo.bairro,
        telefone: dadosEntrega.clienteNovo.telefone
      };
      
      setClientes(prev => [...prev, novoCliente]);
      setProximoIdCliente(prev => prev + 1);
      clienteId = proximoIdCliente;
    }
    
    const novaEntrega: Entrega = {
      id: proximoIdEntrega,
      dataHora: agora,
      numeroPedido: dadosEntrega.numeroPedido,
      clienteId: clienteId,
      entregadorId: dadosEntrega.entregadorId,
      entregador: entregador?.nome || '',
      formaPagamento: dadosEntrega.formaPagamento,
      valorTotalPedido: dadosEntrega.valorTotalPedido,
      valorCorrida: dadosEntrega.valorCorrida,
      status: 'Aguardando'
    };

    setEntregas(prev => [...prev, novaEntrega]);
    setProximoIdEntrega(prev => prev + 1);
    setMostrarNovaEntrega(false);
  };

  // CORREÇÃO CRÍTICA: Função reescrita para calcular duração em segundos
  const handleAtualizarStatus = (id: number, status: 'Em Rota' | 'Entregue' | 'Cancelado', dataHora?: Date) => {
    setEntregas(prev => 
      prev.map(entrega => {
        if (entrega.id === id) {
          const entregaAtualizada = { ...entrega, status };
          
          if (status === 'Em Rota' && dataHora) {
            // Para "Em Rota", apenas salvar a data/hora de saída
            entregaAtualizada.dataHoraSaida = dataHora;
          } else if (status === 'Entregue' && dataHora) {
            // SEQUÊNCIA OBRIGATÓRIA PARA "ENTREGUE":
            
            // PASSO 1: CAPTURAR OS TEMPOS
            const dataHoraSaida = entrega.dataHoraSaida;
            const tempoAtual = dataHora; // Momento exato do clique
            
            // PASSO 2: CALCULAR A DURAÇÃO EM SEGUNDOS
            if (dataHoraSaida) {
              const duracaoSegundos = calcularDuracaoSegundos(dataHoraSaida, tempoAtual);
              
              // PASSO 3: SALVAR O RESULTADO EM SEGUNDOS (CRÍTICO!)
              entregaAtualizada.duracaoEntrega = duracaoSegundos; // Salva permanentemente em segundos
            }
            
            // PASSO 4: ATUALIZAR O STATUS E DATA DE ENTREGA
            entregaAtualizada.dataHoraEntrega = tempoAtual;
            
            console.log(`🔧 CORREÇÃO APLICADA - Entrega ${id}:`, {
              dataHoraSaida: dataHoraSaida,
              tempoAtual: tempoAtual,
              duracaoCalculadaSegundos: entregaAtualizada.duracaoEntrega,
              status: 'Entregue'
            });
          }
          
          return entregaAtualizada;
        }
        return entrega;
      })
    );
  };

  const handleEditarEntrega = (entrega: Entrega) => {
    // Enriquecer a entrega com dados do cliente
    const entregaComCliente = {
      ...entrega,
      cliente: clientes.find(c => c.id === entrega.clienteId)
    };
    setEntregaParaEditar(entregaComCliente);
  };

  const handleSalvarEdicaoEntrega = (entregaEditada: Entrega) => {
    // Atualizar cliente se necessário
    if (entregaEditada.cliente) {
      setClientes(prev => 
        prev.map(cliente => 
          cliente.id === entregaEditada.cliente!.id ? entregaEditada.cliente! : cliente
        )
      );
    }
    
    setEntregas(prev => 
      prev.map(entrega => 
        entrega.id === entregaEditada.id ? entregaEditada : entrega
      )
    );
    setEntregaParaEditar(null);
  };

  const handleExcluirEntrega = (id: number) => {
    setEntregas(prev => prev.filter(entrega => entrega.id !== id));
  };

  const handleAdicionarEntregador = (nome: string, email: string) => {
    const novoEntregador: Entregador = {
      id: proximoIdEntregador,
      nome,
      email
    };
    
    setEntregadores(prev => [...prev, novoEntregador]);
    setProximoIdEntregador(prev => prev + 1);
  };

  const handleEditarEntregador = (id: number, nome: string, email: string) => {
    setEntregadores(prev => 
      prev.map(entregador => 
        entregador.id === id ? { ...entregador, nome, email } : entregador
      )
    );
    
    // Atualizar nome do entregador nas entregas
    setEntregas(prev => 
      prev.map(entrega => 
        entrega.entregadorId === id ? { ...entrega, entregador: nome } : entrega
      )
    );
  };

  const handleRemoverEntregador = (id: number) => {
    // Verificar se há entregas pendentes para este entregador
    const entregasPendentes = entregas.filter(e => e.entregadorId === id && (e.status === 'Aguardando' || e.status === 'Em Rota'));
    
    if (entregasPendentes.length > 0) {
      alert('Não é possível remover este entregador pois há entregas pendentes.');
      return;
    }
    
    setEntregadores(prev => prev.filter(entregador => entregador.id !== id));
  };

  const handleAtualizarPerfil = (email: string, senha: string, nomeCompleto: string) => {
    if (usuario) {
      // Atualizar usuário no localStorage
      const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
      if (usuariosSalvos) {
        const usuarios: Usuario[] = JSON.parse(usuariosSalvos);
        const usuariosAtualizados = usuarios.map(u => 
          u.id === usuario.id ? { ...u, email, senha, nomeCompleto } : u
        );
        localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuariosAtualizados));
        
        // Atualizar usuário logado
        const usuarioAtualizado = { ...usuario, email, senha, nomeCompleto };
        localStorage.setItem('pizzaria-usuario-logado', JSON.stringify(usuarioAtualizado));
      }
    }
  };

  const handleAdicionarCliente = (dadosCliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => {
    const novoCliente: Cliente = {
      id: proximoIdCliente,
      ...dadosCliente
    };
    
    setClientes(prev => [...prev, novoCliente]);
    setProximoIdCliente(prev => prev + 1);
  };

  const handleEditarCliente = (id: number, dadosCliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => {
    setClientes(prev => 
      prev.map(cliente => 
        cliente.id === id ? { ...cliente, ...dadosCliente } : cliente
      )
    );
  };

  const handleRemoverCliente = (id: number) => {
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Se for entregador, mostrar dashboard específico
  if (isEntregador) {
    return (
      <EntregadorDashboard
        entregas={entregasComClientes}
        clientes={clientes}
        onAtualizarStatus={handleAtualizarStatus}
      />
    );
  }

  // Se estiver na tela de perfil
  if (mostrarMeuPerfil) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <img 
                  src="/borda de fogo - logo - nome preto e vermelho.png" 
                  alt="Pizzaria Borda de Fogo" 
                  className="h-12 w-auto"
                />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-white">
                    Pizzaria Borda de Fogo
                  </h1>
                  <p className="text-sm text-gray-400">Configurações da Conta</p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-2 rounded-md font-medium transition-colors duration-200 text-xs sm:text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <MeuPerfil
            onVoltar={() => setMostrarMeuPerfil(false)}
            onAtualizarPerfil={handleAtualizarPerfil}
          />
        </main>
      </div>
    );
  }

  // Interface do gerente
  const menuItems = [
    { id: 'dashboard' as TelaAtiva, label: 'Dashboard', icon: BarChart3 },
    { id: 'relatorios' as TelaAtiva, label: 'Relatórios', icon: FileText },
    { id: 'entregadores' as TelaAtiva, label: 'Entregadores', icon: Users },
    { id: 'clientes' as TelaAtiva, label: 'Clientes', icon: UserCheck }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img 
                src="/borda de fogo - logo - nome preto e vermelho.png" 
                alt="Pizzaria Borda de Fogo" 
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">
                  Pizzaria Borda de Fogo
                </h1>
                <p className="text-sm text-gray-400">Controle de Entregas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTelaAtiva(item.id)}
                      className={`px-2 sm:px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base ${
                        telaAtiva === item.id
                          ? 'bg-red-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={16} sm:size={18} />
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Botão Meu Perfil - Apenas para Gerente */}
              {isGerente && (
                <button
                  onClick={() => setMostrarMeuPerfil(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200"
                  title="Meu Perfil"
                >
                  <Settings size={18} />
                </button>
              )}
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-2 rounded-md font-medium transition-colors duration-200 text-xs sm:text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
            clientes={clientes}
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
      </main>

      {/* Modal Nova Entrega */}
      {mostrarNovaEntrega && (
        <NovaEntrega
          entregadores={entregadores}
          clientes={clientes}
          onSalvar={handleNovaEntrega}
          onFechar={() => setMostrarNovaEntrega(false)}
        />
      )}

      {/* Modal Editar Entrega */}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;