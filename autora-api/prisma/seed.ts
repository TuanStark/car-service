import {
  BookingStatus,
  CityCode,
  CouponDiscountType,
  GarageStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ServiceBadge,
  UserStatus,
  VehicleBodyType,
} from "@prisma/client";
import { hashPassword } from "../src/core/utils/password-hasher";
import { generateUuidV7 } from "../src/core/utils/uuid.util";

const prisma = new PrismaClient();

async function seedRolesAndUsers() {
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

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "admin" } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { code: "customer" } });

  const adminHash = await hashPassword("AutoraAdmin@2026");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@autora.vn" },
    update: { fullName: "Quản trị viên AUTORA", status: UserStatus.ACTIVE },
    create: {
      id: generateUuidV7(),
      email: "admin@autora.vn",
      phone: "0901000999",
      passwordHash: adminHash,
      fullName: "Quản trị viên AUTORA",
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  const customerHash = await hashPassword("Autora@2026");
  const customerSeeds = [
    {
      email: "khoa.nguyen@autora.vn",
      phone: "0909688912",
      fullName: "Nguyễn Đăng Khoa",
      status: UserStatus.ACTIVE,
      vehicle: {
        brand: "Mazda",
        model: "CX-5 2.0 Premium",
        year: "2023",
        bodyType: VehicleBodyType.SUV,
        licensePlate: "51K-682.39",
        currentOdoKm: 24800,
      },
    },
    {
      email: "minh.tran@autora.vn",
      phone: "0912345678",
      fullName: "Trần Hoàng Minh",
      status: UserStatus.ACTIVE,
      vehicle: {
        brand: "Toyota",
        model: "Camry 2.5Q",
        year: "2022",
        bodyType: VehicleBodyType.SEDAN,
        licensePlate: "51H-449.12",
        currentOdoKm: 41200,
      },
    },
    {
      email: "lan.pham@autora.vn",
      phone: "0938771204",
      fullName: "Phạm Ngọc Lan",
      status: UserStatus.ACTIVE,
      vehicle: {
        brand: "VinFast",
        model: "VF 8 Plus",
        year: "2024",
        bodyType: VehicleBodyType.EV,
        licensePlate: "30K-901.55",
        currentOdoKm: 12400,
      },
    },
    {
      email: "hung.le@autora.vn",
      phone: "0977882311",
      fullName: "Lê Quốc Hưng",
      status: UserStatus.INACTIVE,
      vehicle: {
        brand: "Kia",
        model: "Carnival Signature",
        year: "2023",
        bodyType: VehicleBodyType.MPV,
        licensePlate: "51K-118.90",
        currentOdoKm: 35600,
      },
    },
  ];

  const seededCustomers = new Map<string, { userId: string; fullName: string; phone: string; vehicleId: string; vehicleLabel: string; licensePlate: string; odoKm: number }>();

  for (const c of customerSeeds) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { fullName: c.fullName, status: c.status },
      create: {
        id: generateUuidV7(),
        email: c.email,
        phone: c.phone,
        passwordHash: customerHash,
        fullName: c.fullName,
        status: c.status,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
      update: {},
      create: { userId: user.id, roleId: customerRole.id },
    });

    let vehicle = await prisma.customerVehicle.findFirst({
      where: { userId: user.id, licensePlate: c.vehicle.licensePlate },
    });
    if (!vehicle) {
      vehicle = await prisma.customerVehicle.create({
        data: {
          id: generateUuidV7(),
          userId: user.id,
          brand: c.vehicle.brand,
          model: c.vehicle.model,
          year: c.vehicle.year,
          bodyType: c.vehicle.bodyType,
          licensePlate: c.vehicle.licensePlate,
          currentOdoKm: c.vehicle.currentOdoKm,
          isPrimary: true,
        },
      });
    }

    seededCustomers.set(c.email, {
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone ?? c.phone,
      vehicleId: vehicle.id,
      vehicleLabel: `${c.vehicle.brand} ${c.vehicle.model} (${c.vehicle.year})`,
      licensePlate: c.vehicle.licensePlate,
      odoKm: c.vehicle.currentOdoKm,
    });
  }

  return { adminUser, seededCustomers };
}

