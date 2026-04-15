"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm break-words">{error.message}</div>
          {error.digest ? <div className="text-xs text-muted-foreground">Digest: {error.digest}</div> : null}
          <button className="w-fit rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => reset()}>
            Retry
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

