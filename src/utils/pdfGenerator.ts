import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Entrega, Entregador } from '../types';
import { formatarDataHora, formatarValor } from './calculations';

interface ResumoEntregador {
  nome: string;
  quantidadeEntregas: number;
  valorTotal: number;
  totalDinheiro: number;
  totalPix: number;
  totalDebito: number;
  totalCredito: number;
}

interface DadosRelatorio {
  entregas: Entrega[];
  entregadores: Entregador[];
  entregadorSelecionado?: number;
  dataInicio?: string;
  dataFim?: string;
  valorAdicional: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  private async adicionarCabecalho(titulo: string, periodo?: string): Promise<number> {
    // Cabeçalho simples sem logo
    // LINHA 1: Nome da Pizzaria
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 38, 38);
    const nomeEmpresa = 'Pizzaria Borda de Fogo';
    const nomeWidth = this.doc.getTextWidth(nomeEmpresa);
    const nomeX = (this.pageWidth - nomeWidth) / 2;
    this.doc.text(nomeEmpresa, nomeX, 30);
    
    // LINHA 2: Detalhes do Relatório
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(150, 150, 150);
    const dataGeracao = new Date().toLocaleString('pt-BR');
    const textoGeracao = `Relatório gerado em: ${dataGeracao}`;
    const geracaoWidth = this.doc.getTextWidth(textoGeracao);
    const geracaoX = (this.pageWidth - geracaoWidth) / 2;
    this.doc.text(textoGeracao, geracaoX, 45);
    
