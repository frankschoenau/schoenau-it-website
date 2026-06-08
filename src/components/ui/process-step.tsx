interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
}

export default function ProcessStep({
  number,
  title,
  description,
}: ProcessStepProps) {
  return (
    <div
      className="
        group
        relative
      "
    >
      {/* CONNECTION LINE */}

      <div
        className="
          absolute
          left-8
          top-16

          hidden
          md:block

          h-full
          w-px

          bg-linear-to-b
          from-cyan-500/30
          to-white/5
        "
      />

      {/* CONTENT */}

      <div
        className="
          relative
          z-10

          flex
          flex-col

          gap-4

          md:flex-row
          md:gap-8
        "
      >
        {/* NUMBER */}

        <div
          className="
            flex
            h-14
            w-14

            md:h-16
            md:w-16

            shrink-0
            items-center
            justify-center

            rounded-full

            border
            border-cyan-500/30

            bg-cyan-500/10

            text-base
            font-bold
            tracking-wide
            text-cyan-400

            shadow-[0_0_25px_rgba(6,182,212,0.15)]
          "
        >
          {number}
        </div>

        {/* CARD */}

        <div
          className="
            w-full

            rounded-[24px]
            md:rounded-[28px]

            border
            border-white/5

            bg-white/3

            p-6
            md:p-8

            transition-all
            duration-300

            hover:border-cyan-500/20
            hover:bg-white/5
          "
        >
          <h3
            className="
              text-xl
              md:text-2xl

              font-semibold
              tracking-tight
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-4

              text-sm
              md:text-base

              leading-relaxed
              text-slate-400
            "
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}