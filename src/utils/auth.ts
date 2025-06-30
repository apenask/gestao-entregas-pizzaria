// src/utils/auth.ts
export const hashSenha = (senha: string): string => {
  return btoa(senha + 'salt_secreto');
};

export const verificarSenha = (senha: string, hash: string): boolean => {
  return hashSenha(senha) === hash;
};

export const gerarToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};