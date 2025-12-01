import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserContext";

/**
 * MyBookings:
 * - fetches occupied-dates for the current user
 * - groups sequential occupied dates into ranges per room
 * - fetches room names for display
 */
export default function MyBookings() {
  const { user, authedFetch, API } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [ranges, setRanges] = useState([]); // [{ roomUrl, roomName, from, to, dates }]
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJson(path) {
      if (authedFetch) {
        const res = await authedFetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } else {
        const base = API || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const full = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
        const res = await fetch(full);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }
    }

    function parseDate(s) {
      // backend returns yyyy-mm-dd — parse into Date at local midnight
      return new Date(s + "T00:00:00");
    }

    function formatDisplayDate(s) {
      if (!s) return "—";
      const d = new Date(s + "T00:00:00");
      // en-GB => dd/mm/yyyy, replace slashes with '-' if you prefer
      return d.toLocaleDateString("en-GB");
    }

    // group sorted array of date strings into contiguous ranges
    function datesToRanges(dates) {
      if (!dates || dates.length === 0) return [];
      // dates: array of "yyyy-mm-dd"
      const sorted = dates.slice().sort();
      const out = [];
      let start = sorted[0];
      let prev = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        const cur = sorted[i];
        const prevDate = parseDate(prev);
        const curDate = parseDate(cur);
        const diffMs = curDate - prevDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          // contiguous — extend range
          prev = cur;
        } else {
          // gap — push previous range
          out.push({ from: start, to: prev });
          start = cur;
          prev = cur;
        }
      }
      // push last
      out.push({ from: start, to: prev });
      return out;
    }

    async function load() {
      if (!user) {
        setErr("Please login to see your bookings.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        // try occupied-dates with user filter (your backend supports this)
        const path = `/occupied-dates/?user=${user.id}`;
        const items = await fetchJson(path);

        if (!Array.isArray(items)) {
          setErr("Unexpected API response for occupied-dates.");
          setLoading(false);
          return;
        }

        // group by room URL
        const byRoom = {};
        for (const it of items) {
          const roomUrl = it.room; // e.g. "http://127.0.0.1:8000/rooms/1/"
          const date = it.date; // "yyyy-mm-dd"
          if (!roomUrl || !date) continue;
          if (!byRoom[roomUrl]) byRoom[roomUrl] = [];
          byRoom[roomUrl].push(date);
        }

        // build ranges per room
        const entries = Object.entries(byRoom); // [ [roomUrl, [dates...]], ... ]
        // fetch room names (avoid duplicate requests)
        const roomNameCache = {};

        await Promise.all(
          entries.map(async ([roomUrl, dates]) => {
            // normalize roomUrl to a path for fetchJson
            // roomUrl might be absolute: http://127.0.0.1:8000/rooms/1/
            // convert to path: /rooms/1/
            let pathForFetch;
            try {
              const u = new URL(roomUrl);
              pathForFetch = u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
            } catch (e) {
              // if it's already a path like "/rooms/1/"
              pathForFetch = roomUrl.startsWith("/") ? roomUrl : `/${roomUrl}`;
            }

            let roomName = roomNameCache[roomUrl] || null;
            try {
              if (!roomName) {
                const roomJson = await fetchJson(pathForFetch);
                // room title key is "name" per your screenshot
                roomName = roomJson.name ?? roomJson.title ?? `Room ${roomJson.id ?? ""}`;
                roomNameCache[roomUrl] = roomName;
              }
            } catch (e) {
              // if room fetch failed, fallback to showing the URL
              roomName = roomUrl;
            }

            // get contiguous ranges for this room's dates
            const rangesForRoom = datesToRanges(dates);

            // store ranges to final list
            for (const r of rangesForRoom) {
              // push one entry per contiguous range
              setRanges((prev) => [
                ...prev,
                {
                  roomUrl,
                  roomName,
                  from: r.from,
                  to: r.to,
                  rawDates: dates.slice().sort(),
                },
              ]);
            }
          })
        );

        // done
        if (!cancelled) {
          // setRanges was updated incrementally; sort by from date
          setRanges((prev) =>
            prev
              .slice()
              .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0))
          );
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load occupied-dates", e);
        if (!cancelled) {
          setErr("Failed to load bookings: " + (e.message || e));
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authedFetch, API]);

  if (loading) return <div className="py-4">Loading your bookings...</div>;
  if (err) return <div className="alert alert-warning mt-3">{err}</div>;
  if (!ranges || ranges.length === 0) return <div className="py-4">You have no bookings yet.</div>;

  return (
    <div className="py-3">
      <h3 className="mb-3">My bookings</h3>

      <div className="row">
        {ranges.map((r, i) => (
          <div key={`${r.roomUrl}-${r.from}-${i}`} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{r.roomName}</h5>
                <p className="card-text small text-muted">
                  {new Date(r.from + "T00:00:00").toLocaleDateString("en-GB")} →{" "}
                  {new Date(r.to + "T00:00:00").toLocaleDateString("en-GB")}
                </p>
                <p className="mb-1"><strong>User:</strong> {user?.email ?? user?.username ?? "—"}</p>
                <p className="mb-0 small text-muted">Days: {r.rawDates.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

