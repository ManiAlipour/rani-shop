import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HeroSection() {
  return (
    <section className="relative w-full h-lvh overflow-hidden select-none -z-50">
      <Image
        src="/images/hero/hero.svg"
        alt="کالکشن پاییز و زمستان"
        fill
        priority
        className="w-full h-full object-cover object-[center_top] md:object-[35%_center] scale-105"
      />

      <div className="absolute inset-0 bg-amber-950/20 mix-blend-multiply" />

      <div className="absolute inset-0 bg-linear-to-t md:bg-linear-to-l from-stone-950/80 via-stone-950/40 to-transparent" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(20,16,13,0.6)_100%)]" />

      <div className="relative z-10 container mx-auto h-full px-6 sm:px-10 lg:px-16 flex items-center justify-center md:justify-start">
        <div className="flex flex-col items-center md:items-start text-center md:text-right max-w-xl lg:max-w-2xl text-white">
          <Badge variant="ink" className="p-2">
            کالکشن پاییز و زمستان ۱۴۰۵
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-tight sm:leading-[1.2] mb-4 sm:mb-6 drop-shadow-md">
            روایت تازه‌ای از <br className="hidden sm:inline" />
            <span className="text-gold-200">زیبایی تو</span>
          </h1>

          <p className="text-xs sm:text-base lg:text-lg text-stone-200/90 font-normal leading-relaxed max-w-lg mb-6 sm:mb-8 drop-shadow-sm">
            طراحی‌های ماندگار، پارچه‌های باکیفیت و جزئیاتی که برای درخشش شما
            ساخته شده‌اند.
          </p>

          <Button variant="gold" size="lg">
            مشاهده کالکشن
          </Button>
        </div>
      </div>
    </section>
  );
}
