"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class DialogErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Silently catch removeChild errors - they're harmless
    if (error.message?.includes("removeChild") || error.message?.includes("not a child")) {
      return { hasError: false }; // Don't show error UI for these
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Silently handle removeChild errors
    if (error.message?.includes("removeChild") || error.message?.includes("not a child")) {
      console.warn("Dialog cleanup error (harmless):", error.message);
      return;
    }
    console.error("Dialog error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}



