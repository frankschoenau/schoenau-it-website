interface SectionHeadingProps {

  eyebrow?: string;

  title: string;

  description?: string;
}

export default function SectionHeading({

  eyebrow,

  title,

  description,

}: SectionHeadingProps) {

  return (

    <div className="max-w-3xl">

      {eyebrow && (

        <div
          className="
            mb-4
            text-sm
            font-medium
            uppercase
            tracking-[0.2em]
            text-cyan-400
          "
        >
          {eyebrow}
        </div>
      )}

      <h2
        className="
          text-4xl
          font-semibold
          tracking-tight
          md:text-5xl
        "
      >
        {title}
      </h2>

      {description && (

        <p
          className="
            mt-6
            text-lg
            leading-relaxed
            text-slate-400
          "
        >
          {description}
        </p>

      )}

    </div>
  );
}