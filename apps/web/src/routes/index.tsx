import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Cloud, MapPin, RefreshCcw, Camera, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@project-dailyquotes/ui/components/button";

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

  if (!location && !cityQuery && !locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Reading your sky...</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocationError(true)}>
          Skip & enter city manually
        </Button>
      </div>
    );
  }

  if (!location && !cityQuery && locationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center max-w-md mx-auto">
        <MapPin className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Location Access Denied</h2>
        <p className="text-sm text-muted-foreground">No worries — tell us your city instead.</p>
        <form className="flex w-full space-x-2 mt-4" onSubmit={(e) => {
          e.preventDefault();
          const city = new FormData(e.currentTarget).get("city") as string;
          if (city) {
            setCityQuery(city);
          }
        }}>
           <input name="city" placeholder="Davao City" className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground" required />
           <Button type="submit">Search</Button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Gathering your daily quote...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center">
        <p className="text-sm text-destructive">Failed to fetch the quote.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
        </Button>
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
            className="absolute inset-0 w-full h-full object-cover"
            ref={(ref) => {
              if (ref && !ref.srcObject) {
                ref.srcObject = videoStream;
              }
            }}
          />
        )}
        <div className="absolute top-8 right-8">
          <Button variant="secondary" onClick={stopARMode}>Close AR</Button>
        </div>
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="z-10 text-center p-6 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl m-4 max-w-md pointer-events-auto">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-2">
            {data.weather.toneLabel}
          </h2>
          <blockquote className="text-3xl font-serif leading-tight text-white drop-shadow-md">
            "{data.quote.text}"
          </blockquote>
          <p className="text-white/80 mt-4 font-medium drop-shadow-md">— {data.quote.author}</p>
        </div>
        <div className="absolute bottom-8 z-10 flex space-x-4">
          <Button variant="secondary" onClick={() => {
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
          </Button>
        </div>
      </div>
    );
  }

  const getToneBackgroundClass = (toneId: string) => {
    switch (toneId) {
      case "energy_action": return "bg-gradient-to-br from-amber-500/20 to-orange-600/20 dark:from-amber-900/40 dark:to-orange-950/40";
      case "patience_perseverance": return "bg-gradient-to-br from-slate-300/50 to-slate-500/50 dark:from-slate-800/80 dark:to-slate-900/80";
      case "resilience_growth": return "bg-gradient-to-br from-blue-400/30 to-cyan-600/30 dark:from-blue-900/50 dark:to-cyan-950/50";
      case "courage_strength": return "bg-gradient-to-br from-indigo-900/60 to-purple-900/60 dark:from-indigo-950 dark:to-purple-950";
      case "clarity_focus": return "bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/80 dark:to-gray-900/80";
      case "rest_renewal": return "bg-gradient-to-br from-sky-100/50 to-blue-200/50 dark:from-sky-900/60 dark:to-blue-950/60";
      default: return "bg-gradient-to-br from-background to-muted";
    }
  };

  return (
    <div className={`container mx-auto flex max-w-md flex-col items-center justify-center h-full p-4 space-y-8 relative overflow-hidden ${getToneBackgroundClass(data.weather.toneId)}`}>
      {/* Weather info */}
      <div className="absolute top-4 right-4 flex flex-col items-end opacity-80 text-sm">
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4" />
          <span>{data.weather.condition}</span>
        </div>
        <div>{Math.round(data.weather.temp)}°C</div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {data.weather.toneLabel}
          </h2>
          <blockquote className="text-2xl md:text-4xl font-serif leading-tight">
            "{data.quote.text}"
          </blockquote>
          <p className="text-muted-foreground mt-4">— {data.quote.author}</p>
        </div>
      </div>

      <div className="flex w-full flex-col space-y-3 pb-8">
        <Button
          onClick={startARMode}
          className="w-full h-14 text-lg"
        >
          <Camera className="mr-2 h-5 w-5" /> View in AR
        </Button>
        <div className="flex w-full space-x-3">
          <Button variant="secondary" className="flex-1" onClick={() => {
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
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