async function seedCatalogAndGarages() {
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

  const servicesData = [
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
      isActive: true,
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
      isActive: true,
    },
    {
      sku: "ATR-DT-009",
      slug: "hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep",
      categoryCode: "cham-soc-detailing",
      name: "Hiệu Chỉnh Sơn 2 Bước & Phủ Ceramic 9H Độ Bóng Sâu",
      shortSummary: "Xóa xoáy xước sơn 85%, phủ gốm 9H chống tia UV và mưa axit.",
      description: "Phục hồi độ bóng sâu và bảo vệ lớp sơn ngoại thất trong môi trường nắng nóng tại Việt Nam.",
      imageUrl: "/images/service-detailing.jpg",
      galleryUrls: ["/images/service-detailing.jpg"],
      priceVnd: 3500000,
      originalPriceVnd: 4200000,
      discountPercent: 17,
      badge: ServiceBadge.PROMO,
      estimatedDuration: "8 giờ",
      warrantyLabel: "Bảo hành độ bóng 24 tháng",
      compatibleVehicles: [VehicleBodyType.ALL],
      compatibleBrandsLabel: "Tất cả dòng xe du lịch",
      includedSteps: ["Rửa chi tiết & tẩy nhựa đường", "Hiệu chỉnh sơn 2 bước", "Phủ Ceramic 9H"],
      specificationsJson: [{ label: "Độ cứng", value: "9H Ceramic Coating" }],
      isFeatured: true,
      isActive: true,
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
      isActive: true,
    },
  ];

  const serviceBySlug = new Map<string, { id: string; sku: string; name: string; priceVnd: number }>();

  for (const svc of servicesData) {
    const categoryId = categoryIdMap.get(svc.categoryCode);
    if (!categoryId) continue;

    const record = await prisma.serviceProduct.upsert({
      where: { slug: svc.slug },
      update: { priceVnd: svc.priceVnd, isActive: svc.isActive },
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
        isActive: svc.isActive,
      },
    });
    serviceBySlug.set(svc.slug, {
      id: record.id,
      sku: record.sku,
      name: record.name,
      priceVnd: record.priceVnd,
    });
  }

  const garagesSeed = [
    {
      slug: "saigon-motorwerks-quan-7",
      name: "SAIGON MOTORWERKS & DETAILING LAB",
      district: "Quận 7, TP.HCM",
      cityCode: CityCode.HCM,
      cityLabel: "TP. Hồ Chí Minh",
      fullAddress: "88 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP.HCM",
      phone: "0901234567",
      verified: true,
      status: GarageStatus.ACTIVE,
      isFeatured: true,
      coverImageUrl: "/images/featured-garage.jpg",
      openHours: "07:30 – 19:00",
      bayCount: 8,
      startingPriceVnd: 450000,
      certifications: ["AUTORA Verified", "Bosch Car Service Partner"],
      summary: "Xưởng dịch vụ tiêu chuẩn 8 cầu nâng tại Quận 7 chuyên bảo dưỡng nhanh và detailing.",
    },
    {
      slug: "autohaus-workshop-binh-thanh",
      name: "AUTOHAUS PRECISION GARAGE",
      district: "Bình Thạnh, TP.HCM",
      cityCode: CityCode.HCM,
      cityLabel: "TP. Hồ Chí Minh",
      fullAddress: "215 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
      phone: "0908334455",
      verified: true,
      status: GarageStatus.ACTIVE,
      isFeatured: true,
      coverImageUrl: "/images/garage-card-alt.jpg",
      openHours: "08:00 – 18:30",
      bayCount: 6,
      startingPriceVnd: 550000,
      certifications: ["AUTORA Verified", "Hunter 3D Center"],
      summary: "Trung tâm cân chỉnh thước lái 3D và bảo dưỡng định kỳ khu vực trung tâm TP.HCM.",
    },
    {
      slug: "hanoi-euro-care-cau-giay",
      name: "HANOI EURO CARE SERVICE",
      district: "Cầu Giấy, Hà Nội",
      cityCode: CityCode.HN,
      cityLabel: "Hà Nội",
      fullAddress: "45 Trần Thái Tông, Dịch Vọng, Cầu Giấy, Hà Nội",
      phone: "0915667788",
      verified: false,
      status: GarageStatus.INACTIVE,
      isFeatured: false,
      coverImageUrl: "/images/service-repair.jpg",
      openHours: "08:00 – 18:00",
      bayCount: 5,
      startingPriceVnd: 500000,
      certifications: ["Đang chờ thẩm định"],
      summary: "Xưởng chuyên kiểm tra chẩn đoán điện và bảo dưỡng xe châu Âu tại Cầu Giấy.",
    },
  ];

  const garageBySlug = new Map<string, { id: string; name: string }>();
  for (const g of garagesSeed) {
    const record = await prisma.garage.upsert({
      where: { slug: g.slug },
      update: { status: g.status, verified: g.verified },
      create: { id: generateUuidV7(), ...g },
    });
    garageBySlug.set(g.slug, { id: record.id, name: record.name });

    for (const svc of serviceBySlug.values()) {
      await prisma.garageService.upsert({
        where: {
          garageId_serviceProductId: { garageId: record.id, serviceProductId: svc.id },
        },
        update: {},
        create: {
          garageId: record.id,
          serviceProductId: svc.id,
          isAvailable: true,
        },
      });
    }
  }

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

  return { serviceBySlug, garageBySlug };
}

