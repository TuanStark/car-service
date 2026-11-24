import React from "react";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { garageService } from "@/features/garages/services/garage.service";
import { contentService } from "@/features/content/blog.service";
import { EcommerceHome } from "@/features/marketing/components/ecommerce-home";

export default function HomePage() {
  const categories = catalogService.getAllCategories();
  const products = catalogService.getAllProducts();
  const garages = garageService.getAllGarages();
  const featuredGarage = garageService.getFeaturedGarage();
  const cities = garageService.getCities();
  const articles = contentService.getAllArticles();

  return (
    <EcommerceHome
      categories={categories}
      products={products}
      garages={garages}
      featuredGarage={featuredGarage}
      cities={cities}
      articles={articles}
    />
  );
}
