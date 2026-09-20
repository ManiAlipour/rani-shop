"use client";

import { useState } from "react";
import { IoMenuOutline, IoCloseOutline, IoHomeOutline } from "react-icons/io5"; // اضافه کردن آیکون بستن برای تجربه بهتر
import Image from "next/image";
import Link from "next/link";
import { FaRegPaperPlane, FaRegUser } from "react-icons/fa";
import { BsBagHeart } from "react-icons/bs";
import { GoSearch } from "react-icons/go";
import { usePathname } from "next/navigation";
import { CiShop } from "react-icons/ci";
import { LuNewspaper } from "react-icons/lu";

const links = [
  { title: "خانه", href: "/", icon: <IoHomeOutline /> },
  { title: "محصولات", href: "/shop", icon: <CiShop /> },
  { title: "مجله", href: "/blogs", icon: <LuNewspaper /> },
  { title: "تماس با ما", href: "/contact", icon: <FaRegPaperPlane /> },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const pathname = usePathname();

  const toggleOpen = () => setMenuOpen(!menuOpen);

  return (
    <header
      className="lg:px-10 lg:py-5 px-4 py-3 flex justify-between bg-white sticky top-0 right-0 z-50
     items-center w-full"
    >
      {menuOpen && (
        <div
          onClick={toggleOpen}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all"
        />
      )}

      <div
        className={`z-50 fixed w-72 h-screen bg-white top-0 right-0 transition-transform
           duration-300 shadow-xl ${menuOpen ? "translate-x-0" : "translate-x-full"} font-dana`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={toggleOpen}>
            <IoCloseOutline size={30} />
          </button>

          <div className="font-bold">
            <span className="text-gold-900">Ranis </span>
            <span className="font-extralight">Style</span>
          </div>
        </div>
        <span className="p-4 font-light text-xs mt-10 text-gray-500">
          لینک ها:
        </span>
        <nav className="flex flex-col gap-5 p-4">
          {links.map((l, i) => (
            <Link
              href={l.href}
              key={i}
              className={`transition duration-300 p-4 rounded-xl flex items-center gap-2
            ${pathname === l.href ? "bg-gold-400" : ""}`}
            >
              <span className="text-xl">{l.icon}</span>
              {l.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="text-xl lg:text-2xl transition duration-300 hover:text-gold-900 font-dana flex items-center gap-2">
        <Image src="/images/logo.webp" alt="logo" width={45} height={45} />
        <div>
          <span className="font-black text-gold-800">رانیس </span>
          <span className="text-light text-xs lg:text-sm text-gold-500">
            استایل
          </span>
        </div>
      </div>

      <nav className="hidden lg:flex gap-6">
        {links.map((l, i) => (
          <Link href={l.href} key={i}>
            {l.title}
          </Link>
        ))}
      </nav>

      <div className="flex gap-4 items-center text-gold-900">
        <Link href="/dashboard">
          <FaRegUser size={25} />
        </Link>

        <Link href="/cart">
          <BsBagHeart size={25} />
        </Link>

        <button>
          <GoSearch size={25} />
        </button>

        <button onClick={toggleOpen} className="lg:hidden text-black">
          <IoMenuOutline size={25} />
        </button>
      </div>
    </header>
  );
}
