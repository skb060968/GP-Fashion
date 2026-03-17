import { recognitions } from "@/lib/data/recognitions"

export const metadata = {
  title: "Recognition | Piyush Bholla",
  description: "Awards and honors received.",
}

export default function RecognitionPage() {
  return (
    <main>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-stone-50">
        <div className="container-max">
          <h1 className="text-3xl md:text-4xl font-bold text-fashion-black mb-4">
            Recognition & Awards
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Honoring achievements in design, sustainability, and innovation.
          </p>
        </div>
      </section>

      {/* Recognition awards */}
      <section className="pb-24 bg-white">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {recognitions.map((award, i) => (
              <div
                key={i}
                className="card-base p-6"
              >
                <h3 className="font-serif text-xl font-bold text-fashion-gold mb-2">
                  {award.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{award.year}</p>
                <p className="text-gray-700 leading-relaxed">{award.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}