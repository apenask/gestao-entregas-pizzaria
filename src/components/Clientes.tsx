import React, { useState, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, User, MapPin, Phone } from 'lucide-react';
import { Cliente } from '../types';
import { Modal, useModal } from './Modal';

interface ClientesProps {
  clientes: Cliente[];
  onAdicionarCliente: (cliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => void;
  onEditarCliente: (id: number, cliente: { nome: string; ruaNumero: string; bairro: string; telefone?: string }) => void;
  onRemoverCliente: (id: number) => void;
}

interface FormularioCliente {
  nome: string;
  ruaNumero: string;
  bairro: string;
  telefone: string;
}

export const Clientes: React.FC<ClientesProps> = ({
  clientes,
  onAdicionarCliente,
  onEditarCliente,
  onRemoverCliente
}) => {
  const [busca, setBusca] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formulario, setFormulario] = useState<FormularioCliente>({
    nome: '',
    ruaNumero: '',
    bairro: '',
    telefone: ''
  });

  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  // Filtrar clientes baseado na busca
  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      cliente.ruaNumero.toLowerCase().includes(busca.toLowerCase()) ||
      cliente.bairro.toLowerCase().includes(busca.toLowerCase()) ||
      (cliente.telefone && cliente.telefone.includes(busca))
    );
  }, [clientes, busca]);

  const resetFormulario = () => {
    setFormulario({
      nome: '',
      ruaNumero: '',
      bairro: '',
      telefone: ''
    });
  };

  const handleAbrirModalNovo = () => {
    resetFormulario();
    setClienteEditando(null);
    setMostrarModal(true);
  };

  const handleAbrirModalEdicao = (cliente: Cliente) => {
    setFormulario({
      nome: cliente.nome,
      ruaNumero: cliente.ruaNumero,
      bairro: cliente.bairro,
      telefone: cliente.telefone || ''
    });
    setClienteEditando(cliente);
    setMostrarModal(true);
  };

  const handleFecharModal = () => {
    setMostrarModal(false);
    setClienteEditando(null);
    resetFormulario();
  };

  const handleSubmitFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulario.nome.trim() || !formulario.ruaNumero.trim() || !formulario.bairro.trim()) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios (Nome, Rua e Número, Bairro).', 'error');
      return;
    }

    const dadosCliente = {
      nome: formulario.nome.trim(),
      ruaNumero: formulario.ruaNumero.trim(),
      bairro: formulario.bairro.trim(),
      telefone: formulario.telefone.trim() || undefined
    };

    if (clienteEditando) {
      onEditarCliente(clienteEditando.id, dadosCliente);
    } else {
      onAdicionarCliente(dadosCliente);
    }

    handleFecharModal();
  };

  const handleRemoverComConfirmacao = (cliente: Cliente) => {
    const message = `Tem certeza que deseja excluir este cliente?\n\nNome: ${cliente.nome}\nEndereço: ${cliente.ruaNumero}, ${cliente.bairro}\n\nTodas as entregas associadas a ele permanecerão no histórico, mas este cadastro será removido.\n\nEsta ação não pode ser desfeita.`;
    
    showConfirm(
      'Confirmar Exclusão',
      message,
      () => onRemoverCliente(cliente.id),
      {
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    );
  };

  const handleInputChange = (campo: keyof FormularioCliente, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciamento de Clientes</h1>
          </div>
          
          <button
            onClick={handleAbrirModalNovo}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg"
          >
            <Plus size={20} />
            Adicionar Novo Cliente
          </button>
        </div>

        {/* Barra de Busca */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente por nome, endereço ou telefone..."
              className="w-full px-4 py-3 pl-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Clientes Cadastrados ({clientesFiltrados.length})
              {busca && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  - Filtrado de {clientes.length} total
                </span>
              )}
            </h3>
          </div>

          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              {busca ? (
                <>
                  <Search size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    Nenhum cliente encontrado com o termo "{busca}"
                  </p>
                  <button
                    onClick={() => setBusca('')}
                    className="mt-3 text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    Limpar busca
                  </button>
                </>
              ) : (
                <>
                  <Users size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    Nenhum cliente cadastrado ainda
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="p-4 hover:bg-gray-750 transition-colors duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Informações principais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-green-500 flex-shrink-0" />
                          <span className="font-bold text-white truncate">
                            {cliente.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                          <span className="text-gray-300 truncate">
                            {cliente.bairro}
                          </span>
                        </div>
                        {cliente.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-purple-500 flex-shrink-0" />
                            <span className="text-gray-300 truncate">
                              {cliente.telefone}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Endereço completo */}
                      <div className="bg-gray-800 rounded-md p-3">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-white">Endereço Completo:</span> {cliente.ruaNumero}, {cliente.bairro}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {cliente.id}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
                      <button
                        onClick={() => handleAbrirModalEdicao(cliente)}
                        className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemoverComConfirmacao(cliente)}
                        className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar/Editar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {clienteEditando ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
              </h2>
              <button
                onClick={handleFecharModal}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitFormulario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Cliente *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Digite o nome completo"
                    required
                  />
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rua e Número *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formulario.ruaNumero}
                    onChange={(e) => handleInputChange('ruaNumero', e.target.value)}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Rua das Flores, 123"
                    required
                  />
                  <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formulario.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Centro"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formulario.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: (11) 99999-9999"
                  />
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <Save size={16} />
                  {clienteEditando ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Global */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDestructive={modalState.isDestructive}
      />
    </>
  );
};