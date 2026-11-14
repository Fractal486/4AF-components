"use client"

/*
Adapted from HextaUI (https://github.com/preetsuthar17/hextaui).
MIT License

Copyright (c) 2026 Preet Suthar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


/*
Roll, motion blur, and soft-edge geometry adapted from
https://github.com/wheresryan22/sfinterface-numbers.
MIT License

Copyright (c) 2026 The San Francisco Interface

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Local adaptation: no runtime dependency on the source packages.

import { prefersReducedMotion, subscribeReducedMotion } from "@/registry/lib/reduced-motion";
import * as React from "react"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "@/registry/lib/cn"
import { numberAnimationVariants } from "./number-animation.variants"

import "./number-animation.css"

type NumberAnimationTrend = "auto" | "up" | "down" | "shortest"

type NumberAnimationChar = {
  key: string
  section: number
  order: number
  value: string
  digit: number | null
}

type NumberAnimationItem = NumberAnimationChar & {
  exiting: boolean
  exitId: number
}

type NumberAnimationProps = Omit<
  useRender.ComponentProps<"span">,
  "children" | "prefix"
> & {
  value: number
  locales?: Intl.LocalesArgument
  format?: Intl.NumberFormatOptions
  prefix?: string
  suffix?: string
  trend?: NumberAnimationTrend
  duration?: number
  easing?: string
  onAnimationsStart?: () => void
  onAnimationsFinish?: () => void
}

const rows = 30


function getSpinDelta(
  from: number,
  to: number,
  trend: Exclude<NumberAnimationTrend, "auto">
) {
  let delta = to - from

  if (trend === "up") {
    if (delta < 0) {
      delta += 10
    }
  } else if (trend === "down") {
    if (delta > 0) {
      delta -= 10
    }
  } else if (delta > 5) {
    delta -= 10
  } else if (delta < -4) {
    delta += 10
  }

  return delta
}

function digitGlyphs(
  formatter: Intl.NumberFormat,
  locales: Intl.LocalesArgument | undefined
) {
  const { numberingSystem } = formatter.resolvedOptions()
  const plain = new Intl.NumberFormat(locales, {
    numberingSystem,
    useGrouping: false,
  })

  return Array.from({ length: 10 }, (_, digit) => plain.format(digit))
}

function formatChars(
  value: number,
  locales: Intl.LocalesArgument | undefined,
  format: Intl.NumberFormatOptions | undefined,
  prefix: string | undefined,
  suffix: string | undefined
) {
  const formatter = new Intl.NumberFormat(locales, format)
  const glyphs = digitGlyphs(formatter, locales)
  const parts = formatter.formatToParts(value)
  const integerCount = parts
    .filter((part) => part.type === "integer")
    .reduce((count, part) => count + Array.from(part.value).length, 0)
  const chars: NumberAnimationChar[] = []
  const occurrences = new Map<string, number>()
  let integerIndex = 0
  let fractionIndex = 0
  let seenNumber = false

  function symbol(section: number, type: string, text: string) {
    const name = `${section}-${type}`
    const occurrence = occurrences.get(name) ?? 0
    occurrences.set(name, occurrence + 1)
    chars.push({
      key: `s${name}-${occurrence}`,
      section,
      order: occurrence,
      value: text,
      digit: null,
    })
  }

  if (prefix) {
    chars.push({
      key: "prefix",
      section: 0,
      order: 0,
      value: prefix,
      digit: null,
    })
  }

  for (const part of parts) {
    if (part.type === "integer") {
      seenNumber = true
      for (const glyph of Array.from(part.value)) {
        const place = integerCount - 1 - integerIndex
        const digit = glyphs.indexOf(glyph)
        chars.push({
          key: `i${place}`,
          section: 2,
          order: -place,
          value: glyph,
          digit: digit === -1 ? null : digit,
        })
        integerIndex += 1
      }
    } else if (part.type === "group") {
      const place = integerCount - 1 - integerIndex
      chars.push({
        key: `g${place}`,
        section: 2,
        order: -place - 0.5,
        value: part.value,
        digit: null,
      })
    } else if (part.type === "decimal") {
      seenNumber = true
      chars.push({
        key: "decimal",
        section: 3,
        order: 0,
        value: part.value,
        digit: null,
      })
    } else if (part.type === "fraction") {
      for (const glyph of Array.from(part.value)) {
        const digit = glyphs.indexOf(glyph)
        chars.push({
          key: `f${fractionIndex}`,
          section: 4,
          order: fractionIndex,
          value: glyph,
          digit: digit === -1 ? null : digit,
        })
        fractionIndex += 1
      }
    } else {
      symbol(seenNumber ? 5 : 1, part.type, part.value)
    }
  }

  if (suffix) {
    chars.push({
      key: "suffix",
      section: 6,
      order: 0,
      value: suffix,
      digit: null,
    })
  }

  return { chars, glyphs }
}

function signature(chars: NumberAnimationChar[]) {
  return chars.map((char) => `${char.key}:${char.value}`).join("|")
}

function mergeItems(previous: NumberAnimationItem[], next: NumberAnimationChar[]) {
  const keys = new Set(next.map((char) => char.key))
  const kept = previous
    .filter((item) => !keys.has(item.key))
    .map((item) =>
      item.exiting ? item : { ...item, exiting: true, exitId: item.exitId + 1 }
    )
  const fresh = next.map((char) => {
    const before = previous.find((item) => item.key === char.key)
    return { ...char, exiting: false, exitId: before?.exitId ?? 0 }
  })

  return [...kept, ...fresh].sort(
    (a, b) => a.section - b.section || a.order - b.order
  )
}

function canAnimate() {
  return (
    typeof Element !== "undefined" &&
    typeof Element.prototype.animate === "function"
  )
}

function liveIndex(column: HTMLElement) {
  const height = column.offsetHeight

  if (!height) {
    return null
  }

  const translate = getComputedStyle(column).translate
  const y = translate === "none" ? "0" : (translate.split(" ")[1] ?? "0")
  const amount = parseFloat(y) || 0

  return y.endsWith("%") ? (-amount / 100) * rows : (-amount / height) * rows
}

function NumberAnimation({
  value,
  locales,
  format,
  prefix,
  suffix,
  trend = "auto",
  duration,
  easing = "cubic-bezier(0.32, 0.72, 0, 1)",
  onAnimationsStart,
  onAnimationsFinish,
  className,
  style,
  ref,
  render,
  ...props
}: NumberAnimationProps) {
  const { chars, glyphs } = formatChars(value, locales, format, prefix, suffix)
  const key = signature(chars)
  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false
  )
  const animate = !reducedMotion && canAnimate()
  const [state, setState] = React.useState(() => ({
    key,
    items: chars.map((char) => ({ ...char, exiting: false, exitId: 0 })),
  }))

  if (state.key !== key || (!animate && state.items.some(item => item.exiting))) {
    setState({
      key,
      items: animate
        ? mergeItems(state.items, chars)
        : chars.map((char) => ({ ...char, exiting: false, exitId: 0 })),
    })
  }

  const rootRef = React.useRef<HTMLSpanElement>(null)
  const animationsRef = React.useRef(new Set<Animation>())
  const batchRef = React.useRef(0)
  // Dispose the old batch before the later layout effect can start a new one.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const animations = animationsRef.current
    return () => {
      batchRef.current += 1
      // Exit cells can be detached from the root. Keep their animations too,
      // so a live reduced-motion change cancels every layer.
      animations.forEach(animation => animation.cancel())
      animations.clear()
      root?.querySelectorAll('[data-turning]').forEach(cell => cell.removeAttribute('data-turning'))
    }
  }, [animate])
  const previousRef = React.useRef<Map<
    string,
    { digit: number | null; exiting: boolean; exitId: number }
  > | null>(null)
  const valueRef = React.useRef(value)
  const callbacksRef = React.useRef({ onAnimationsStart, onAnimationsFinish })
  const finishExitRef = React.useRef((itemKey: string, exitId: number) => {
    setState((current) => ({
      ...current,
      items: current.items.filter(
        (item) =>
          !(item.key === itemKey && item.exiting && item.exitId === exitId)
      ),
    }))
  })

  React.useLayoutEffect(() => {
    callbacksRef.current = { onAnimationsStart, onAnimationsFinish }
  })

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const previous = previousRef.current
    const current = new Map(
      state.items.map((item) => [
        item.key,
        { digit: item.digit, exiting: item.exiting, exitId: item.exitId },
      ])
    )
    const previousValue = valueRef.current

    previousRef.current = current
    valueRef.current = value

    if (!root || !previous || !animate) {
      return
    }

    const direction =
      trend !== "auto"
        ? trend
        : value > previousValue
          ? "up"
          : value < previousValue
            ? "down"
            : "shortest"
    const computed = getComputedStyle(root)
    const cssDuration = computed.getPropertyValue("--number-animation-roll").trim()
    // Resolve calc() through a timing property, which the browser returns in seconds.
    const resolvedDuration = parseFloat(computed.animationDuration) * 1000
    const rollDuration = duration ?? (Number.isFinite(resolvedDuration) && resolvedDuration > 0 ? resolvedDuration : cssDuration.endsWith("ms") ? parseFloat(cssDuration) : 520)
    const timing = { duration: rollDuration, easing }
    const settle = Math.min(240, rollDuration)
    const fontSize = parseFloat(computed.fontSize) || 16
    const deepest = fontSize * 0.09
    const started: Animation[] = []
    const cells = root.querySelectorAll<HTMLElement>(
      ":scope > [data-number-animation-key]"
    )

    let arriving = 0
    for (const cell of cells) {
      const itemKey = cell.dataset.numberAnimationKey!
      const item = current.get(itemKey)
      const before = previous.get(itemKey)

      if (!item || typeof cell.animate !== "function") {
        continue
      }

      const column = cell.querySelector<HTMLElement>(
        "[data-slot=number-animation-column]"
      )
      const entering = !item.exiting && (!before || before.exiting)
      const leaving = item.exiting && (!before || !before.exiting)

      if (entering || leaving) {
        const running = cell.getAnimations()
        const fromWidth = running.length
          ? cell.getBoundingClientRect().width
          : entering
            ? 0
            : cell.getBoundingClientRect().width
        const fromOpacity = running.length
          ? Number(getComputedStyle(cell).opacity)
          : entering
            ? 0
            : 1
        running.forEach((animation) => animation.cancel())
        const toWidth = entering ? cell.getBoundingClientRect().width : 0
        const animation = cell.animate(
          [
            { width: `${fromWidth}px`, opacity: fromOpacity },
            { width: `${toWidth}px`, opacity: entering ? 1 : 0 },
          ],
          { duration: settle, easing, fill: leaving ? "forwards" : "none" }
        )
        started.push(animation)
        if (entering) {
          const bleed = fontSize * (1.4 - 0.86) / 2
          started.push(cell.animate([
            { opacity: 0, filter: `blur(${deepest}px)`, transform: `translateY(${-bleed * 0.5}px) scaleX(0.55)`, offset: 0 },
            { opacity: 0.14, offset: 0.45 },
            { opacity: 0.62, offset: 0.78 },
            { opacity: 1, filter: "blur(0px)", transform: "translateY(0) scaleX(1)", offset: 1 },
          ], { duration: settle, delay: Math.min(arriving++, 4) * 18, easing: "linear", fill: "backwards" }))
        }
        if (leaving) {
          const exitId = item.exitId
          animation.finished.then(
            () => finishExitRef.current(itemKey, exitId),
            () => {}
          )
        }
      }

      if (!column || item.digit === null || item.exiting || entering) {
        continue
      }

      const target = item.digit
      const running = column.getAnimations()
      const live = running.length ? liveIndex(column) : null
      running.forEach((animation) => animation.cancel())
      const from =
        live !== null
          ? live - 10
          : entering
            ? 0
            : before && before.digit !== null
              ? before.digit
              : target

      if (live === null && from === target && !entering) {
        continue
      }

      const delta = getSpinDelta(
        from,
        target,
        entering && live === null ? "up" : direction
      )

      if (delta === 0) {
        continue
      }

      const turning = column.animate(
        [
          { translate: `0 ${(-(target + 10 - delta) / rows) * 100}%` },
          { translate: `0 ${(-(target + 10) / rows) * 100}%` },
        ], timing,
      )
      started.push(turning)
      // Restart the source's deepening soft edge on every changed digit.
      cell.removeAttribute("data-turning")
      void cell.offsetWidth
      cell.setAttribute("data-turning", "")
      turning.finished.then(() => {
        if (column.getAnimations().every(animation => animation.playState === "finished")) cell.removeAttribute("data-turning")
      }, () => {})
      const depth = Math.min(1, Math.abs(delta) / 4) * deepest
      // Source timing: blur peaks at 15% and clears by 62% of the roll.
      started.push(cell.animate([
        { filter: "blur(0px)", offset: 0 },
        { filter: `blur(${depth.toFixed(2)}px)`, offset: 0.15 },
        { filter: "blur(0px)", offset: 0.62 },
        { filter: "blur(0px)", offset: 1 },
      ], { duration: rollDuration, easing: "linear" }))
    }

    if (!started.length) {
      return
    }

    for (const animation of started) {
      animationsRef.current.add(animation)
      const settled = () => { animationsRef.current.delete(animation) }
      animation.finished.then(settled, settled)
    }
    batchRef.current += 1
    const batch = batchRef.current
    callbacksRef.current.onAnimationsStart?.()
    Promise.all(started.map((animation) => animation.finished)).then(
      () => {
        if (batch === batchRef.current) {
          callbacksRef.current.onAnimationsFinish?.()
        }
      },
      () => {}
    )
  }, [state.items, animate, duration, easing, trend, value])

  return useRender({
    defaultTagName: "span",
    render,
    ref: [rootRef, ref ?? null],
    props: {
      dir: "ltr",
      ...props,
      "data-slot": "number-animation",
      "data-animated": "",
      className: cn(numberAnimationVariants(), className),
      style: {
        ...style,
        animationDuration: "var(--number-animation-roll)",
        ...(duration !== undefined ? { "--number-animation-roll": `${duration}ms` } : {}),
      } as React.CSSProperties,
      children: <>
      <span data-slot="number-animation-text" className="sr-only">
        {state.items
          .filter((item) => !item.exiting)
          .map((item) => item.value)
          .join("")}
      </span>
      {state.items.map((item) =>
        item.digit === null ? (
          <span
            key={item.key}
            data-number-animation-key={item.key}
            data-slot="number-animation-symbol"
            aria-hidden
            className="inline-block max-w-full overflow-clip wrap-anywhere whitespace-pre-wrap"
          >
            {item.value}
          </span>
        ) : (
          <span
            key={item.key}
            data-number-animation-key={item.key}
            data-slot="number-animation-digit"
            aria-hidden
            className="number-animation-slot"
            data-digit-glyph={glyphs[0]}
          >
            <span className="number-animation-window">
            <span
              aria-hidden
              data-slot="number-animation-column"
              data-digit={item.digit}
              className="number-animation-strip"
              style={{ "--number-animation-at": item.digit + 10 } as React.CSSProperties}
            >
              {Array.from({ length: rows }, (_, row) => (
                <span key={row} className="number-animation-cell">
                  {glyphs[row % 10]}
                </span>
              ))}
            </span>
            </span>
          </span>
        )
      )}
      </>,
    },
  })
}

export {
  NumberAnimation,
  type NumberAnimationProps,
  type NumberAnimationTrend,
}
