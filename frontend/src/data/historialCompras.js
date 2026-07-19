export const historialCompras = [
  {
    id: 1,
    vendedor: "Alex Rivera",
    iniciales: "AR",
    avatarBg: "#32324d",
    avatarColor: "#ffba67",
    producto: "MacBook Air",
    fecha: "24 Oct, 2026",
    status: "entregado",
    cantidad: 1,
    monto: "$1.299.000",
  },
  {
    id: 2,
    vendedor: "Elena Sanz",
    iniciales: "ES",
    avatarBg: "#1e3050",
    avatarColor: "#86d0ff",
    producto: "Tv LG 45 pulgadas",
    fecha: "23 Oct, 2026",
    status: "encamino",
    cantidad: 2,
    monto: "$1.900.000",
  },
  {
    id: 3,
    vendedor: "Julian Thorne",
    iniciales: "JT",
    avatarBg: "#2a2a4a",
    avatarColor: "#ffffff",
    producto: "iPhone 15 Pro",
    fecha: "22 Oct, 2026",
    status: "entregado",
    cantidad: 1,
    monto: "$3.000.000",
  },
  {
    id: 4,
    vendedor: "Marco Rossi",
    iniciales: "MR",
    avatarBg: "#32324d",
    avatarColor: "#ffba67",
    producto: 'iPad Pro 11"',
    fecha: "21 Oct, 2026",
    status: "pendiente",
    cantidad: 1,
    monto: "$2.799.000",
  },
];

export const filtrosHistorial = [
  { key: "todo", label: "Todo" },
  { key: "pendiente", label: "Pendiente" },
  { key: "encamino", label: "En camino" },
  { key: "entregado", label: "Entregado" },
];

export const estadosHistorial = {
  entregado: {
    className: "bg-primary/20 text-primary",
    label: "Entregado",
  },
  encamino: {
    className: "bg-accent-blue/20 text-accent-blue",
    label: "En camino",
  },
  pendiente: {
    className: "bg-error-container/30 text-error",
    label: "Pendiente",
  },
};
