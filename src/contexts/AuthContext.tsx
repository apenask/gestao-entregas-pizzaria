import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Função para simular hash de senha (em produção, usar bcrypt no backend)
const hashSenha = (senha: string): string => {
  // Simulação simples de hash - em produção usar bcrypt
  return btoa(senha + 'salt_secreto');
};

// Função para verificar senha
const verificarSenha = (senha: string, hash: string): boolean => {
  return hashSenha(senha) === hash;
};

// Função para gerar token de recuperação
const gerarToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Carregar usuário do localStorage
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('pizzaria-usuario-logado');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
  }, []);

  // Inicializar dados padrão se não existirem
  useEffect(() => {
    const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
    const entregadoresSalvos = localStorage.getItem('pizzaria-entregadores');
    
    if (!usuariosSalvos) {
      // Criar usuários padrão
      const usuariosPadrao: Usuario[] = [
        {
          id: 1,
          email: 'gerente@bordadefogo.com',
          senha: hashSenha('admin123'),
          nomeCompleto: 'Administrador do Sistema',
          cargo: 'gerente',
          emailVerificado: true
        }
      ];
      localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuariosPadrao));
    }

    if (!entregadoresSalvos) {
      // Criar entregadores padrão
      const entregadoresPadrao = [
        { id: 1, nome: 'João Silva', email: 'joao@bordadefogo.com' },
        { id: 2, nome: 'Maria Santos', email: 'maria@bordadefogo.com' },
        { id: 3, nome: 'Pedro Costa', email: 'pedro@bordadefogo.com' }
      ];
      localStorage.setItem('pizzaria-entregadores', JSON.stringify(entregadoresPadrao));
    }
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
    
    if (!usuariosSalvos) return false;
    
    const usuarios: Usuario[] = JSON.parse(usuariosSalvos);
    
    // Buscar usuário por email
    const usuarioEncontrado = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (usuarioEncontrado && verificarSenha(senha, usuarioEncontrado.senha)) {
      setUsuario(usuarioEncontrado);
      localStorage.setItem('pizzaria-usuario-logado', JSON.stringify(usuarioEncontrado));
      return true;
    }

    return false;
  };

  const criarConta = async (
    email: string, 
    senha: string, 
    nomeCompleto: string, 
    cargo: 'gerente' | 'entregador'
  ): Promise<{ sucesso: boolean; mensagem: string }> => {
    const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
    const usuarios: Usuario[] = usuariosSalvos ? JSON.parse(usuariosSalvos) : [];
    
    // Verificar se email já existe
    const emailExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExiste) {
      return { sucesso: false, mensagem: 'Este email já está cadastrado no sistema.' };
    }

    // Se for entregador, verificar se o email está na lista de entregadores autorizados
    if (cargo === 'entregador') {
      const entregadoresSalvos = localStorage.getItem('pizzaria-entregadores');
      if (entregadoresSalvos) {
        const entregadores = JSON.parse(entregadoresSalvos);
        const entregadorAutorizado = entregadores.find((e: any) => e.email.toLowerCase() === email.toLowerCase());
        
        if (!entregadorAutorizado) {
          return { 
            sucesso: false, 
            mensagem: 'Este email não está autorizado para criar conta de entregador. Entre em contato com o gerente.' 
          };
        }

        // Verificar se já existe conta para este entregador
        const contaExistente = usuarios.find(u => u.entregadorId === entregadorAutorizado.id);
        if (contaExistente) {
          return { 
            sucesso: false, 
            mensagem: 'Já existe uma conta criada para este entregador.' 
          };
        }

        // Criar conta do entregador
        const novoUsuario: Usuario = {
          id: Math.max(...usuarios.map(u => u.id), 0) + 1,
          email: email.toLowerCase(),
          senha: hashSenha(senha),
          nomeCompleto,
          cargo: 'entregador',
          entregadorId: entregadorAutorizado.id,
          emailVerificado: true // Assumir verificado para simplificar
        };

        usuarios.push(novoUsuario);
        localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuarios));

        return { sucesso: true, mensagem: 'Conta de entregador criada com sucesso!' };
      }
    } else {
      // Criar conta de gerente (apenas para demonstração - em produção seria mais restritivo)
      const novoUsuario: Usuario = {
        id: Math.max(...usuarios.map(u => u.id), 0) + 1,
        email: email.toLowerCase(),
        senha: hashSenha(senha),
        nomeCompleto,
        cargo: 'gerente',
        emailVerificado: true
      };

      usuarios.push(novoUsuario);
      localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuarios));

      return { sucesso: true, mensagem: 'Conta de gerente criada com sucesso!' };
    }

    return { sucesso: false, mensagem: 'Erro ao criar conta.' };
  };

  const recuperarSenha = async (email: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
    
    if (!usuariosSalvos) {
      return { sucesso: false, mensagem: 'Email não encontrado no sistema.' };
    }
    
    const usuarios: Usuario[] = JSON.parse(usuariosSalvos);
    const usuarioIndex = usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (usuarioIndex === -1) {
      return { sucesso: false, mensagem: 'Email não encontrado no sistema.' };
    }

    // Gerar token de recuperação
    const token = gerarToken();
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 1); // Token válido por 1 hora

    usuarios[usuarioIndex].tokenRecuperacao = token;
    usuarios[usuarioIndex].tokenExpiracao = expiracao;

    localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuarios));

    // Simular envio de email (em produção, enviar email real)
    console.log(`Email de recuperação enviado para ${email}`);
    console.log(`Link de recuperação: ${window.location.origin}/redefinir-senha?token=${token}`);

    // Salvar token no localStorage para simulação
    localStorage.setItem('ultimo-token-recuperacao', token);

    return { 
      sucesso: true, 
      mensagem: 'Email de recuperação enviado! Verifique sua caixa de entrada. (Para demonstração, o link aparecerá no console do navegador)' 
    };
  };

  const redefinirSenha = async (token: string, novaSenha: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    const usuariosSalvos = localStorage.getItem('pizzaria-usuarios');
    
    if (!usuariosSalvos) {
      return { sucesso: false, mensagem: 'Token inválido.' };
    }
    
    const usuarios: Usuario[] = JSON.parse(usuariosSalvos);
    const usuarioIndex = usuarios.findIndex(u => 
      u.tokenRecuperacao === token && 
      u.tokenExpiracao && 
      new Date(u.tokenExpiracao) > new Date()
    );
    
    if (usuarioIndex === -1) {
      return { sucesso: false, mensagem: 'Token inválido ou expirado.' };
    }

    // Atualizar senha
    usuarios[usuarioIndex].senha = hashSenha(novaSenha);
    usuarios[usuarioIndex].tokenRecuperacao = undefined;
    usuarios[usuarioIndex].tokenExpiracao = undefined;

    localStorage.setItem('pizzaria-usuarios', JSON.stringify(usuarios));

    return { sucesso: true, mensagem: 'Senha redefinida com sucesso!' };
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};