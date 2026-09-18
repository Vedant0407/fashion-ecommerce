export type StoreStory = {
  id: string;
  title: string;
  caption?: string;
  image: string;
  link_url?: string;
  link_text?: string;
  duration?: number;
  active: boolean;
  order_index?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
};

export const DEFAULT_STORIES: StoreStory[] = [
  {
    id: "story-drop-1",
    title: "DROP 01 // AUTUMN ATELIER",
    caption: "Architectural Italian Poplin shirting engineered with sculptural collar stances.",
    image: "/atelier-shirt.jpg",
    link_url: "/products/tailored-poplin-shirt",
    link_text: "EXPLORE PIECE",
    duration: 5,
    active: true,
    order_index: 0,
    views_count: 142,
    created_at: "2026-09-17T18:40:14.499Z",
  },
  {
    id: "story-heavyweight-tee",
    title: "300GSM COMBED JERSEY",
    caption: "Heavyweight drop-shoulder tee that moves with quiet elegance.",
    image: "/atelier-tshirt.jpg",
    link_url: "/products/oversized-black-tee",
    link_text: "VIEW PIECE",
    duration: 5,
    active: true,
    order_index: 1,
    views_count: 98,
    created_at: "2026-09-17T18:40:14.750Z",
  },
  {
    id: "story-oxford-overshirt",
    title: "STRUCTURED OXFORD WEAVE",
    caption: "Deep charcoal Italian cotton overshirt for layered architectural silhouettes.",
    image: "/atelier-oxford-shirt.jpg",
    link_url: "/products/charcoal-oxford-overshirt",
    link_text: "EXPLORE PIECE",
    duration: 5,
    active: true,
    order_index: 2,
    views_count: 76,
    created_at: "2026-09-17T18:40:15.000Z",
  },
  {
    id: "story-minimalist-chalk",
    title: "MINIMALIST CHALK PALETTE",
    caption: "Crisp luxury drop-shoulder crewneck tailored in Milan.",
    image: "/atelier-white-tee.jpg",
    link_url: "/products/minimalist-chalk-tee",
    link_text: "VIEW SILHOUETTE",
    duration: 5,
    active: true,
    order_index: 3,
    views_count: 54,
    created_at: "2026-09-17T18:40:15.242Z",
  },
];
