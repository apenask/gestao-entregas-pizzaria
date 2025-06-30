// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContextType } from '../types';

// Importar o AuthContext do arquivo de contexto
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};