import React from "react";
import { notFound } from "next/navigation";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { garageService } from "@/features/garages/services/garage.service";
import { ProductDetailClient } from "@/features/catalog/components/product-detail-client";

export function generateStaticParams() {
  return catalogService.getAllProducts().map((p) => ({ slug: p.slug }));
}

export default async function ServiceProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = catalogService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const supportedGarages = product.supportedGarageIds
    .map((id) => garageService.getGarageById(id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const relatedProducts = catalogService.getRelatedProducts(product, 4);

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs
        items={[
          { label: "Cửa hàng dịch vụ", href: ROUTES.SERVICES },
          {
            label: product.categoryLabel,
            href: `${ROUTES.SERVICES}?danh-muc=${product.categoryId}`,
          },
          { label: product.name },
        ]}
      />
      <ProductDetailClient
        product={product}
        supportedGarages={supportedGarages}
        relatedProducts={relatedProducts}
      />
    </div>
  );
}

