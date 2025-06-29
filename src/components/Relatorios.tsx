import React, { useState, useMemo } from 'react';
import { FileText, Filter, Calendar, DollarSign, CreditCard, Banknote, Smartphone, Receipt, Plus, Download, FileDown } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { formatarDataHora, formatarValor } from '../utils/calculations';
import { PDFGenerator } from '../utils/pdfGenerator';
import { Modal, useModal } from './Modal';

interface RelatoriosProps {
  entregas: Entrega[];
  entregadores: Entregador[];
  clientes: Cliente[];
}

export const Relatorios: React.FC<RelatoriosProps> = ({ entregas, entregadores, clientes }) => {
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
    
    const totalDebito = entregasFiltradas
      .filter(e => e.formaPagamento === 'Cartão de Débito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalCredito = entregasFiltradas
      .filter(e => e.formaPagamento === 'Cartão de Crédito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);

    // Valor total final incluindo adicional
    const valorTotalFinal = valorTotalCorridas + valorAdicional;

    return {
      quantidadeEntregas,
      valorTotalCorridas,
      valorTotalFinal,
      totalDinheiro,
      totalPix,
      totalDebito,
      totalCredito
    };
  }, [entregasFiltradas, valorAdicional]);

  const entregadorNome = entregadores.find(e => e.id === entregadorSelecionado)?.nome || 'Todos os Entregadores';

  const handleValorAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value === '' ? 0 : Number(e.target.value);
    setValorAdicional(valor);
  };

  const handleGerarPDF = async () => {
    if (entregasFiltradas.length === 0) {
      showAlert('Nenhum Dado Encontrado', 'Não há entregas para gerar o relatório com os filtros selecionados.', 'error');
      return;
    }

    setGerandoPDF(true);

    try {
      const pdfGenerator = new PDFGenerator();
      
      const dadosRelatorio = {
        entregas: entregasFiltradas,
        entregadores,
        entregadorSelecionado: entregadorSelecionado || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        valorAdicional
      };

      if (entregadorSelecionado) {
        // Relatório individual
        await pdfGenerator.gerarRelatorioIndividual(dadosRelatorio);
        showAlert('PDF Gerado!', `Relatório individual de ${entregadorNome} foi gerado e baixado com sucesso!`, 'success');
      } else {
        // Relatório geral
        await pdfGenerator.gerarRelatorioGeral(dadosRelatorio);
        showAlert('PDF Gerado!', 'Relatório geral consolidado foi gerado e baixado com sucesso!', 'success');
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Todos os Entregadores</option>
                {entregadores.map((entregador) => (
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Botão de Geração de PDF */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileDown size={20} className="text-green-500" />
                <h3 className="text-lg font-semibold text-white">Gerar Relatório em PDF</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Tipo:</span> Relatório {getTipoRelatorio()}
                </p>
                <p className="text-sm text-gray-400">
                  {getDescricaoRelatorio()}
                </p>
                <p className="text-xs text-gray-500">
                  {entregasFiltradas.length} entrega{entregasFiltradas.length !== 1 ? 's' : ''} será{entregasFiltradas.length !== 1 ? 'ão' : ''} incluída{entregasFiltradas.length !== 1 ? 's' : ''} no relatório
                </p>
              </div>
            </div>
            
            <button
              onClick={handleGerarPDF}
              disabled={gerandoPDF || entregasFiltradas.length === 0}
              className="w-full lg:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg min-w-[200px]"
            >
              {gerandoPDF ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Gerar Relatório em PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Painel de Resumo com Cards Individuais */}
        {entregasFiltradas.length > 0 && (
          <div className="space-y-6">
            {/* Título do Resumo */}
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Resumo Financeiro - {entregadorNome}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Baseado em {resumo.quantidadeEntregas} entrega{resumo.quantidadeEntregas !== 1 ? 's' : ''} realizada{resumo.quantidadeEntregas !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Quantidade de Entregas */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 bg-opacity-20 rounded-lg">
                    <Receipt size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Quantidade</p>
                    <p className="text-xs text-gray-500">de Entregas</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  {resumo.quantidadeEntregas}
                </p>
              </div>

              {/* Total em Dinheiro */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-600 bg-opacity-20 rounded-lg">
                    <Banknote size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Total em</p>
                    <p className="text-xs text-gray-500">Dinheiro</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-400">
                  {formatarValor(resumo.totalDinheiro)}
                </p>
              </div>

              {/* Total via Pix */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 bg-opacity-20 rounded-lg">
                    <Smartphone size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Total via</p>
                    <p className="text-xs text-gray-500">Pix</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-400">
                  {formatarValor(resumo.totalPix)}
                </p>
              </div>

              {/* Total Cartão de Débito */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-600 bg-opacity-20 rounded-lg">
                    <CreditCard size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Cartão</p>
                    <p className="text-xs text-gray-500">Débito</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-yellow-400">
                  {formatarValor(resumo.totalDebito)}
                </p>
              </div>

              {/* Total Cartão de Crédito */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-600 bg-opacity-20 rounded-lg">
                    <CreditCard size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Cartão</p>
                    <p className="text-xs text-gray-500">Crédito</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-purple-400">
                  {formatarValor(resumo.totalCredito)}
                </p>
              </div>

              {/* Campo Adicional/Extra */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-600 bg-opacity-20 rounded-lg">
                    <Plus size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Adicional</p>
                    <p className="text-xs text-gray-500">Extra (R$)</p>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorAdicional || ''}
                  onChange={handleValorAdicionalChange}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-lg font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Valor Total a Pagar - Destacado */}
              <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-4 hover:bg-gray-750 transition-all duration-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-600 bg-opacity-30 rounded-lg">
                    <DollarSign size={24} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-400">VALOR TOTAL</p>
                    <p className="text-xs text-red-300">A PAGAR</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {formatarValor(resumo.valorTotalFinal)}
                </p>
                {valorAdicional > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="text-xs text-gray-400">
                      Corridas: {formatarValor(resumo.valorTotalCorridas)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Adicional: {formatarValor(valorAdicional)}
                    </p>
                  </div>
                )}
              </div>

              {/* Card vazio para completar o grid se necessário */}
              {resumo.quantidadeEntregas > 0 && (
                <div className="hidden xl:block"></div>
              )}
            </div>
          </div>
        )}

        {/* Tabela de Entregas */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Entregas Realizadas ({entregasFiltradas.length})
            </h3>
          </div>

          {entregasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">
                Nenhuma entrega encontrada com os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nº Pedido
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Entregador
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Forma de Pagamento
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Valor da Corrida
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {entregasFiltradas.map((entrega) => (
                    <tr key={entrega.id} className="hover:bg-gray-750 transition-colors duration-200">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                        {formatarDataHora(entrega.dataHora)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-red-400">
                        #{entrega.numeroPedido}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white font-medium">
                        {entrega.cliente?.nome}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                        {entrega.entregador}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                        {entrega.formaPagamento}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-red-400">
                        {formatarValor(entrega.valorCorrida)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Global */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDestructive={modalState.isDestructive}
      />
    </>
  );
};