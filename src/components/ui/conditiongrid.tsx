"use client";

import { MoveUpRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import React from "react";

export interface ProjectsTypes {
  id: string;
  img: string;
  title: string;
  des: string;
}

const projects: ProjectsTypes[] = [
  {
    id: "01",
    img: "https://cdn.21st.dev/assets/mirror/f2/f267202371f1d7603ebceea7cbcac251b6a9f5b035f6ff48146e0e29f85736d8.jpg",
    title: "Distrokings",
    des: "We make your logo communicate with your customers more than words ever could",
  },
  {
    id: "02",
    img: "https://cdn.21st.dev/assets/mirror/ac/ac1b54879a9289f1cf908a8e6e7e4da09828ddd43eef95cae78a0c71cb748c29.jpg",
    title: "Profitables",
    des: "We are dedicated to unlocking your business potential through precision development",
  },
  {
    id: "03",
    img: "https://cdn.21st.dev/assets/mirror/94/94876618573b337e94fc0f2716364c23a6f4e486ccb75e5a25a91af75dd30ca5.jpg",
    title: "Topserve-copiers",
    des: "We are dedicated to unlocking your business potential through precision development",
  },
  {
    id: "04",
    img: "https://cdn.21st.dev/assets/mirror/fc/fc8b7c4531f5c2a277663830ae19cac5569b9e36c97a65e3bd6a515f4435aeb9.jpg",
    title: "Labramart.",
    des: "We specialize in crafting marketing solutions that propel your brand to new heights",
  },
];

export default function ConditionGrid() {
  return (
    <section
      className="condition-grid-section bg-[#F7F6F2] w-full"
      style={{
        padding: "0 clamp(16px, 2.5vw, 40px) 48px",
      }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-2 sm:gap-3 overflow-hidden">
          {projects.map((project, index) => {
            // Row 1: Left = 8 cols (wide), Right = 4 cols (narrow)
            // Row 2: Left = 4 cols (narrow), Right = 8 cols (wide)
            let colSpanClass = "sm:col-span-6 col-span-12";
            if (index === 0) {
              colSpanClass = "sm:col-span-8 col-span-12";
            } else if (index === 1) {
              colSpanClass = "sm:col-span-4 col-span-12";
            } else if (index === 2) {
              colSpanClass = "sm:col-span-4 col-span-12";
            } else if (index === 3) {
              colSpanClass = "sm:col-span-8 col-span-12";
            }

            return (
              <motion.article
                key={project.id ?? project.title}
                initial={{ y: 35, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.55, delay: index * 0.08 }}
                viewport={{ once: true }}
                className={`relative ${colSpanClass} group cursor-pointer`}
              >
                <div className="w-full relative overflow-hidden rounded-2xl bg-[#EFECE6] h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px]">
                  <Image
                    src={project.img}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 800px"
                    className="object-cover rounded-2xl transition-transform duration-700 ease-out group-hover:scale-105"
                    priority={index < 2}
                  />

                  {/* Subtle hover overlay and interactive indicator */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div className="absolute bottom-3 left-3 right-3 text-white flex justify-between items-center z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <h3 className="text-xs sm:text-sm font-semibold tracking-wider uppercase bg-black/85 backdrop-blur-md text-white rounded-lg py-1.5 px-3 shadow-sm">
                      {project.title}
                    </h3>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 text-white grid place-content-center rounded-full bg-black/85 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <MoveUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { ConditionGrid };
