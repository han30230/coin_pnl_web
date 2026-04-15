import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Not found</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm">The page you requested does not exist.</div>
          <Link className="w-fit rounded-md border px-3 py-2 text-sm hover:bg-muted" href="/">
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

