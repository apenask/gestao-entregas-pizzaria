import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Clock, MapPin, Phone, LogOut, Timer, CheckSquare, Square, Package, Wallet } from 'lucide-react'; 
import { Entrega, Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatarValor, formatarHora } from '../utils/calculations';
import { useTimer } from '../hooks/useTimer';
import { supabase } from '../lib/supabase';

interface EntregadorDashboardProps {
  entregas: Entrega[];
  clientes: Cliente[];
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue', dataHora?: Date) => void;
}

export const EntregadorDashboard: React.FC<EntregadorDashboardProps> = ({
  entregas,
  clientes,
  onAtualizarStatus,
}) => {
  const { usuario, logout } = useAuth();
  const horaAtual = useTimer();
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<Set<number>>(new Set());
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  useEffect(() => {
    console.log("Iniciando rastreamento para o entregador ID:", usuario?.entregadorId);
    let watchId: number | null = null;

    if (navigator.geolocation) {
      console.log("Geolocalização suportada. A iniciar watchPosition...");
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Posição obtida: Lat ${latitude}, Lon ${longitude}`);
          setErroLocalizacao(null);

          if (usuario?.entregadorId) {
            console.log(`Enviando atualização para o Supabase para o entregador ${usuario.entregadorId}`);
            const { error } = await supabase
              .from('entregadores')
              .update({ latitude, longitude, ultimo_update: new Date().toISOString() })
              .eq('id', usuario.entregadorId);

            if (error) {
              console.error('Erro ao enviar localização para o Supabase:', error);
              setErroLocalizacao('Não foi possível enviar a sua localização.');
            } else {
              console.log("Localização enviada com sucesso!");
            }
          } else {
            console.warn("ID do entregador não encontrado, não é possível enviar a localização.");
          }
        },
        (error) => {
          console.error("Erro de Geolocalização:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setErroLocalizacao("Permissão de localização negada. Ative a localização para continuar.");
          } else {
            setErroLocalizacao("Não foi possível obter a sua localização.");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      console.error("Geolocalização não é suportada neste navegador.");
      setErroLocalizacao("Geolocalização não é suportada neste navegador.");
    }

    return () => {
      if (watchId) {
        console.log("Parando o rastreamento de localização.");
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [usuario?.entregadorId]);


  const entregasCompletas = useMemo(() => {
    return entregas.map((entrega) => ({
      ...entrega,
      cliente: clientes.find((c) => c.id === entrega.clienteId),
    }));
  }, [entregas, clientes]);

  const entregasAguardando = entregasCompletas.filter((e) => e.status === 'Aguardando');
  const entregasEmRota = entregasCompletas.filter((e) => e.status === 'Em Rota');

  const ganhosDeHoje = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return entregasCompletas
      .filter(e => 
        e.status === 'Entregue' && 
        e.dataHoraEntrega && 
        new Date(e.dataHoraEntrega).setHours(0, 0, 0, 0) === hoje.getTime()
      )
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
  }, [entregasCompletas]);

  const toggleSelecionarEntrega = (entregaId: number) => {
    const novaSelecao = new Set(entregasSelecionadas);
    if (novaSelecao.has(entregaId)) {
      novaSelecao.delete(entregaId);
    } else {
      novaSelecao.add(entregaId);
    }
    setEntregasSelecionadas(novaSelecao);
  };

  const handleSairComSelecionadas = () => {
    const agora = new Date();
    entregasSelecionadas.forEach((id) => onAtualizarStatus(id, 'Em Rota', agora));
    setEntregasSelecionadas(new Set());
  };
  
  const calcularTempoEmRota = (dataSaida: Date): string => {
    const saida = new Date(dataSaida);
    if (isNaN(saida.getTime())) return '00:00:00';
    const diffMs = horaAtual.getTime() - saida.getTime();
    if (diffMs < 0) return '00:00:00';

    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const renderEntregaCard = (entrega: Entrega & { cliente?: Cliente }) => (
    <div key={entrega.id} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${entrega.status === 'Em Rota' ? 'border-blue-500' : 'border-yellow-500'} shadow-lg space-y-4`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <Package size={20} className={entrega.status === 'Em Rota' ? 'text-blue-400' : 'text-yellow-400'} />
                <div>
                    <h3 className="font-bold text-white text-lg">#{entrega.numeroPedido} - {entrega.cliente?.nome}</h3>
                    <p className="text-sm text-gray-400">{entrega.status}</p>
                </div>
            </div>
            {entrega.status === 'Aguardando' && (
                <button onClick={() => toggleSelecionarEntrega(entrega.id)} className="p-1 text-gray-400 hover:text-white">
                    {entregasSelecionadas.has(entrega.id) ? <CheckSquare size={22} className="text-blue-400" /> : <Square size={22} />}
                </button>
            )}
        </div>
        <div className="space-y-2 border-t border-gray-700 pt-3">
            <div className="flex items-start gap-3 text-gray-300"><MapPin size={18} className="mt-1 flex-shrink-0" /><span>{entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}</span></div>
            {entrega.cliente?.telefone && <div className="flex items-center gap-3 text-gray-300"><Phone size={16} /><span>{entrega.cliente.telefone}</span></div>}
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wallet size={16} className="text-orange-400" /> <span className="text-gray-400 text-sm">Valor a Cobrar</span></div>
                <span className="text-white font-bold text-xl">{formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}</span>
            </div>
        </div>
        {entrega.status === 'Em Rota' && entrega.dataHoraSaida && (
            <div className="bg-yellow-500/10 p-3 rounded-lg text-center">
                <p className="text-xs text-yellow-400 mb-1">TEMPO EM ROTA</p>
                <p className="text-yellow-300 font-mono text-2xl tracking-wider">{calcularTempoEmRota(entrega.dataHoraSaida)}</p>
            </div>
        )}
        {entrega.status === 'Aguardando' && <button onClick={() => onAtualizarStatus(entrega.id, 'Em Rota')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">SAIR PARA ENTREGA</button>}
        {entrega.status === 'Em Rota' && <button onClick={() => onAtualizarStatus(entrega.id, 'Entregue')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">MARCAR COMO ENTREGUE</button>}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-700">Pedido criado às {formatarHora(new Date(entrega.dataHora))}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
            <Truck size={24} className="text-blue-400" />
            <div>
                <h1 className="text-lg font-bold whitespace-nowrap">Painel</h1>
                <p className="text-sm text-gray-400">Olá, {usuario?.nomeCompleto}</p>
            </div>
        </div>
        <div className="flex-grow flex justify-center">
            <div className="text-center bg-green-500/10 border border-green-500/30 px-4 py-1 rounded-lg">
                <p className="text-xs text-green-400">Ganhos de Hoje</p>
                <p className="text-xl font-bold text-white">{formatarValor(ganhosDeHoje)}</p>
            </div>
        </div>
        <div className="flex-shrink-0">
            <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md text-sm font-medium flex items-center gap-2">
              <LogOut size={18} />
            </button>
        </div>
      </header>
      
      <main className="p-4 sm:p-6 space-y-8">
        {erroLocalizacao && (
            <div className="bg-red-900/80 border border-red-600 text-white text-sm rounded-lg p-4 text-center">
                <strong>Atenção:</strong> {erroLocalizacao}
            </div>
        )}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Timer size={20} className="text-blue-400" />Em Rota ({entregasEmRota.length})</h2>
          <div className="space-y-4">
            {entregasEmRota.length > 0 ? entregasEmRota.map(renderEntregaCard) : <div className="text-center text-gray-500 py-8"><Truck size={40} className="mx-auto" /><p className="mt-2">Nenhuma entrega em rota.</p></div>}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Clock size={20} className="text-yellow-400" />Aguardando ({entregasAguardando.length})</h2>
          {entregasAguardando.length > 1 && entregasSelecionadas.size > 0 && (
            <button onClick={handleSairComSelecionadas} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg mb-4">SAIR COM SELECIONADAS ({entregasSelecionadas.size})</button>
          )}
          <div className="space-y-4">
            {entregasAguardando.length > 0 ? entregasAguardando.map(renderEntregaCard) : <div className="text-center text-gray-500 py-8"><Clock size={40} className="mx-auto" /><p className="mt-2">Nenhuma entrega aguardando.</p></div>}
          </div>
        </section>
      </main>
    </div>
  );
};
