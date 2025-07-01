import React, { useState } from 'react';
// ÍCONES NÃO UTILIZADOS FORAM REMOVIDOS DAQUI
import { useAuth } from '../hooks/useAuth';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import { Usuario } from '../types';

interface MeuPerfilProps {
  onVoltar: () => void;
  onAtualizarPerfil: (dados: Partial<Usuario>) => void;
}

export const MeuPerfil: React.FC<MeuPerfilProps> = ({
  onVoltar,
  onAtualizarPerfil,
}) => {
  const { usuario } = useAuth();

  const [formulario, setFormulario] = useState({
    email: usuario?.email || '',
    nomeCompleto: usuario?.nomeCompleto || '',
    novaSenha: '',
    confirmarSenha: '',
  });

  const { modalState, showAlert, closeModal } = useModal();

  const handleInputChange = (
    campo: keyof typeof formulario,
    valor: string
  ) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.email.trim() || !formulario.nomeCompleto.trim()) {
      showAlert(
        'Campos Obrigatórios',
        'Por favor, preencha o email e nome completo.',
        'error'
      );
      return;
    }

    const dadosParaAtualizar: Partial<Usuario> = {
      email: formulario.email.trim(),
      nomeCompleto: formulario.nomeCompleto.trim(),
    };

    if (formulario.novaSenha.trim()) {
      if (formulario.novaSenha !== formulario.confirmarSenha) {
        showAlert(
          'Senhas Diferentes',
          'A nova senha e a confirmação devem ser iguais.',
          'error'
        );
        return;
      }
      if (formulario.novaSenha.length < 6) {
        showAlert(
          'Senha Muito Curta',
          'A senha deve ter pelo menos 6 caracteres.',
          'error'
        );
        return;
      }
      dadosParaAtualizar.senha = formulario.novaSenha;
    }

    onAtualizarPerfil(dadosParaAtualizar);

    showAlert(
      'Perfil Atualizado',
      'Suas informações foram atualizadas com sucesso!',
      'success'
    );

    setFormulario((prev) => ({
      ...prev,
      novaSenha: '',
      confirmarSenha: '',
    }));
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="text-gray-400 hover:text-white">
            &larr; Voltar ao Dashboard
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white">Meu Perfil</h1>
        
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            Configurações da Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                value={formulario.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formulario.nomeCompleto}
                onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                required
              />
            </div>
            
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Alterar Senha (Opcional)
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
              <input
                type="password"
                value={formulario.novaSenha}
                onChange={(e) => handleInputChange('novaSenha', e.target.value)}
                className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={formulario.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                disabled={!formulario.novaSenha.trim()}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button type="button" onClick={onVoltar} className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium">
                Cancelar
              </button>
              <button type="submit" className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal
        onClose={closeModal}
        {...modalState}
      />
    </>
  );
};