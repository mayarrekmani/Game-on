const SHAPE_CLASS: Record<string, string> = {
  circle: "rounded-full",
  square: "rounded-lg",
  hex: "[clip-path:polygon(25%_6%,75%_6%,100%_50%,75%_94%,25%_94%,0%_50%)]",
  shield: "[clip-path:polygon(50%_0%,100%_20%,100%_60%,50%_100%,0%_60%,0%_20%)]",
};

export default function Avatar({
  shape = "circle",
  color = "#d9531e",
  icon,
  photoUrl,
  name = "",
  size = "md",
  ringColor,
  className = "",
}: {
  shape?: "circle" | "square" | "hex" | "shield" | string;
  color?: string | null;
  icon?: string | null;
  photoUrl?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  ringColor?: string;
  className?: string;
}) {
  const sizeClass = {
    xs: "h-7 w-7 text-xs",
    sm: "h-9 w-9 text-sm",
    md: "h-11 w-11 text-base",
    lg: "h-16 w-16 text-2xl",
  }[size];

  const shapeClass = SHAPE_CLASS[shape] ?? SHAPE_CLASS.circle;

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center bg-cover bg-center font-serif font-bold text-white ${sizeClass} ${shapeClass} ${className}`}
      style={{
        background: photoUrl ? undefined : color ?? "#d9531e",
        backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
        boxShadow: ringColor ? `0 0 0 3px ${ringColor}` : undefined,
      }}
    >
      {!photoUrl && (icon || name?.[0]?.toUpperCase() || "?")}
    </div>
  );
}
