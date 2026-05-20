import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  // Agregar producto al carrito
  const agregar = (producto, cantidad = 1) => {
    setItems(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
  };

  // Quitar un producto del carrito
  const quitar = (productoId) => {
    setItems(prev => prev.filter(i => i.id !== productoId));
  };

  // Cambiar cantidad de un producto
  const cambiarCantidad = (productoId, cantidad) => {
    if (cantidad <= 0) { quitar(productoId); return; }
    setItems(prev =>
      prev.map(i => i.id === productoId ? { ...i, cantidad } : i)
    );
  };

  // Vaciar carrito completo
  const vaciar = () => setItems([]);

  // Total de items (para el badge del navbar)
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  // Total en pesos
  const totalPrecio = items.reduce((acc, i) => acc + (Number(i.precio) * i.cantidad), 0);

  return (
    <CarritoContext.Provider value={{
      items, agregar, quitar, cambiarCantidad, vaciar,
      totalItems, totalPrecio
    }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
};