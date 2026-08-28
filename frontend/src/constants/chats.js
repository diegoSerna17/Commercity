// JS Datos estaticos de conversaciones con avatar, preview y contenido
const MESSAGES = [
  {
    id: 1,
    name: "Marco Valerio",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVMdlDdJhIQqEsFgcb2S2BkYejQuj6aJxekd3ounjl0ddKnxQRYh3Q_LxHxgx7wtVFpDKmIYoNgKdPTR75wAj7NV1ltPAp0NPOAeAbUhWfzA003VZqh-y9kMhs2EHYRn0s1CV_n8f9iYBogUIysnqhrzZzm4NYayG30W-K47lM5BpXlaYKKFtrDpfZymOIan2xJfEWH2WinwCjDU-l2kZ5G2bVQ2XvJTl3kwGZIrcCo5sVwG6_LlfSav-glp_FZKOcXszLL-q27uuh",
    time: "10:24 AM",
    preview: "¿Cuándo llega mi pedido de 2026?",
    unread: 2,
    active: true,
    grayscale: false,
    conversation: [
      { type: "incoming", text: "Hola, ¿todavía está disponible el teclado?", time: "10:03 AM" },
      { type: "incoming", text: "¿Tiene garantía?", time: "10:03 AM" },
      { type: "outgoing", text: "Sí, aún tenemos stock disponible.", time: "10:31 AM" },
      { type: "outgoing", text: "Sí, garantía de 6 meses.", time: "10:33 AM" },
    ],
  },
  {
    id: 2,
    name: "Sofía Alarcón",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDV4RUURivuKMl_qU0lYRYTcP41QmhXCJFMtrCB1_j05k8pE-Cag0eIc94EMG8k3-mqObX0hLDh_T4-drBWAo5LU5hOa_lb5D4oAXjIlMwpr4RQaEWdz1GZzSK1Vxxyt_e2fxs-Bn67ZhYftag9kZoDLVf4kDuZxBzoKxOKDM_mz0NHzpuRVLjd2m0yTBiPmdY8FSU5l2za-g-OxTBSfHEpdNvyzT4m7VuktJYart8URTyobkms6PhrbLkPiHaOOMXQsodWpMJzDtDx",
    time: "Ayer",
    preview: "Gracias por la atención, excelente...",
    unread: 0,
    active: false,
    grayscale: true,
    conversation: [
      { type: "incoming", text: "Me llegó el producto, está hermoso.", time: "3:45 PM" },
      { type: "incoming", text: "Muchas gracias por la atención.", time: "3:46 PM" },
      { type: "outgoing", text: "Nos alegra que te haya gustado.", time: "4:10 PM" },
      { type: "outgoing", text: "Cualquier cosa, estoy acá para ayudar.", time: "4:11 PM" },
    ],
  },
  {
    id: 3,
    name: "Soporte Commercity",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB91zK1IPcra_6OyN2uqpnYPWHKifTFT8fojD4u2ojtpfC9SJPP_5cOSEYd68fp-vML8y_MyFsmeumo3JsV5BichZgazy0Mw2lJu1eVpLhJPZuTvcJczjKf1kaAJigLEV5cdD13CefllwsniXs-E3xCr4y82QmxdewgvgcI9f5zo5eLgWLsmFW2xH8BatBb0FM5UligWn39QwHMbY6RsgIWjsJmQVXYPAnvbJHJ9NNDbTTUHPxFMfwL-YlOMy-d8DFWJYfofpz0Ceef",
    time: "Lun",
    preview: "Su ticket #8849 ha sido resuelto.",
    unread: 0,
    active: false,
    grayscale: false,
    conversation: [
      { type: "product", productName: "Bolso Boutique", productPrice: "$250.000 COP", productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiAy7PzZlfjoN5XL8ujhNsYmziXlr_zNLv-7mflww43slOzhrWo09nS6lLDkWulpKpbddKYmZUm-9jbD6ou29JutOLHQuMdBN0ZYZrXYItIv43QR1wtZC-IHpmiIHuKwjm6d0AsEzLPNJ2eJipqco3mQYDXcWyBkW0jUMSv4svT8_-K1XFDB55Qds92xF439QYmhYKra-pWN84-Nub-7mJhEXnPkt0Wn5mv-2Kg8VVBfrW_5QZp76PgJpff_9TZ4e_90AYn-vKfWXB" },
      { type: "incoming", text: "Hola Juan. Somos de Soporte Commercity.", time: "9:00 AM" },
      { type: "incoming", text: "Queremos informarte que tu ticket #8849 ha sido resuelto.", time: "9:01 AM" },
      { type: "outgoing", text: "Gracias por la pronta respuesta.", time: "9:30 AM" },
    ],
  },
];

export default MESSAGES;
