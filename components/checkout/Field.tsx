import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

const BASE =
  "w-full rounded-lg border bg-white px-4 py-3 font-jost text-black placeholder:text-black/35 transition focus:outline-none focus:ring-1"
const OK = "border-black/15 focus:border-black focus:ring-black"
const BAD = "border-red-500 focus:border-red-500 focus:ring-red-500"

type Common = {
  label: string
  name: string
  error?: string
  hint?: string
  optional?: boolean
}

type InputFieldProps = Common & { as?: "input" } & InputHTMLAttributes<HTMLInputElement>
type TextareaFieldProps = Common & { as: "textarea" } & TextareaHTMLAttributes<HTMLTextAreaElement>

/** Labelled form field with inline error, used across checkout. */
export default function Field(props: InputFieldProps | TextareaFieldProps) {
  const { label, name, error, hint, optional } = props
  const id = `field-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between font-jost">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">{label}</span>
        {optional && <span className="text-xs text-black/40">Optional</span>}
      </label>

      {props.as === "textarea" ? (
        <textarea
          {...stripCommon(props)}
          id={id}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${BASE} mt-2 ${error ? BAD : OK}`}
        />
      ) : (
        <input
          {...stripCommon(props)}
          id={id}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${BASE} mt-2 ${error ? BAD : OK}`}
        />
      )}

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 font-jost text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 font-jost text-xs text-black/50">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function stripCommon<T extends Common & { as?: string }>(props: T) {
  const { label, name, error, hint, optional, as, ...rest } = props
  void label; void name; void error; void hint; void optional; void as
  return rest
}
