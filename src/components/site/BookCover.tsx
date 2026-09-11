import { cn } from "@/lib/utils";

type Props = {
  title: string;
  author?: string;
  color: string;
  coverUrl?: string | null;
  className?: string;
  compact?: boolean;
};

/**
 * Realistic book-cover placeholder. When a real cover image is uploaded
 * (cover_url) it is used instead, so the shop owner can replace artwork later.
 */
export function BookCover({ title, author, color, coverUrl, className, compact }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-r-md rounded-l-sm",
        className,
      )}
      style={{
        backgroundColor: color,
        boxShadow: "var(--shadow-book)",
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-between p-[8%] text-left">
          <div
            className="absolute inset-y-0 left-0 w-[9%]"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0))" }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 45%, rgba(0,0,0,0.28))",
            }}
            aria-hidden
          />
          <div className="relative">
            <div
              className="mb-[6%] h-px w-full opacity-50"
              style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
            />
            <p
              className={cn(
                "text-display leading-tight text-[oklch(0.98_0.02_85)]",
                compact ? "text-[0.55rem]" : "text-[0.78rem] sm:text-sm",
              )}
            >
              {title}
            </p>
          </div>
          {author && !compact && (
            <p className="relative text-[0.6rem] uppercase tracking-[0.18em] text-[oklch(0.98_0.02_85_/_0.75)]">
              {author}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
