"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ServiceProduct } from "@/features/catalog/types/service.types";
import { catalogService } from "@/features/catalog/services/catalog.service";

export interface CartItem {
  readonly productId: string;
  readonly slug: string;
  readonly sku: string;
  readonly name: string;
  readonly categoryLabel: string;
  readonly image: string;
  readonly priceVnd: number;
  readonly originalPriceVnd?: number;
  readonly quantity: number;
  readonly selectedGarageId?: string;
  readonly estimatedDuration: string;
}

export interface CustomerVehicle {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly year: string;
  readonly licensePlate: string;
  readonly currentOdoKm: string;
}

export interface ServiceOrder {
  readonly orderCode: string;
  readonly createdAt: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly garageAddress: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly odoKm: string;
  readonly paymentMethodLabel: string;
  readonly items: readonly CartItem[];
  readonly subtotalVnd: number;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly status: "DA_XAC_NHAN" | "DANG_THUC_HIEN" | "HOAN_TAT";
  readonly notes?: string;
}

interface StoreContextValue {
  readonly cart: readonly CartItem[];
  readonly cartCount: number;
  readonly subtotalVnd: number;
  readonly couponCode: string | null;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly isMiniCartOpen: boolean;
  readonly wishlistIds: readonly string[];
  readonly quickViewProduct: ServiceProduct | null;
  readonly activeVehicle: CustomerVehicle;
  readonly orders: readonly ServiceOrder[];
  readonly toastMessage: string | null;
  readonly addToCart: (
    product: ServiceProduct,
    quantity?: number,
    garageId?: string,
    openDrawer?: boolean
  ) => void;
  readonly updateCartQuantity: (productId: string, quantity: number) => void;
  readonly removeFromCart: (productId: string) => void;
  readonly clearCart: () => void;
  readonly applyCoupon: (code: string) => { ok: boolean; message: string };
  readonly removeCoupon: () => void;
  readonly setMiniCartOpen: (open: boolean) => void;
  readonly toggleWishlist: (productId: string) => void;
  readonly isInWishlist: (productId: string) => boolean;
  readonly openQuickView: (product: ServiceProduct) => void;
  readonly closeQuickView: () => void;
  readonly setActiveVehicle: (vehicle: CustomerVehicle) => void;
  readonly placeOrder: (
    draft: Omit<
      ServiceOrder,
      | "orderCode"
      | "createdAt"
      | "items"
      | "subtotalVnd"
      | "discountVnd"
      | "totalVnd"
      | "status"
    >
  ) => ServiceOrder;
}

const DEFAULT_VEHICLE: CustomerVehicle = {
  id: "veh-1",
  brand: "Mazda",
  model: "CX-5 2.0 Premium",
  year: "2023",
  licensePlate: "51K-682.39",
  currentOdoKm: "24.800",
};

const INITIAL_DEMO_ORDERS: readonly ServiceOrder[] = [
  {
    orderCode: "ATR-2611-801",
    createdAt: "10/08/2026",
    appointmentDate: "12/08/2026",
    appointmentTime: "09:30",
    garageId: "grg-saigon-motorwerks",
    garageName: "SAIGON MOTORWERKS & DETAILING LAB",
    garageAddress: "88 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP.HCM",
    customerName: "Nguyễn Minh Khoa",
    customerPhone: "0909 688 912",
    vehicleLabel: "Mazda CX-5 2.0 Premium (2023)",
    licensePlate: "51K-682.39",
    odoKm: "20.150",
    paymentMethodLabel: "Thanh toán tại garage sau nghiệm thu",
    items: [
      {
        productId: "prd-milestone-20k",
        slug: "bao-duong-dinh-ky-moc-20000km-toan-dien",
        sku: "ATR-BD-020",
        name: "Combo Bảo Dưỡng Định Kỳ Cấp Trung (Mốc 20.000 km)",
        categoryLabel: "Bảo dưỡng định kỳ",
        image: "/images/garage-card-alt.jpg",
        priceVnd: 1350000,
        originalPriceVnd: 1600000,
        quantity: 1,
        estimatedDuration: "90 phút",
      },
    ],
    subtotalVnd: 1350000,
    discountVnd: 0,
    totalVnd: 1350000,
    status: "HOAN_TAT",
  },
];

