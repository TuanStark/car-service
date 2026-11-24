import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Calendar, ArrowRight, User } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { contentService } from "@/features/content/blog.service";

export const metadata: Metadata = {
  title: "Cẩm nang chăm sóc & Bảo dưỡng ô tô — AUTORA",
  description:
    "Kiến thức bảo dưỡng ô tô định kỳ, kinh nghiệm chăm sóc xe detailing và an toàn kỹ thuật dành cho chủ xe Việt Nam.",
};

export default function BlogListPage() {
  const articles = contentService.getAllArticles();

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Cẩm nang chăm xe" }]} />

      <div className="border-b border-line bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand">
            KIẾN THỨC KỸ THUẬT Ô TÔ THỰC CHIẾN
          </span>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl font-extrabold uppercase text-ink">
            CẨM NANG CHĂM XE & BẢO DƯỠNG
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {articles.map((art) => (
          <article
            key={art.id}
            className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xs hover:border-brand/50 hover:shadow-md transition-all"
          >
            <Link
              href={ROUTES.BLOG_DETAIL(art.slug)}
              className="relative h-52 w-full bg-surface-subtle block"
            >
              <Image
                src={art.coverImage}
                alt={art.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-sm bg-brand px-2.5 py-0.5 text-xs font-bold text-ink-inverse">
                {art.category}
              </span>
            </Link>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex items-center gap-3 text-xs text-ink-secondary">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-brand" />
                    {art.publishedDate}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-brand" />
                    {art.author}
                  </span>
                </div>

                <h2 className="mt-2.5 font-display text-2xl font-bold uppercase leading-snug text-ink hover:text-brand">
                  <Link href={ROUTES.BLOG_DETAIL(art.slug)}>{art.title}</Link>
                </h2>

                <p className="mt-2.5 text-xs leading-relaxed text-ink-secondary">
                  {art.excerpt}
                </p>
              </div>

              <Link
                href={ROUTES.BLOG_DETAIL(art.slug)}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand"
              >
                Đọc bài viết <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
