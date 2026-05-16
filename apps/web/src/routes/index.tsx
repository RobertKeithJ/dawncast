import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getWeatherClass } from "@/lib/functions";
import {
  getDailyQuote,
  setDailyQuote,
  type StoredQuote,
} from "@/lib/storage";
import {
  Cloud,
  MapPin,
  RefreshCcw,
  Camera,
  ExternalLink,
  RefreshCw,
  History,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ShareModal } from "@/components/share-modal";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

interface QuoteDisplay {
  id: string;
  text: string;
  author: string;
  isPrimary: boolean;
  isBonus: boolean;
}

function HomeComponent() {
  const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
  const [cityQuery, setCityQuery] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<QuoteDisplay | null>(null);
  const [cachedQuote, setCachedQuote] = useState<StoredQuote | null>(null);

  // Check localStorage for today's quote on mount
  useEffect(() => {
    const stored = getDailyQuote();
    if (stored) setCachedQuote(stored);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude.toString(),
            lon: pos.coords.longitude.toString(),
          });
          setLocationError(false);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setLocationError(true);
        },
        { timeout: 5000, maximumAge: 0 },
      );
    } else {
      setLocationError(true);
    }
  }, []);

  // Only fetch from API if we have no cached quote for today
  const shouldFetchFromAPI = !cachedQuote && (location !== null || cityQuery !== null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["daily-quote", location, cityQuery],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (cityQuery) {
        queryParams.city = cityQuery;
      } else if (location) {
        queryParams.lat = location.lat;
        queryParams.lon = location.lon;
      }
      const res = await api.api["daily-quote"].get({ $query: queryParams });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: shouldFetchFromAPI,
  });

  // When fresh API data arrives, cache it and set the active quote
  useEffect(() => {
    if (!data) return;
    const quote: StoredQuote = {
      id: data.quote.id,
      text: data.quote.text,
      author: data.quote.author,
      servedDate: data.meta.servedDate,
      toneId: data.weather.toneId,
      toneLabel: data.weather.toneLabel,
      weatherCode: data.weather.code,
      weatherCondition: data.weather.condition,
      tempCelsius: data.weather.temp,
    };
    setDailyQuote(quote);
    setCachedQuote(quote);
    setActiveQuote({
      id: data.quote.id,
      text: data.quote.text,
      author: data.quote.author,
      isPrimary: true,
      isBonus: false,
    });
  }, [data]);

  // When a cached quote loads (no API call), set it as active
  useEffect(() => {
    if (cachedQuote && !activeQuote) {
      setActiveQuote({
        id: cachedQuote.id,
        text: cachedQuote.text,
        author: cachedQuote.author,
        isPrimary: true,
        isBonus: false,
      });
    }
  }, [cachedQuote, activeQuote]);

  // Derive weather info: prefer fresh API data, fall back to cached
  const weatherInfo = data?.weather ?? (cachedQuote
    ? {
        code: cachedQuote.weatherCode,
        condition: cachedQuote.weatherCondition,
        temp: cachedQuote.tempCelsius,
        toneId: cachedQuote.toneId,
        toneLabel: cachedQuote.toneLabel,
      }
    : null);

  // Bonus quote mutation
  const bonusMutation = useMutation({
    mutationFn: async () => {
      const body: {
        lat?: number;
        lon?: number;
        city?: string;
        subscriptionId?: string;
        language?: string;
      } = {};
      if (location) {
        body.lat = parseFloat(location.lat);
        body.lon = parseFloat(location.lon);
      } else if (cityQuery) {
        body.city = cityQuery;
      }
      const res = await api.api.quote.bonus.post(body);
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (bonus) => {
      setActiveQuote({
        id: bonus.quote.id,
        text: bonus.quote.text,
        author: bonus.quote.author,
        isPrimary: false,
        isBonus: true,
      });
    },
    onError: () => {
      toast.error("Couldn't fetch a bonus quote. Try again!");
    },
  });

  const handleShare = useCallback(() => {
    if (!activeQuote) return;
    const shareText = `"${activeQuote.text}" — ${activeQuote.author}`;
    if (navigator.share) {
      navigator
        .share({ title: "Daily Motivation", text: shareText })
        .catch(() => {});
    } else {
      setShareOpen(true);
    }
  }, [activeQuote]);

  const startARMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setVideoStream(stream);
      setIsARMode(true);
      toast("AR Mode activated", { description: "Simulating AR with device camera." });
    } catch (_err) {
      toast.error("Camera access denied", {
        description: "AR needs your camera — no worries, here's the quote anyway",
      });
    }
  };

  const stopARMode = useCallback(() => {
    videoStream?.getTracks().forEach((track) => track.stop());
    setVideoStream(null);
    setIsARMode(false);
  }, [videoStream]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      videoStream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoStream]);

  // ── Loading: waiting for geolocation ────────────────────────────
  if (!cachedQuote && !location && !cityQuery && !locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 bg-background transition-colors duration-700">
        <div className="dc-loading animate-[dc-enter_500ms_ease_both]">
          Reading your sky…
        </div>
        <button
          className="dc-btn dc-btn-ghost mt-8 animate-[dc-enter_500ms_ease_both_200ms]"
          onClick={() => setLocationError(true)}
        >
          Skip &amp; enter city manually
        </button>
      </div>
    );
  }

  // ── Location denied — city input ───────────────────────────────
  if (!cachedQuote && !location && !cityQuery && locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-background transition-colors duration-700">
        <div className="animate-[dc-enter_500ms_ease_both]">
          <MapPin className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Location Access Denied</h2>
          <p className="text-muted-foreground mb-8">No worries — tell us your city instead.</p>
          <form
            className="dc-location-field w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const city = new FormData(e.currentTarget).get("city") as string;
              if (city) setCityQuery(city);
            }}
          >
            <input name="city" placeholder="Davao City" required />
            <button type="submit" className="dc-btn dc-btn-primary">Search</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Fetching from API ──────────────────────────────────────────
  if (isLoading && !cachedQuote) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 bg-background transition-colors duration-700">
        <div className="dc-loading animate-[dc-enter_500ms_ease_both]">
          Gathering your daily quote…
        </div>
      </div>
    );
  }

  // ── API Error with no cache ────────────────────────────────────
  if ((error || !activeQuote) && !cachedQuote) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-background transition-colors duration-700">
        <div className="animate-[dc-enter_500ms_ease_both]">
          <p className="text-destructive mb-6 font-medium">Failed to fetch the quote.</p>
          <button onClick={() => refetch()} className="dc-btn dc-btn-ghost">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Guard: we need at least an active quote by this point
  if (!activeQuote || !weatherInfo) return null;

  const weatherClass = getWeatherClass(weatherInfo.condition);
  const quoteLabel = activeQuote.isBonus ? "Bonus Quote" : "Your quote for today";

  // ── AR Mode ────────────────────────────────────────────────────
  if (isARMode) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
          {videoStream && (
            <video
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              ref={(ref) => {
                if (ref && !ref.srcObject) ref.srcObject = videoStream;
              }}
            />
          )}

          {/* Simulated AR badge */}
          <div className="absolute top-6 left-6 z-20">
            <span className="text-xs font-semibold bg-black/50 text-white/80 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
              Simulated AR
            </span>
          </div>

          <div className="absolute top-6 right-6 z-20">
            <button
              className="dc-btn dc-btn-ghost bg-black/40 text-white border-white/20 backdrop-blur-md"
              onClick={stopARMode}
            >
              Close AR
            </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

          <div className="z-10 p-1 m-4 max-w-md animate-[dc-float_6s_ease-in-out_infinite]">
            <div className="dc-quote-card bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
              <div className="dc-quote-tone text-white/90 border-white/20 bg-white/10">
                {weatherInfo.toneLabel}
              </div>
              <blockquote className="dc-quote-text text-white text-3xl md:text-4xl leading-tight">
                &ldquo;{activeQuote.text}&rdquo;
              </blockquote>
              <p className="dc-quote-author text-white/70">— {activeQuote.author}</p>
            </div>
          </div>

          <div className="absolute bottom-8 z-20 flex gap-4">
            <button className="dc-btn dc-btn-primary" onClick={handleShare}>
              <ExternalLink className="mr-2 h-4 w-4" /> Share
            </button>
          </div>
        </div>

        {shareOpen && (
          <ShareModal
            text={activeQuote.text}
            author={activeQuote.author}
            onClose={() => setShareOpen(false)}
          />
        )}
      </>
    );
  }

  // ── Main View ──────────────────────────────────────────────────
  return (
    <>
      <div className={`min-h-full transition-colors duration-1000 ease-in-out ${weatherClass}`}>
        <div className="container mx-auto max-w-md h-full flex flex-col p-6 space-y-8">
          {/* Weather badge + history link */}
          <div className="flex items-center justify-between pt-2 animate-[dc-enter_600ms_ease_both]">
            <Link
              to="/history"
              className="dc-btn dc-btn-ghost !py-1.5 !px-3 text-xs gap-1"
              aria-label="View quote history"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Link>
            <div className="dc-weather-badge backdrop-blur-sm bg-background/30 border-foreground/10">
              <Cloud className="h-3.5 w-3.5" />
              <span>{weatherInfo.condition} · {Math.round(weatherInfo.temp)}°C</span>
            </div>
          </div>

          {/* Quote card */}
          <div className="flex-1 flex flex-col items-center justify-center animate-[dc-enter_800ms_ease_both_200ms]">
            <div
              className="dc-quote-card w-full shadow-xl"
              style={
                {
                  "--_glow-color": `var(--weather-${weatherClass.replace("weather-", "")}-glow)`,
                } as React.CSSProperties & Record<string, string>
              }
            >
              {/* Primary / Bonus label */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
                {quoteLabel}
              </p>

              <div className="dc-quote-tone">{weatherInfo.toneLabel}</div>

              <blockquote
                className="dc-quote-text"
                aria-live="polite"
                aria-atomic="true"
              >
                &ldquo;{activeQuote.text}&rdquo;
              </blockquote>
              <p className="dc-quote-author">— {activeQuote.author}</p>

              <div className="dc-quote-footer">
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {cityQuery ?? "Near you"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pb-10 animate-[dc-enter_800ms_ease_both_400ms]">
            <button
              onClick={startARMode}
              className="dc-btn dc-btn-primary w-full h-14 text-lg"
            >
              <Camera className="mr-2 h-5 w-5" /> View in AR
            </button>

            <div className="flex gap-3">
              <button className="dc-btn dc-btn-ghost flex-1" onClick={handleShare}>
                <ExternalLink className="mr-2 h-4 w-4" /> Share
              </button>

              <button
                className="dc-btn dc-btn-ghost flex-1"
                onClick={() => bonusMutation.mutate()}
                disabled={bonusMutation.isPending}
                aria-label="Get a bonus quote"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {bonusMutation.isPending ? "…" : "Another"}
              </button>

              <button
                className="dc-btn dc-btn-ghost flex-1"
                onClick={() => {
                  setCachedQuote(null);
                  setActiveQuote(null);
                  localStorage.removeItem("dawncast:daily_quote");
                  refetch();
                }}
                aria-label="Refresh quote"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          text={activeQuote.text}
          author={activeQuote.author}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
