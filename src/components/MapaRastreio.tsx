import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Entregador } from '../types';

// Corrige um problema comum com o ícone padrão no React-Leaflet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapaRastreioProps {
  entregador: Entregador | null;
}

// Componente para recentralizar o mapa quando a posição do marcador muda
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export const MapaRastreio: React.FC<MapaRastreioProps> = ({ entregador }) => {
  const posicaoEntregador: [number, number] | null = 
    entregador && entregador.latitude && entregador.longitude
      ? [entregador.latitude, entregador.longitude]
      : null;

  // Posição inicial do mapa (Ouricuri, PE)
  const posicaoInicial: [number, number] = [-7.9839, -40.0833];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border-2 border-gray-700">
      <MapContainer 
        center={posicaoEntregador || posicaoInicial} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        {posicaoEntregador && <ChangeView center={posicaoEntregador} zoom={15} />}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {posicaoEntregador && (
          <Marker position={posicaoEntregador}>
            <Popup>
              <b>{entregador?.nome}</b><br />
              Atualizado em: {entregador?.ultimo_update ? new Date(entregador.ultimo_update).toLocaleTimeString() : 'N/A'}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
