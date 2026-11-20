export const defaultMenus = {
  "2026-11-19": {
    title: "Menú del día",
    subtitle: "Jueves 19 de noviembre",
    availableUntil: "2:00 p. m.",
    items: [
      { id: "1", name: "Pollo al horno", description: "Pollo marinado con hierbas, arroz con coco y ensalada fresca.", price: 18000, category: "Plato fuerte", available: true },
      { id: "2", name: "Pasta cremosa de la casa", description: "Pasta corta, salsa cremosa, champiñones y queso parmesano.", price: 17000, category: "Plato fuerte", available: true },
      { id: "3", name: "Brownie de chocolate", description: "Brownie húmedo con chocolate y nueces.", price: 7000, category: "Postre", available: true }
    ]
  },
  "2026-11-20": {
    title: "Menú del día",
    subtitle: "Viernes 20 de noviembre",
    availableUntil: "2:00 p. m.",
    items: [
      { id: "4", name: "Arroz oriental con pollo", description: "Arroz salteado con pollo, vegetales y salsa de la casa.", price: 19000, category: "Plato fuerte", available: true },
      { id: "5", name: "Lasaña artesanal", description: "Capas de pasta, carne, salsa de tomate y queso gratinado.", price: 21000, category: "Plato fuerte", available: true },
      { id: "6", name: "Cheesecake de frutos rojos", description: "Porción individual con salsa de frutos rojos.", price: 8000, category: "Postre", available: true }
    ]
  }
};

export const defaultBookings = [
  {
    id: "r-1001",
    ownerId: "demo-admin",
    clientName: "Laura Martínez",
    clientPhone: "3005550101",
    date: "2026-11-21",
    time: "17:00",
    note: "Celebración familiar.",
    status: "confirmada"
  },
  {
    id: "r-1002",
    ownerId: "demo-admin",
    clientName: "Andrés Rojas",
    clientPhone: "3154440199",
    date: "2026-11-28",
    time: "11:30",
    note: "Cotización para 35 personas.",
    status: "pendiente"
  }
];
