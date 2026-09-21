// components/modules/CategoryCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";

interface ICategoryCardProps {
  title: string;
  picture: string;
  slug: string;
  itemCount?: number;
  priority?: boolean;
}

export default function CategoryCard({
  picture,
  title,
  slug,
  itemCount,
  priority = false,
}: ICategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      aria-label={`مشاهده محصولات دسته‌بندی ${title}`}
      className="group relative block w-full overflow-hidden rounded-2xl 
        bg-neutral-100 shadow-sm ring-1 ring-neutral-200
        transition-all duration-300 hover:shadow-xl hover:ring-amber-300/60
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      {/* نسبت 4/5: بلندتر از مربع ولی نه به اغراق‌آمیزی 3/4 در ستون باریک */}
      <div className="relative aspect-4/5 w-full overflow-hidden">
        <Image
          src={picture}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* گرادیان فقط نیمه پایین + روشن‌تر: خوانایی متن بدون سیاه‌شدن کارت */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
        />

        {/* محتوا: پدینگ کافی + line-clamp تا هیچ‌وقت روی هم نریزه */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <div className="min-w-0">
            {typeof itemCount === "number" && (
              <span className="mb-1 block text-[11px] font-medium text-white/70">
                {itemCount} محصول
              </span>
            )}
            <h3 className="text-base lg:text-lg font-bold leading-snug text-white line-clamp-2">
              {title}
            </h3>
          </div>

          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              bg-white/15 border border-white/25 text-white backdrop-blur-sm
              transition-all duration-300
              group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white
              group-hover:rotate-45"
          >
            <ArrowUpLeft className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
