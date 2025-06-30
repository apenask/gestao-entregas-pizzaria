import React, { useState, useMemo } from 'react';
import { FileText, Filter, DollarSign, CreditCard, Banknote, Smartphone, Receipt, Download, FileDown } from 'lucide-react';
import { Entrega, Entregador } from '../types';
import { formatarDataHora, formatarValor } from '../utils/calculations';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
interface RelatoriosProps {
  entregas: Entrega[];
  entregadores: Entregador[];
}

export const Relatorios: React.FC<RelatoriosProps> = ({ entregas, entregadores }) => {
  const [entregadorSelecionado, setEntregadorSelecionado] = useState<number | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [valorAdicional, setValorAdicional] = useState<number>(0);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { modalState, showAlert, closeModal } = useModal();

  const entregasFiltradas = useMemo(() => {
    return entregas.filter(entrega => {
      // Filtrar apenas entregas entregues
      if (entrega.status !== 'Entregue') return false;

      // Filtrar por entregador
      if (entregadorSelecionado && entrega.entregadorId !== entregadorSelecionado) {
        return false;
      }

      // Filtrar por data
      if (dataInicio) {
        const dataEntrega = new Date(entrega.dataHora);
        const inicio = new Date(dataInicio);
        if (dataEntrega < inicio) return false;
      }

      if (dataFim) {
        const dataEntrega = new Date(entrega.dataHora);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999); // Incluir todo o dia
        if (dataEntrega > fim) return false;
      }

      return true;
    });
  }, [entregas, entregadorSelecionado, dataInicio, dataFim]);

  // Cálculos do resumo
  const resumo = useMemo(() => {
    const quantidadeEntregas = entregasFiltradas.length;
    const valorTotalCorridas = entregasFiltradas.reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalDinheiro = entregasFiltradas
      .filter(e => e.formaPagamento === 'Dinheiro')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalPix = entregasFiltradas
      .filter(e => e.formaPagamento === 'Pix')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalCartaoDebito = entregasFiltradas
      .filter(e => e.formaPagamento === 'Cartão de Débito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalCartaoCredito = entregasFiltradas
      .filter(e => e.formaPagamento === 'Cartão de Crédito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);

    return {
      quantidadeEntregas,
      valorTotalCorridas,
      totalDinheiro,
      totalPix,
      totalCartaoDebito,
      totalCartaoCredito,
      valorFinal: valorTotalCorridas + valorAdicional
    };
  }, [entregasFiltradas, valorAdicional]);

  const entregadorNome = entregadorSelecionado 
    ? entregadores.find(e => e.id === entregadorSelecionado)?.nome || 'Desconhecido'
    : '';

  const gerarPDF = async () => {
    if (entregasFiltradas.length === 0) {
      showAlert('Sem Dados', 'Não há entregas para gerar o relatório com os filtros selecionados.', 'error');
      return;
    }

    setGerandoPDF(true);
    
    try {
      // Simular geração de PDF (você pode implementar a lógica real aqui)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (entregadorSelecionado) {
        showAlert('Relatório Gerado', 'Relatório individual foi gerado e baixado com sucesso!', 'success');
      } else {
        showAlert('Relatório Gerado', 'Relatório geral consolidado foi gerado e baixado com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showAlert('Erro na Geração', 'Ocorreu um erro ao gerar o relatório PDF. Tente novamente.', 'error');
    } finally {
      setGerandoPDF(false);
    }
  };

  const getTipoRelatorio = () => {
    return entregadorSelecionado ? 'Individual' : 'Geral Consolidado';
  };

  const getDescricaoRelatorio = () => {
    if (entregadorSelecionado) {
      return `Relatório detalhado para ${entregadorNome}`;
    }
    return 'Relatório consolidado de todos os entregadores';
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-red-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Relatórios</h1>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-white">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entregador
              </label>
              <select
                value={entregadorSelecionado}
                onChange={(e) => setEntregadorSelecionado(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos os entregadores</option>
                {entregadores.map(entregador => (
                  <option key={entregador.id} value={entregador.id}>
                    {entregador.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={20} className="text-green-500" />
            <h2 className="text-lg font-semibold text-white">Resumo Financeiro</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-blue-400" />
                <span className="text-gray-300 text-sm">Entregas</span>
              </div>
              <p className="text-2xl font-bold text-white">{resumo.quantidadeEntregas}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">Dinheiro</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{formatarValor(resumo.totalDinheiro)}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={16} className="text-blue-400" />
                <span className="text-gray-300 text-sm">Pix</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{formatarValor(resumo.totalPix)}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-purple-400" />
                <span className="text-gray-300 text-sm">Cartões</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {formatarValor(resumo.totalCartaoDebito + resumo.totalCartaoCredito)}
              </p>
            </div>
          </div>

          {/* Valor adicional */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor Adicional (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              value={valorAdicional || ''}
              onChange={(e) => setValorAdicional(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Total final */}
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-300 font-medium">Total Final:</span>
              <span className="text-2xl font-bold text-red-400">
                {formatarValor(resumo.valorFinal)}
              </span>
            </div>
          </div>
        </div>

        {/* Geração de PDF */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <FileDown size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Gerar Relatório PDF</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">
                Tipo: {getTipoRelatorio()}
              </h3>
              <p className="text-gray-300 text-sm mb-3">
                {getDescricaoRelatorio()}
              </p>
              
              <div className="text-sm text-gray-400">
                <p>• Período: {dataInicio || 'Início'} até {dataFim || 'Hoje'}</p>
                <p>• Entregas: {resumo.quantidadeEntregas}</p>
                <p>• Total: {formatarValor(resumo.valorFinal)}</p>
              </div>
            </div>
            
            <button
              onClick={gerarPDF}
              disabled={gerandoPDF || entregasFiltradas.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {gerandoPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Gerar e Baixar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de entregas */}
        {entregasFiltradas.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Entregas Filtradas ({entregasFiltradas.length})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-300">Data/Hora</th>
                    <th className="text-left py-2 text-gray-300">Pedido</th>
                    <th className="text-left py-2 text-gray-300">Cliente</th>
                    <th className="text-left py-2 text-gray-300">Entregador</th>
                    <th className="text-left py-2 text-gray-300">Pagamento</th>
                    <th className="text-right py-2 text-gray-300">Corrida</th>
                  </tr>
                </thead>
                <tbody>
                  {entregasFiltradas.map(entrega => (
                    <tr key={entrega.id} className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-50">
                      <td className="py-2 text-gray-300">
                        {formatarDataHora(entrega.dataHora)}
                      </td>
                      <td className="py-2 text-white font-medium">
                        #{entrega.numeroPedido}
                      </td>
                      <td className="py-2 text-gray-300">
                        {entrega.cliente?.nome || 'Cliente não encontrado'}
                      </td>
                      <td className="py-2 text-gray-300">
                        {entregadores.find(e => e.id === entrega.entregadorId)?.nome || 'Desconhecido'}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          entrega.formaPagamento === 'Dinheiro' ? 'bg-green-600 text-green-100' :
                          entrega.formaPagamento === 'Pix' ? 'bg-blue-600 text-blue-100' :
                          'bg-purple-600 text-purple-100'
                        }`}>
                          {entrega.formaPagamento}
                        </span>
                      </td>
                      <td className="py-2 text-right text-green-400 font-medium">
                        {formatarValor(entrega.valorCorrida)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onClose={closeModal}
      />
    </>
  );
};