    // Linha decorativa
    this.doc.setDrawColor(220, 38, 38);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 55, this.pageWidth - this.margin, 55);
    
    // Título do relatório
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    const tituloWidth = this.doc.getTextWidth(titulo);
    const tituloX = (this.pageWidth - tituloWidth) / 2;
    this.doc.text(titulo, tituloX, 70);
    
    let currentY = 85;
    
    // Período
    if (periodo) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      const periodoWidth = this.doc.getTextWidth(periodo);
      const periodoX = (this.pageWidth - periodoWidth) / 2;
      this.doc.text(periodo, periodoX, currentY);
      currentY += 10;
    }
    
    return currentY + 10;
  }

  private adicionarResumoFinanceiro(resumo: ResumoEntregador, yPosition: number, valorAdicional: number = 0): number {
    const startY = yPosition + 10;
    
    // Título da seção
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('RESUMO FINANCEIRO', this.margin, startY);
    
    // Caixa do resumo
    const boxY = startY + 10;
    const boxHeight = 60;
    
    // Fundo cinza claro
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight, 'F');
    
    // Borda
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight);
    
    // Conteúdo do resumo
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const leftCol = this.margin + 10;
    const rightCol = this.pageWidth / 2 + 10;
    let currentY = boxY + 15;
    
    // Coluna esquerda
    this.doc.text(`Quantidade de Entregas: ${resumo.quantidadeEntregas}`, leftCol, currentY);
    currentY += 8;
    this.doc.text(`Total em Dinheiro: ${formatarValor(resumo.totalDinheiro)}`, leftCol, currentY);
    currentY += 8;
    this.doc.text(`Total via Pix: ${formatarValor(resumo.totalPix)}`, leftCol, currentY);
    
    // Coluna direita
    currentY = boxY + 15;
    this.doc.text(`Cartão de Débito: ${formatarValor(resumo.totalDebito)}`, rightCol, currentY);
    currentY += 8;
    this.doc.text(`Cartão de Crédito: ${formatarValor(resumo.totalCredito)}`, rightCol, currentY);
    
    if (valorAdicional > 0) {
      currentY += 8;
      this.doc.text(`Adicional/Extra: ${formatarValor(valorAdicional)}`, rightCol, currentY);
    }
    
    // Valor total destacado
    const valorTotalFinal = resumo.valorTotal + valorAdicional;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 38, 38);
    this.doc.text(`VALOR TOTAL A PAGAR: ${formatarValor(valorTotalFinal)}`, leftCol, boxY + boxHeight - 10);
    
    return boxY + boxHeight + 20;
  }

  private adicionarTabelaEntregas(entregas: Entrega[], yPosition: number): number {
    // Título da seção
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`LISTA DETALHADA DE ENTREGAS (${entregas.length})`, this.margin, yPosition);
    
    // Preparar dados da tabela
    const tableData = entregas.map(entrega => [
      formatarDataHora(entrega.dataHora),
      `#${entrega.numeroPedido}`,
      entrega.cliente?.nome || 'N/A',
      entrega.formaPagamento,
      formatarValor(entrega.valorCorrida)
    ]);
    
    // Configurar e gerar tabela
    autoTable(this.doc, {
      startY: yPosition + 10,
      head: [['Data/Hora', 'Nº Pedido', 'Cliente', 'Pagamento', 'Valor Corrida']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private calcularResumoEntregador(entregas: Entrega[], nomeEntregador: string): ResumoEntregador {
    const quantidadeEntregas = entregas.length;
    const valorTotal = entregas.reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalDinheiro = entregas
      .filter(e => e.formaPagamento === 'Dinheiro')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalPix = entregas
      .filter(e => e.formaPagamento === 'Pix')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalDebito = entregas
      .filter(e => e.formaPagamento === 'Cartão de Débito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
    
    const totalCredito = entregas
      .filter(e => e.formaPagamento === 'Cartão de Crédito')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);

    return {
      nome: nomeEntregador,
      quantidadeEntregas,
      valorTotal,
      totalDinheiro,
      totalPix,
      totalDebito,
      totalCredito
    };
  }

  private formatarPeriodo(dataInicio?: string, dataFim?: string): string {
    if (!dataInicio && !dataFim) {
      return 'Período: Todas as entregas';
    }
    
    const inicio = dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início';
    const fim = dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje';
    
    return `Período: ${inicio} a ${fim}`;
  }

  public async gerarRelatorioIndividual(dados: DadosRelatorio): Promise<void> {
    const { entregas, entregadores, entregadorSelecionado, dataInicio, dataFim, valorAdicional } = dados;
    
    const entregador = entregadores.find(e => e.id === entregadorSelecionado);
    if (!entregador) return;
    
    const entregasDoEntregador = entregas.filter(e => e.entregadorId === entregadorSelecionado);
    
    // Cabeçalho
    const titulo = `Relatório de Entregas - ${entregador.nome}`;
    const periodo = this.formatarPeriodo(dataInicio, dataFim);
    let currentY = await this.adicionarCabecalho(titulo, periodo);
    
    // Resumo financeiro
    const resumo = this.calcularResumoEntregador(entregasDoEntregador, entregador.nome);
    currentY = this.adicionarResumoFinanceiro(resumo, currentY, valorAdicional);
    
    // Verificar se precisa de nova página
    if (currentY > this.pageHeight - 100) {
      this.doc.addPage();
      currentY = 30;
    }
    
    // Tabela de entregas
    this.adicionarTabelaEntregas(entregasDoEntregador, currentY);
    
    // Salvar arquivo
    const nomeArquivo = `relatorio-${entregador.nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(nomeArquivo);
  }

  public async gerarRelatorioGeral(dados: DadosRelatorio): Promise<void> {
    const { entregas, entregadores, dataInicio, dataFim, valorAdicional } = dados;
    
    // Cabeçalho
    const titulo = 'Relatório Geral de Entregas';
    const periodo = this.formatarPeriodo(dataInicio, dataFim);
    let currentY = await this.adicionarCabecalho(titulo, periodo);
    
    // Agrupar entregas por entregador
    const entregadoresComEntregas = entregadores
      .map(entregador => {
        const entregasDoEntregador = entregas.filter(e => e.entregadorId === entregador.id);
        return {
          entregador,
          entregas: entregasDoEntregador,
          resumo: this.calcularResumoEntregador(entregasDoEntregador, entregador.nome)
        };
      })
      .filter(item => item.entregas.length > 0);
    
    // Resumo por entregador
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('RESUMO POR ENTREGADOR', this.margin, currentY);
    currentY += 20;
    
    let custoTotalGeral = valorAdicional;
    
    entregadoresComEntregas.forEach((item, index) => {
      const { entregador, resumo } = item;
      
      // Verificar se precisa de nova página
      if (currentY > this.pageHeight - 60) {
        this.doc.addPage();
        currentY = 30;
      }
      
      // Caixa do entregador
      const boxHeight = 45;
      
      // Fundo alternado
      if (index % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(this.margin, currentY - 5, this.pageWidth - 2 * this.margin, boxHeight, 'F');
      }
      
      // Nome do entregador
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(220, 38, 38);
      this.doc.text(`${entregador.nome}`, this.margin + 5, currentY + 5);
      
      // Informações
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      this.doc.text(`Total de Entregas: ${resumo.quantidadeEntregas}`, this.margin + 5, currentY + 15);
      this.doc.text(`Valor Total: ${formatarValor(resumo.valorTotal)}`, this.margin + 5, currentY + 25);
      
      // Detalhamento por forma de pagamento
      const rightCol = this.pageWidth / 2 + 10;
      this.doc.text(`Dinheiro: ${formatarValor(resumo.totalDinheiro)}`, rightCol, currentY + 15);
      this.doc.text(`Pix: ${formatarValor(resumo.totalPix)} | Débito: ${formatarValor(resumo.totalDebito)} | Crédito: ${formatarValor(resumo.totalCredito)}`, rightCol, currentY + 25);
      
      custoTotalGeral += resumo.valorTotal;
      currentY += boxHeight + 5;
    });
    
    // Total geral consolidado
    currentY += 20;
    
    // Verificar se precisa de nova página
    if (currentY > this.pageHeight - 80) {
      this.doc.addPage();
      currentY = 30;
    }
    
    // Caixa destacada para o total geral
    const totalBoxHeight = 40;
    this.doc.setFillColor(220, 38, 38);
    this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, totalBoxHeight, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CUSTO TOTAL COM ENTREGAS NO PERÍODO:', this.margin + 10, currentY + 15);
    this.doc.setFontSize(20);
    this.doc.text(formatarValor(custoTotalGeral), this.margin + 10, currentY + 30);
    
    // Salvar arquivo
    const nomeArquivo = `relatorio-geral-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(nomeArquivo);
  }
}