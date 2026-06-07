import { HTMLAttributes } from "react";
const colors = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  wine: "bg-[#8B1A1A]/10 text-[#8B1A1A]",
};
interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  label: string;
  color?: keyof typeof colors;
}
export function Badge({ label, color = "gray", className = "", ...rest }: BadgeProps) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`} {...rest}>{label}</span>;
}