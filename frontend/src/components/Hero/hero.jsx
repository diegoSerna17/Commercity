import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";

import "swiper/css";
import "swiper/css/effect-fade";

import HeroStats from "./HeroStats";

const slides = [
    {
        image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80",
        title: "Transforma tu estilo",
        subtitle: "Eleva tu vida",
    },
    {
        image: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=1400&q=80",
        title: "Nueva colección 2026",
        subtitle: "Diseño único",
    },
    ];

    const Hero = () => {
    const swiperRef = useRef(null);

    return (
        <section className="bg-[#ffffff] min-h-screen flex items-center justify-center mt-8 px-1 md:px-8 py-8">

        <div className="relative w-full max-w-[96%] h-[85vh] rounded-3xl overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.22)]">

            <Swiper
            onSwiper={(s) => (swiperRef.current = s)}
            modules={[Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            autoplay={{ delay: 8000, disableOnInteraction: false }}
            speed={1500}
            loop
            className="h-full"
            >
            {slides.map((slide, index) => (
                <SwiperSlide key={index}>

                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.image})` }}
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                />

                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/45 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />


                <div className="relative z-10 flex items-center h-full px-8 md:px-16">
                    <div className="max-w-xl">

                    <AnimatePresence mode="wait">

                        <motion.h1
                        key={`title-${index}`}
                        initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -24, filter: "blur(4px)" }}
                        transition={{ duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-4xl md:text-6xl lg:text-[5rem] font-black text-white mb-5 leading-[1.05] tracking-tight"
                        >
                        {slide.title}
                        <br />
                        <span className="relative inline-block mt-1">
                            <span className="text-primary italic relative z-10 ">
                            {slide.subtitle}
                            </span>
                            <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-primary/60 rounded-full blur-[2px]" />
                        </span>
                        </motion.h1>

                        <motion.p
                        key={`desc-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
                        className="text-white/70 mb-9 text-sm md:text-base leading-relaxed max-w-md tracking-wide"
                        >
                        Descubre productos únicos diseñados para destacar tu estilo.
                        En <span className="text-white font-semibold">CommerCity</span> encuentras calidad, tendencias y ofertas exclusivas en un solo lugar.
                        </motion.p>

                        <motion.div
                        key={`btns-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.45, duration: 0.6 }}
                        className="flex flex-wrap gap-3"
                        >
                        <button className="px-7 py-3.5 bg-primary text-white text-sm font-semibold rounded-full  border-white/25 bg-white/10 backdrop-blur-md  hover:-translate-y-0.5 transition-all duration-300">
                            Explorar productos
                        </button>

                        </motion.div>

                    </AnimatePresence>
                    </div>
                </div>

                </SwiperSlide>
            ))}
            </Swiper>

            <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5">
            <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/25 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
            <button
                onClick={() => swiperRef.current?.slideNext()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/25 hover:border-white/40 hover:translate-y-0.5 transition-all duration-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            </div>

            <div className="absolute bottom-1 right-1">
            <HeroStats />
            </div>

        </div>
        </section>
    );
};

export default Hero;