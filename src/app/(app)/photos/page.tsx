import { Suspense } from "react";
import { getAllPhotos } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import Gallery from "./gallery";

export default function PhotosPage() {
  return (
    <main>
      <PageHeader title="사진" />
      <Suspense
        fallback={
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-line/60" />
            ))}
          </div>
        }
      >
        <Data />
      </Suspense>
    </main>
  );
}

async function Data() {
  const photos = await getAllPhotos();
  return <Gallery photos={photos} />;
}
