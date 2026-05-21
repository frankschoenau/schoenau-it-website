import {
  ButtonHTMLAttributes,
} from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {

  variant?:
    | "primary"
    | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {

  const variants = {

    primary:
      `
        bg-blue-600
        hover:bg-blue-700
        text-white
      `,

    secondary:
      `
        border
        border-white/10
        bg-white/5
        hover:bg-white/10
        text-white
      `,
  };

  return (
    <button
      className={`
        inline-flex
        items-center
        justify-center
        rounded-full
        px-6
        py-3
        text-sm
        font-medium
        transition-all
        duration-300
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}