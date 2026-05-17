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
    <div className="min-h-full bg-background transition-colors duration-700">
      <div className="dc-container py-6 space-y-8">
        <div className="flex items-center gap-3 animate-[dc-enter_400ms_ease_both]">
          <Link to="/" className="dc-btn dc-btn-ghost dc-btn-icon">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">My Quote History</h1>
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
          <ul className="space-y-6">
            {history.map((entry, i) => (
              <li
                key={`${entry.id}-${entry.servedDate}`}
                className={`dc-quote-card !shadow-md animate-[dc-enter_${Math.min(i * 100 + 300, 800)}ms_ease_both] ${getWeatherClass(entry.weatherCondition)}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 truncate">
                    {entry.servedDate}
                  </span>
                  <span className="dc-weather-badge dc-btn-sm !py-1 !px-2.5 shrink-0">
                    <Cloud className="h-3 w-3" />
                    <span>{entry.weatherCondition}</span>
                  </span>
                </div>
                <div className="dc-quote-tone mb-4">{entry.toneLabel}</div>
                <blockquote className="dc-quote-text !text-lg !mb-2">
                  &ldquo;{entry.text}&rdquo;
                </blockquote>
                <p className="dc-quote-author !text-sm !mb-0 !text-left">— {entry.author}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
