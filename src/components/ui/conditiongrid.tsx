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
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    title: "Atelier Poplin Edition",
    des: "Crisp Italian poplin tailored with architectural lines and mother-of-pearl closures",
  },
  {
    id: "02",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    title: "Heavyweight Boxy Series",
    des: "Cut from 300gsm dense combed cotton jersey with sculpted dropped shoulders",
  },
  {
    id: "03",
    img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    title: "Oxford Structured Weave",
    des: "Minimalist collared overshirt crafted from heavyweight Italian structured cotton",
  },
  {
    id: "04",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    title: "Chalk Minimalist Silhouette",
    des: "Clean architectural crewneck cut from 320gsm premium off-white combed jersey",
  },
];

export default function ConditionGrid() {
  return (
    <section className="condition-grid-section" style={{ maxWidth: "1560px", margin: "0 auto", padding: "16px clamp(16px, 2.5vw, 36px) 64px" }}>
      <div className="grid grid-cols-12 gap-4 overflow-hidden">
        {projects.map((project, index) => {
          let colSpanClass = "sm:col-span-6 col-span-12";
          if (index === 0) {
            colSpanClass = "sm:col-span-5 col-span-12";
          } else if (index === 1) {
            colSpanClass = "sm:col-span-7 col-span-12";
          } else if (index === projects.length - 2) {
            colSpanClass = "sm:col-span-7 col-span-12";
          } else if (index === projects.length - 1) {
            colSpanClass = "sm:col-span-5 col-span-12";
          }
          return (
            <motion.article
              key={project.id ?? project.title}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ ease: "easeOut", duration: 0.6 }}
              viewport={{ once: true }}
              className={`relative ${colSpanClass} group`}
              style={{ minHeight: "360px" }}
            >
              <div className="w-full h-full relative overflow-hidden rounded-xl bg-[#EFECE6]" style={{ height: "420px" }}>
                <Image
                  src={project.img}
                  alt={project.title}
                  height={600}
                  width={1200}
                  className="h-full w-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-105"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              </div>
              <div className="absolute lg:bottom-4 bottom-2 text-white w-full p-4 flex justify-between items-center z-10 pointer-events-auto">
                <div>
                  <h3 className="lg:text-base text-xs font-semibold tracking-wider uppercase bg-black/80 backdrop-blur-md text-white rounded-lg py-2 px-3.5 inline-block shadow-sm">
                    {project.title}
                  </h3>
                  <p className="text-[11px] text-white/80 mt-1 max-w-[280px] hidden sm:block">
                    {project.des}
                  </p>
                </div>
                <div className="lg:w-11 w-9 lg:h-11 h-9 text-white grid place-content-center rounded-full bg-black/85 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-black">
                  <MoveUpRight className="w-4 h-4" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export { ConditionGrid };
