"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAutoraConnector = void 0;
const common_1 = require("@nestjs/common");
function normalizeVi(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
const MOCK_SERVICES = [
    {
        id: "prd-oil-5w30",
        sku: "ATR-BD-001",
        slug: "thay-dau-dong-co-tong-hop-5w30",
        categoryId: "bao-duong-dinh-ky",
        categoryLabel: "Bảo dưỡng định kỳ",
        name: "Gói Thay Dầu Động Cơ Tổng Hợp 5W-30 & Kiểm Tra 18 Điểm",
        shortSummary: "Bao gồm 4L dầu tổng hợp API SP, vệ sinh lọc gió và kiểm tra an toàn.",
        priceVnd: 450000,
        estimatedDuration: "45 phút",
        warrantyLabel: "Chu kỳ 5.000 – 7.000 km",
    },
    {
        id: "prd-milestone-20k",
        sku: "ATR-BD-020",
        slug: "bao-duong-dinh-ky-moc-20000km-toan-dien",
        categoryId: "bao-duong-dinh-ky",
        categoryLabel: "Bảo dưỡng định kỳ",
        name: "Combo Bảo Dưỡng Định Kỳ Cấp Trung (Mốc 20.000 km)",
        shortSummary: "Thay dầu, lọc dầu, vệ sinh phanh 4 bánh, đảo lốp và quét lỗi OBD-II.",
        priceVnd: 1350000,
        estimatedDuration: "90 phút",
        warrantyLabel: "Bảo hành kỹ thuật 6 tháng",
    },
    {
        id: "prd-obd-check",
        sku: "ATR-SC-001",
        slug: "kiem-tra-tong-quat-chan-doan-obd-32-diem",
        categoryId: "sua-chua-o-to",
        categoryLabel: "Sửa chữa kỹ thuật",
        name: "Gói Kiểm Tra Tổng Quát 32 Hạng Mục & Chẩn Đoán OBD-II",
        shortSummary: "Đánh giá toàn diện động cơ, gầm treo, phanh và hệ thống điện.",
        priceVnd: 300000,
        estimatedDuration: "60 phút",
        warrantyLabel: "Biên bản kỹ thuật 32 điểm",
    },
    {
        id: "prd-brake-overhaul",
        sku: "ATR-SC-008",
        slug: "bao-duong-phanh-lang-dia-cnc-4-banh",
        categoryId: "sua-chua-o-to",
        categoryLabel: "Sửa chữa kỹ thuật",
        name: "Bảo Dưỡng Cụm Phanh 4 Bánh & Láng Đĩa Phanh CNC",
        shortSummary: "Xử lý tiếng kêu rít khi phanh, rung giật bàn đạp phanh và bó kẹt ắc phanh.",
        priceVnd: 650000,
        estimatedDuration: "75 phút",
        warrantyLabel: "Bảo hành 6 tháng / 10.000 km",
    },
    {
        id: "prd-interior-steam",
        sku: "ATR-DT-002",
        slug: "ve-sinh-noi-that-hoi-nuoc-nong-duong-da",
        categoryId: "cham-soc-detailing",
        categoryLabel: "Chăm sóc & Detailing",
        name: "Vệ Sinh Nội Thất Chuyên Sâu Hơi Nước Nóng & Dưỡng Da",
        shortSummary: "Làm sạch khoang cabin, dưỡng da và khử mùi vi sinh an toàn.",
        priceVnd: 800000,
        estimatedDuration: "3.5 giờ",
        warrantyLabel: "Khử mùi sinh học an toàn",
    },
    {
        id: "prd-ceramic-9h",
        sku: "ATR-DT-009",
        slug: "hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep",
        categoryId: "cham-soc-detailing",
        categoryLabel: "Chăm sóc & Detailing",
        name: "Hiệu Chỉnh Sơn 2 Bước & Phủ Ceramic 9H Độ Bóng Sâu",
        shortSummary: "Xóa xoáy xước sơn 85%, phủ gốm 9H chống tia UV và mưa axit.",
        priceVnd: 3500000,
        estimatedDuration: "8 giờ",
        warrantyLabel: "Bảo hành độ bóng 24 tháng",
    },
    {
        id: "prd-alignment-3d",
        sku: "ATR-LP-001",
        slug: "can-chinh-goc-dat-banh-xe-hunter-3d-can-bang-dong",
        categoryId: "lop-va-mam-xe",
        categoryLabel: "Lốp & Cân chỉnh 3D",
        name: "Căn Chỉnh Góc Đặt Bánh Xe Laser 3D & Cân Bằng Động",
        shortSummary: "Khắc phục lệch vô-lăng, nhao lái và mòn lốp không đều.",
        priceVnd: 550000,
        estimatedDuration: "60 phút",
        warrantyLabel: "Bảo hành 10.000 km",
    },
];
const MOCK_GARAGES = [
    {
        id: "grg-saigon-motorwerks",
        slug: "saigon-motorwerks-quan-7",
        name: "SAIGON MOTORWERKS & DETAILING LAB",
        district: "Quận 7, TP.HCM",
        cityCode: "hcm",
        fullAddress: "88 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP.HCM",
        rating: 4.9,
        reviewCount: 342,
        startingPriceVnd: 450000,
        openHours: "07:30 – 19:00 (Thứ 2 – Chủ Nhật)",
        availableServices: [
            "Bảo dưỡng định kỳ",
            "Chẩn đoán ECU",
            "Phủ Ceramic 9H",
            "Căn chỉnh thước lái 3D",
        ],
        categories: [
            "bao-duong-dinh-ky",
            "sua-chua-o-to",
            "cham-soc-detailing",
            "lop-va-mam-xe",
        ],
    },
    {
        id: "grg-autohaus-binh-thanh",
        slug: "autohaus-workshop-binh-thanh",
        name: "AUTOHAUS PRECISION GARAGE",
        district: "Bình Thạnh, TP.HCM",
        cityCode: "hcm",
        fullAddress: "214 Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM",
        rating: 4.8,
        reviewCount: 219,
        startingPriceVnd: 450000,
        openHours: "08:00 – 18:30 (Thứ 2 – Thứ 7)",
        availableServices: [
            "Bảo dưỡng cấp lớn",
            "Sửa chữa điện – máy lạnh",
            "Đại tu gầm & phanh",
        ],
        categories: ["bao-duong-dinh-ky", "sua-chua-o-to"],
    },
    {
        id: "grg-thang-long-motorsport-cau-giay",
        slug: "thang-long-auto-tech-cau-giay",
        name: "THĂNG LONG AUTO TECH CENTER",
        district: "Cầu Giấy, Hà Nội",
        cityCode: "hn",
        fullAddress: "126 Thành Thái, Phường Dịch Vọng, Cầu Giấy, Hà Nội",
        rating: 4.8,
        reviewCount: 274,
        startingPriceVnd: 300000,
        openHours: "07:30 – 18:30 (Thứ 2 – Chủ Nhật)",
        availableServices: [
            "Kiểm tra tổng quát",
            "Bảo dưỡng định kỳ",
            "Thay lốp & Căn chỉnh 3D",
        ],
        categories: ["bao-duong-dinh-ky", "sua-chua-o-to", "lop-va-mam-xe"],
    },
    {
        id: "grg-danang-coastal-autoworks",
        slug: "han-river-autoworks-hai-chau",
        name: "SÔNG HÀN AUTOWORKS & DETAILING",
        district: "Hải Châu, Đà Nẵng",
        cityCode: "dn",
        fullAddress: "305 Đường 2 Tháng 9, Quận Hải Châu, Đà Nẵng",
        rating: 4.9,
        reviewCount: 194,
        startingPriceVnd: 350000,
        openHours: "07:30 – 18:30 (Thứ 2 – Chủ Nhật)",
        availableServices: [
            "Bảo dưỡng định kỳ",
            "Phủ gầm chống rỉ",
            "Vệ sinh nội thất & Phủ Ceramic",
        ],
        categories: [
            "bao-duong-dinh-ky",
            "sua-chua-o-to",
            "cham-soc-detailing",
        ],
    },
];
const MOCK_VEHICLES_BY_USER = {
    "usr_khoa_01": [
        {
            id: "veh-1",
            brand: "Mazda",
            model: "CX-5 2.0 Premium",
            year: "2023",
            licensePlate: "51K-682.39",
            currentOdoKm: "24.800",
        },
    ],
};
const MOCK_ORDERS_BY_USER = {
    "usr_khoa_01": [
        {
            orderCode: "ATR-2611-801",
            appointmentDate: "12/08/2026",
            appointmentTime: "09:30",
            garageName: "SAIGON MOTORWERKS & DETAILING LAB",
            serviceName: "Combo Bảo Dưỡng Định Kỳ Cấp Trung (Mốc 20.000 km)",
            totalVnd: 1350000,
            status: "HOAN_TAT",
        },
    ],
};
let MockAutoraConnector = class MockAutoraConnector {
    async searchServices(input) {
        const q = normalizeVi(input.query ?? "");
        return MOCK_SERVICES.filter((s) => {
            if (input.categoryId && input.categoryId !== "all" && s.categoryId !== input.categoryId) {
                return false;
            }
            if (input.maxPriceVnd && s.priceVnd > input.maxPriceVnd) {
                return false;
            }
            if (q) {
                const corpus = normalizeVi(`${s.sku} ${s.name} ${s.categoryLabel} ${s.shortSummary}`);
                return q.split(" ").every((tok) => corpus.includes(tok));
            }
            return true;
        });
    }
    async searchGarages(input) {
        const q = normalizeVi(input.query ?? "");
        return MOCK_GARAGES.filter((g) => {
            if (input.city && input.city !== "all" && g.cityCode !== input.city) {
                return false;
            }
            if (input.serviceCategory &&
                input.serviceCategory !== "all" &&
                !g.categories.includes(input.serviceCategory)) {
                return false;
            }
            if (input.minRating && g.rating < input.minRating) {
                return false;
            }
            if (q) {
                const corpus = normalizeVi(`${g.name} ${g.district} ${g.fullAddress} ${g.availableServices.join(" ")}`);
                return q.split(" ").some((tok) => corpus.includes(tok));
            }
            return true;
        }).map(({ categories: _cats, ...dto }) => dto);
    }
    async compareGarages(garageIdsOrSlugs) {
        const matched = MOCK_GARAGES.filter((g) => garageIdsOrSlugs.includes(g.id) || garageIdsOrSlugs.includes(g.slug));
        const list = matched.length > 0 ? matched : MOCK_GARAGES.slice(0, 2);
        return list.map(({ categories: _cats, ...dto }) => dto);
    }
    async checkAvailability(garageIdOrSlug, date) {
        const garage = MOCK_GARAGES.find((g) => g.id === garageIdOrSlug || g.slug === garageIdOrSlug) ?? MOCK_GARAGES[0];
        return {
            garageId: garage.id,
            garageName: garage.name,
            date,
            availableSlots: ["08:00", "09:30", "13:30", "15:00"],
        };
    }
    async prepareBookingDraft(input) {
        const garage = MOCK_GARAGES.find((g) => g.id === input.garageId || g.slug === input.garageId) ?? MOCK_GARAGES[0];
        const service = MOCK_SERVICES.find((s) => s.slug === input.serviceSlug || s.id === input.serviceSlug) ?? MOCK_SERVICES[0];
        return {
            draftId: `draft_${Date.now()}`,
            garageId: garage.id,
            garageName: garage.name,
            serviceSlug: service.slug,
            serviceName: service.name,
            estimatedPriceVnd: service.priceVnd,
            preferredDate: input.preferredDate ?? "2026-11-25",
            preferredTime: input.preferredTime ?? "09:30",
            vehicleBrand: input.vehicleBrand,
            vehicleModel: input.vehicleModel,
            notes: input.notes,
            requiresUserConfirmation: true,
        };
    }
    async getMyVehicles(userId) {
        return MOCK_VEHICLES_BY_USER[userId] ?? [];
    }
    async getMyOrders(userId) {
        return MOCK_ORDERS_BY_USER[userId] ?? [];
    }
};
exports.MockAutoraConnector = MockAutoraConnector;
exports.MockAutoraConnector = MockAutoraConnector = __decorate([
    (0, common_1.Injectable)()
], MockAutoraConnector);
//# sourceMappingURL=mock-autora.connector.js.map