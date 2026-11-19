import Image from "next/image";

// Shows the product photo if one is set, otherwise a neutral placeholder tile.
export function ProductImage({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl: string | null;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg bg-black/5 dark:bg-white/10 ${className}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full items-center justify-center text-4xl font-semibold text-black/25 dark:text-white/25">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}
