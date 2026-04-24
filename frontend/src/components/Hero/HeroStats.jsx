import React from "react";

const HeroStats = () => {
    return (
        <div className="absolute bottom-0 right-0 z-10 hidden md:flex items-center gap-6 px-8 py-4 bg-white/10 backdrop-blur-md border-t border-l border-white/15 rounded-tl-2xl">

        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">12K+</span>
            <span className="text-[11px] text-white/60 mt-1">Productos</span>
        </div>

        <div className="w-px h-9 bg-white/20"></div>

        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">98%</span>
            <span className="text-[11px] text-white/60 mt-1">Satisfacción</span>
        </div>

        <div className="w-px h-9 bg-white/20"></div>

        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">50+</span>
            <span className="text-[11px] text-white/60 mt-1">Marcas</span>
        </div>

        </div>
    );
};

export default HeroStats;