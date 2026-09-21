import React from "react";
import CategoryCard from "./CategoryCard";
import Link from "next/link";
import {  ArrowLeft, Sparkles } from "lucide-react";

const CATEGORIES_DATA = [
  {
    id: 1,
    title: "تیشرت و پلوشرت",
    picture: "/images/tshirt.jpg",
    slug: "tshirts",
    itemCount: 42,
  },
  {
    id: 2,
    title: "کت و پالتو",
    picture: "/images/jackets.jpg",
    slug: "jackets",
    itemCount: 18,
  },
  {
    id: 3,
    title: "شلوار و جین",
    picture: "/images/pants.jpg",
    slug: "pants",
    itemCount: 35,
  },
  {
    id: 4,
    title: "سویشرت و هودی",
    picture: "/images/sweatshirt.jpg",
    slug: "accessories",
    itemCount: 29,
  },
];

export default function CategoriesSection() {
  return (
    <section className="w-full py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="space-y-2 text-center md:text-right">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
              bg-3 
              bg-amber-100 border border-amber- font-semibold tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                کالکشن‌های <strong>رانیس استایل</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              دسته‌بندی‌های برگزیده
            </h2>
            <p className="text-sm text-neutral-600 max-w-md">
              منتخب بهترین استایل‌های روز با کیفیت ممتاز
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <Link
              href="/categories"
              className="group inline-flex items-center gap-2 text-sm font-semibold 
                text-amber-700 hover:text-amber-800 transition-colors py-2"
            >
              <span>مشاهده تمام دسته‌ها</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ⭐ تغییر کلیدی: حداکثر ۴ ستون — کارت‌ها عریض‌تر و متن‌ها خواناتر */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES_DATA.map((cat, index) => (
            <CategoryCard key={cat.id} {...cat} priority={index < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
