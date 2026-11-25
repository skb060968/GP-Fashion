import type { ReactNode } from "react"

type View = "front" | "back" | "side" | "seated"

const TAPE = "#a8803f"

const HALF_ARM = "M55,31 L55,38 Q44,40 34,46 Q29,80 27,118 L25,130 Q28,134 31,130 L33,118 Q36,90 41,62"
const HALF_BODY = "M41,62 Q45,78 44,92 Q38,102 39,112 Q40,140 42,168 L45,222 L40,228 L52,228 L51,222 L52,168 Q55,140 60,124"

function Standing({ back }: { back?: boolean }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={60} cy={20} r={11} />
      <path d={`${HALF_ARM} ${HALF_BODY}`} />
      <path d={`${HALF_ARM} ${HALF_BODY}`} transform="translate(120,0) scale(-1,1)" />
      {back ? <path d="M60,38 L60,118" strokeOpacity={0.35} /> : <path d="M60,40 L60,118" strokeOpacity={0.15} strokeDasharray="2 3" />}
    </g>
  )
}

function Side() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={58} cy={20} r={11} />
      <path d="M54,31 L53,38 Q46,60 50,88 Q43,102 46,118 Q50,140 52,168 L54,222 L54,228 L72,228 L62,222 L64,168 Q67,140 68,118 Q70,104 66,92 Q64,86 68,74 Q72,58 64,40 L63,31" />
      <path d="M58,44 Q62,80 60,118" strokeOpacity={0.3} />
    </g>
  )
}

function Seated() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={56} cy={34} r={11} />
      <path d="M51,45 Q45,70 45,96 Q43,118 46,138 L88,138 Q89,170 90,204 L92,207" />
      <path d="M61,45 Q71,62 68,80 Q64,92 67,100 Q72,112 72,124 L96,124 Q99,128 98,140 L98,204 L108,207 L90,207" />
      <path d="M32,140 L86,140 M32,140 L32,92 M36,140 L36,212 M82,140 L82,212" strokeOpacity={0.35} />
    </g>
  )
}

const tape = (rx: number, cx: number, y: number, ry = 2.4) => (
  <>
    <path d={`M${cx - rx},${y} A${rx},${ry} 0 0 1 ${cx + rx},${y}`} stroke={TAPE} strokeWidth={1.6} strokeDasharray="2 2" fill="none" />
    <path d={`M${cx - rx},${y} A${rx},${ry} 0 0 0 ${cx + rx},${y}`} stroke={TAPE} strokeWidth={2.4} fill="none" />
  </>
)

const line = (d: string) => <path d={d} stroke={TAPE} strokeWidth={2.4} fill="none" strokeLinecap="round" />

const ends = (...pts: [number, number][]) => pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} fill={TAPE} />)

const ZOOM_NECK = "35 4 50 100"
const ZOOM_UPPER_ARM = "12 36 44 88"
const ZOOM_HAND = "8 80 40 80"
const ZOOM_KNEE = "27 128 40 80"
const ZOOM_LOWER_LEG = "27 152 40 80"

