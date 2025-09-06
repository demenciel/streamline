import React, { createContext, useContext, useEffect, useRef, useState } from "react"

// Context to expose the show() function to any descendant
const SnackbarContext = createContext({ show: () => {} })

export function SnackbarProvider({ children }) {
  const [snack, setSnack] = useState(null) // { id, message, variant }
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)
  const idRef = useRef(0)

  const show = (message, { variant = "success", duration = 3000 } = {}) => {
    // Clear any running timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const id = ++idRef.current
    setSnack({ id, message, variant })
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true))
    timeoutRef.current = setTimeout(() => {
      setVisible(false) // start exit animation
      // Clear message after exit transition
      setTimeout(() => setSnack((s) => (s && s.id === id ? null : s)), 250)
    }, duration)
  }

  useEffect(() => () => timeoutRef.current && clearTimeout(timeoutRef.current), [])

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {/* Animated host rendered once at the root */}
      <div
        className={[
          "fixed left-1/2 -translate-x-1/2 bottom-6 z-50",
          "transition-all duration-250 ease-in-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {snack && (
          <div
            className={[
              "px-4 py-2 rounded-md shadow border text-sm backdrop-blur",
              snack.variant === "error"
                ? "bg-red-900/70 border-red-700 text-red-100"
                : snack.variant === "success"
                ? "bg-emerald-900/70 border-emerald-700 text-emerald-100"
                : "bg-gray-900/70 border-gray-700 text-gray-100"
            ].join(" ")}
          >
            {snack.message}
          </div>
        )}
      </div>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error("useSnackbar must be used within a SnackbarProvider")
  return ctx
}