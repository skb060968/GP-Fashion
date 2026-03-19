// Premium section heading component
interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: "left" | "center"
  className?: string
  as?: "h1" | "h2"
}

export default function SectionHeading({
  title,
  subtitle,
  align = "center",
  className = "",
  as: Tag = "h2",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center" : "text-left"

  return (
    <div className={`${alignClass} ${className}`}>
      <Tag className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-fashion-black mb-6">
        {title}
      </Tag>
      {subtitle && (
        <p className={`text-lg sm:text-xl text-gray-600 leading-relaxed ${align === "center" ? "max-w-3xl mx-auto" : "max-w-3xl"}`}>
          {subtitle}
        </p>
      )}
      <div className={`w-24 h-1 bg-fashion-gold mt-8 ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  )
}
