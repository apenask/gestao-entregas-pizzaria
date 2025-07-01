import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Usuario, AuthContextType } from '../types';
import { usuarioService, entregadorService } from '../services/database';
import { hashSenha, verificarSenha, gerarToken } from '../utils/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

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
      
      if (!usuarioEncontrado || !verificarSenha(senha, usuarioEncontrado.senha)) {
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

      if (cargo === 'entregador') {
        const entregadorAutorizado = await entregadorService.buscarPorEmail(email.toLowerCase());
        if (!entregadorAutorizado) {
          return { sucesso: false, mensagem: 'Email não autorizado. Contate o gerente.' };
        }
        await usuarioService.criar({ email: email.toLowerCase(), senha: hashSenha(senha), nomeCompleto, cargo, entregadorId: entregadorAutorizado.id, emailVerificado: true });
        return { sucesso: true, mensagem: 'Conta de entregador criada com sucesso!' };
      } else {
        await usuarioService.criar({ email: email.toLowerCase(), senha: hashSenha(senha), nomeCompleto, cargo, emailVerificado: true });
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
      expiracao.setHours(expiracao.getHours() + 1);

      await usuarioService.atualizar(usuarioEncontrado.id, {
        tokenRecuperacao: token,
        tokenExpiracao: expiracao
      });

      const { error } = await supabase.functions.invoke('send-reset-email', {
        body: { email, token },
      });

      if (error) {
        throw error;
      }
      
      return { 
        sucesso: true, 
        mensagem: 'Instruções de recuperação enviadas para seu email.' 
      };
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      return { sucesso: false, mensagem: 'Erro ao processar a recuperação de senha.' };
    }
  };

  const redefinirSenha = async (token: string, novaSenha: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const usuario = await usuarioService.buscarPorToken(token);
      
      if (!usuario || (usuario.tokenExpiracao && new Date() > new Date(usuario.tokenExpiracao))) {
        return { sucesso: false, mensagem: 'Token inválido ou expirado.' };
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

  const atualizarUsuario = async (id: number, dados: Partial<Usuario>) => {
    try {
      const dadosParaAtualizar = { ...dados };
      if (dados.senha && dados.senha.trim() !== '') {
        dadosParaAtualizar.senha = hashSenha(dados.senha);
      } else {
        delete dadosParaAtualizar.senha;
      }
      const usuarioAtualizado = await usuarioService.atualizar(id, dadosParaAtualizar);
      setUsuario(usuarioAtualizado);
      localStorage.setItem('pizzaria-usuario-logado', JSON.stringify(usuarioAtualizado));
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
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
    atualizarUsuario,
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