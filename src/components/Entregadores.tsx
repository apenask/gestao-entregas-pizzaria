import React, { useState } from 'react';
// Imports for unused icons have been removed.
import { Users, Edit2, Trash2, UserPlus } from 'lucide-react'; 
import { Entregador } from '../types';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';

interface EntregadoresProps {
  entregadores: Entregador[];
  onAdicionarEntregador: (nome: string, email: string) => void;
  onEditarEntregador: (id: number, nome: string, email: string, senha?: string) => void;
  onRemoverEntregador: (id: number) => void;
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
  
  const [formularioNovo, setFormularioNovo] = useState({ nome: '', email: '' });
  const [formularioEdicao, setFormularioEdicao] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' });

  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const handleAbrirModalNovo = () => setMostrarModalNovo(true);
  const handleFecharModalNovo = () => {
    setMostrarModalNovo(false);
    setFormularioNovo({ nome: '', email: '' });
  };
  
  const handleAbrirModalEdicao = (entregador: Entregador) => {
    setEntregadorEditando(entregador);
    setFormularioEdicao({ nome: entregador.nome, email: entregador.email, senha: '', confirmarSenha: '' });
    setMostrarModalEdicao(true);
  };
  
  const handleFecharModalEdicao = () => {
    setMostrarModalEdicao(false);
    setEntregadorEditando(null);
    setFormularioEdicao({ nome: '', email: '', senha: '', confirmarSenha: '' });
  };

  const handleSubmitNovo = (e: React.FormEvent) => {
    e.preventDefault();
    onAdicionarEntregador(formularioNovo.nome, formularioNovo.email);
    handleFecharModalNovo();
  };
  
  const handleSubmitEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entregadorEditando) return;
    if (formularioEdicao.senha && formularioEdicao.senha !== formularioEdicao.confirmarSenha) {
      showAlert('Erro', 'As senhas não coincidem.', 'error');
      return;
    }
    onEditarEntregador(entregadorEditando.id, formularioEdicao.nome, formularioEdicao.email, formularioEdicao.senha || undefined);
    handleFecharModalEdicao();
  };

  const handleRemoverComConfirmacao = (entregador: Entregador) => {
    showConfirm('Confirmar Remoção', `Tem certeza que deseja remover o entregador "${entregador.nome}"?`, () => onRemoverEntregador(entregador.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users size={28} /> Gerenciar Entregadores</h1>
        <button onClick={handleAbrirModalNovo} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"><UserPlus size={20} /> Adicionar Novo</button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="divide-y divide-gray-700">
          {entregadores.map((entregador) => (
            <div key={entregador.id} className="p-4 flex justify-between items-center hover:bg-gray-750">
              <div>
                <p className="font-bold text-white">{entregador.nome}</p>
                <p className="text-sm text-gray-400">{entregador.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAbrirModalEdicao(entregador)} className="p-2 bg-blue-600 rounded hover:bg-blue-700"><Edit2 size={16} /></button>
                <button onClick={() => handleRemoverComConfirmacao(entregador)} className="p-2 bg-red-600 rounded hover:bg-red-700"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {mostrarModalNovo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Novo Entregador</h2>
            <form onSubmit={handleSubmitNovo} className="space-y-4">
              <div>
                  <label>Nome Completo *</label>
                  <input type="text" value={formularioNovo.nome} onChange={(e) => setFormularioNovo({...formularioNovo, nome: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" required/>
              </div>
              <div>
                  <label>Email *</label>
                  <input type="email" value={formularioNovo.email} onChange={(e) => setFormularioNovo({...formularioNovo, email: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" required/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleFecharModalNovo} className="bg-gray-600 py-2 px-4 rounded">Cancelar</button>
                  <button type="submit" className="bg-red-600 py-2 px-4 rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEdicao && entregadorEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Editar Entregador</h2>
            <form onSubmit={handleSubmitEdicao} className="space-y-4">
              <div>
                  <label>Nome Completo *</label>
                  <input type="text" value={formularioEdicao.nome} onChange={(e) => setFormularioEdicao({...formularioEdicao, nome: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" required/>
              </div>
              <div>
                  <label>Email *</label>
                  <input type="email" value={formularioEdicao.email} onChange={(e) => setFormularioEdicao({...formularioEdicao, email: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" required/>
              </div>
              <div className="border-t border-gray-600 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Alterar Senha (Opcional)</p>
                  <div>
                      <label>Nova Senha</label>
                      <input type="password" value={formularioEdicao.senha} onChange={(e) => setFormularioEdicao({...formularioEdicao, senha: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" placeholder="Deixe em branco para não alterar"/>
                  </div>
                  <div className="mt-4">
                      <label>Confirmar Nova Senha</label>
                      <input type="password" value={formularioEdicao.confirmarSenha} onChange={(e) => setFormularioEdicao({...formularioEdicao, confirmarSenha: e.target.value})} className="w-full mt-1 p-2 bg-gray-700 rounded" disabled={!formularioEdicao.senha}/>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleFecharModalEdicao} className="bg-gray-600 py-2 px-4 rounded">Cancelar</button>
                  <button type="submit" className="bg-red-600 py-2 px-4 rounded">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Modal {...modalState} onClose={closeModal} />
    </div>
  );
};