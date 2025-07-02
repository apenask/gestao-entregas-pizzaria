import React from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';
import { Usuario } from '../types';

interface AprovacoesProps {
  usuariosPendentes: Usuario[];
  onAprovar: (id: number) => void;
  onRecusar: (id: number) => void;
}

export const Aprovacoes: React.FC<AprovacoesProps> = ({
  usuariosPendentes,
  onAprovar,
  onRecusar,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck size={28} className="text-red-500" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Aprovar Cadastros</h1>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Solicitações Pendentes ({usuariosPendentes.length})
          </h3>
        </div>
        
        {usuariosPendentes.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">Nenhuma solicitação pendente no momento.</p>
        ) : (
          <div className="divide-y divide-gray-700">
            {usuariosPendentes.map((usuario) => (
              <div key={usuario.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{usuario.nomeCompleto}</p>
                  <p className="text-sm text-gray-400">{usuario.email}</p>
                  <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Aguardando aprovação
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => onRecusar(usuario.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <UserX size={18} />
                    Recusar
                  </button>
                  <button 
                    onClick={() => onAprovar(usuario.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <UserCheck size={18} />
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};