const STORAGE_KEY = "autora_ecommerce_v2";

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<readonly CartItem[]>(() => {
    const starter = catalogService.getAllProducts()[0];
    return starter
      ? [
          {
            productId: starter.id,
            slug: starter.slug,
            sku: starter.sku,
            name: starter.name,
            categoryLabel: starter.categoryLabel,
            image: starter.image,
            priceVnd: starter.priceVnd,
            originalPriceVnd: starter.originalPriceVnd,
            quantity: 1,
            selectedGarageId: starter.supportedGarageIds[0],
            estimatedDuration: starter.estimatedDuration,
          },
        ]
      : [];
  });
  const [wishlistIds, setWishlistIds] = useState<readonly string[]>([
    "prd-ceramic-9h",
    "prd-alignment-3d",
  ]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isMiniCartOpen, setMiniCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<ServiceProduct | null>(null);
  const [activeVehicle, setActiveVehicle] =
    useState<CustomerVehicle>(DEFAULT_VEHICLE);
  const [orders, setOrders] =
    useState<readonly ServiceOrder[]>(INITIAL_DEMO_ORDERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  // Defer hydration via async timeout callback to avoid synchronous setState in effect
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.cart)) setCart(parsed.cart);
          if (Array.isArray(parsed.wishlistIds))
            setWishlistIds(parsed.wishlistIds);
          if (parsed.activeVehicle) setActiveVehicle(parsed.activeVehicle);
          if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
          if (typeof parsed.couponCode === "string")
            setCouponCode(parsed.couponCode);
        }
      } catch {
        // Ignore malformed localStorage
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cart,
          wishlistIds,
          activeVehicle,
          orders,
          couponCode,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [storageReady, cart, wishlistIds, activeVehicle, orders, couponCode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  const addToCart = useCallback(
    (
      product: ServiceProduct,
      quantity = 1,
      garageId?: string,
      openDrawer = true
    ) => {
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === product.id
        );
        if (existingIndex >= 0) {
          return prev.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  selectedGarageId: garageId ?? item.selectedGarageId,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            sku: product.sku,
            name: product.name,
            categoryLabel: product.categoryLabel,
            image: product.image,
            priceVnd: product.priceVnd,
            originalPriceVnd: product.originalPriceVnd,
            quantity,
            selectedGarageId: garageId ?? product.supportedGarageIds[0],
            estimatedDuration: product.estimatedDuration,
          },
        ];
      });

      if (openDrawer) {
        setMiniCartOpen(true);
      } else {
        showToast(`Đã thêm "${product.name}" vào giỏ dịch vụ`);
      }
    },
    [showToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode(null);
  }, []);

  const applyCoupon = useCallback(
    (code: string): { ok: boolean; message: string } => {
      const normalized = code.trim().toUpperCase();
      if (normalized === "AUTORA10" || normalized === "CHAMXE10") {
        setCouponCode(normalized);
        return {
          ok: true,
          message: `Đã áp dụng mã ${normalized}: Giảm 10% (tối đa 300.000đ)`,
        };
      }
      return {
        ok: false,
        message: "Mã ưu đãi không hợp lệ. Thử nhập mã: AUTORA10",
      };
    },
    []
  );

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        showToast(
          exists
            ? "Đã xóa khỏi danh sách yêu thích"
            : "Đã lưu vào danh sách dịch vụ yêu thích"
        );
        return exists
          ? prev.filter((id) => id !== productId)
          : [productId, ...prev];
      });
    },
    [showToast]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const openQuickView = useCallback((product: ServiceProduct) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const subtotalVnd = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const discountVnd = useMemo(() => {
    if (!couponCode || subtotalVnd === 0) return 0;
    return Math.min(Math.round(subtotalVnd * 0.1), 300000);
  }, [couponCode, subtotalVnd]);

  const totalVnd = Math.max(0, subtotalVnd - discountVnd);

  const placeOrder = useCallback(
    (
      draft: Omit<
        ServiceOrder,
        | "orderCode"
        | "createdAt"
        | "items"
        | "subtotalVnd"
        | "discountVnd"
        | "totalVnd"
        | "status"
      >
    ): ServiceOrder => {
      const nextNum = 802 + orders.length;
      const newOrder: ServiceOrder = {
        ...draft,
        orderCode: `ATR-2611-${nextNum}`,
        createdAt: "24/11/2026",
        items: [...cart],
        subtotalVnd,
        discountVnd,
        totalVnd,
        status: "DA_XAC_NHAN",
      };
      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setCouponCode(null);
      return newOrder;
    },
    [cart, discountVnd, orders.length, subtotalVnd, totalVnd]
  );

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        subtotalVnd,
        couponCode,
        discountVnd,
        totalVnd,
        isMiniCartOpen,
        wishlistIds,
        quickViewProduct,
        activeVehicle,
        orders,
        toastMessage,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        setMiniCartOpen,
        toggleWishlist,
        isInWishlist,
        openQuickView,
        closeQuickView,
        setActiveVehicle,
        placeOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
