export const perfilVendedorSocial = {
  usuario: "Juan_giraldo",
  seguidores: [
    { id: 1, nombre: "Camila Torres", usuario: "camila_torres", avatar: null, color: "#5c3317", inicial: "C" },
    { id: 2, nombre: "Sebastian Ruiz", usuario: "seba_ruiz", avatar: null, color: "#2d1a30", inicial: "S" },
    { id: 3, nombre: "Mariana Gomez", usuario: "mariana_gomez", avatar: null, color: "#2a2a2a", inicial: "M" },
    { id: 4, nombre: "Felipe Restrepo", usuario: "felipe_restrepo", avatar: null, color: "#ff5168", inicial: "F" },
    { id: 5, nombre: "Laura Jimenez", usuario: "laura_jimenez", avatar: null, color: "#3b2a1a", inicial: "L" },
    { id: 6, nombre: "Esteban Cardenas", usuario: "esteban_cardenas", avatar: null, color: "#20a47a", inicial: "E" },
    { id: 7, nombre: "Daniela Perez", usuario: "daniela_perez", avatar: null, color: "#1a2a3b", inicial: "D" },
    { id: 8, nombre: "Juan Pablo Soto", usuario: "jp_soto", avatar: null, color: "#2a2a2a", inicial: "J" },
    { id: 9, nombre: "Valeria Rios", usuario: "valeria_rios", avatar: null, color: "#7c3aed", inicial: "V" },
    { id: 10, nombre: "Cristian Mejia", usuario: "cristian_mejia", avatar: null, color: "#0891b2", inicial: "C" },
    { id: 11, nombre: "Natalia Vargas", usuario: "natalia_vargas", avatar: null, color: "#5c3317", inicial: "N" },
  ],
  siguiendo: [
    { id: 1, nombre: "Andres Bedoya", usuario: "andres_bedoya", avatar: null, color: "#5c3317", inicial: "A" },
    { id: 2, nombre: "Paula Castano", usuario: "paula_castano", avatar: null, color: "#2d1a30", inicial: "P" },
    { id: 3, nombre: "Diego Marin", usuario: "diego_marin", avatar: null, color: "#2a2a2a", inicial: "D" },
    { id: 4, nombre: "Sofia Londono", usuario: "sofia_londono", avatar: null, color: "#ff5168", inicial: "S" },
    { id: 5, nombre: "Tomas Herrera", usuario: "tomas_herrera", avatar: null, color: "#3b2a1a", inicial: "T" },
    { id: 6, nombre: "Isabela Quintero", usuario: "isabela_quintero", avatar: null, color: "#20a47a", inicial: "I" },
    { id: 7, nombre: "Santiago Velez", usuario: "santiago_velez", avatar: null, color: "#1a2a3b", inicial: "S" },
    { id: 8, nombre: "Camila Ortega", usuario: "camila_ortega", avatar: null, color: "#2a2a2a", inicial: "C" },
  ],
};

export function formatSocialCount(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
  return value.toString();
}
