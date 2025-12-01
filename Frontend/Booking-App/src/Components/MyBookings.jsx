import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserContext";

/**
 * MyBookings (improved)
 * - groups per-day occupied-dates into ranges (deduped)
 * - fetches room name and an image (if available)
 * - shows Cancel button which deletes all occupied-date records for that range
 */
export default function MyBookings() {
  const { user, authedFetch, API } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [ranges, setRanges] = useState([]); // { roomUrl, roomName, from, to, rawDates[], ids[] , roomImage }
  const [err, setErr] = useState(null);
  const [deleting, setDeleting] = useState(null); // id of active deleting range

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
      return new Date(s + "T00:00:00");
    }

    // convert list of sorted date strings into contiguous ranges
    function datesToRangesWithIds(sortedDates, sortedIds) {
      if (!sortedDates || sortedDates.length === 0) return [];
      const out = [];
      let start = sortedDates[0];
      let startIds = [sortedIds[0]];
      let prev = sortedDates[0];
      let prevIdList = [sortedIds[0]];

      for (let i = 1; i < sortedDates.length; i++) {
        const cur = sortedDates[i];
        const curId = sortedIds[i];
        const prevDate = parseDate(prev);
        const curDate = parseDate(cur);
        const diff = (curDate - prevDate) / (1000 * 60 * 60 * 24);

        if (diff === 1) {
          // contiguous => extend
          prev = cur;
          prevIdList.push(curId);
        } else {
          // push previous range
          out.push({ from: start, to: prev, ids: startIds.concat(prevIdList.slice(1)) });
          // start new
          start = cur;
          startIds = [curId];
          prev = cur;
          prevIdList = [curId];
        }
      }
      // push last
      out.push({ from: start, to: prev, ids: startIds.concat(prevIdList.slice(1)) });
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
        // get occupied-dates for this user
        const items = await fetchJson(`/occupied-dates/?user=${user.id}`);

        if (!Array.isArray(items)) {
          setErr("Unexpected occupied-dates response.");
          setLoading(false);
          return;
        }

        // group by roomUrl, collect date and id
        const byRoom = {};
        for (const it of items) {
          const roomUrl = it.room;
          const date = it.date;
          const id = it.id;
          if (!roomUrl || !date) continue;
          if (!byRoom[roomUrl]) byRoom[roomUrl] = { dates: [], ids: [] };
          byRoom[roomUrl].dates.push(date);
          byRoom[roomUrl].ids.push(id);
        }

        // Prepare results: for each room, sort dates, convert to ranges (with id lists)
        const results = [];
        // cache room details
        const roomCache = {};

        for (const [roomUrl, { dates, ids }] of Object.entries(byRoom)) {
          // sort dates and align ids accordingly (sort by date)
          const pairs = dates.map((d, idx) => ({ date: d, id: ids[idx] }));
          pairs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
          const sortedDates = pairs.map((p) => p.date);
          const sortedIds = pairs.map((p) => p.id);

          // get continuous ranges with id lists
          const rangesForRoom = datesToRangesWithIds(sortedDates, sortedIds);

          // get room name + an image if present
          let roomName = roomUrl;
          let roomImage = null;
          try {
            // convert absolute roomUrl to path if needed
            let pathForFetch;
            try {
              const u = new URL(roomUrl);
              pathForFetch = u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
            } catch (e) {
              pathForFetch = roomUrl.startsWith("/") ? roomUrl : `/${roomUrl}`;
            }

            if (!roomCache[roomUrl]) {
              const roomJson = await fetchJson(pathForFetch);
              roomCache[roomUrl] = roomJson;
            }
            const r = roomCache[roomUrl];
            roomName = r.name ?? r.title ?? roomUrl;
            // images: array of objects with image url (from your screenshot)
            if (r.images && r.images.length > 0) {
              // prefer first image.image
              roomImage = r.images[0].image ?? null;
            }
          } catch (e) {
            // ignore, fallback to URL
            console.warn("Could not fetch room details for", roomUrl, e);
          }

          // push each range as individual entry
          for (const rf of rangesForRoom) {
            results.push({
              roomUrl,
              roomName,
              roomImage,
              from: rf.from,
              to: rf.to,
              ids: rf.ids, // list of occupied-dates record ids for this range
              days: rf.ids.length,
            });
          }
        }

        // dedupe identical ranges (same room+from+to)
        const deduped = [];
        const seen = new Set();
        for (const r of results) {
          const key = `${r.roomUrl}__${r.from}__${r.to}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(r);
        }

        if (!cancelled) {
          setRanges(deduped.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0)));
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
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

  // DELETE helper: deletes a single occupied-date record id
  async function deleteOccupiedDate(id) {
    if (authedFetch) {
      const res = await authedFetch(`/occupied-dates/${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed ${res.status}`);
      return;
    } else {
      const base = API || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${base}/occupied-dates/${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed ${res.status}`);
      return;
    }
  }

  // Cancel booking: deletes all occupied-date records by id for that range
  async function handleCancelRange(range) {
    if (!confirm("Cancel this booking? This will remove the occupied dates.")) return;
    setDeleting(range.roomUrl + "|" + range.from + "|" + range.to);
    try {
      for (const id of range.ids) {
        await deleteOccupiedDate(id);
      }
      // remove from UI
      setRanges((prev) => prev.filter((r) => !(r.roomUrl === range.roomUrl && r.from === range.from && r.to === range.to)));
      alert("Booking cancelled.");
    } catch (e) {
      console.error("Cancel failed", e);
      alert("Cancel failed: " + (e.message || e));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="py-4">Loading your bookings...</div>;
  if (err) return <div className="alert alert-warning mt-3">{err}</div>;
  if (!ranges || ranges.length === 0) return <div className="py-4">You have no bookings yet.</div>;

  return (
    <div className="py-3">
      <h3 className="mb-3">My bookings</h3>

      <div className="row">
        {ranges.map((r, idx) => (
          <div key={`${r.roomUrl}-${r.from}-${r.to}-${idx}`} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100 shadow-sm">
              {r.roomImage && (
                <img src={r.roomImage} alt={r.roomName} className="card-img-top" style={{ objectFit: "cover", height: 150 }} />
              )}
              <div className="card-body">
                <h5 className="card-title">{r.roomName}</h5>
                <p className="card-text small text-muted">
                  {new Date(r.from + "T00:00:00").toLocaleDateString("en-GB")} →{" "}
                  {new Date(r.to + "T00:00:00").toLocaleDateString("en-GB")}
                </p>
                <p className="mb-1"><strong>User:</strong> {user?.email ?? user?.username ?? "—"}</p>
                <p className="mb-2 small text-muted">Days: {r.days}</p>

                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleCancelRange(r)}
                    disabled={deleting !== null}
                  >
                    {deleting === (r.roomUrl + "|" + r.from + "|" + r.to) ? "Cancelling..." : "Cancel"}
                  </button>

                  <small className="text-muted align-self-center">IDs: {r.ids.length}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

