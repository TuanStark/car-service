import {
  BookingStatus,
  CityCode,
  CouponDiscountType,
  EquipmentCategory,
  EquipmentMaintenanceType,
  EquipmentStatus,
  ExpenseCategory,
  GarageStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ServiceBadge,
  TechnicianSkillLevel,
  TechnicianSpecialty,
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
    {
      code: "ops_staff",
      name: "Cố vấn dịch vụ (SA)",
      description: "Tiếp nhận xe, điều phối cầu nâng, lập báo giá và thu ngân",
    },
    {
      code: "technician",
      name: "Kỹ thuật viên (KTV)",
      description: "Thực hiện sửa chữa, kiểm tra DVI và mượn dụng cụ chuyên dụng",
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
  const bayTemplates = [
    { code: "BAY-01", name: "Cầu nhanh 01 (Bảo dưỡng)", bayType: "QUICK_SERVICE" as const, sortOrder: 1 },
    { code: "BAY-02", name: "Cầu 2 trụ 02 (Gầm & Máy)", bayType: "TWO_POST" as const, sortOrder: 2 },
    { code: "BAY-03", name: "Cầu cân chỉnh 3D Hunter", bayType: "ALIGNMENT_3D" as const, sortOrder: 3 },
    { code: "BAY-04", name: "Khoang Detailing & Phủ Ceramic", bayType: "DETAILING" as const, sortOrder: 4 },
  ];

  for (const garage of garageBySlug.values()) {
    for (const tpl of bayTemplates) {
      await prisma.serviceBay.upsert({
        where: { garageId_code: { garageId: garage.id, code: tpl.code } },
        update: {},
        create: {
          id: generateUuidV7(),
          garageId: garage.id,
          code: tpl.code,
          name: tpl.name,
          bayType: tpl.bayType,
          status: "AVAILABLE",
          sortOrder: tpl.sortOrder,
        },
      });
    }
  }

  // Seed Suppliers, PartItems, GarageInventory & ServicePartRecipe (BOM)
  const suppliers = [
    {
      code: "NCC-CASTROL-MN",
      name: "Nhà phân phối Dầu nhớt Castrol Miền Nam",
      phone: "02838221199",
      email: "b2b@castrol-miennam.vn",
      address: "KCN Tân Bình, TP.HCM",
      taxCode: "0312345678",
      paymentTermsDays: 30,
    },
    {
      code: "NCC-BOSCH-VN",
      name: "Công ty Phụ tùng Bosch & Brembo Việt Nam",
      phone: "02839112233",
      email: "sales@bosch-parts.vn",
      address: "Quận 7, TP.HCM",
      taxCode: "0318765432",
      paymentTermsDays: 15,
    },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { code: sup.code },
      update: {},
      create: { id: generateUuidV7(), ...sup },
    });
  }

  const partsData = [
    {
      sku: "PT-OIL-5W30",
      oemCode: "CASTROL-EDGE-5W30",
      name: "Dầu động cơ tổng hợp toàn phần 5W-30 API SP",
      category: "OIL_FLUID" as const,
      unit: "lít",
      minStockQty: 20,
      avgCostVnd: 145000,
      sellPriceVnd: 220000,
      imageUrl: "/images/service-maintenance.jpg",
    },
    {
      sku: "PT-FLT-OIL",
      oemCode: "BOSCH-OF-019",
      name: "Lọc nhớt động cơ chuẩn OEM (Toyota/Mazda/Honda)",
      category: "FILTER" as const,
      unit: "cái",
      minStockQty: 10,
      avgCostVnd: 85000,
      sellPriceVnd: 150000,
      imageUrl: "/images/service-maintenance.jpg",
    },
    {
      sku: "PT-BRK-PAD",
      oemCode: "BREMBO-P83",
      name: "Bộ má phanh đĩa trước gốm Ceramic",
      category: "BRAKE" as const,
      unit: "bộ",
      minStockQty: 4,
      avgCostVnd: 920000,
      sellPriceVnd: 1450000,
      imageUrl: "/images/service-repair.jpg",
    },
    {
      sku: "PT-CHEM-9H",
      oemCode: "CARPRO-CQUARTZ-50",
      name: "Dung dịch phủ Ceramic 9H chuyên dụng (Lọ 50ml)",
      category: "DETAILING_CHEM" as const,
      unit: "lọ",
      minStockQty: 5,
      avgCostVnd: 850000,
      sellPriceVnd: 1400000,
      imageUrl: "/images/service-detailing.jpg",
    },
    {
      sku: "PT-TIRE-BAL",
      oemCode: "LEAD-W-50G",
      name: "Chì dán cân bằng động mâm đúc & Van cao su",
      category: "TIRE" as const,
      unit: "bộ",
      minStockQty: 15,
      avgCostVnd: 35000,
      sellPriceVnd: 80000,
      imageUrl: "/images/service-tires.jpg",
    },
  ];

  const partBySku = new Map<string, string>();
  for (const part of partsData) {
    const saved = await prisma.partItem.upsert({
      where: { sku: part.sku },
      update: {},
      create: { id: generateUuidV7(), ...part },
    });
    partBySku.set(part.sku, saved.id);
  }

  for (const garage of garageBySlug.values()) {
    const initialStock: Record<string, { qty: number; bin: string }> = {
      "PT-OIL-5W30": { qty: 64, bin: "Kệ A1-01" },
      "PT-FLT-OIL": { qty: 18, bin: "Kệ A1-02" },
      "PT-BRK-PAD": { qty: 3, bin: "Kệ B2-01" }, // intentionally below minStockQty (4)
      "PT-CHEM-9H": { qty: 8, bin: "Tủ C1-03" },
      "PT-TIRE-BAL": { qty: 30, bin: "Kệ D1-01" },
    };
    for (const [sku, cfg] of Object.entries(initialStock)) {
      const partId = partBySku.get(sku);
      if (!partId) continue;
      await prisma.garageInventory.upsert({
        where: { garageId_partItemId: { garageId: garage.id, partItemId: partId } },
        update: {},
        create: {
          id: generateUuidV7(),
          garageId: garage.id,
          partItemId: partId,
          onHandQty: cfg.qty,
          reservedQty: 0,
          binLocation: cfg.bin,
        },
      });
    }
  }

  const oilService = serviceBySlug.get("thay-dau-dong-co-tong-hop-5w30");
  const oil20kService = serviceBySlug.get("bao-duong-dinh-ky-moc-20000km-toan-dien");
  const ceramicService = serviceBySlug.get("hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep");
  const oilPartId = partBySku.get("PT-OIL-5W30");
  const filterPartId = partBySku.get("PT-FLT-OIL");
  const ceramicPartId = partBySku.get("PT-CHEM-9H");

  const bomEntries: {
    serviceProductId?: string;
    partItemId?: string;
    vehicleBodyType: VehicleBodyType;
    standardQty: number;
  }[] = [
    { serviceProductId: oilService?.id, partItemId: oilPartId, vehicleBodyType: VehicleBodyType.ALL, standardQty: 4 },
    { serviceProductId: oilService?.id, partItemId: oilPartId, vehicleBodyType: VehicleBodyType.SUV, standardQty: 6 },
    { serviceProductId: oilService?.id, partItemId: filterPartId, vehicleBodyType: VehicleBodyType.ALL, standardQty: 1 },
    { serviceProductId: oil20kService?.id, partItemId: oilPartId, vehicleBodyType: VehicleBodyType.ALL, standardQty: 4.5 },
    { serviceProductId: oil20kService?.id, partItemId: filterPartId, vehicleBodyType: VehicleBodyType.ALL, standardQty: 1 },
    { serviceProductId: ceramicService?.id, partItemId: ceramicPartId, vehicleBodyType: VehicleBodyType.ALL, standardQty: 1 },
  ];

  for (const bom of bomEntries) {
    if (!bom.serviceProductId || !bom.partItemId) continue;
    await prisma.servicePartRecipe.upsert({
      where: {
        serviceProductId_partItemId_vehicleBodyType: {
          serviceProductId: bom.serviceProductId,
          partItemId: bom.partItemId,
          vehicleBodyType: bom.vehicleBodyType,
        },
      },
      update: {},
      create: {
        id: generateUuidV7(),
        serviceProductId: bom.serviceProductId,
        partItemId: bom.partItemId,
        vehicleBodyType: bom.vehicleBodyType,
        standardQty: bom.standardQty,
        isOptional: false,
      },
    });
  }

  // ── Phase 3: Staff/Technicians & Workshop Equipment / Special Tools ────
  const techRole = await prisma.role.findUniqueOrThrow({ where: { code: "technician" } });
  const opsRole = await prisma.role.findUniqueOrThrow({ where: { code: "ops_staff" } });
  const staffPassHash = await hashPassword("AutoraStaff@2026");

  const staffSeeds = [
    {
      email: "ktv.tuan@autora.vn",
      fullName: "Nguyễn Minh Tuấn (KTV Trưởng)",
      phone: "0903111222",
      roleId: techRole.id,
      tech: {
        specialty: TechnicianSpecialty.CHASSIS_BRAKE,
        skillLevel: TechnicianSkillLevel.MASTER,
        laborCommissionPct: 18,
        hourlyRateVnd: 120000,
      },
    },
    {
      email: "ktv.minh@autora.vn",
      fullName: "Trần Quốc Minh (KTV Chẩn đoán)",
      phone: "0903111333",
      roleId: techRole.id,
      tech: {
        specialty: TechnicianSpecialty.ELECTRICAL,
        skillLevel: TechnicianSkillLevel.SENIOR,
        laborCommissionPct: 15,
        hourlyRateVnd: 95000,
      },
    },
    {
      email: "sa.lan@autora.vn",
      fullName: "Lê Thị Ngọc Lan (Cố vấn dịch vụ)",
      phone: "0903111444",
      roleId: opsRole.id,
      tech: null,
    },
  ];

  const firstSeededGarage = await prisma.garage.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const primaryGarageId = firstSeededGarage?.id ?? null;
  let tuanUserId: string | null = null;

  for (const s of staffSeeds) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { fullName: s.fullName, status: UserStatus.ACTIVE },
      create: {
        id: generateUuidV7(),
        email: s.email,
        phone: s.phone,
        passwordHash: staffPassHash,
        fullName: s.fullName,
        status: UserStatus.ACTIVE,
      },
    });
    if (s.email === "ktv.tuan@autora.vn") tuanUserId = user.id;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: s.roleId } },
      update: {},
      create: { userId: user.id, roleId: s.roleId },
    });

    if (s.tech) {
      await prisma.technicianProfile.upsert({
        where: { userId: user.id },
        update: {
          primaryGarageId,
          specialty: s.tech.specialty,
          skillLevel: s.tech.skillLevel,
          laborCommissionPct: s.tech.laborCommissionPct,
          hourlyRateVnd: s.tech.hourlyRateVnd,
          isActive: true,
        },
        create: {
          userId: user.id,
          primaryGarageId,
          specialty: s.tech.specialty,
          skillLevel: s.tech.skillLevel,
          laborCommissionPct: s.tech.laborCommissionPct,
          hourlyRateVnd: s.tech.hourlyRateVnd,
          isActive: true,
        },
      });
    }
  }

  if (tuanUserId) {
    const completedBooking = await prisma.booking.findFirst({
      where: { status: BookingStatus.COMPLETED, assignedTechnicianId: null },
    });
    if (completedBooking) {
      await prisma.booking.update({
        where: { id: completedBooking.id },
        data: { assignedTechnicianId: tuanUserId },
      });
    }
  }

  if (primaryGarageId) {
    const firstBay = await prisma.serviceBay.findFirst({
      where: { garageId: primaryGarageId },
      orderBy: { sortOrder: "asc" },
    });
    const inThreeDays = new Date(Date.now() + 3 * 86_400_000);
    const inFiveDays = new Date(Date.now() + 5 * 86_400_000);
    const inSixtyDays = new Date(Date.now() + 60 * 86_400_000);

    const equipSeeds = [
      {
        assetCode: "EQ-LIFT-01",
        name: "Cầu nâng 2 trụ BendPak XPR-10AS (4.5 Tấn)",
        category: EquipmentCategory.LIFT,
        brandModel: "BendPak XPR-10AS",
        serialNumber: "BP-2025-8812",
        status: EquipmentStatus.OPERATIONAL,
        serviceBayId: firstBay?.id ?? null,
        purchaseCostVnd: 115000000,
        nextMaintenanceAt: inSixtyDays,
        calibrationDueAt: null,
      },
      {
        assetCode: "EQ-SCAN-01",
        name: "Máy chẩn đoán lỗi Autel MaxiSys Ultra",
        category: EquipmentCategory.DIAGNOSTIC_SCANNER,
        brandModel: "Autel MaxiSys Ultra",
        serialNumber: "AUT-994021",
        status: EquipmentStatus.OPERATIONAL,
        serviceBayId: null,
        purchaseCostVnd: 86000000,
        nextMaintenanceAt: null,
        calibrationDueAt: inThreeDays,
      },
      {
        assetCode: "EQ-ALIGN-01",
        name: "Hệ thống cân chỉnh thước lái 3D Hunter",
        category: EquipmentCategory.WHEEL_ALIGNMENT,
        brandModel: "Hunter HawkEye Elite",
        serialNumber: "HNT-33104",
        status: EquipmentStatus.OPERATIONAL,
        serviceBayId: null,
        purchaseCostVnd: 420000000,
        nextMaintenanceAt: inFiveDays,
        calibrationDueAt: inFiveDays,
      },
      {
        assetCode: "EQ-AC-01",
        name: "Máy thu hồi & nạp gas điều hòa Robinair",
        category: EquipmentCategory.AC_MACHINE,
        brandModel: "Robinair AC1234-6",
        serialNumber: "ROB-7721",
        status: EquipmentStatus.OPERATIONAL,
        serviceBayId: null,
        purchaseCostVnd: 74000000,
        nextMaintenanceAt: inSixtyDays,
        calibrationDueAt: null,
      },
      {
        assetCode: "TL-TORQ-01",
        name: "Cần siết lực điện tử Snap-on TechAngle 1/2\"",
        category: EquipmentCategory.SPECIAL_TOOL,
        brandModel: "Snap-on ATECH3FR250B",
        serialNumber: "SNP-44910",
        status: EquipmentStatus.IN_USE,
        serviceBayId: null,
        purchaseCostVnd: 18500000,
        nextMaintenanceAt: null,
        calibrationDueAt: inSixtyDays,
      },
    ];

    for (const eq of equipSeeds) {
      await prisma.workshopEquipment.upsert({
        where: { assetCode: eq.assetCode },
        update: {},
        create: {
          id: generateUuidV7(),
          garageId: primaryGarageId,
          ...eq,
        },
      });
    }

    const scanEq = await prisma.workshopEquipment.findUnique({
      where: { assetCode: "EQ-SCAN-01" },
    });
    if (scanEq) {
      const existingMaint = await prisma.equipmentMaintenanceLog.count({
        where: { equipmentId: scanEq.id },
      });
      if (existingMaint === 0) {
        await prisma.equipmentMaintenanceLog.create({
          data: {
            id: generateUuidV7(),
            equipmentId: scanEq.id,
            maintenanceType: EquipmentMaintenanceType.CALIBRATION,
            costVnd: 1500000,
            vendorName: "Autel Việt Nam",
            nextDueAt: inThreeDays,
            notes: "Cập nhật phần mềm chẩn đoán OEM 2026 & hiệu chuẩn đầu đo",
            recordedByEmail: "admin@autora.vn",
          },
        });
      }
    }

    const torqueTool = await prisma.workshopEquipment.findUnique({
      where: { assetCode: "TL-TORQ-01" },
    });
    if (torqueTool && tuanUserId) {
      const activeCheckout = await prisma.toolCheckoutLog.findFirst({
        where: { equipmentId: torqueTool.id, returnedAt: null },
      });
      if (!activeCheckout) {
        await prisma.toolCheckoutLog.create({
          data: {
            id: generateUuidV7(),
            equipmentId: torqueTool.id,
            technicianUserId: tuanUserId,
            expectedReturnAt: new Date(Date.now() + 4 * 3_600_000),
            notes: "Siết lực ốc bánh xe & cụm phanh trước",
          },
        });
      }
    }
  }

  // ── Phase 4: Sample Electronic Warranty & Low-Rating Review ────────────
  const completedRo = await prisma.booking.findFirst({
    where: { status: BookingStatus.COMPLETED },
    include: { items: true },
  });
  if (completedRo && completedRo.items[0]) {
    const existingW = await prisma.warrantyRecord.count({
      where: { bookingId: completedRo.id },
    });
    if (existingW === 0) {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 6);
      await prisma.warrantyRecord.create({
        data: {
          id: generateUuidV7(),
          warrantyCode: `BH-${completedRo.orderCode.slice(-6)}-101`,
          bookingId: completedRo.id,
          vehicleId: completedRo.vehicleId,
          garageId: completedRo.garageId,
          serviceProductId: completedRo.items[0].serviceProductId,
          serviceNameSnap: completedRo.items[0].serviceNameSnap,
          licensePlate: completedRo.licensePlate,
          customerName: completedRo.customerName,
          warrantyLabel: "6 tháng / 10.000 km",
          validUntilDate: validUntil,
          startOdoKm: completedRo.odoKm,
          validUntilOdoKm: completedRo.odoKm + 10_000,
        },
      });
    }
  }

  const anyCustomer = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { code: "customer" } } } },
  });
  if (anyCustomer && primaryGarageId) {
    const lowReviewCount = await prisma.review.count({
      where: { rating: { lte: 2 } },
    });
    if (lowReviewCount === 0) {
      await prisma.review.create({
        data: {
          id: generateUuidV7(),
          userId: anyCustomer.id,
          garageId: primaryGarageId,
          vehicleLabel: "Mazda CX-5 (2023)",
          rating: 2,
          comment:
            "Thời gian chờ nhận xe hơi lâu vào giờ cao điểm sáng thứ 7, nhưng kỹ thuật viên làm cẩn thận.",
        },
      });
    }
  }

  // ── Phase 5: Sample Workshop Operating Expenses (Cashbook) ─────────────
  if (primaryGarageId) {
    const existingExpenses = await prisma.expenseEntry.count({
      where: { garageId: primaryGarageId },
    });
    if (existingExpenses === 0) {
      const today = new Date();
      await prisma.expenseEntry.createMany({
        data: [
          {
            id: generateUuidV7(),
            garageId: primaryGarageId,
            category: ExpenseCategory.RENT_UTILITIES,
            amountVnd: 28000000,
            occurredAt: today,
            referenceCode: "CHI-MB-1126",
            description: "Thuê mặt bằng xưởng & điện 3 pha tháng 11/2026",
            recordedByEmail: "admin@autora.vn",
          },
          {
            id: generateUuidV7(),
            garageId: primaryGarageId,
            category: ExpenseCategory.BASE_SALARY,
            amountVnd: 32000000,
            occurredAt: today,
            referenceCode: "CHI-LUONG-1126",
            description: "Lương cứng đội ngũ Cố vấn & Kỹ thuật viên",
            recordedByEmail: "admin@autora.vn",
          },
          {
            id: generateUuidV7(),
            garageId: primaryGarageId,
            category: ExpenseCategory.WASTE_DISPOSAL,
            amountVnd: 1850000,
            occurredAt: today,
            referenceCode: "CHI-MT-1126",
            description: "Thu gom xử lý dầu nhớt thải & giẻ lau công nghiệp",
            recordedByEmail: "admin@autora.vn",
          },
        ],
      });
    }
  }

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
