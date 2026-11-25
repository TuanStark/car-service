import {
  CityCode,
  CouponDiscountType,
  PrismaClient,
  ServiceBadge,
  VehicleBodyType,
} from "@prisma/client";
import { hashPassword } from "../src/core/utils/password-hasher";
import { generateUuidV7 } from "../src/core/utils/uuid.util";

const prisma = new PrismaClient();

async function seedRolesAndPermissions(): Promise<void> {
  const roles = [
    {
      code: "customer",
      name: "Khách hàng AUTORA",
      description: "Chủ xe đặt lịch dịch vụ, quản lý xe cá nhân và đánh giá xưởng",
    },
    {
      code: "partner_staff",
      name: "Đối tác Garage",
      description: "Quản lý xưởng, cầu nâng, lịch hẹn và bảng giá tại xưởng",
    },
    {
      code: "admin",
      name: "Quản trị viên hệ thống",
      description: "Toàn quyền quản trị nền tảng AUTORA",
    },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { id: generateUuidV7(), ...r },
    });
  }

  const demoPasswordHash = await hashPassword("Autora@2026");
  const customerRole = await prisma.role.findUniqueOrThrow({
    where: { code: "customer" },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "khoa.nguyen@autora.vn" },
    update: {},
    create: {
      id: generateUuidV7(),
      email: "khoa.nguyen@autora.vn",
      phone: "0909688912",
      passwordHash: demoPasswordHash,
      fullName: "Nguyễn Đăng Khoa",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: demoUser.id, roleId: customerRole.id },
    },
    update: {},
    create: {
      userId: demoUser.id,
      roleId: customerRole.id,
    },
  });
}

