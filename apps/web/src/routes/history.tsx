import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Cloud, Calendar } from "lucide-react";
import { getHistory } from "@/lib/storage";
import { getWeatherClass } from "@/lib/functions";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const history = getHistory();

  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto max-w-md p-6 space-y-6">
        <div className="flex items-center gap-3 animate-[dc-enter_400ms_ease_both]">
          <Link to="/" className="dc-btn dc-btn-ghost !py-1.5 !px-3">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold">My Quote History</h1>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-[dc-enter_500ms_ease_both]">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No history yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your past daily quotes will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {history.map((entry, i) => (
              <li
                key={`${entry.id}-${entry.servedDate}`}
                className={`dc-quote-card animate-[dc-enter_${Math.min(i * 100 + 300, 800)}ms_ease_both] ${getWeatherClass(entry.weatherCondition)}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {entry.servedDate}
                  </span>
                  <span className="dc-weather-badge text-[10px] !py-0.5 !px-2">
                    <Cloud className="h-3 w-3" />
                    <span>{entry.weatherCondition}</span>
                  </span>
                </div>
                <div className="dc-quote-tone mb-2">{entry.toneLabel}</div>
                <blockquote className="text-lg font-quote italic leading-relaxed text-foreground">
                  &ldquo;{entry.text}&rdquo;
                </blockquote>
                <p className="text-sm text-muted-foreground mt-2">— {entry.author}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
