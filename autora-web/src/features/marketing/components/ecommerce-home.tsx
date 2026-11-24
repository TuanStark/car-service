"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  ReceiptText,
  CalendarClock,
  FileCheck2,
  ArrowRight,
  Star,
  MapPin,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatStartingVND } from "@/core/formatters/currency";
import { cn } from "@/core/lib/cn";
import type {
  ServiceCategory,
  ServiceCategoryId,
  ServiceProduct,
  VehicleBodyType,
} from "@/features/catalog/types/service.types";
import type {
  CityCode,
  CityOption,
  GarageEntity,
} from "@/features/garages/types/garage.types";
import type { BlogArticle } from "@/features/content/blog.service";
import { ServiceProductCard } from "@/features/catalog/components/service-product-card";
import { GarageStoreCard } from "@/features/garages/components/garage-store-card";

interface EcommerceHomeProps {
  readonly categories: readonly ServiceCategory[];
  readonly products: readonly ServiceProduct[];
  readonly garages: readonly GarageEntity[];
  readonly featuredGarage: GarageEntity;
  readonly cities: readonly CityOption[];
  readonly articles: readonly BlogArticle[];
}

export function EcommerceHome({
  categories,
  products,
  garages,
  featuredGarage,
  cities,
  articles,
}: EcommerceHomeProps) {
  const router = useRouter();

  const [finderVehicle, setFinderVehicle] = useState<VehicleBodyType>("all");
  const [finderCategory, setFinderCategory] = useState<string>("all");
  const [finderPrice, setFinderPrice] = useState<string>("all");

  const [activeProductTab, setActiveProductTab] = useState<
    "all" | "discount" | ServiceCategoryId
  >("all");
  const [activeCityTab, setActiveCityTab] = useState<CityCode>("all");

  const handleFinderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (finderCategory !== "all") params.set("danh-muc", finderCategory);
    if (finderVehicle !== "all") params.set("loai-xe", finderVehicle);
    if (finderPrice !== "all") params.set("muc-gia", finderPrice);
    router.push(`${ROUTES.SERVICES}?${params.toString()}`);
  };

  const displayedProducts = useMemo(() => {
    if (activeProductTab === "all") return products.slice(0, 8);
    if (activeProductTab === "discount") {
      return products.filter((p) => Boolean(p.discountPercent)).slice(0, 8);
    }
    return products
      .filter((p) => p.categoryId === activeProductTab)
      .slice(0, 8);
  }, [products, activeProductTab]);

  const displayedGarages = useMemo(() => {
    if (activeCityTab === "all") return garages.slice(0, 3);
    return garages.filter((g) => g.cityCode === activeCityTab).slice(0, 3);
  }, [garages, activeCityTab]);

  return (
    <div className="bg-canvas">
      {/* SECTION 1: Daylight Open Storefront Hero + Fitment Finder + Promo Stack */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Main 8-Column Airy Daylight Hero */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:col-span-8">
            {/* Split Light Top Area + Workshop Photography Accent */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
              <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-7 workshop-grid-bg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="default">SÀN DỊCH VỤ Ô TÔ VIỆT NAM</Badge>
                  <span className="font-mono text-[11px] font-semibold text-ink-muted">
                    01 / 04 • MINH BẠCH VNĐ
                  </span>
                </div>

                <div className="my-6">
                  <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.98] tracking-tight text-ink sm:text-5xl">
                    CHĂM XE ĐÚNG CHẤT.
                    <span className="mt-1 block text-brand">
                      AN TÂM MỌI HÀNH TRÌNH.
                    </span>
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-ink-secondary leading-relaxed">
                    Chọn gói bảo dưỡng định kỳ, sửa chữa kỹ thuật và detailing chính hãng với giá VNĐ công khai tại hơn 60+ garage xác minh trên toàn quốc.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button variant="accent" size="md" asChild>
                    <Link href={ROUTES.SERVICES}>
                      KHÁM PHÁ CỬA HÀNG DỊCH VỤ
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="md" asChild>
                    <Link href={ROUTES.GARAGES}>TÌM GARAGE GẦN BẠN</Link>
                  </Button>
                </div>
              </div>

              <div className="relative min-h-[240px] md:col-span-5 bg-surface-subtle">
                <Image
                  src="/images/hero-workshop.jpg"
                  alt="Xưởng dịch vụ bảo dưỡng và chăm sóc ô tô chuyên nghiệp AUTORA"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Integrated Commercial Fitment & Package Finder Bar */}
            <div className="border-t border-line bg-surface-subtle/80 p-4">
              <form
                onSubmit={handleFinderSubmit}
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-4"
              >
                <select
                  aria-label="Chọn kiểu dáng xe"
                  value={finderVehicle}
                  onChange={(e) =>
                    setFinderVehicle(e.target.value as VehicleBodyType)
                  }
                  className="h-10 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="all">Tất cả dòng xe</option>
                  <option value="sedan">Sedan 4–5 chỗ</option>
                  <option value="suv">CUV / SUV 5–7 chỗ</option>
                  <option value="mpv">MPV / Bán tải</option>
                  <option value="ev">Xe điện (VinFast...)</option>
                </select>

                <select
                  aria-label="Chọn hạng mục dịch vụ"
                  value={finderCategory}
                  onChange={(e) => setFinderCategory(e.target.value)}
                  className="h-10 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="all">Chọn hạng mục dịch vụ</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortLabel}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Chọn khoảng giá"
                  value={finderPrice}
                  onChange={(e) => setFinderPrice(e.target.value)}
                  className="h-10 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="all">Mọi mức ngân sách</option>
                  <option value="under-500k">Dưới 500.000đ</option>
                  <option value="500k-1500k">500.000đ – 1.500.000đ</option>
                  <option value="over-1500k">Trên 1.500.000đ</option>
                </select>

                <Button type="submit" variant="primary" className="h-10 text-xs">
                  <Search className="h-3.5 w-3.5" />
                  TÌM GÓI DỊCH VỤ
                </Button>
              </form>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-secondary">
                <span>Tìm nhanh:</span>
                <Link
                  href={`${ROUTES.SERVICES}?q=ATR-BD-001`}
                  className="font-mono font-semibold text-brand hover:underline"
                >
                  ATR-BD-001
                </Link>
                <span>•</span>
                <Link
                  href={`${ROUTES.SERVICES}?q=Ceramic`}
                  className="font-medium text-brand hover:underline"
                >
                  Phủ Ceramic 9H
                </Link>
                <span>•</span>
                <Link
                  href={`${ROUTES.SERVICES}?q=20.000`}
                  className="font-medium text-brand hover:underline"
                >
                  Bảo dưỡng 20.000 km
                </Link>
              </div>
            </div>
          </div>

          {/* Right 4-Column Light Commercial Promo Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:col-span-4">
            <Link
              href={ROUTES.SERVICE_DETAIL(
                "bao-duong-dinh-ky-moc-20000km-toan-dien"
              )}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-brand/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] font-extrabold text-ink-inverse">
                    TIẾT KIỆM -16%
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-ink group-hover:text-brand">
                    COMBO BẢO DƯỠNG MỐC 20.000 KM
                  </h2>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Thay nhớt, lọc nhớt, vệ sinh phanh 4 bánh & đảo lốp
                  </p>
                </div>
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-subtle">
                  <Image
                    src="/images/service-maintenance.jpg"
                    alt="Combo bảo dưỡng 20.000km"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <strong className="font-display text-2xl font-extrabold text-brand">
                  1.350.000đ
                </strong>
                <span className="inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-accent group-hover:translate-x-1 transition-transform">
                  MUA GÓI NGAY <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            <Link
              href={ROUTES.SERVICE_DETAIL(
                "hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep"
              )}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-brand/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-sm bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-bold text-brand">
                    HOT DETAILING
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-ink group-hover:text-brand">
                    HIỆU CHỈNH SƠN & PHỦ CERAMIC 9H
                  </h2>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Tặng kèm phủ kính lái chống bám nước mưa lá sen
                  </p>
                </div>
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-subtle">
                  <Image
                    src="/images/service-detailing.jpg"
                    alt="Phủ Ceramic 9H"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <strong className="font-display text-2xl font-extrabold text-brand">
                  3.500.000đ
                </strong>
                <span className="inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-accent group-hover:translate-x-1 transition-transform">
                  XEM CHI TIẾT <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* 4-Pillar E-Commerce Service Guarantee Strip */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "100% Garage xác minh",
              sub: "Thẩm định thiết bị & tay nghề kỹ thuật",
            },
            {
              icon: ReceiptText,
              title: "Giá niêm yết minh bạch",
              sub: "Hiển thị rõ bằng VNĐ, không phí ẩn",
            },
            {
              icon: CalendarClock,
              title: "Đặt lịch ưu tiên cầu nâng",
              sub: "Đến xưởng tiếp nhận ngay không chờ",
            },
            {
              icon: FileCheck2,
              title: "Sổ bảo dưỡng điện tử",
              sub: "Lưu lịch sử ODO & hạng mục trọn đời",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3.5 rounded-lg border border-line bg-surface px-5 py-4 shadow-xs"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <strong className="block font-display text-base font-bold uppercase tracking-wide text-ink">
                    {item.title}
                  </strong>
                  <span className="block text-xs text-ink-secondary">{item.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: 3-Banner Commercial Service Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              tag: "PHỔ BIẾN NHẤT",
              title: "BẢO DƯỠNG ĐỊNH KỲ",
              sub: "Chuẩn quy trình 5.000 – 40.000 km",
              href: `${ROUTES.SERVICES}?danh-muc=bao-duong-dinh-ky`,
              img: "/images/service-maintenance.jpg",
            },
            {
              tag: "CHẨN ĐOÁN SỐ",
              title: "KIỂM TRA CHUYÊN SÂU",
              sub: "Quét lỗi OBD-II & kiểm định 32 điểm",
              href: `${ROUTES.SERVICES}?danh-muc=sua-chua-o-to`,
              img: "/images/service-repair.jpg",
            },
            {
              tag: "CÔNG NGHỆ 3D",
              title: "CHỈNH THƯỚC LÁI & LỐP",
              sub: "Cân bằng động & chỉnh độ chụm laser",
              href: `${ROUTES.SERVICES}?danh-muc=lop-va-mam-xe`,
              img: "/images/service-tires.jpg",
            },
          ].map((banner) => (
            <Link
              key={banner.title}
              href={banner.href}
              className="group flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-brand/50 hover:shadow-md"
            >
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                  {banner.tag}
                </span>
                <h3 className="mt-1 font-display text-2xl font-extrabold uppercase text-ink group-hover:text-brand">
                  {banner.title}
                </h3>
                <p className="mt-1 text-xs text-ink-secondary">{banner.sub}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-brand">
                  XEM DANH MỤC <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-subtle">
                <Image
                  src={banner.img}
                  alt={banner.title}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: Visual Category Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              KHÁM PHÁ THEO NHU CẦU
            </span>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
              DANH MỤC DỊCH VỤ Ô TÔ
            </h2>
          </div>
          <Link
            href={ROUTES.SERVICES}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand hover:underline"
          >
            Xem toàn bộ cửa hàng <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`${ROUTES.SERVICES}?danh-muc=${cat.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xs transition-all hover:border-brand hover:shadow-md"
            >
              <div className="relative h-28 w-full overflow-hidden bg-surface-subtle">
                <Image
                  src={cat.image}
                  alt={cat.shortLabel}
                  fill
                  sizes="(max-width: 640px) 50vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2.5 top-2.5 rounded-sm bg-surface/95 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand shadow-xs">
                  {cat.number}
                </span>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <h3 className="font-display text-base font-bold uppercase leading-tight text-ink group-hover:text-brand">
                  {cat.shortLabel}
                </h3>
                <p className="mt-1.5 text-[11px] font-medium text-ink-secondary">
                  {formatStartingVND(cat.startingPriceVnd)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: Featured E-Commerce Service Products Grid */}
      <section className="border-y border-line bg-surface-subtle/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                BẢNG GIÁ NIÊM YẾT THAM KHẢO
              </span>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
                GÓI DỊCH VỤ & BẢO DƯỠNG NỔI BẬT
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "Tất cả" },
                { id: "discount", label: "Đang ưu đãi" },
                { id: "bao-duong-dinh-ky", label: "Bảo dưỡng" },
                { id: "sua-chua-o-to", label: "Sửa chữa" },
                { id: "cham-soc-detailing", label: "Detailing" },
                { id: "lop-va-mam-xe", label: "Lốp & Phanh" },
              ].map((tab) => {
                const active = activeProductTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveProductTab(
                        tab.id as "all" | "discount" | ServiceCategoryId
                      )
                    }
                    className={cn(
                      "rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer",
                      active
                        ? "bg-brand text-ink-inverse border-brand"
                        : "bg-surface text-ink-secondary border-line hover:text-brand hover:border-brand/40"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayedProducts.map((product) => (
              <ServiceProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-9 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href={ROUTES.SERVICES}>
                XEM TẤT CẢ {products.length} GÓI DỊCH VỤ TRONG CỬA HÀNG
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 5: Flagship Garage Storefront */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:grid-cols-12">
          <div className="relative min-h-[300px] lg:col-span-6 bg-surface-subtle">
            <Image
              src={featuredGarage.coverImage}
              alt={featuredGarage.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge variant="solidAccent">GARAGE NỔI BẬT</Badge>
              <Badge variant="technical">{featuredGarage.bayCount} CẦU NÂNG</Badge>
            </div>
          </div>

          <div className="p-6 sm:p-9 lg:col-span-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-ink-secondary">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <strong className="text-ink">
                  {featuredGarage.rating.toFixed(1)}/5.0
                </strong>
                <span>({featuredGarage.reviewCount} đánh giá thực tế)</span>
              </div>

              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
                {featuredGarage.name}
              </h2>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                {featuredGarage.fullAddress}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                {featuredGarage.summary}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {featuredGarage.referencePrices.map((rp) => (
                  <div
                    key={rp.name}
                    className="rounded-md border border-line bg-surface-subtle/60 px-3 py-2 text-xs"
                  >
                    <span className="block text-ink-secondary truncate">
                      {rp.name}
                    </span>
                    <strong className="text-brand">
                      từ {formatVND(rp.priceVnd)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="primary" size="md" asChild>
                <Link href={ROUTES.GARAGE_DETAIL(featuredGarage.slug)}>
                  VÀO CỬA HÀNG GARAGE
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="md" asChild>
                <Link href={ROUTES.PRICING}>XEM COMBO BẢO DƯỠNG</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Partner Garages Marketplace by City */}
      <section className="border-t border-line bg-surface-subtle/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                ĐỐI TÁC XƯỞNG CHÍNH THỨC
              </span>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
                TÌM GARAGE UY TÍN GẦN BẠN
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setActiveCityTab(c.code)}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer",
                    activeCityTab === c.code
                      ? "bg-brand text-ink-inverse border-brand"
                      : "bg-surface text-ink-secondary border-line hover:text-brand"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
            {displayedGarages.map((garage) => (
              <GarageStoreCard key={garage.id} garage={garage} />
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href={ROUTES.GARAGES}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand hover:underline"
            >
              Xem tất cả {garages.length} chi nhánh đối tác trên danh bạ{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7: How It Works + Knowledge Blog */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">
        {/* 3-Step Compact Banner */}
        <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-center">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand">
                QUY TRÌNH 3 BƯỚC
              </span>
              <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-ink">
                ĐẶT DỊCH VỤ NHƯ MUA SẮM ONLINE
              </h2>
            </div>

            {[
              {
                step: "01",
                title: "Chọn gói dịch vụ",
                desc: "Thêm gói bảo dưỡng hoặc chăm sóc xe với giá niêm yết vào giỏ.",
              },
              {
                step: "02",
                title: "Chọn garage & Giờ hẹn",
                desc: "Chọn xưởng gần nhà tại TP.HCM, Hà Nội, Đà Nẵng và khung giờ trống.",
              },
              {
                step: "03",
                title: "Nghiệm thu & Thanh toán",
                desc: "Đưa xe tới khoang ưu tiên, kiểm tra hoàn tất mới thanh toán tại xưởng.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-lg border border-line bg-surface-subtle/60 p-4 border-l-4 border-l-brand"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand">
                    BƯỚC {s.step}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                </div>
                <strong className="mt-1 block font-display text-lg uppercase text-ink">
                  {s.title}
                </strong>
                <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Blog / Maintenance Guides */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                CHUYÊN GIA TƯ VẤN KỸ THUẬT
              </span>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
                TIN TỨC & CẨM NANG CHĂM XE
              </h2>
            </div>
            <Link
              href={ROUTES.BLOG}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand hover:underline"
            >
              Xem tất cả bài viết <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {articles.map((art) => (
              <article
                key={art.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xs hover:border-brand/50 hover:shadow-md transition-all"
              >
                <Link
                  href={ROUTES.BLOG_DETAIL(art.slug)}
                  className="relative h-48 w-full overflow-hidden bg-surface-subtle block"
                >
                  <Image
                    src={art.coverImage}
                    alt={art.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-brand px-2.5 py-0.5 text-[11px] font-bold text-ink-inverse">
                    {art.category}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-ink-secondary">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      <span className="font-mono">{art.publishedDate}</span>
                      <span>•</span>
                      <span>{art.readTime}</span>
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold uppercase leading-snug text-ink group-hover:text-brand transition-colors">
                      <Link href={ROUTES.BLOG_DETAIL(art.slug)}>
                        {art.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-secondary">
                      {art.excerpt}
                    </p>
                  </div>

                  <Link
                    href={ROUTES.BLOG_DETAIL(art.slug)}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand"
                  >
                    Đọc chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
