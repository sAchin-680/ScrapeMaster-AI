export default function Loading() {
  return (
    <div className="container py-12" aria-busy="true" aria-label="Loading product">
      <div className="skeleton h-4 w-28" />
      <div className="mt-6 grid gap-12 lg:grid-cols-[5fr_6fr]">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="flex flex-col gap-6">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-2/3" />
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
