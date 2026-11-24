"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Car,
  Wrench,
  MessageCircle,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Button } from "@/components/ui/button";
import type { ServiceProduct } from "@/features/catalog/types/service.types";
import type { GarageEntity } from "@/features/garages/types/garage.types";
import type { BlogArticle } from "@/features/content/blog.service";
import { ServiceProductCard } from "@/features/catalog/components/service-product-card";
import { cn } from "@/core/lib/cn";

interface NhatQuangStyleHomeProps {
  readonly products: readonly ServiceProduct[];
  readonly garages: readonly GarageEntity[];
  readonly articles: readonly BlogArticle[];
}

const CAR_BRANDS = [
  "Toyota",
  "Mazda",
  "Hyundai",
  "Honda",
  "Kia",
  "Ford",
  "VinFast",
  "Mercedes-Benz",
] as const;

const BRAND_BANNERS = [
  {
    tag: "Thương hiệu",
    name: "MICHELIN & BRIDGESTONE",
    image: "/images/service-tires.jpg",
    href: `${ROUTES.SERVICES}?danh-muc=lop-va-mam-xe`,
  },
  {
    tag: "Thương hiệu",
    name: "MOBIL 1 & TOTAL",
    image: "/images/service-maintenance.jpg",
    href: `${ROUTES.SERVICES}?danh-muc=bao-duong-dinh-ky`,
  },
  {
    tag: "Thương hiệu",
    name: "3M & SONAX CARE",
    image: "/images/service-detailing.jpg",
    href: `${ROUTES.SERVICES}?danh-muc=cham-soc-detailing`,
  },
] as const;

const FOUR_PILLARS = [
  {
    num: "01",
    title: "Niềm tin",
    desc: "Dịch vụ chính hãng, nguồn gốc phụ tùng rõ ràng và chính sách bảo hành minh bạch giúp khách hàng yên tâm tuyệt đối khi giao xe cho AUTORA. Mỗi khuyến nghị kỹ thuật đều dựa trên nhu cầu thực tế.",
  },
  {
    num: "02",
    title: "An toàn",
    desc: "Ưu tiên các vật tư và quy trình đạt chuẩn quốc tế về phanh, độ bám lốp và hiệu suất vận hành. Mọi hạng mục lắp đặt – cân bằng – kiểm định đều được kiểm tra kỹ lưỡng trước khi bàn giao.",
  },
  {
    num: "03",
    title: "Giá trị",
    desc: "Tối ưu chi phí sử dụng lâu dài bằng bảng giá VNĐ công khai minh bạch và tư vấn bảo dưỡng đúng mốc km, giúp chiếc xe bền bỉ và tiết kiệm nhiên liệu hơn theo thời gian.",
  },
  {
    num: "04",
    title: "Chuyên nghiệp",
    desc: "Đặt lịch trước theo khung giờ, đội ngũ cố vấn và kỹ thuật viên chuẩn hóa quy trình tiếp nhận, xử lý nhanh gọn và lưu lịch sử vào Sổ bảo dưỡng điện tử của bạn.",
  },
] as const;

