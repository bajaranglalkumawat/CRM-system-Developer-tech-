"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
      <h1 className="mb-2 text-4xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mb-2 text-muted-foreground">
        An unexpected error occurred.
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  );
}
