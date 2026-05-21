import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {

  return (
    <div
      className={`
        card-blur
        border-subtle
        rounded-[24px]
        p-8
        shadow-[var(--shadow-card)]
        transition-all
        duration-300
        hover:-translate-y-1
        ${className}
      `}
    >
      {children}
    </div>
  );
}