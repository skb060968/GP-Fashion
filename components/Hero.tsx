export default function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-black"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/hero/poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
    </section>
  )
}
