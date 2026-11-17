import { ChevronDown } from "lucide-react"
import { INDIAN_STATES } from "@/lib/gst/states"

const BASE =
  "w-full appearance-none rounded-lg border bg-white py-3 pl-4 pr-10 font-jost text-black transition focus:outline-none focus:ring-1"
const OK = "border-black/15 focus:border-black focus:ring-black"
const BAD = "border-red-500 focus:border-red-500 focus:ring-red-500"

export default function StateSelect({
  value,
  onChange,
  error,
  name = "state",
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  error?: string
  name?: string
}) {
  const id = `field-${name}`
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between font-jost">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">State</span>
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          name={name}
          autoComplete="address-level1"
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${BASE} ${value ? "" : "text-black/40"} ${error ? BAD : OK}`}
        >
          <option value="" disabled>
            Select state
          </option>
          {INDIAN_STATES.map((s) => (
            <option key={s.code} value={s.name} className="text-black">
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" strokeWidth={1.75} aria-hidden />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 font-jost text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
