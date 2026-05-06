import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "הדר ביוטי",
    short_name: "הדר ביוטי",
    description: "ניהול עסק יופי — הכנסות, הוצאות ורווח נטו",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF9",
    theme_color: "#9C7A6F",
    orientation: "portrait-primary",
    lang: "he",
    dir: "rtl",
    categories: ["business", "finance"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
