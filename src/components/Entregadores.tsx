import React, { useState } from 'react';
import { Users, Edit2, Trash2, Save, X, UserPlus, User, Mail } from 'lucide-react';
import { Entregador } from '../types';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';

interface EntregadoresProps {
  entregadores: Entregador[];
  onAdicionarEntregador: (nome: string, email: string) => void;
  onEditarEntregador: (id: number, nome: string, email: string) => void;
  onRemoverEntregador: (id: number) => void;
}

interface FormularioEntregador {
  nome: string;
  email: string;
}

export const Entregadores: React.FC<EntregadoresProps> = ({
  entregadores,
  onAdicionarEntregador,
  onEditarEntregador,
  onRemoverEntregador
}) => {
  const [mostrarModalNovo, setMostrarModalNovo] = useState(false);
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [entregadorEditando, setEntregadorEditando] = useState<Entregador | null>(null);
  
  const [formularioNovo, setFormularioNovo] = useState<FormularioEntregador>({
    nome: '',
    email: ''
  });

  const [formularioEdicao, setFormularioEdicao] = useState<FormularioEntregador>({
    nome: '',
    email: ''
  });

  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const resetFormularioNovo = () => {
    setFormularioNovo({
      nome: '',
      email: ''
    });
  };

  const resetFormularioEdicao = () => {
    setFormularioEdicao({
      nome: '',
      email: ''
    });
  };

  const handleAbrirModalNovo = () => {
    resetFormularioNovo();
    setMostrarModalNovo(true);
  };

  const handleFecharModalNovo = () => {
    setMostrarModalNovo(false);
    resetFormularioNovo();
  };

  const handleAbrirModalEdicao = (entregador: Entregador) => {
    setEntregadorEditando(entregador);
    setFormularioEdicao({
      nome: entregador.nome,
      email: entregador.email
    });
    setMostrarModalEdicao(true);
  };

  const handleFecharModalEdicao = () => {
    setMostrarModalEdicao(false);
    setEntregadorEditando(null);
    resetFormularioEdicao();
  };

  const handleSubmitNovo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formularioNovo.nome.trim() || !formularioNovo.email.trim()) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Verificar se email já existe
    const emailExiste = entregadores.find(e => e.email.toLowerCase() === formularioNovo.email.toLowerCase());
    if (emailExiste) {
      showAlert('Email Já Cadastrado', 'Este email já está cadastrado para outro entregador.', 'error');
      return;
    }

    onAdicionarEntregador(
      formularioNovo.nome.trim(),
      formularioNovo.email.trim().toLowerCase()
    );
    
    handleFecharModalNovo();
    showAlert('Entregador Cadastrado', 'Entregador cadastrado com sucesso! Ele poderá criar sua conta usando este email.', 'success');
  };

  const handleSubmitEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formularioEdicao.nome.trim() || !formularioEdicao.email.trim() || !entregadorEditando) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Verificar se email já existe (exceto o atual)
    const emailExiste = entregadores.find(e => 
      e.email.toLowerCase() === formularioEdicao.email.toLowerCase() && 
      e.id !== entregadorEditando.id
    );
    if (emailExiste) {
      showAlert('Email Já Cadastrado', 'Este email já está cadastrado para outro entregador.', 'error');
      return;
    }

    onEditarEntregador(
      entregadorEditando.id, 
      formularioEdicao.nome.trim(),
      formularioEdicao.email.trim().toLowerCase()
    );

    handleFecharModalEdicao();
    showAlert('Entregador Atualizado', 'Informações do entregador atualizadas com sucesso!', 'success');
  };

  const handleRemoverComConfirmacao = (entregador: Entregador) => {
    const message = `Tem certeza que deseja remover o entregador "${entregador.nome}"?\n\nEsta ação irá:\n• Remover o entregador da lista\n• Manter o histórico de entregas\n• A conta de usuário (se existir) permanecerá ativa\n\nEsta ação não pode ser desfeita.`;
    
    showConfirm(
      'Confirmar Remoção',
      message,
      () => onRemoverEntregador(entregador.id),
      {
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    );
  };

  const handleInputNovoChange = (campo: keyof FormularioEntregador, valor: string) => {
    setFormularioNovo(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleInputEdicaoChange = (campo: keyof FormularioEntregador, valor: string) => {
    setFormularioEdicao(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-red-500" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Gerenciar Entregadores</h1>
          </div>
          
          <button
            onClick={handleAbrirModalNovo}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg text-sm sm:text-base"
          >
            <UserPlus size={20} />
            <span className="sm:inline">Adicionar Novo Entregador</span>
          </button>
        </div>

        {/* Lista de entregadores */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-3 sm:p-4 border-b border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Entregadores Cadastrados ({entregadores.length})
            </h3>
          </div>

          {entregadores.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Users size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Nenhum entregador cadastrado ainda.
              </p>
              <button
                onClick={handleAbrirModalNovo}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors duration-200"
              >
                <UserPlus size={18} />
                Cadastrar Primeiro Entregador
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {entregadores.map((entregador) => (
                <div key={entregador.id} className="p-3 sm:p-4 hover:bg-gray-750 transition-colors duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-gray-400 flex-shrink-0" />
                        <h4 className="font-medium text-white truncate">{entregador.nome}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm truncate">{entregador.email}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        ID: {entregador.id}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:flex-col lg:flex-row">
                      <button
                        onClick={() => handleAbrirModalEdicao(entregador)}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm"
                        title="Editar Entregador"
                      >
                        <Edit2 size={16} />
                        <span className="sm:inline">Editar</span>
                      </button>
                      
                      <button
                        onClick={() => handleRemoverComConfirmacao(entregador)}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm"
                        title="Remover Entregador"
                      >
                        <Trash2 size={16} />
                        <span className="sm:inline">Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informação sobre criação de contas */}
        <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Como funciona o sistema de contas:</h4>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>• Cadastre o entregador com nome e email</li>
            <li>• O entregador poderá criar sua própria conta usando o email cadastrado</li>
            <li>• Ele acessará a tela de "Criar Conta" e usará o email que você cadastrou</li>
            <li>• Apenas emails cadastrados aqui podem criar contas de entregador</li>
          </ul>
        </div>
      </div>

      {/* Modal de Adicionar Novo Entregador */}
      {mostrarModalNovo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Adicionar Novo Entregador
              </h2>
              <button
                onClick={handleFecharModalNovo}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitNovo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formularioNovo.nome}
                    onChange={(e) => handleInputNovoChange('nome', e.target.value)}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: João da Silva"
                    required
                  />
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email do Entregador *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formularioNovo.email}
                    onChange={(e) => handleInputNovoChange('email', e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: joao@email.com"
                    required
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  O entregador usará este email para criar sua conta no sistema
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFecharModalNovo}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Save size={16} />
                  Cadastrar Entregador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Entregador */}
      {mostrarModalEdicao && entregadorEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Editar Entregador
              </h2>
              <button
                onClick={handleFecharModalEdicao}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-750 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Editando:</span> {entregadorEditando.nome}
              </p>
              <p className="text-xs text-gray-500">
                ID: {entregadorEditando.id}
              </p>
            </div>

            <form onSubmit={handleSubmitEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formularioEdicao.nome}
                    onChange={(e) => handleInputEdicaoChange('nome', e.target.value)}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: João da Silva"
                    required
                  />
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email do Entregador *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formularioEdicao.email}
                    onChange={(e) => handleInputEdicaoChange('email', e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: joao@email.com"
                    required
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Altere o email se necessário. O entregador precisará usar o novo email para acessar
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFecharModalEdicao}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Save size={16} />
                  Salvar Alterações
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