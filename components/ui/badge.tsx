import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo-100 text-indigo-800",
        secondary: "border-transparent bg-slate-100 text-slate-700",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-900",
        danger: "border-transparent bg-red-100 text-red-800",
        blue: "border-transparent bg-blue-100 text-blue-800",
        yellow: "border-transparent bg-yellow-100 text-yellow-900",
        amber: "border-transparent bg-amber-100 text-amber-950",
        orange: "border-transparent bg-orange-100 text-orange-900",
        violet: "border-transparent bg-violet-100 text-violet-800",
        slate: "border-transparent bg-slate-200 text-slate-800",
        pink: "border-transparent bg-pink-100 text-pink-800",
        cyan: "border-transparent bg-cyan-100 text-cyan-900",
        teal: "border-transparent bg-teal-100 text-teal-900",
        green: "border-transparent bg-green-100 text-green-800",
        rose: "border-transparent bg-rose-100 text-rose-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
