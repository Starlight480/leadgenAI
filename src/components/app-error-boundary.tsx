"use client"

import { Component, type ReactNode } from "react"
import { ErrorFallback } from "@/components/error-boundary"

export class AppErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback || (
          <ErrorFallback
            error={this.state.error}
            reset={() => this.setState({ hasError: false, error: null })}
          />
        )
      )
    }
    return this.props.children
  }
}
