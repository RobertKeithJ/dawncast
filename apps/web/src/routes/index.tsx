import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Cloud, MapPin, RefreshCcw, Camera, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [location, setLocation] = useState<{ lat: string; lon: string } | null>(null);
  const [cityQuery, setCityQuery] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

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
        { timeout: 5000, maximumAge: 0 } // Add a 5-second timeout so it doesn't hang indefinitely
      );
    } else {
      setLocationError(true);
    }
  }, []);

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

      const res = await api.api["daily-quote"].get({
        $query: queryParams,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: location !== null || cityQuery !== null,
  });

  const startARMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setVideoStream(stream);
      setIsARMode(true);
      toast("AR Mode activated", { description: "Simulating AR with device camera." });
    } catch (err) {
      toast.error("Camera access denied", {
        description: "AR needs your camera — no worries, here's the quote anyway",
      });
    }
  };

  const stopARMode = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setIsARMode(false);
  };

  const getWeatherClass = (condition: string | undefined) => {
    if (!condition) return "";
    const lower = condition.toLowerCase();
    if (lower.includes("sun") || lower.includes("clear")) return "weather-sunny";
    if (lower.includes("cloud") || lower.includes("overcast")) return "weather-cloudy";
    if (lower.includes("rain") || lower.includes("drizzle")) return "weather-rainy";
    if (lower.includes("storm") || lower.includes("thunder")) return "weather-stormy";
    if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "weather-foggy";
    if (lower.includes("snow") || lower.includes("sleet")) return "weather-snow";
    if (lower.includes("night")) return "weather-night";
    if (lower.includes("heat") || lower.includes("hot")) return "weather-heat";
    return "";
  };

  if (!location && !cityQuery && !locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 bg-background transition-colors duration-700">
        <div className="dc-loading animate-[dc-enter_500ms_ease_both]">
          Reading your sky…
        </div>
        <button
          className="dc-btn dc-btn-ghost mt-8 animate-[dc-enter_500ms_ease_both_200ms]"
          onClick={() => setLocationError(true)}
        >
          Skip & enter city manually
        </button>
      </div>
    );
  }

  if (!location && !cityQuery && locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-background transition-colors duration-700">
        <div className="animate-[dc-enter_500ms_ease_both]">
          <MapPin className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Location Access Denied</h2>
          <p className="text-muted-foreground mb-8">No worries — tell us your city instead.</p>
          <form className="dc-location-field w-full" onSubmit={(e) => {
            e.preventDefault();
            const city = new FormData(e.currentTarget).get("city") as string;
            if (city) {
              setCityQuery(city);
            }
          }}>
             <input name="city" placeholder="Davao City" required />
             <button type="submit" className="dc-btn dc-btn-primary">Search</button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 bg-background transition-colors duration-700">
        <div className="dc-loading animate-[dc-enter_500ms_ease_both]">
          Gathering your daily quote…
        </div>
      </div>
    );
  }

  if (error || !data) {
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

  if (isARMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
        {videoStream && (
          <video
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            ref={(ref) => {
              if (ref && !ref.srcObject) {
                ref.srcObject = videoStream;
              }
            }}
          />
        )}
        <div className="absolute top-6 right-6 z-20">
          <button className="dc-btn dc-btn-ghost bg-black/40 text-white border-white/20 backdrop-blur-md" onClick={stopARMode}>
            Close AR
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        <div className="z-10 p-1 m-4 max-w-md animate-[dc-float_6s_ease-in-out_infinite]">
          <div className="dc-quote-card bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="dc-quote-tone text-white/90 border-white/20 bg-white/10">
              {data.weather.toneLabel}
            </div>
            <blockquote className="dc-quote-text text-white text-3xl md:text-4xl leading-tight">
              "{data.quote.text}"
            </blockquote>
            <p className="dc-quote-author text-white/70">— {data.quote.author}</p>
          </div>
        </div>

        <div className="absolute bottom-8 z-20 flex gap-4">
          <button className="dc-btn dc-btn-primary" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Daily Motivation",
                text: `"${data.quote.text}" — ${data.quote.author}`,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(`"${data.quote.text}" — ${data.quote.author}`);
              toast.success("Quote copied to clipboard!");
            }
          }}>
            <ExternalLink className="mr-2 h-4 w-4" /> Share
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full transition-colors duration-1000 ease-in-out ${getWeatherClass(data.weather.condition)}`}>
      <div className="container mx-auto max-w-md h-full flex flex-col p-6 space-y-8">
        {/* Weather info */}
        <div className="flex justify-end pt-2 animate-[dc-enter_600ms_ease_both]">
          <div className="dc-weather-badge backdrop-blur-sm bg-background/30 border-foreground/10">
            <Cloud className="h-3.5 w-3.5" />
            <span>{data.weather.condition} · {Math.round(data.weather.temp)}°C</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center animate-[dc-enter_800ms_ease_both_200ms]">
          <div className="dc-quote-card w-full shadow-xl" style={{ "--_glow-color": `var(--weather-${getWeatherClass(data.weather.condition).replace('weather-', '')}-glow)` } as any}>
            <div className="dc-quote-tone">
              {data.weather.toneLabel}
            </div>
            <blockquote className="dc-quote-text">
              "{data.quote.text}"
            </blockquote>
            <p className="dc-quote-author">— {data.quote.author}</p>

            <div className="dc-quote-footer">
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {cityQuery || "Near you"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-10 animate-[dc-enter_800ms_ease_both_400ms]">
          <button
            onClick={startARMode}
            className="dc-btn dc-btn-primary w-full h-14 text-lg"
          >
            <Camera className="mr-2 h-5 w-5" /> View in AR
          </button>

          <div className="flex gap-4">
            <button className="dc-btn dc-btn-ghost flex-1" onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Daily Motivation",
                  text: `"${data.quote.text}" — ${data.quote.author}`,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`"${data.quote.text}" — ${data.quote.author}`);
                toast.success("Quote copied to clipboard!");
              }
            }}>
              <ExternalLink className="mr-2 h-4 w-4" /> Share
            </button>
            <button className="dc-btn dc-btn-ghost flex-1" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
