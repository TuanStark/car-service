import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentService } from "@/features/content/blog.service";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { formatVND } from "@/core/formatters/currency";

export function generateStaticParams() {
  return contentService.getAllArticles().map((a) => ({ slug: a.slug }));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = contentService.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const recommended = catalogService.getFeaturedProducts(3);

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs
        items={[
          { label: "Cẩm nang chăm xe", href: ROUTES.BLOG },
          { label: article.title },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <article className="lg:col-span-8 rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-xs space-y-6">
          <Badge variant="default">{article.category}</Badge>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase leading-tight text-ink">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary border-b border-line pb-4">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-brand" />
              {article.author}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              {article.publishedDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand" />
              {article.readTime}
            </span>
          </div>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-line bg-surface-subtle">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>

          <div className="space-y-4 text-base leading-relaxed text-ink">
            {article.content.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        </article>

        {/* Sidebar Recommended Service Packages */}
        <aside className="lg:col-span-4">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4 sticky top-28">
            <h2 className="font-display text-xl font-bold uppercase text-ink border-b border-line pb-3">
              GÓI DỊCH VỤ LIÊN QUAN
            </h2>
            <div className="space-y-3">
              {recommended.map((prd) => (
                <Link
                  key={prd.id}
                  href={ROUTES.SERVICE_DETAIL(prd.slug)}
                  className="block rounded-lg border border-line bg-surface-subtle/50 p-3.5 hover:border-brand transition-colors"
                >
                  <strong className="block text-xs font-semibold text-ink">
                    {prd.name}
                  </strong>
                  <span className="mt-1 block font-display text-lg font-extrabold text-brand">
                    {formatVND(prd.priceVnd)}
                  </span>
                </Link>
              ))}
            </div>
            <Button variant="primary" size="md" asChild className="w-full">
              <Link href={ROUTES.SERVICES}>
                ĐẾN CỬA HÀNG DỊCH VỤ <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
