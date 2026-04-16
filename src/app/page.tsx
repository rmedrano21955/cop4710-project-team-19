import Link from "next/link";

const features = [
  { href: "/drivers", title: "Drivers", desc: "Browse the full driver directory with career stats" },
  { href: "/races", title: "Races", desc: "View race results by season and round" },
  { href: "/standings", title: "Standings", desc: "Championship standings for drivers and constructors" },
  { href: "/constructors", title: "Constructors", desc: "Explore teams and their driver lineups" },
  { href: "/circuits", title: "Circuits", desc: "Circuit details and race history" },
  { href: "/compare", title: "Compare", desc: "Head-to-head driver comparison with charts" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-f1-red">Pit</span>Wall
        </h1>
        <p className="mt-3 text-muted text-lg">
          Formula 1 statistics from 2010 to 2024
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="bg-card border border-border rounded-lg p-5 hover:bg-card-hover hover:border-f1-red/30 transition-all"
          >
            <h2 className="font-semibold text-lg">{f.title}</h2>
            <p className="text-sm text-muted mt-1">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
