import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, UserPlus, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type TelaAuth = 'login' | 'criar-conta' | 'recuperar-senha' | 'redefinir-senha';

export const Login: React.FC = () => {
  const [telaAtiva, setTelaAtiva] = useState<TelaAuth>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [token, setToken] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const { login, criarConta, recuperarSenha, redefinirSenha } = useAuth();

  // Verificar se há token na URL para redefinição de senha
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');
    if (tokenUrl) {
      setToken(tokenUrl);
      setTelaAtiva('redefinir-senha');
    }
  }, []);

  const resetarFormulario = () => {
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    setNomeCompleto('');
    setToken('');
    setErro('');
    setSucesso('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, preencha todos os campos.');
      setCarregando(false);
      return;
    }

    const sucesso = await login(email.trim(), senha);
    
    if (!sucesso) {
      setErro('Email ou senha incorretos.');
    }
    
    setCarregando(false);
  };

  const handleCriarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (!email.trim() || !senha.trim() || !nomeCompleto.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      setCarregando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      setCarregando(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    // Sempre criar conta como entregador
    const resultado = await criarConta(email.trim(), senha, nomeCompleto.trim(), 'entregador');
    
    if (resultado.sucesso) {
      setSucesso(resultado.mensagem);
      setTimeout(() => {
        resetarFormulario();
        setTelaAtiva('login');
      }, 2000);
    } else {
      setErro(resultado.mensagem);
    }
    
    setCarregando(false);
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (!email.trim()) {
      setErro('Por favor, digite seu email.');
      setCarregando(false);
      return;
    }

    const resultado = await recuperarSenha(email.trim());
    
    if (resultado.sucesso) {
      setSucesso(resultado.mensagem);
    } else {
      setErro(resultado.mensagem);
    }
    
    setCarregando(false);
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (!senha.trim() || !confirmarSenha.trim()) {
      setErro('Por favor, preencha todos os campos.');
      setCarregando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      setCarregando(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    const resultado = await redefinirSenha(token, senha);
    
    if (resultado.sucesso) {
      setSucesso(resultado.mensagem);
      setTimeout(() => {
        resetarFormulario();
        setTelaAtiva('login');
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    } else {
      setErro(resultado.mensagem);
    }
    
    setCarregando(false);
  };

  const renderLogin = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <img 
          src="/borda de fogo - logo - nome preto e vermelho.png" 
          alt="Pizzaria Borda de Fogo" 
          className="h-12 sm:h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Sistema de Entregas
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Faça login para acessar o sistema
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite seu email"
                disabled={carregando}
              />
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite sua senha"
                disabled={carregando}
              />
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {erro && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar no Sistema
              </>
            )}
          </button>

          <div className="space-y-2 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={() => {
                resetarFormulario();
                setTelaAtiva('recuperar-senha');
              }}
              className="w-full text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
            >
              Esqueceu sua senha?
            </button>
            <button
              type="button"
              onClick={() => {
                resetarFormulario();
                setTelaAtiva('criar-conta');
              }}
              className="w-full text-green-400 hover:text-green-300 text-sm transition-colors duration-200"
            >
              Não tem uma conta? Crie uma agora
            </button>
          </div>
        </form>
      </div>
    </>
  );

  const renderCriarConta = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <img 
          src="/borda de fogo - logo - nome preto e vermelho.png" 
          alt="Pizzaria Borda de Fogo" 
          className="h-12 sm:h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Criar Conta de Entregador
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Preencha os dados para criar sua conta de entregador
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 shadow-2xl">
        {/* Aviso sobre autorização */}
        <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-300">
            <strong>Importante:</strong> Seu email deve estar cadastrado pelo gerente para criar uma conta de entregador.
          </p>
        </div>

        <form onSubmit={handleCriarConta} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Digite seu nome completo"
              disabled={carregando}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite seu email"
                disabled={carregando}
                required
              />
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-xs text-blue-300 mt-1">
              Use o email que foi cadastrado pelo gerente da pizzaria.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha *
            </label>
            <div className="relative">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite sua senha (mínimo 6 caracteres)"
                disabled={carregando}
                required
                minLength={6}
              />
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite a senha novamente"
                disabled={carregando}
                required
              />
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {erro && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-md p-3 flex items-center gap-2">
              <UserPlus size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">{sucesso}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Criando Conta...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Criar Conta de Entregador
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              resetarFormulario();
              setTelaAtiva('login');
            }}
            className="w-full text-gray-400 hover:text-white text-sm transition-colors duration-200 pt-4 border-t border-gray-600"
          >
            Já tem uma conta? Faça login
          </button>
        </form>
      </div>
    </>
  );

  const renderRecuperarSenha = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <img 
          src="/borda de fogo - logo - nome preto e vermelho.png" 
          alt="Pizzaria Borda de Fogo" 
          className="h-12 sm:h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Recuperar Senha
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Digite seu email para receber o link de recuperação
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 shadow-2xl">
        <form onSubmit={handleRecuperarSenha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite seu email"
                disabled={carregando}
                required
              />
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {erro && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-md p-3 flex items-center gap-2">
              <KeyRound size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">{sucesso}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <KeyRound size={18} />
                Enviar Link de Recuperação
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              resetarFormulario();
              setTelaAtiva('login');
            }}
            className="w-full text-gray-400 hover:text-white text-sm transition-colors duration-200 pt-4 border-t border-gray-600"
          >
            Voltar ao login
          </button>
        </form>
      </div>
    </>
  );

  const renderRedefinirSenha = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <img 
          src="/borda de fogo - logo - nome preto e vermelho.png" 
          alt="Pizzaria Borda de Fogo" 
          className="h-12 sm:h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Redefinir Senha
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Digite sua nova senha
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 shadow-2xl">
        <form onSubmit={handleRedefinirSenha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                disabled={carregando}
                required
                minLength={6}
              />
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite a nova senha novamente"
                disabled={carregando}
                required
              />
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {erro && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-md p-3 flex items-center gap-2">
              <KeyRound size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">{sucesso}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Redefinindo...
              </>
            ) : (
              <>
                <KeyRound size={18} />
                Redefinir Senha
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {telaAtiva === 'login' && renderLogin()}
        {telaAtiva === 'criar-conta' && renderCriarConta()}
        {telaAtiva === 'recuperar-senha' && renderRecuperarSenha()}
        {telaAtiva === 'redefinir-senha' && renderRedefinirSenha()}
      </div>
    </div>
  );
};