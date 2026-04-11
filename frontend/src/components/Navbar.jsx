import React, { useState } from "react";
import {
  Search,
  Bell,
  ShoppingCart,
  User,
  ChevronDown,
} from "lucide-react";

const Navbar = () => {
    const [search, setSearch] = useState("");

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center gap-8">


            <a href="#" className="text-xl font-black tracking-tight shrink-0">
            Commer<span className="text-blue-600">City</span>
            </a>


            <nav className="hidden md:flex items-center gap-7 text-sm font-medium flex-1">
            <a href="#" className="text-[#111] font-semibold border-b-2 border-blue-600 pb-0.5">
                Inicio
            </a>

            <a href="#" className="text-gray-500 hover:text-[#111] transition-colors flex items-center gap-1">
                Categorías <ChevronDown size={14} />
            </a>

            <a href="#" className="text-gray-500 hover:text-[#111] transition-colors flex items-center gap-1">
                Opciones <ChevronDown size={14} />
            </a>
            </nav>


            <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-2 flex-1 max-w-xs focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search size={16} className="text-gray-400" />

            <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none px-2 text-sm w-full placeholder-gray-400"
            />


            {search && (
                <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 text-xs"
                >
                ✕
                </button>
            )}
            </div>


            <div className="flex items-center gap-1 ml-auto">

            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors lg:hidden">
                <Search size={18} />
            </button>

            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                <Bell size={18} />
            </button>

            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors relative">
                <ShoppingCart size={18} />
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
                </span>
            </button>

            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                <User size={18} />
            </button>

            </div>
        </div>
        </header>
    );
};

export default Navbar;