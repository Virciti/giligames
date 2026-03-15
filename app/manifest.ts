import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GiiGames - Monster Truck Learning Adventure",
    short_name: "GiiGames",
    description:
      "Educational monster truck game for young children ages 4-7",
    start_url: "/",
    display: "standalone",
    background_color: "#38bdf8",
    theme_color: "#0284c7",
    orientation: "any",
    categories: ["education", "games", "kids"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