export function NhatQuangStyleHome({
  products,
  garages,
  articles,
}: NhatQuangStyleHomeProps) {
  const router = useRouter();

  // Hero Video Bottom Pill Finder State
  const [finderMode, setFinderMode] = useState<"car" | "garage">("car");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  // SEC 2 Collection Tabs
  const [activeCollection, setActiveCollection] = useState<
    "bao-duong" | "detailing" | "lop-sua-chua"
  >("bao-duong");

  const collectionSubtitle =
    activeCollection === "bao-duong"
      ? "Các gói bảo dưỡng định kỳ & dầu nhớt chính hãng"
      : activeCollection === "detailing"
      ? "Các gói chăm sóc nội ngoại thất & phủ Ceramic 9H"
      : "Các dịch vụ lốp xe, phanh & kiểm tra kỹ thuật";

  const collectionProducts =
    activeCollection === "bao-duong"
      ? products
          .filter((p) => p.categoryId === "bao-duong-dinh-ky")
          .slice(0, 4)
      : activeCollection === "detailing"
      ? products
          .filter((p) => p.categoryId === "cham-soc-detailing")
          .slice(0, 4)
      : products
          .filter(
            (p) =>
              p.categoryId === "lop-va-mam-xe" ||
              p.categoryId === "sua-chua-o-to" ||
              p.categoryId === "dien-va-dieu-hoa"
          )
          .slice(0, 4);

  const handleFinderGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (finderMode === "garage") {
      router.push(ROUTES.GARAGES);
      return;
    }
    const params = new URLSearchParams();
    if (selectedBrand !== "all") params.set("q", selectedBrand);
    router.push(
      params.toString()
        ? `${ROUTES.SERVICES}?${params.toString()}`
        : ROUTES.SERVICES
    );
  };

  return (
    <div className="bg-surface">
      {/* FULL-VIEWPORT VIDEO HERO (100dvh for iOS Notch/Dynamic Island) + BOTTOM PILL FINDER */}
      <section className="relative h-[100dvh] min-h-[580px] hero-mobile-landscape w-full overflow-hidden bg-slate-900">
        <video
          src="/videos/hero-slider.mp4"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/featured-garage.jpg"
          className="h-full w-full object-cover object-center"
        />

        {/* Subtle Top & Bottom Gradient so Transparent Header & Bottom Bar stay crisp */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />

        {/* Bottom Floating Yellow + Cobalt Pill Search Bar (Responsive 320px -> Foldable -> Desktop) */}
        <div className="absolute inset-x-0 bottom-20 sm:bottom-8 z-20 px-safe">
          <form
            onSubmit={handleFinderGo}
            className="mx-auto flex w-full max-w-xl flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            {/* Left Yellow Mode Switcher Pill */}
            <div className="flex h-12 shrink-0 items-center rounded-md bg-[#FFE600] p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setFinderMode("car")}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded px-3 text-xs font-extrabold transition-colors cursor-pointer",
                  finderMode === "car"
                    ? "bg-black/10 text-slate-950"
                    : "text-slate-900/70 hover:text-slate-950"
                )}
              >
                <Car className="h-4 w-4" />
                <span>Xe ô tô</span>
              </button>
              <button
                type="button"
                onClick={() => setFinderMode("garage")}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded px-2.5 text-xs font-extrabold transition-colors cursor-pointer",
                  finderMode === "garage"
                    ? "bg-black/10 text-slate-950"
                    : "text-slate-900/70 hover:text-slate-950"
                )}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gara</span>
              </button>
            </div>

            {/* Right Cobalt Blue Selector + Arrow Button */}
            <div className="flex h-12 flex-1 items-center justify-between gap-2 rounded-md bg-[#0047AB] px-3 text-white shadow-lg">
              {finderMode === "car" ? (
                <select
                  aria-label="Tìm dịch vụ theo dòng xe"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="h-full flex-1 bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="text-ink">
                    Tìm dịch vụ theo dòng xe
                  </option>
                  {CAR_BRANDS.map((b) => (
                    <option key={b} value={b} className="text-ink">
                      Dòng xe: {b}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  aria-label="Tìm gara theo khu vực"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="h-full flex-1 bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="text-ink">
                    Tìm gara uy tín gần bạn
                  </option>
                  <option value="hcm" className="text-ink">
                    TP. Hồ Chí Minh
                  </option>
                  <option value="hn" className="text-ink">
                    Hà Nội
                  </option>
                  <option value="dn" className="text-ink">
                    Đà Nẵng
                  </option>
                </select>
              )}

              <button
                type="submit"
                aria-label="Tìm kiếm ngay"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#2563EB] text-white hover:bg-[#3B82F6] transition-colors cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Bottom-Right Floating Contact Pill ("Liên hệ") */}
        <Link
          href={ROUTES.CONTACT}
          className="absolute bottom-6 right-5 z-20 hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-lg hover:bg-surface-subtle transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5 text-brand" />
          <span>Liên hệ</span>
        </Link>
      </section>

      {/* SEC 1: Những thương hiệu của chúng tôi (3 Brand Cards) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink mb-8">
          Những thương hiệu của chúng tôi
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {BRAND_BANNERS.map((b) => (
            <Link
              key={b.name}
              href={b.href}
              className="group relative h-72 overflow-hidden rounded-xl border border-line bg-slate-900 shadow-xs"
            >
              <Image
                src={b.image}
                alt={b.name}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <span className="text-xs font-medium text-slate-200 block">
                  {b.tag}
                </span>
                <h3 className="mt-1 font-display text-2xl font-extrabold uppercase">
                  {b.name}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 group-hover:translate-x-1 transition-transform">
                  Khám phá <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEC 2: Sản phẩm nổi bật (3 Tabs + Subtitle + 4-Col Grid) */}
      <section className="border-t border-line bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-4">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
              Sản phẩm nổi bật
            </h2>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "bao-duong", label: "Bảo dưỡng & Dầu nhớt" },
                { id: "detailing", label: "Detailing & Nội thất" },
                { id: "lop-sua-chua", label: "Lốp & Kỹ thuật" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setActiveCollection(
                      t.id as "bao-duong" | "detailing" | "lop-sua-chua"
                    )
                  }
                  className={cn(
                    "rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer border",
                    activeCollection === t.id
                      ? "bg-brand text-white border-brand"
                      : "bg-surface text-ink-secondary border-line hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <h3 className="mt-6 font-display text-xl font-bold uppercase text-ink-secondary">
            {collectionSubtitle}
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {collectionProducts.map((prd) => (
              <ServiceProductCard key={prd.id} product={prd} />
            ))}
          </div>
        </div>
      </section>

      {/* SEC 3: Dual Marquee Section */}
      <section className="border-y border-line bg-brand py-5 text-white overflow-hidden space-y-2">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wider">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="inline-flex items-center gap-8">
              <span>Niềm tin bền vững cho từng hành trình</span>
              <span className="text-amber-300">•</span>
            </span>
          ))}
        </div>
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-blue-100">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="inline-flex items-center gap-8">
              <span>Niềm tin</span>
              <span>•</span>
              <span>An toàn</span>
              <span>•</span>
              <span>Giá trị</span>
              <span>•</span>
              <span>Chuyên nghiệp</span>
              <span>•</span>
            </span>
          ))}
        </div>
      </section>

      {/* SEC 4: 01 Niềm tin • 02 An toàn • 03 Giá trị • 04 Chuyên nghiệp */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FOUR_PILLARS.map((p) => (
            <div key={p.num} className="border-t-2 border-brand pt-5 space-y-2.5">
              <span className="font-mono text-sm font-extrabold text-brand">
                {p.num}
              </span>
              <h2 className="font-display text-3xl font-extrabold uppercase text-ink">
                {p.title}
              </h2>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 5: Tại sao là AUTORA Car Service? */}
      <section className="border-y border-line bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center fold-dual-grid">
            <div className="lg:col-span-6 space-y-5">
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase leading-tight text-ink">
                Tại sao là AUTORA Car Service?
              </h2>
              <p className="text-base leading-relaxed text-ink-secondary">
                AUTORA sẽ phát triển thành nền tảng dịch vụ bảo dưỡng, lốp xe và dầu nhớt hàng đầu tại Việt Nam với sự đổi mới không ngừng — giúp mọi chủ xe tìm gara uy tín, xem giá VNĐ minh bạch và đặt lịch dễ dàng.
              </p>
              <Button variant="primary" size="lg" asChild>
                <Link href={ROUTES.GARAGES}>
                  Khám phá <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                <Image
                  src="/images/garage-card-alt.jpg"
                  alt="Tại sao chọn AUTORA Car Service"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEC 6: Blog chia sẻ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
            Blog chia sẻ
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.BLOG}>Tất cả</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((art) => (
            <article
              key={art.id}
              className="group relative h-80 overflow-hidden rounded-xl border border-line bg-slate-900 shadow-xs"
            >
              <Image
                src={art.coverImage}
                alt={art.title}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white space-y-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-200">
                  <Calendar className="h-3.5 w-3.5" />
                  {art.publishedDate}
                </span>
                <h3 className="font-display text-xl font-bold uppercase leading-snug group-hover:text-amber-300 transition-colors">
                  <Link href={ROUTES.BLOG_DETAIL(art.slug)}>{art.title}</Link>
                </h3>
                <Link
                  href={ROUTES.BLOG_DETAIL(art.slug)}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase text-amber-300"
                >
                  Khám phá <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
