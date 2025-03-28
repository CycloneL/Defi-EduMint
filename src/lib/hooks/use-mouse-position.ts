"use client";

import { useState, useEffect } from "react"

interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // Add event listener only on client side
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", updateMousePosition)
    }

    // Clean up the event listener when the component unmounts
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", updateMousePosition)
      }
    }
  }, [])

  return mousePosition
} 