const FIGURES: Record<string, { view: View; mark: ReactNode; zoom?: string }> = {
  height: { view: "front", mark: <>{line("M104,9 L104,228")}{line("M98,9 L110,9")}{line("M98,228 L110,228")}</> },
  chest: { view: "front", mark: tape(19.5, 60, 66) },
  waist: { view: "front", mark: tape(16.5, 60, 92) },
  hip: { view: "front", mark: tape(21.5, 60, 112) },
  neck: { view: "front", mark: tape(5.8, 60, 35, 2), zoom: ZOOM_NECK },
  shoulder: { view: "back", mark: <>{line("M34,47 L86,47")}{ends([34, 47], [86, 47])}</> },
  acrossBack: { view: "back", mark: <>{line("M41,57 L79,57")}{ends([41, 57], [79, 57])}</> },
  acrossFront: { view: "front", mark: <>{line("M41,57 L79,57")}{ends([41, 57], [79, 57])}</> },
  bustPointToPoint: { view: "front", mark: <>{line("M50,68 L70,68")}{ends([50, 68], [70, 68])}</> },
  shoulderToBustPoint: { view: "front", mark: <>{line("M36,46 L50,68")}{ends([36, 46], [50, 68])}</> },
  frontWaistLength: { view: "front", mark: <>{line("M60,40 L60,92")}{ends([60, 40], [60, 92])}</> },
  backWaistLength: { view: "back", mark: <>{line("M60,33 L60,92")}{ends([60, 33], [60, 92])}</> },
  shoulderToWaistFront: { view: "front", mark: <>{line("M55,39 Q49,66 52,92")}{ends([55, 39], [52, 92])}</> },
  shoulderToWaistBack: { view: "back", mark: <>{line("M55,39 L54,92")}{ends([55, 39], [54, 92])}</> },
  sleeveLength: { view: "front", mark: <>{line("M33,45 Q27,80 25,118")}{ends([33, 45], [25, 118])}</> },
  upperArm: { view: "front", mark: tape(4.2, 34.6, 72, 1.4), zoom: ZOOM_UPPER_ARM },
  wrist: { view: "front", mark: tape(3.2, 30, 117, 1.2), zoom: ZOOM_HAND },
  hand: { view: "front", mark: tape(3.4, 28, 126, 1.2), zoom: ZOOM_HAND },
  abdomen: { view: "front", mark: tape(19.5, 60, 101) },
  upperThigh: { view: "front", mark: tape(9.5, 49.4, 130, 1.8) },
  knee: { view: "front", mark: tape(5.4, 47, 168, 1.4), zoom: ZOOM_KNEE },
  calf: { view: "front", mark: tape(4.8, 47.3, 186, 1.4), zoom: ZOOM_LOWER_LEG },
  ankle: { view: "front", mark: tape(3.4, 48, 218, 1.2), zoom: ZOOM_LOWER_LEG },
  seatedRise: { view: "seated", mark: <>{line("M57,96 L57,138")}{line("M51,96 L63,96")}{line("M51,138 L63,138")}</> },
  crotchLength: { view: "side", mark: <>{line("M66,92 Q71,112 58,128 Q45,124 45,104 Q45,94 50,88")}{ends([66, 92], [50, 88])}</> },
  waistToHip: { view: "front", mark: <>{line("M76,92 Q82,102 81,112")}{ends([76, 92], [81, 112])}</> },
  waistToKnee: { view: "front", mark: <>{line("M76,92 Q82,102 81,112 Q80,140 78,168")}{ends([76, 92], [78, 168])}</> },
  waistToAnkle: { view: "front", mark: <>{line("M76,92 Q82,102 81,112 Q80,140 78,168 L75,219")}{ends([76, 92], [75, 219])}</> },
  waistToFloor: { view: "front", mark: <>{line("M76,92 Q82,102 81,112 Q80,140 78,168 L75,222 L75,228")}{line("M66,229 L86,229")}{ends([76, 92])}</> },
  shirtLength: { view: "front", mark: <>{line("M55,39 Q49,66 51,92 L51,128")}{line("M45,128 L57,128")}{ends([55, 39])}</> },
}

export default function MeasureFigure({ field, className }: { field: string; className?: string }) {
  const f = FIGURES[field]
  if (!f) return null
  return (
    <svg viewBox={f.zoom ?? "0 0 120 240"} className={`measure-figure ${className ?? ""}`} aria-hidden focusable="false">
      <style>{".measure-figure path,.measure-figure circle{vector-effect:non-scaling-stroke}"}</style>
      {f.view === "side" ? <Side /> : f.view === "seated" ? <Seated /> : <Standing back={f.view === "back"} />}
      {f.mark}
      {f.view === "back" && (
        <text x={60} y={238} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.5} fontFamily="inherit">
          back
        </text>
      )}
    </svg>
  )
}
