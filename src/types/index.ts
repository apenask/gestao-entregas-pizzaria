export interface Entregador {
  id: number;
  nome: string;
  email: string;
  // Adicione os campos de localização
  latitude?: number;
  longitude?: number;
  ultimo_update?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  ruaNumero: string;
  bairro: string;
  telefone?: string;
}

export interface Usuario {
  id: number;
  email: string;
  senha: string;
  nomeCompleto: string;
  cargo: 'gerente' | 'entregador';
  entregadorId?: number;
  emailVerificado?: boolean;
  tokenRecuperacao?: string;
  tokenExpiracao?: Date;
  status_aprovacao?: 'pendente' | 'aprovado' | 'recusado';
}

export interface Entrega {
  id: number;
  dataHora: Date;
  numeroPedido: string;
  clienteId: number;
  cliente?: Cliente;
  entregadorId: number;
  entregador?: Entregador; // Alterado para o tipo Entregador para acesso fácil
  formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';
  valorTotalPedido: number;
  valorCorrida: number;
  status: 'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado';
  dataHoraSaida?: Date;
  dataHoraEntrega?: Date;
  duracaoEntrega?: number;
}

export type TelaAtiva = 'dashboard' | 'relatorios' | 'entregadores' | 'clientes' | 'perfil' | 'aprovacoes';

export interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  criarConta: (email: string, senha: string, nomeCompleto: string, cargo: 'gerente' | 'entregador') => Promise<{ sucesso: boolean; mensagem: string }>;
  recuperarSenha: (email: string) => Promise<{ sucesso: boolean; mensagem: string }>;
  redefinirSenha: (token: string, novaSenha: string) => Promise<{ sucesso: boolean; mensagem: string }>;
  atualizarUsuario: (id: number, dados: Partial<Usuario>) => Promise<void>;
  isAuthenticated: boolean;
  isGerente: boolean;
  isEntregador: boolean;
}
