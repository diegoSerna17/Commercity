import React, { useState } from "react";
import {
  Search,
  Bell,
  ShoppingCart,
  User,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [search, setSearch] = useState("");

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 
        bg-bg-glass backdrop-blur-xl border-b border-border-light 
        shadow-navbar">

        <div className="max-w-[94%] mx-auto h-full px-6 flex items-center gap-8">

            <a href="#" className="text-xl font-extrabold text-secondary tracking-tight shrink-0">
              Commer<span className="text-primary relative">City<span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary/40 blur-sm"></span></span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium flex-1">

            <a
                href="#"
                className="relative text-text-main font-semibold"
            >
                Inicio
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary rounded-full"></span>
            </a>

            <a
                href="#"
                className="text-text-muted hover:text-text-main transition-all duration-300 flex items-center gap-1 group"
            >
                Categorías
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            </a>

            <a
                href="#"
                className="text-text-muted hover:text-text-main transition-all duration-300 flex items-center gap-1 group"
            >
                Opciones
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            </a>

            </nav>

            <div className="hidden lg:flex items-center gap-2 
            bg-bg-glass-light backdrop-blur-md border border-border-gray 
            rounded-full px-4 py-2 flex-1 max-w-xs 
            focus-within:ring-2 focus-within:ring-accent-blue
            transition-all duration-300 shadow-card">

            <Search size={16} className="text-text-light" />

            <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none px-2 text-sm w-full placeholder-text-light"
            />

            {search && (
                <button
                onClick={() => setSearch("")}
                className="text-text-light hover:text-text-secondary text-xs transition"
                >
                ✕
                </button>
            )}
            </div>

            <div className="flex items-center gap-2 ml-auto">

            {[ 
                { icon: <Search size={18} />, mobile: true },
                { icon: <Bell size={18} /> },
                { icon: <ShoppingCart size={18} />, cart: true },
                { icon: <User size={18} />, isLogin: true },
            ].map((item, i) => (
                item.isLogin ? (
                    <Link
                        to="/login"
                        key={i}
                        className="relative w-10 h-10 rounded-full flex items-center justify-center 
                        text-text-secondary 
                        bg-bg-glass-light backdrop-blur-md border border-border-gray 
                        hover:bg-bg-primary hover:shadow-card hover:-translate-y-[1px] 
                        transition-all duration-300"
                    >
                        {item.icon}
                    </Link>
                ) : (
                <button
                    key={i}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center 
                    text-text-secondary 
                    bg-bg-glass-light backdrop-blur-md border border-border-gray 
                    hover:bg-bg-primary hover:shadow-card hover:-translate-y-[1px] 
                    transition-all duration-300 
                    ${item.mobile ? "lg:hidden" : ""}`}
                >
                {item.icon}

                {item.cart && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 
                    bg-accent-red text-white text-[9px] font-bold 
                    rounded-full flex items-center justify-center 
                    shadow-card">
                    3
                    </span>
                )}
                </button>
                )
            ))}

            </div>

        </div>
        </header>
    );
};

export default Navbar;