async function seedBookings(params: {
  adminEmail: string;
  adminId: string;
  seededCustomers: Awaited<ReturnType<typeof seedRolesAndUsers>>["seededCustomers"];
  serviceBySlug: Map<string, { id: string; sku: string; name: string; priceVnd: number }>;
  garageBySlug: Map<string, { id: string; name: string }>;
}) {
  const sgGarage = params.garageBySlug.get("saigon-motorwerks-quan-7");
  const btGarage = params.garageBySlug.get("autohaus-workshop-binh-thanh");
  const hnGarage = params.garageBySlug.get("hanoi-euro-care-cau-giay");

  const oilSvc = params.serviceBySlug.get("thay-dau-dong-co-tong-hop-5w30");
  const m20Svc = params.serviceBySlug.get("bao-duong-dinh-ky-moc-20000km-toan-dien");
  const ceramicSvc = params.serviceBySlug.get("hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep");
  const alignSvc = params.serviceBySlug.get("can-chinh-goc-dat-banh-xe-hunter-3d-can-bang-dong");

  const khoa = params.seededCustomers.get("khoa.nguyen@autora.vn");
  const minh = params.seededCustomers.get("minh.tran@autora.vn");
  const lan = params.seededCustomers.get("lan.pham@autora.vn");
  const hung = params.seededCustomers.get("hung.le@autora.vn");

  if (!sgGarage || !btGarage || !hnGarage || !oilSvc || !m20Svc || !ceramicSvc || !alignSvc || !khoa || !minh || !lan || !hung) {
    return;
  }

  const bookingRows = [
    {
      orderCode: "ATR-2611-001",
      customer: khoa,
      garage: sgGarage,
      service: oilSvc,
      date: "2026-11-26",
      time: "08:00",
      status: BookingStatus.PENDING_CONFIRMATION,
      paymentMethod: PaymentMethod.PAY_AT_GARAGE,
      paymentStatus: PaymentStatus.UNPAID,
      notes: "Khách yêu cầu kiểm tra thêm độ ồn khoang máy",
    },
    {
      orderCode: "ATR-2611-002",
      customer: minh,
      garage: btGarage,
      service: alignSvc,
      date: "2026-11-26",
      time: "09:30",
      status: BookingStatus.PENDING_CONFIRMATION,
      paymentMethod: PaymentMethod.VIETQR,
      paymentStatus: PaymentStatus.UNPAID,
      notes: "Vô lăng hơi lệch phải khi chạy cao tốc",
    },
    {
      orderCode: "ATR-2611-003",
      customer: lan,
      garage: hnGarage,
      service: ceramicSvc,
      date: "2026-11-26",
      time: "13:30",
      status: BookingStatus.CONFIRMED,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PAID,
      notes: "Xe mới lấy tháng trước, cần phủ Ceramic 9H",
    },
    {
      orderCode: "ATR-2611-004",
      customer: khoa,
      garage: sgGarage,
      service: m20Svc,
      date: "2026-11-25",
      time: "11:00",
      status: BookingStatus.IN_PROGRESS,
      paymentMethod: PaymentMethod.PAY_AT_GARAGE,
      paymentStatus: PaymentStatus.UNPAID,
      notes: "Đang thực hiện bảo dưỡng trên cầu nâng số 3",
    },
    {
      orderCode: "ATR-2611-005",
      customer: minh,
      garage: sgGarage,
      service: oilSvc,
      date: "2026-11-24",
      time: "15:00",
      status: BookingStatus.COMPLETED,
      paymentMethod: PaymentMethod.VIETQR,
      paymentStatus: PaymentStatus.PAID,
      notes: "Đã nghiệm thu bàn giao xe sạch sẽ",
    },
    {
      orderCode: "ATR-2611-006",
      customer: lan,
      garage: btGarage,
      service: m20Svc,
      date: "2026-11-23",
      time: "09:30",
      status: BookingStatus.COMPLETED,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PAID,
      notes: "Khách đánh giá 5 sao",
    },
    {
      orderCode: "ATR-2611-007",
      customer: hung,
      garage: btGarage,
      service: alignSvc,
      date: "2026-11-23",
      time: "16:30",
      status: BookingStatus.COMPLETED,
      paymentMethod: PaymentMethod.PAY_AT_GARAGE,
      paymentStatus: PaymentStatus.UNPAID,
      notes: "Hoàn tất kỹ thuật, kế toán xưởng đang đối soát công nợ",
    },
    {
      orderCode: "ATR-2611-008",
      customer: hung,
      garage: sgGarage,
      service: ceramicSvc,
      date: "2026-11-22",
      time: "13:30",
      status: BookingStatus.CANCELLED,
      paymentMethod: PaymentMethod.VIETQR,
      paymentStatus: PaymentStatus.REFUNDED,
      notes: "Khách bận công tác đột xuất, đã hoàn tiền VietQR",
    },
  ];

  for (const row of bookingRows) {
    const existing = await prisma.booking.findUnique({ where: { orderCode: row.orderCode } });
    if (existing) continue;

    const bookingId = generateUuidV7();
    await prisma.booking.create({
      data: {
        id: bookingId,
        orderCode: row.orderCode,
        userId: row.customer.userId,
        garageId: row.garage.id,
        vehicleId: row.customer.vehicleId,
        appointmentDate: new Date(`${row.date}T00:00:00Z`),
        appointmentTime: row.time,
        customerName: row.customer.fullName,
        customerPhone: row.customer.phone,
        vehicleLabel: row.customer.vehicleLabel,
        licensePlate: row.customer.licensePlate,
        odoKm: row.customer.odoKm,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        status: row.status,
        subtotalVnd: row.service.priceVnd,
        discountVnd: 0,
        totalVnd: row.service.priceVnd,
        notes: row.notes,
        items: {
          create: [
            {
              id: generateUuidV7(),
              serviceProductId: row.service.id,
              serviceNameSnap: row.service.name,
              skuSnap: row.service.sku,
              unitPriceVnd: row.service.priceVnd,
              quantity: 1,
              lineTotalVnd: row.service.priceVnd,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              id: generateUuidV7(),
              fromStatus: null,
              toStatus: row.status,
              reason: "Khởi tạo dữ liệu lịch hẹn",
              changedByUserId: params.adminId,
              changedByEmail: params.adminEmail,
            },
          ],
        },
      },
    });
  }
}

async function main(): Promise<void> {
  const { adminUser, seededCustomers } = await seedRolesAndUsers();
  const { serviceBySlug, garageBySlug } = await seedCatalogAndGarages();
  await seedBookings({
    adminEmail: adminUser.email,
    adminId: adminUser.id,
    seededCustomers,
    serviceBySlug,
    garageBySlug,
  });
  console.log("[Seed] AUTORA database seeded successfully (Admin: admin@autora.vn / AutoraAdmin@2026).");
}

main()
  .catch((error) => {
    console.error("[Seed] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
