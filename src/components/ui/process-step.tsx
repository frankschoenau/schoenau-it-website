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
          left-6
          top-14
          hidden
          h-full
          w-px
          bg-white/10

          md:block
        "
      />

      {/* CONTENT */}

      <div
        className="
          relative
          z-10

          flex
          gap-6
        "
      >

        {/* NUMBER */}

        <div
          className="
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center

            rounded-full

            border
            border-cyan-500/20

            bg-cyan-500/10

            text-sm
            font-semibold
            text-cyan-400
          "
        >
          {number}
        </div>

        {/* CARD */}

        <div
          className="
            flex-1

            rounded-[28px]

            border
            border-white/5

            bg-white/[0.03]

            p-8

            transition-all
            duration-300

            hover:border-cyan-500/20
            hover:bg-white/[0.05]
          "
        >

          <h3
            className="
              text-2xl
              font-semibold
              tracking-tight
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-4

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