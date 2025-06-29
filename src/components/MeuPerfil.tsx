import React, { useState } from 'react';
import { User, Lock, Save, ArrowLeft, Settings, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Modal, useModal } from './Modal';

interface MeuPerfilProps {
  onVoltar: () => void;
  onAtualizarPerfil: (email: string, senha: string, nomeCompleto: string) => void;
}

interface FormularioPerfil {
  email: string;
  nomeCompleto: string;
  novaSenha: string;
  confirmarSenha: string;
}

export const MeuPerfil: React.FC<MeuPerfilProps> = ({
  onVoltar,
  onAtualizarPerfil
}) => {
  const { usuario } = useAuth();
  
  const [formulario, setFormulario] = useState<FormularioPerfil>({
    email: usuario?.email || '',
    nomeCompleto: usuario?.nomeCompleto || '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const { modalState, showAlert, closeModal } = useModal();

  const handleInputChange = (campo: keyof FormularioPerfil, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulario.email.trim() || !formulario.nomeCompleto.trim()) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha o email e nome completo.', 'error');
      return;
    }

    // Se está alterando a senha
    if (formulario.novaSenha.trim()) {
      if (formulario.novaSenha !== formulario.confirmarSenha) {
        showAlert('Senhas Diferentes', 'A nova senha e a confirmação devem ser iguais.', 'error');
        return;
      }

      if (formulario.novaSenha.length < 6) {
        showAlert('Senha Muito Curta', 'A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
      }

      // Atualizar usuário e senha
      onAtualizarPerfil(formulario.email.trim(), formulario.novaSenha, formulario.nomeCompleto.trim());
    } else {
      // Atualizar apenas email e nome (manter senha atual)
      onAtualizarPerfil(formulario.email.trim(), usuario?.senha || '', formulario.nomeCompleto.trim());
    }

    showAlert('Perfil Atualizado', 'Suas informações foram atualizadas com sucesso!', 'success');
    
    // Limpar campos de senha
    setFormulario(prev => ({
      ...prev,
      novaSenha: '',
      confirmarSenha: ''
    }));
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
          >
            <ArrowLeft size={18} />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <Settings size={24} sm:size={28} className="text-red-500" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Meu Perfil</h1>
          </div>
        </div>

        {/* Formulário de Perfil */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <User size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-white">
              Configurações da Conta
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Atuais */}
            <div className="bg-gray-750 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Informações Atuais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Cargo:</span>
                  <span className="text-white font-semibold ml-2 capitalize">
                    {usuario?.cargo}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">ID do Usuário:</span>
                  <span className="text-white font-semibold ml-2">
                    {usuario?.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Digite seu email"
                  required
                />
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este será seu email para fazer login
              </p>
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formulario.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Digite seu nome completo"
                  required
                />
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Alterar Senha (Opcional)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Deixe em branco se não quiser alterar a senha atual
              </p>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formulario.novaSenha}
                  onChange={(e) => handleInputChange('novaSenha', e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  minLength={6}
                />
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formulario.confirmarSenha}
                  onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Digite a nova senha novamente"
                  disabled={!formulario.novaSenha.trim()}
                />
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="button"
                onClick={onVoltar}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
              >
                <Save size={16} />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

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