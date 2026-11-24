"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AgentWidget,
  type AgentAction,
  type NavigationAdapter,
} from "@autora/agent-sdk";
import { ROUTES } from "@/config/routes.config";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { useStore } from "@/features/cart/context/store-context";

const HOST_CAPABILITIES = [
  "garage.search",
  "garage.show",
  "service.search",
  "service.show",
  "booking.start",
  "booking.fill_draft",
] as const;

const HOST_UI_TARGET_PATTERNS = [
  "nav.garages",
  "nav.services",
  "nav.cart",
  "nav.checkout",
  "garage.filter.search",
  "garage.filter.city.*",
  "garage.filter.category.*",
  "garage.card.*",
  "service.filter.search",
  "service.filter.category.*",
  "service.card.*.add_to_cart",
  "service.card.*.view",
  "checkout.select.garage",
  "checkout.input.date",
  "checkout.slot.*",
  "checkout.input.notes",
  "checkout.submit_booking",
] as const;

const CONFIRM_ONLY_TARGET_PATTERNS = ["checkout.submit_booking"] as const;

export function AutoraAgentHost() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeVehicle, addToCart, setBookingDraft } = useStore();
  const pathnameRef = useRef(pathname);
  const activeVehicleRef = useRef(activeVehicle);

  useEffect(() => {
    pathnameRef.current = pathname;
    activeVehicleRef.current = activeVehicle;
  }, [pathname, activeVehicle]);

  const adapter: NavigationAdapter = useMemo(
    () => ({
      getCapabilities: () => HOST_CAPABILITIES,
      getAllowedUiTargetPatterns: () => HOST_UI_TARGET_PATTERNS,
      navigateToRoute: async (route: string) => {
        router.push(route);
      },
      getCurrentContext: () => ({
        current_page: pathnameRef.current || "/",
        capabilities: HOST_CAPABILITIES,
        uiCapabilities: HOST_UI_TARGET_PATTERNS,
        vehicle: {
          brand: activeVehicleRef.current.brand,
          model: activeVehicleRef.current.model,
          year: activeVehicleRef.current.year,
        },
      }),
      navigate: async (action: AgentAction) => {
        switch (action.target) {
          case "garage.search": {
            router.push(ROUTES.GARAGES);
            break;
          }
          case "garage.show": {
            const slug = String(action.params.garageSlug ?? "");
            if (slug) router.push(ROUTES.GARAGE_DETAIL(slug));
            break;
          }
          case "service.search": {
            const qs = new URLSearchParams();
            if (action.params.category) {
              qs.set("danh-muc", String(action.params.category));
            }
            if (action.params.q) {
              qs.set("q", String(action.params.q));
            }
            const queryStr = qs.toString();
            router.push(
              queryStr ? `${ROUTES.SERVICES}?${queryStr}` : ROUTES.SERVICES
            );
            break;
          }
          case "service.show": {
            const slug = String(action.params.serviceSlug ?? "");
            if (slug) router.push(ROUTES.SERVICE_DETAIL(slug));
            break;
          }
          case "booking.start":
          case "booking.fill_draft": {
            const serviceSlug = action.params.serviceSlug
              ? String(action.params.serviceSlug)
              : undefined;
            const garageId = action.params.garageId
              ? String(action.params.garageId)
              : undefined;

            if (serviceSlug) {
              const matchedProduct =
                catalogService.getProductBySlug(serviceSlug);
              if (matchedProduct) {
                addToCart(matchedProduct, 1, garageId, false);
              }
            }

            setBookingDraft({
              garageId,
              serviceSlug,
              preferredDate: action.params.preferredDate
                ? String(action.params.preferredDate)
                : undefined,
              preferredTime: action.params.preferredTime
                ? String(action.params.preferredTime)
                : undefined,
              notes: action.params.notes
                ? String(action.params.notes)
                : undefined,
            });

            router.push(ROUTES.CHECKOUT);
            break;
          }
        }
      },
    }),
    [router, addToCart, setBookingDraft]
  );

  const agentApiUrl =
    process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:4100";

  return (
    <AgentWidget
      apiBaseUrl={agentApiUrl}
      tenantId="autora-vn"
      actorRole="customer"
      actorUserId="usr_khoa_01"
      navigationAdapter={adapter}
      allowedTargetPatterns={HOST_UI_TARGET_PATTERNS}
      confirmOnlyTargetPatterns={CONFIRM_ONLY_TARGET_PATTERNS}
    />
  );
}

