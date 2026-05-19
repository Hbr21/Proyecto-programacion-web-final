import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix de íconos con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Fuerza a Leaflet a recalcular tamaño del contenedor
function RedrawMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        map.setView(center, map.getZoom());
      }, 200);
    }
  }, [map, center]);
  return null;
}

export default function MapaArtesano({ latitud, longitud, nombre, comunidad }) {
  if (!latitud || !longitud) {
    return (
      <div style={{
        background: 'var(--crema-dark)',
        border: '1.5px dashed var(--borde)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--texto-suave)',
        fontSize: '0.9rem'
      }}>
        📍 Ubicación no disponible — el artesano aún no ha agregado sus coordenadas.
      </div>
    );
  }

  const center = [parseFloat(latitud), parseFloat(longitud)];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        border: '1px solid var(--borde)',
        zIndex: 0,
        marginTop: '15px',
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>
          <strong>{nombre}</strong><br />
          📍 {comunidad}
        </Popup>
      </Marker>
      <RedrawMap center={center} />
    </MapContainer>
  );
}