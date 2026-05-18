import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapaArtesano({ latitud, longitud, nombre, comunidad }) {
  if (!latitud || !longitud) {
    return (
      <div style={{
        background: 'var(--crema-dark)',
        border: '1.5px dashed var(--borde)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--texto-suave)'
      }}>
        📍 Ubicación no disponible
      </div>
    );
  }

  return (
    <MapContainer
      center={[parseFloat(latitud), parseFloat(longitud)]}
      zoom={13}
      style={{ width: '100%', height: '300px', borderRadius: '12px', border: '1px solid var(--borde)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[parseFloat(latitud), parseFloat(longitud)]}>
        <Popup>
          <strong>{nombre}</strong><br />
          📍 {comunidad}
        </Popup>
      </Marker>
    </MapContainer>
  );
}