async function seedCatalogAndGarages(): Promise<void> {
  const categories = [
    {
      code: "bao-duong-dinh-ky",
      displayNumber: "01",
      title: "Bảo dưỡng định kỳ",
      shortLabel: "Bảo dưỡng",
      description: "Thay dầu động cơ, lọc gió, kiểm tra phanh và các mốc 5.000 - 40.000 km.",
      imageUrl: "/images/service-maintenance.jpg",
      startingPriceVnd: 450000,
      estimatedDuration: "45 - 90 phút",
      highlights: ["Dầu tổng hợp API SP", "Kiểm tra an toàn 18-32 điểm", "Lưu sổ bảo dưỡng"],
      sortOrder: 1,
    },
    {
      code: "sua-chua-o-to",
      displayNumber: "02",
      title: "Sửa chữa kỹ thuật",
      shortLabel: "Sửa chữa",
      description: "Chẩn đoán lỗi OBD-II, láng đĩa phanh CNC, sửa gầm treo và hệ thống lái.",
      imageUrl: "/images/service-repair.jpg",
      startingPriceVnd: 300000,
      estimatedDuration: "60 - 120 phút",
      highlights: ["Máy chẩn đoán đa năng", "Báo giá minh bạch trước khi thay"],
      sortOrder: 2,
    },
    {
      code: "cham-soc-detailing",
      displayNumber: "03",
      title: "Chăm sóc & Detailing",
      shortLabel: "Detailing",
      description: "Vệ sinh nội thất hơi nước nóng, hiệu chỉnh sơn 2 bước và phủ Ceramic 9H.",
      imageUrl: "/images/service-detailing.jpg",
      startingPriceVnd: 800000,
      estimatedDuration: "3.5 - 8 giờ",
      highlights: ["Dung dịch pH trung tính", "Bảo hành độ bóng 24 tháng"],
      sortOrder: 3,
    },
    {
      code: "lop-va-mam-xe",
      displayNumber: "04",
      title: "Lốp & Cân chỉnh 3D",
      shortLabel: "Lốp & Mâm",
      description: "Căn chỉnh góc đặt bánh xe Laser Hunter 3D và cân bằng động.",
      imageUrl: "/images/service-tires.jpg",
      startingPriceVnd: 550000,
      estimatedDuration: "45 - 60 phút",
      highlights: ["Công nghệ Hunter 3D", "Khắc phục nhao lái"],
      sortOrder: 4,
    },
  ];

  const categoryIdMap = new Map<string, string>();
  for (const cat of categories) {
    const record = await prisma.serviceCategory.upsert({
      where: { code: cat.code },
      update: { title: cat.title, startingPriceVnd: cat.startingPriceVnd },
      create: { id: generateUuidV7(), ...cat },
    });
    categoryIdMap.set(cat.code, record.id);
  }

  const services = [
    {
      sku: "ATR-BD-001",
      slug: "thay-dau-dong-co-tong-hop-5w30",
      categoryCode: "bao-duong-dinh-ky",
      name: "Gói Thay Dầu Động Cơ Tổng Hợp 5W-30 & Kiểm Tra 18 Điểm",
      shortSummary: "Bao gồm 4L dầu tổng hợp API SP, vệ sinh lọc gió và kiểm tra an toàn.",
      description: "Giải pháp bảo dưỡng định kỳ tiêu chuẩn giúp bảo vệ động cơ êm ái trong điều kiện đô thị.",
      imageUrl: "/images/service-maintenance.jpg",
      galleryUrls: ["/images/service-maintenance.jpg"],
      priceVnd: 450000,
      originalPriceVnd: 550000,
      discountPercent: 18,
      badge: ServiceBadge.BEST_SELLER,
      estimatedDuration: "45 phút",
      warrantyLabel: "Chu kỳ 5.000 – 7.000 km",
      compatibleVehicles: [VehicleBodyType.SEDAN, VehicleBodyType.SUV, VehicleBodyType.MPV],
      compatibleBrandsLabel: "Toyota, Mazda, Honda, Hyundai, Kia, Ford",
      includedSteps: ["Xả nhớt cũ & kiểm tra cặn dầu", "Thay 4L dầu tổng hợp 5W-30", "Kiểm tra an toàn 18 điểm"],
      specificationsJson: [{ label: "Cấp nhớt", value: "SAE 5W-30 API SP" }],
      isFeatured: true,
    },
    {
      sku: "ATR-BD-020",
      slug: "bao-duong-dinh-ky-moc-20000km-toan-dien",
      categoryCode: "bao-duong-dinh-ky",
      name: "Combo Bảo Dưỡng Định Kỳ Cấp Trung (Mốc 20.000 km)",
      shortSummary: "Thay dầu, lọc dầu, vệ sinh phanh 4 bánh, đảo lốp và quét lỗi OBD-II.",
      description: "Gói bảo dưỡng toàn diện ở mốc 20.000 km giúp phanh bám chuẩn và lốp mòn đều.",
      imageUrl: "/images/service-maintenance.jpg",
      galleryUrls: ["/images/service-maintenance.jpg"],
      priceVnd: 1350000,
      originalPriceVnd: 1650000,
      discountPercent: 18,
      badge: ServiceBadge.RECOMMENDED,
      estimatedDuration: "90 phút",
      warrantyLabel: "Bảo hành kỹ thuật 6 tháng",
      compatibleVehicles: [VehicleBodyType.SEDAN, VehicleBodyType.SUV, VehicleBodyType.MPV],
      compatibleBrandsLabel: "Đa dòng xe du lịch 4-7 chỗ",
      includedSteps: ["Thay dầu & lọc dầu", "Vệ sinh phanh 4 bánh", "Đảo lốp & quét OBD-II"],
      specificationsJson: [{ label: "Mốc ODO", value: "20.000 km / 12 tháng" }],
      isFeatured: true,
    },
    {
      sku: "ATR-LP-001",
      slug: "can-chinh-goc-dat-banh-xe-hunter-3d-can-bang-dong",
      categoryCode: "lop-va-mam-xe",
      name: "Căn Chỉnh Góc Đặt Bánh Xe Laser 3D & Cân Bằng Động",
      shortSummary: "Khắc phục lệch vô-lăng, nhao lái và mòn lốp không đều.",
      description: "Sử dụng hệ thống đo góc Camber, Caster, Toe chuẩn xác đến từng phút góc.",
      imageUrl: "/images/service-tires.jpg",
      galleryUrls: ["/images/service-tires.jpg"],
      priceVnd: 550000,
      originalPriceVnd: 700000,
      discountPercent: 21,
      badge: ServiceBadge.PROMO,
      estimatedDuration: "60 phút",
      warrantyLabel: "Bảo hành 10.000 km",
      compatibleVehicles: [VehicleBodyType.ALL],
      compatibleBrandsLabel: "Tất cả dòng xe du lịch & EV",
      includedSteps: ["Kiểm tra áp suất & gai lốp", "Cân bằng động 4 bánh", "Căn chỉnh độ chụm 3D"],
      specificationsJson: [{ label: "Thiết bị", value: "Hunter HawkEye Elite 3D" }],
      isFeatured: true,
    },
  ];

  for (const svc of services) {
    const categoryId = categoryIdMap.get(svc.categoryCode);
    if (!categoryId) continue;

    await prisma.serviceProduct.upsert({
      where: { slug: svc.slug },
      update: { priceVnd: svc.priceVnd },
      create: {
        id: generateUuidV7(),
        sku: svc.sku,
        slug: svc.slug,
        categoryId,
        name: svc.name,
        shortSummary: svc.shortSummary,
        description: svc.description,
        imageUrl: svc.imageUrl,
        galleryUrls: svc.galleryUrls,
        priceVnd: svc.priceVnd,
        originalPriceVnd: svc.originalPriceVnd,
        discountPercent: svc.discountPercent,
        badge: svc.badge,
        estimatedDuration: svc.estimatedDuration,
        warrantyLabel: svc.warrantyLabel,
        compatibleVehicles: svc.compatibleVehicles,
        compatibleBrandsLabel: svc.compatibleBrandsLabel,
        includedSteps: svc.includedSteps,
        specificationsJson: svc.specificationsJson,
        isFeatured: svc.isFeatured,
      },
    });
  }

  await prisma.garage.upsert({
    where: { slug: "saigon-motorwerks-quan-7" },
    update: {},
    create: {
      id: generateUuidV7(),
      slug: "saigon-motorwerks-quan-7",
      name: "SAIGON MOTORWERKS & DETAILING LAB",
      district: "Quận 7, TP.HCM",
      cityCode: CityCode.HCM,
      cityLabel: "TP. Hồ Chí Minh",
      fullAddress: "88 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP.HCM",
      phone: "0901234567",
      verified: true,
      isFeatured: true,
      coverImageUrl: "/images/garage-saigon.jpg",
      openHours: "08:00 - 18:30",
      bayCount: 8,
      startingPriceVnd: 450000,
      certifications: ["AUTORA Verified", "Bosch Car Service Partner"],
      summary: "Xưởng dịch vụ tiêu chuẩn 8 cầu nâng tại Quận 7 chuyên bảo dưỡng nhanh và detailing.",
    },
  });

  await prisma.coupon.upsert({
    where: { code: "AUTORA10" },
    update: {},
    create: {
      id: generateUuidV7(),
      code: "AUTORA10",
      description: "Giảm 10% (tối đa 300.000đ) cho khách hàng đặt lịch trực tuyến",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      maxDiscountVnd: 300000,
      minOrderVnd: 300000,
      startsAt: new Date("2026-01-01T00:00:00Z"),
      expiresAt: new Date("2027-12-31T23:59:59Z"),
      isActive: true,
    },
  });
}

async function main(): Promise<void> {
  await seedRolesAndPermissions();
  await seedCatalogAndGarages();
  console.log("[Seed] AUTORA database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("[Seed] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
