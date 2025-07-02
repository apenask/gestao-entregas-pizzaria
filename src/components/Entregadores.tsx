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

  const [formularioNovo, setFormularioNovo] = useState<FormularioEntregador>({ nome: '', email: '' });
  const [formularioEdicao, setFormularioEdicao] = useState<FormularioEntregador>({ nome: '', email: '' });

  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const resetFormularioNovo = () => setFormularioNovo({ nome: '', email: '' });
  const resetFormularioEdicao = () => setFormularioEdicao({ nome: '', email: '' });

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
    setFormularioEdicao({ nome: entregador.nome, email: entregador.email });
    setMostrarModalEdicao(true);
  };

  const handleFecharModalEdicao = () => {
    setMostrarModalEdicao(false);
    setEntregadorEditando(null);
    resetFormularioEdicao(); // Correção aqui
  };

  const handleSubmitNovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioNovo.nome.trim() || !formularioNovo.email.trim()) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos.', 'error');
      return;
    }
    onAdicionarEntregador(formularioNovo.nome.trim(), formularioNovo.email.trim().toLowerCase());
    handleFecharModalNovo();
  };

  const handleSubmitEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioEdicao.nome.trim() || !formularioEdicao.email.trim() || !entregadorEditando) return;
    onEditarEntregador(entregadorEditando.id, formularioEdicao.nome.trim(), formularioEdicao.email.trim().toLowerCase());
    handleFecharModalEdicao();
  };

  const handleRemoverComConfirmacao = (entregador: Entregador) => {
    const message = `Tem certeza que deseja remover o entregador "${entregador.nome}"?`;
    showConfirm('Confirmar Remoção', message, () => onRemoverEntregador(entregador.id), { isDestructive: true });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Users size={28} className="text-red-500" /> Gerenciar Entregadores</h1>
          <button onClick={handleAbrirModalNovo} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
            <UserPlus size={20} /> Adicionar Novo
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Entregadores Cadastrados ({entregadores.length})</h3>
          </div>
          {entregadores.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {entregadores.map((entregador) => (
                <div key={entregador.id} className="p-4 hover:bg-gray-750 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2"><User size={16} />{entregador.nome}</h4>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1"><Mail size={16} />{entregador.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAbrirModalEdicao(entregador)} className="bg-blue-600 p-2 rounded-md"><Edit2 size={16} /></button>
                    <button onClick={() => handleRemoverComConfirmacao(entregador)} className="bg-red-600 p-2 rounded-md"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="p-4 text-gray-400">Nenhum entregador cadastrado.</p>}
        </div>
      </div>

      {mostrarModalNovo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Adicionar Entregador</h2>
              <button onClick={handleFecharModalNovo}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitNovo} className="space-y-4">
              <input type="text" value={formularioNovo.nome} onChange={(e) => setFormularioNovo({ ...formularioNovo, nome: e.target.value })} placeholder="Nome" className="w-full p-2 bg-gray-700 rounded-md" required />
              <input type="email" value={formularioNovo.email} onChange={(e) => setFormularioNovo({ ...formularioNovo, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-gray-700 rounded-md" required />
              <div className="flex gap-2">
                <button type="button" onClick={handleFecharModalNovo} className="flex-1 bg-gray-600 py-2 rounded-md">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded-md flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEdicao && entregadorEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Entregador</h2>
              <button onClick={handleFecharModalEdicao}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitEdicao} className="space-y-4">
              <input type="text" value={formularioEdicao.nome} onChange={(e) => setFormularioEdicao({ ...formularioEdicao, nome: e.target.value })} placeholder="Nome" className="w-full p-2 bg-gray-700 rounded-md" required />
              <input type="email" value={formularioEdicao.email} onChange={(e) => setFormularioEdicao({ ...formularioEdicao, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-gray-700 rounded-md" required />
              <div className="flex gap-2">
                <button type="button" onClick={handleFecharModalEdicao} className="flex-1 bg-gray-600 py-2 rounded-md">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded-md flex items-center justify-center gap-2"><Save size={16} /> Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={closeModal} />
    </>
  );
};