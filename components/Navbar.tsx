'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Image from "next/image"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { cart } = useCart()

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: 'Portfolio', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Journal', href: '/journal' },
    { name: 'Contact', href: '/contact' },
    { name: 'Track Order', href: '/track-order' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-stone-200 backdrop-blur-md border-b border-gray-100">
      <div className="container-max">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/payments/logo.png"
              alt="GP Fashion logo"
              width={60}
              height={60}
              className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <span className="font-serif text-2xl font-bold tracking-tight text-fashion-black">
              GP Fashion
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-fashion-black transition-colors"
              >
                {item.name}
              </Link>
            ))}

            {/* Cart Icon */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-fashion-black" />
              {cart.length > 0 && (
                <span
                  className="absolute -top-2 -right-2 bg-fashion-gold text-white text-xs font-semibold rounded-full px-1.5 py-0.5 animate-pulse"
                >
                  {cart.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-gray-700 hover:text-fashion-black"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu with animation */}
        <div
          className={`lg:hidden transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          } border-t border-gray-100 bg-gradient-to-b from-amber-50 to-amber-100`}
        >
          <div className="py-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-2 py-2 text-sm text-gray-700 hover:text-fashion-black"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Cart Icon in mobile menu */}
            <Link
              href="/cart"
              className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:text-fashion-black"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cart.length > 0 && (
                <span
                  className="ml-2 bg-fashion-gold text-white text-xs font-semibold rounded-full px-1.5 py-0.5 animate-pulse"
                >
                  {cart.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}