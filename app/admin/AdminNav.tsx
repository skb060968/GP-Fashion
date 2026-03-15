"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/orders");
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="text-lg font-serif font-bold text-stone-800">
            Admin
          </span>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  isActive(link.href)
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <LogoutButton />
      </div>
    </nav>
  );
}
