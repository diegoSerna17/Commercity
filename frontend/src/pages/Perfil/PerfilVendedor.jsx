import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/globales/Header";
import AgregarProducto from "../../components/perfil/AgregarProducto";
import SeguidoresModal from "../../components/perfil/SeguidoresModal";
import { perfilVendedorSocial } from "../../data/perfilVendedorSocial";

const BIO_MAX_LENGTH = 180;

const STAR_PATH =
  "M2.86875 14.25L4.0875 8.98125L0 5.4375L5.4 4.96875L7.5 0L9.6 4.96875L15 5.4375L10.9125 8.98125L12.1313 14.25L7.5 11.4563L2.86875 14.25Z";
const PENCIL_PATH =
  "M1.66667 13.3333H2.85417L11 5.1875L9.8125 4L1.66667 12.1458V13.3333ZM0 15V11.4583L11 0.479167C11.1667 0.326389 11.3507 0.208333 11.5521 0.125C11.7535 0.0416667 11.9653 0 12.1875 0C12.4097 0 12.625 0.0416667 12.8333 0.125C13.0417 0.208333 13.2222 0.333333 13.375 0.5L14.5208 1.66667C14.6875 1.81944 14.809 2 14.8854 2.20833C14.9618 2.41667 15 2.625 15 2.83333C15 3.05556 14.9618 3.26736 14.8854 3.46875C14.809 3.67014 14.6875 3.85417 14.5208 4.02083L3.54167 15H0ZM13.3333 2.83333L12.1667 1.66667L13.3333 2.83333ZM10.3958 4.60417L9.8125 4L11 5.1875L10.3958 4.60417Z";

const PRODUCTS = [
  {
    id: 1,
    name: "Bolso Boutique",
    originalPrice: "$138.880",
    price: "$125.000",
    discount: "-10%",
    image: "https://picsum.photos/seed/bolso1/400/400",
    bgColor: "#f1f1f4",
  },
  {
    id: 2,
    name: "Cuadro Decorativo Minimalista",
    originalPrice: null,
    price: "$29.000",
    discount: null,
    image: "https://picsum.photos/seed/cuadro1/400/400",
    bgColor: "#f1f1f4",
  },
  {
    id: 3,
    name: "Cuadro Decorativo",
    originalPrice: "$6.000",
    price: "$25.000",
    discount: "-25%",
    image: "https://picsum.photos/seed/cuadro3/400/400",
    bgColor: "#f1f1f4",
  },
  {
    id: 4,
    name: "Bascula de Oro",
    originalPrice: "$4.000",
    price: "$40.000",
    discount: "-20%",
    image: "https://picsum.photos/seed/bascula1/400/400",
    bgColor: "#f1f1f4",
  },
  {
    id: 5,
    name: "Bascula de Oro",
    originalPrice: "$4.000",
    price: "$40.000",
    discount: "-20%",
    image: "https://picsum.photos/seed/bascula2/400/400",
    bgColor: "#f1f1f4",
  },
  {
    id: 6,
    name: "Cuadro Decorativo",
    originalPrice: "$6.000",
    price: "$25.000",
    discount: "-25%",
    image: "https://picsum.photos/seed/cuadro4/400/400",
    bgColor: "#f1f1f4",
  },
];

const TABS = [
  { id: "mis-productos", label: "Mis Productos" },
  { id: "favoritos", label: "Favoritos" },
  { id: "resenas", label: "Reseñas" },
];

