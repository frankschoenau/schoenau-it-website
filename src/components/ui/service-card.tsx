import { ReactNode } from "react";

interface ServiceCardProps {

  icon: ReactNode;

  title: string;

  description: string;
}

export default function ServiceCard({

  icon,

  title,

  description,

}: ServiceCardProps) {

  return (

    <div
      className="
        group
        relative

        overflow-hidden

        rounded-[28px]

        border
        border-white/5

        bg-white/[0.03]

        p-8

        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-cyan-500/20
        hover:bg-white/[0.05]
      "
    >

      {/* GLOW */}

      <div
        className="
          absolute
          inset-0

          opacity-0

          transition-opacity
          duration-500

          group-hover:opacity-100
        "
      >
        <div
          className="
            absolute
            -top-20
            right-0

            h-40
            w-40

            rounded-full

            bg-cyan-500/10

            blur-3xl
          "
        />
      </div>

      {/* CONTENT */}

      <div className="relative z-10">

        {/* ICON */}

        <div
          className="
            mb-8

            flex
            h-14
            w-14
            items-center
            justify-center

            rounded-2xl

            border
            border-white/10

            bg-white/5

            text-cyan-400
          "
        >
          {icon}
        </div>

        {/* TITLE */}

        <h3
          className="
            text-2xl
            font-semibold
            tracking-tight
          "
        >
          {title}
        </h3>

        {/* DESCRIPTION */}

        <p
          className="
            mt-5

            leading-relaxed

            text-slate-400
          "
        >
          {description}
        </p>

      </div>

    </div>
  );
}