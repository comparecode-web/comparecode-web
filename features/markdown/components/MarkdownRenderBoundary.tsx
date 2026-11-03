"use client";

import { Component, type ReactNode } from "react";

interface MarkdownRenderBoundaryProps {
  fallback: ReactNode;
  resetKey: string;
  children: ReactNode;
}

interface MarkdownRenderBoundaryState {
  hasError: boolean;
}

export class MarkdownRenderBoundary extends Component<MarkdownRenderBoundaryProps, MarkdownRenderBoundaryState> {
  state: MarkdownRenderBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MarkdownRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Markdown preview section render failed.", error);
    }
  }

  componentDidUpdate(previousProps: MarkdownRenderBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
