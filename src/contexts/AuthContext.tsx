import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, AuthContextType } from '../types';
import { usuarioService, entregadorService } from '../services/database';
import { hashSenha, verificarSenha, gerarToken } from '../utils/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

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

  // FUNÇÃO CORRIGIDA - Problema 1 e 2
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

      // NOVO: Verificar se é entregador e se o email está autorizado
      if (cargo === 'entregador') {
        const entregadorAutorizado = await entregadorService.buscarPorEmail(email.toLowerCase());
        
        if (!entregadorAutorizado) {
          return { 
            sucesso: false, 
            mensagem: 'Email não autorizado. Entre em contato com o gerente para cadastrar seu email.' 
          };
        }

        // Criar usuário entregador com vinculação ao entregador
        await usuarioService.criar({
          email: email.toLowerCase(),
          senha: hashSenha(senha),
          nomeCompleto,
          cargo,
          entregadorId: entregadorAutorizado.id, // VINCULAÇÃO CRÍTICA!
          emailVerificado: true
        });

        return { sucesso: true, mensagem: 'Conta de entregador criada com sucesso!' };
      } else {
        // Para gerentes (sem mudanças)
        await usuarioService.criar({
          email: email.toLowerCase(),
          senha: hashSenha(senha),
          nomeCompleto,
          cargo,
          emailVerificado: true
        });

        return { sucesso: true, mensagem: 'Conta criada com sucesso!' };
      }

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
      expiracao.setHours(expiracao.getHours() + 1); // Token válido por 1 hora

      await usuarioService.atualizar(usuarioEncontrado.id, {
        tokenRecuperacao: token,
        tokenExpiracao: expiracao
      });

      // Aqui você implementaria o envio de email real
      console.log('Token de recuperação:', token);
      
      return { 
        sucesso: true, 
        mensagem: 'Instruções de recuperação enviadas para seu email.' 
      };
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      return { sucesso: false, mensagem: 'Erro ao processar recuperação de senha.' };
    }
  };

  const redefinirSenha = async (token: string, novaSenha: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const usuario = await usuarioService.buscarPorToken(token);
      
      if (!usuario) {
        return { sucesso: false, mensagem: 'Token inválido ou expirado.' };
      }

      if (usuario.tokenExpiracao && new Date() > new Date(usuario.tokenExpiracao)) {
        return { sucesso: false, mensagem: 'Token expirado.' };
      }

      await usuarioService.atualizar(usuario.id, {
        senha: hashSenha(novaSenha),
        tokenRecuperacao: undefined,
        tokenExpiracao: undefined
      });

      return { sucesso: true, mensagem: 'Senha redefinida com sucesso!' };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { sucesso: false, mensagem: 'Erro ao redefinir senha.' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('pizzaria-usuario-logado');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};