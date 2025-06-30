import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, AuthContextType } from '../types';
import { usuarioService } from '../services/database';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ... todo o código do AuthProvider permanece igual
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Funções utilitárias
  const hashSenha = (senha: string): string => {
    return btoa(senha + 'salt_secreto');
  };

  const verificarSenha = (senha: string, hash: string): boolean => {
    return hashSenha(senha) === hash;
  };

  const gerarToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Carregar usuário do localStorage (para manter sessão)
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('pizzaria-usuario-logado');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const usuarioEncontrado = await usuarioService.buscarPorEmail(email);
      
      if (!usuarioEncontrado) {
        return false;
      }

      if (!verificarSenha(senha, usuarioEncontrado.senha)) {
        return false;
      }

      setUsuario(usuarioEncontrado);
      localStorage.setItem('pizzaria-usuario-logado', JSON.stringify(usuarioEncontrado));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const criarConta = async (
    email: string, 
    senha: string, 
    nomeCompleto: string, 
    cargo: 'gerente' | 'entregador'
  ): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const usuarioExistente = await usuarioService.buscarPorEmail(email);
      
      if (usuarioExistente) {
        return { sucesso: false, mensagem: 'Este email já está em uso.' };
      }

      await usuarioService.criar({
        email: email.toLowerCase(),
        senha: hashSenha(senha),
        nomeCompleto,
        cargo,
        emailVerificado: true
      });

      return { sucesso: true, mensagem: 'Conta criada com sucesso!' };
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      return { sucesso: false, mensagem: 'Erro ao criar conta.' };
    }
  };

  const recuperarSenha = async (email: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const usuarioEncontrado = await usuarioService.buscarPorEmail(email);
      
      if (!usuarioEncontrado) {
        return { sucesso: false, mensagem: 'Email não encontrado no sistema.' };
      }

      const token = gerarToken();
      const expiracao = new Date();
      expiracao.setHours(expiracao.getHours() + 1);

      await usuarioService.atualizar(usuarioEncontrado.id, {
        tokenRecuperacao: token,
        tokenExpiracao: expiracao
      });

      console.log(`Email de recuperação enviado para ${email}`);
      console.log(`Link de recuperação: ${window.location.origin}/redefinir-senha?token=${token}`);

      return { 
        sucesso: true, 
        mensagem: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
      };
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      return { sucesso: false, mensagem: 'Erro ao processar solicitação.' };
    }
  };

  const redefinirSenha = async (tokenRecebido: string, novaSenhaRecebida: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      console.log('Redefinindo senha com token:', tokenRecebido, 'Nova senha:', novaSenhaRecebida);
      
      return { sucesso: false, mensagem: 'Funcionalidade de redefinição ainda não implementada completamente.' };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { sucesso: false, mensagem: 'Erro ao processar solicitação.' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('pizzaria-usuario-logado');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const value: AuthContextType = {
    usuario,
    login,
    logout,
    criarConta,
    recuperarSenha,
    redefinirSenha,
    isAuthenticated: !!usuario,
    isGerente: usuario?.cargo === 'gerente',
    isEntregador: usuario?.cargo === 'entregador'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};