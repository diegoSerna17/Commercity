import { motion } from "framer-motion";

const categories = [
    {
        label: "Nueva electrónica",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
    },
    {
        label: "Coleccionables",
        image: "https://images.unsplash.com/photo-1701808235569-e6ff5c94b9a9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        label: "Partes y accesorios",
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80",
    },
    {
        label: "Moda",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    },
    {
        label: "Salud y belleza",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
    },
    {
        label: "Hogar y jardín",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    },
    ];

    const Categories = () => {
    return (
        <section className="max-w-11/12 mx-auto px-4 md:px-8 py-2 pb-11">

        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-main">
            ¿Qué estás buscando?
            </h2>
            <a href="#" className="text-sm font-semibold text-primary hover:underline">
            Ver todas →
            </a>
        </div>


        <div className="flex md:grid md:grid-cols-6 gap-4 overflow-x-auto md:overflow-visible pb-2 scrollbar-hide">

            {categories.map((cat, i) => (
            <motion.button
                key={i}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group min-w-[120px] md:min-w-0 flex flex-col items-center gap-3 text-center"
            >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-shadow duration-300">

                <img
                    src={cat.image}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <span className="text-xs md:text-sm font-medium text-text-secondary group-hover:text-primary transition-colors duration-200 leading-tight">
                {cat.label}
                </span>

            </motion.button>
            ))}

        </div>
        </section>
    );
};

export default Categories;