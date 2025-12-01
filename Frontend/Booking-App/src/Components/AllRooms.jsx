import React, { useEffect, useState, useContext } from "react";
import RoomCard from "./RoomCard";
import { UserContext } from "./UserContext";

export default function AllRooms() {
  const { API } = useContext(UserContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const base = API || (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");
        const res = await fetch(`${base}/rooms/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRooms(data);
      } catch (e) {
        console.error("Failed loading rooms", e);
        if (!cancelled) setErr(e.message || "Failed to load rooms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [API]);

  if (loading) return <div className="py-4">Loading rooms...</div>;
  if (err) return <div className="alert alert-danger mt-3">{err}</div>;

  if (!rooms || rooms.length === 0) {
    return <div className="py-4">No rooms found.</div>;
  }

  return (
    <div className="row">
      {rooms.map((room) => (
        <div key={room.id} className="col-sm-12 col-md-6 col-lg-4 mb-4">
          <RoomCard room={room} />
        </div>
      ))}
    </div>
  );
}
