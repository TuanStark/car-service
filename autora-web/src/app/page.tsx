import React from "react";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { garageService } from "@/features/garages/services/garage.service";
import { contentService } from "@/features/content/blog.service";
import { NhatQuangStyleHome } from "@/features/home/components/nhatquang-style-home";

export default function HomePage() {
  const products = catalogService.getAllProducts();
  const garages = garageService.getAllGarages();
  const articles = contentService.getAllArticles();

  return (
    <NhatQuangStyleHome
      products={products}
      garages={garages}
      articles={articles}
    />
  );
}
