interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}
const sizes = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initials = name.split(" ").slice(0,2).map((n) => n[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  return (
    <div className={`${sizes[size]} rounded-full bg-[#8B1A1A]/15 text-[#8B1A1A] font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}