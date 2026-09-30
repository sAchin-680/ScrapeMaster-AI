export default function Loading() {
  return (
    <div className="container py-16" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton mt-6 h-16 w-full max-w-xl" />
      <div className="skeleton mt-4 h-5 w-full max-w-md" />
      <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
