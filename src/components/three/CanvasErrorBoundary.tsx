import { Component, type ReactNode } from 'react'

interface CanvasErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

/**
 * R3F scenes throw synchronously during render on shader compile failures,
 * lost/denied WebGL contexts, etc. — a plain try/catch around JSX can't
 * catch that, only a class-component error boundary can. Renders `fallback`
 * instead of leaving a blank canvas-shaped hole in the hero.
 */
export class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('CoreSample 3D scene failed to render, falling back:', error)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