export default function PerfilVendedor() {
  const [activeTab, setActiveTab] = useState("mis-productos");
  const [sellerRatingSum, setSellerRatingSum] = useState(0);
  const [sellerRatingCount, setSellerRatingCount] = useState(0);
  const [sellerHover, setSellerHover] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [bioText, setBioText] = useState(
    'Me gusta encontrar productos de buena calidad y apoyar tiendas con excelente atención. Siempre busco compras con buenas recomendaciones."'
  );
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(
    "https://picsum.photos/seed/avatar1/400/400"
  );
  const [avatarError, setAvatarError] = useState(false);
  const [brokenImages, setBrokenImages] = useState({});
  const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
  const [mostrarSeguidores, setMostrarSeguidores] = useState(false);

  const avatarInputRef = useRef(null);
  const textareaRef = useRef(null);

  const sellerAverage =
    sellerRatingCount === 0 ? 5 : sellerRatingSum / sellerRatingCount;
  const sellerDisplay =
    sellerHover > 0 ? sellerHover : Math.round(sellerAverage);
  const isMisProductos = activeTab === "mis-productos";

  const setSellerRating = (rating) => {
    setSellerRatingSum((p) => p + rating);
    setSellerRatingCount((p) => p + 1);
    setSellerHover(0);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarError(false);
      setAvatarSrc(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const editBio = () => {
    setBioDraft(bioText);
    setIsEditingBio(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const cancelEditBio = () => setIsEditingBio(false);

  const saveBio = () => {
    setBioText(bioDraft.trim().slice(0, BIO_MAX_LENGTH));
    setIsEditingBio(false);
  };

  const toggleFollow = () => setIsFollowing((p) => !p);

  const handleAgregarProducto = async (formData) => {
    console.log("Producto agregado:", Object.fromEntries(formData));
    setMostrarAgregarProducto(false);
  };

  const handleImageError = (id) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-y-auto"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <Header title="Perfil" showSearch={false} />

      <main
        className="flex-1 px-4 sm:px-6 lg:px-10 py-6 md:py-10 mx-auto w-full overflow-y-auto"
        style={{ maxWidth: "1200px" }}
      >
        {/* Profile Card */}
        <div
          className="rounded-3xl p-6 md:p-10 mb-8"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
            {/* Avatar Section */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <div
                className="rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  width: "176px",
                  height: "176px",
                  backgroundColor: "var(--color-surface-container-high)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                {!avatarError ? (
                  <img
                    id="avatar-img"
                    src={avatarSrc}
                    alt="Avatar de juan_giraldo"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <svg
                    className="w-1/2 h-1/2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--color-brand-muted-text)" }}
                  >
                    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.45c-3.27 0-9.8 1.64-9.8 4.9V21h19.6v-1.65c0-3.26-6.53-4.9-9.8-4.9Z" />
                  </svg>
                )}
              </div>

              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                title="Cambiar foto de perfil"
                className="absolute bottom-3 right-3 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "var(--color-auth-card-bg)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  <path d="M10 14.5C11.25 14.5 12.3125 14.0625 13.1875 13.1875C14.0625 12.3125 14.5 11.25 14.5 10C14.5 8.75 14.0625 7.6875 13.1875 6.8125C12.3125 5.9375 11.25 5.5 10 5.5C8.75 5.5 7.6875 5.9375 6.8125 6.8125C5.9375 7.6875 5.5 8.75 5.5 10C5.5 11.25 5.9375 12.3125 6.8125 13.1875C7.6875 14.0625 8.75 14.5 10 14.5ZM10 12.5C9.3 12.5 8.70833 12.2583 8.225 11.775C7.74167 11.2917 7.5 10.7 7.5 10C7.5 9.3 7.74167 8.70833 8.225 8.225C8.70833 7.74167 9.3 7.5 10 7.5C10.7 7.5 11.2917 7.74167 11.775 8.225C12.2583 8.70833 12.5 9.3 12.5 10C12.5 10.7 12.2583 11.2917 11.775 11.775C11.2917 12.2583 10.7 12.5 10 12.5ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H5.15L7 0H13L14.85 2H18C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V16C20 16.55 19.8042 17.0208 19.4125 17.4125C19.0208 17.8042 18.55 18 18 18H2ZM2 16H18V4H13.95L12.125 2H7.875L6.05 4H2V16Z" />
                </svg>
              </button>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 w-full">
              {/* Top Row: Name + Rating + Actions */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                <div className="space-y-3">
                  <h1
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "32px",
                      letterSpacing: "-0.8px",
                      lineHeight: "38px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    juan_giraldo
                  </h1>

                  <div className="flex items-center gap-[6px]">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const filled = i <= sellerDisplay;
                      return (
                        <button
                          key={i}
                          className="flex-shrink-0 transition-all duration-150 hover:scale-125 cursor-pointer"
                          style={{ width: "18px", height: "17px" }}
                          onClick={() => setSellerRating(i)}
                          onMouseEnter={() => setSellerHover(i)}
                          onMouseLeave={() => setSellerHover(0)}
                        >
                          <svg
                            viewBox="0 0 15 14.25"
                            fill={
                              filled
                                ? "var(--color-brand-orange)"
                                : "var(--color-surface-container-high)"
                            }
                          >
                            <path d={STAR_PATH} />
                          </svg>
                        </button>
                      );
                    })}
                    <span
                      className="ml-2 font-medium"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        fontSize: "13px",
                        lineHeight: "16px",
                        color: "var(--color-brand-muted-text)",
                      }}
                    >
                      {sellerAverage.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    to="/messages"
                    className="flex items-center gap-2.5 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                    style={{
                      padding: "10px 24px",
                      fontSize: "14px",
                      backgroundColor: "var(--color-brand-orange)",
                      color: "var(--color-auth-card-bg)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    Mensajes
                  </Link>

                  {isMisProductos && (
                    <button
                      onClick={() => setMostrarAgregarProducto(true)}
                      className="flex items-center gap-2.5 rounded-full font-semibold text-[13px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "var(--color-brand-orange)",
                        color: "var(--color-auth-card-bg)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <svg
                        className="flex-shrink-0"
                        style={{ width: "18px", height: "18px" }}
                        fill="currentColor"
                        viewBox="0 0 16.6667 16.6667"
                      >
                        <path d="M7.5 12.5H9.16667V9.16667H12.5V7.5H9.16667V4.16667H7.5V7.5H4.16667V9.16667H7.5V12.5ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667ZM8.33333 15C10.1944 15 11.7708 14.3542 13.0625 13.0625C14.3542 11.7708 15 10.1944 15 8.33333C15 6.47222 14.3542 4.89583 13.0625 3.60417C11.7708 2.3125 10.1944 1.66667 8.33333 1.66667C6.47222 1.66667 4.89583 2.3125 3.60417 3.60417C2.3125 4.89583 1.66667 6.47222 1.66667 8.33333C1.66667 10.1944 2.3125 11.7708 3.60417 13.0625C4.89583 14.3542 6.47222 15 8.33333 15Z" />
                      </svg>
                      Agregar Producto
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-10 mb-6">
                <button
                  onClick={() => setMostrarSeguidores(true)}
                  className="group text-left transition-opacity hover:opacity-80"
                >
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {perfilVendedorSocial.seguidores.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Seguidores
                  </p>
                </button>
                <div className="w-px h-8" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
                <button
                  onClick={() => setMostrarSeguidores(true)}
                  className="group text-left transition-opacity hover:opacity-80"
                >
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {perfilVendedorSocial.siguiendo.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Seguidos
                  </p>
                </button>
                <div className="w-px h-8" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
                <div className="text-left">
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {PRODUCTS.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Productos
                  </p>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={toggleFollow}
                className="rounded-full font-semibold text-[14px] transition-all duration-200 hover:shadow-md active:scale-[0.98] mb-6"
                style={{
                  padding: "10px 28px",
                  fontFamily: "var(--font-sans)",
                  ...(isFollowing
                    ? {
                        backgroundColor: "transparent",
                        border: "1.5px solid var(--color-brand-orange)",
                        color: "var(--color-brand-orange)",
                      }
                    : {
                        backgroundColor: "var(--color-brand-orange)",
                        color: "var(--color-auth-card-bg)",
                      }),
                }}
              >
                {isFollowing ? "Siguiendo" : "Seguir"}
              </button>

              {/* Bio Section */}
              <div className="max-w-[500px]">
                <div className="flex items-center gap-2.5 mb-2">
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      fontSize: "18px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    Juan Giraldo
                  </p>
                  {!isEditingBio && (
                    <button
                      onClick={editBio}
                      title="Editar descripción"
                      className="flex-shrink-0 transition-all duration-150 hover:scale-110 p-1 rounded-full"
                      style={{
                        color: "var(--color-brand-muted-text)",
                      }}
                    >
                      <svg
                        className="w-[15px] h-[15px]"
                        fill="currentColor"
                        viewBox="0 0 15 15"
                      >
                        <path d={PENCIL_PATH} />
                      </svg>
                    </button>
                  )}
                </div>

                {!isEditingBio ? (
                  <p
                    className="leading-relaxed"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      fontSize: "15px",
                      lineHeight: "26px",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    {bioText}
                  </p>
                ) : (
                  <div>
                    <textarea
                      ref={textareaRef}
                      maxLength={BIO_MAX_LENGTH}
                      rows={3}
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      className="w-full rounded-2xl p-4 resize-none focus:outline-none transition-all duration-200"
                      style={{
                        backgroundColor: "var(--color-surface-container-lowest)",
                        border: "1.5px solid var(--color-surface-container-high)",
                        color: "var(--color-on-surface)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "15px",
                        lineHeight: "26px",
                      }}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="font-medium"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          color:
                            bioDraft.length >= BIO_MAX_LENGTH
                              ? "var(--color-brand-orange)"
                              : "var(--color-brand-muted-text)",
                        }}
                      >
                        {bioDraft.length}/{BIO_MAX_LENGTH}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={cancelEditBio}
                          className="rounded-full font-semibold text-[13px] transition-all duration-150 hover:opacity-80 active:scale-95"
                          style={{
                            padding: "8px 18px",
                            fontFamily: "var(--font-sans)",
                            color: "var(--color-brand-muted-text)",
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveBio}
                          className="rounded-full font-semibold text-[13px] transition-all duration-150 hover:shadow-md active:scale-95"
                          style={{
                            padding: "8px 18px",
                            fontFamily: "var(--font-sans)",
                            backgroundColor: "var(--color-brand-orange)",
                            color: "var(--color-auth-card-bg)",
                          }}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <div
          className="flex mb-8 w-full mx-auto"
          style={{
            maxWidth: "847px",
            backgroundColor: "var(--color-auth-card-bg)",
            borderRadius: "var(--radius-figma-card)",
            padding: "4px",
          }}
        >
          <button
            onClick={() => setActiveTab("mi-feed")}
            className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl transition-all duration-200"
            style={{
              padding: "13px 16px",
              backgroundColor: !isMisProductos
                ? "var(--color-auth-card-bg)"
                : "transparent",
              boxShadow: !isMisProductos
                ? "0px 1px 1px rgba(0,0,0,0.05)"
                : "none",
            }}
          >
            <svg
              className="flex-shrink-0"
              style={{ width: "18px", height: "18px" }}
              fill={
                !isMisProductos
                  ? "var(--color-brand-orange)"
                  : "var(--color-brand-muted-text)"
              }
              viewBox="0 0 18 18"
            >
              <path d="M0 8V0H8V8H0ZM0 18V10H8V18H0ZM10 8V0H18V8H10ZM10 18V10H18V18H10Z" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: !isMisProductos ? 600 : 400,
                color: !isMisProductos
                  ? "var(--color-brand-orange)"
                  : "var(--color-brand-muted-text)",
              }}
            >
              Mi Feed
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mis-productos")}
            className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl transition-all duration-200"
            style={{
              padding: "13px 16px",
              backgroundColor: isMisProductos
                ? "var(--color-auth-card-bg)"
                : "transparent",
              boxShadow: isMisProductos
                ? "0px 1px 1px rgba(0,0,0,0.05)"
                : "none",
            }}
          >
            <svg
              className="flex-shrink-0"
              style={{ width: "18px", height: "18px" }}
              fill={
                isMisProductos
                  ? "var(--color-brand-orange)"
                  : "var(--color-brand-muted-text)"
              }
              viewBox="0 0 20 18"
            >
              <path d="M3 20C2.45 20 1.97917 19.8042 1.5875 19.4125C1.19583 19.0208 1 18.55 1 18V6.725C0.7 6.54167 0.458333 6.30417 0.275 6.0125C0.0916667 5.72083 0 5.38333 0 5V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V5C20 5.38333 19.9083 5.72083 19.725 6.0125C19.5417 6.30417 19.3 6.54167 19 6.725V18C19 18.55 18.8042 19.0208 18.4125 19.4125C18.0208 19.8042 17.55 20 17 20H3ZM2 5H18V2H2V5ZM7 12H13V10H7V12Z" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
                fontWeight: isMisProductos ? 600 : 400,
                color: isMisProductos
                  ? "var(--color-brand-orange)"
                  : "var(--color-brand-muted-text)",
              }}
            >
              Mis Productos
            </span>
          </button>
        </div>

        {/* Product grid */}
        <div
          className="grid gap-6 pb-10"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {PRODUCTS.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden cursor-pointer transition-shadow"
              style={{
                backgroundColor: "var(--color-auth-card-bg)",
                boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  height: "240px",
                  backgroundColor: p.bgColor,
                }}
              >
                {!brokenImages[p.id] && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [p.id]: true }))
                    }
                  />
                )}
                {p.discount && (
                  <div
                    className="absolute top-2 left-2 rounded-full flex items-center justify-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "var(--color-app-badge)",
                      boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  >
                    <span
                      className="text-white text-center leading-tight"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        fontSize: "10px",
                      }}
                    >
                      {p.discount}
                    </span>
                  </div>
                )}
                {isMisProductos && (
                  <button
                    title="Editar producto"
                    className="absolute top-3 right-3 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                    style={{
                      width: "31px",
                      height: "31px",
                      backgroundColor: "rgba(255,255,255,0.9)",
                      boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <svg
                      className="w-[15px] h-[15px]"
                      viewBox="0 0 15 15"
                      fill="var(--color-app-badge)"
                    >
                      <path d={PENCIL_PATH} />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-4">
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    fontSize: "18px",
                    lineHeight: "24px",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {p.name}
                </h3>
                {p.originalPrice && (
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "15px",
                      lineHeight: "20px",
                      color: "var(--color-app-badge)",
                      textDecoration: "line-through",
                    }}
                  >
                    {p.originalPrice}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: "22px",
                    lineHeight: "28px",
                    color: "var(--color-brand-orange)",
                  }}
                >
                  {p.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {mostrarAgregarProducto && (
        <AgregarProducto
          onCancel={() => setMostrarAgregarProducto(false)}
          onSubmit={handleAgregarProducto}
        />
      )}

      {mostrarSeguidores && (
        <SeguidoresModal
          datos={perfilVendedorSocial}
          initialTab="seguidores"
          onClose={() => setMostrarSeguidores(false)}
        />
      )}
    </div>
  );
}