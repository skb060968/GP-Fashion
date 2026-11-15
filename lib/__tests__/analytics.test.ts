import { describe, it, expect } from "vitest";
import { cleanAnalyticsEvent } from "@/lib/analytics";

const view = (url: string) => ({ type: "pageview" as const, url });

describe("cleanAnalyticsEvent", () => {
  it("drops admin, invoice and api pages", () => {
    for (const path of ["/admin", "/admin/orders/1", "/admin-login", "/invoice/abc", "/api/orders"]) {
      expect(cleanAnalyticsEvent(view(`https://gpfashion.in${path}?t=secret`))).toBeNull();
    }
  });

  it("removes the query string and hash from every other page", () => {
    expect(cleanAnalyticsEvent(view("https://gpfashion.in/order-confirmation/GP123?t=token&email=a%40b.com#top"))).toEqual(
      view("https://gpfashion.in/order-confirmation/GP123"),
    );
    expect(cleanAnalyticsEvent(view("https://gpfashion.in/shop#size"))).toEqual(view("https://gpfashion.in/shop"));
    expect(cleanAnalyticsEvent(view("https://gpfashion.in/"))).toEqual(view("https://gpfashion.in/"));
  });
});
