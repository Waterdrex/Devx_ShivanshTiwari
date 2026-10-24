import math
from typing import Dict, Any, List, Optional

LOCALITY_COORDINATES = {
    "Koramangala": {"lat": 12.9352, "lng": 77.6245},
    "Indiranagar": {"lat": 12.9784, "lng": 77.6408},
    "HSR Layout": {"lat": 12.9121, "lng": 77.6446},
    "Whitefield": {"lat": 12.9698, "lng": 77.7499},
    "Electronic City": {"lat": 12.8399, "lng": 77.6770},
    "Central Bangalore": {"lat": 12.9767, "lng": 77.5928},
    "Jayanagar": {"lat": 12.9308, "lng": 77.5838},
    "Bellandur": {"lat": 12.9260, "lng": 77.6762},
    "Yelahanka": {"lat": 13.1007, "lng": 77.5963},
}

def estimate_distance_km(loc1: str, loc2: str) -> float:
    if loc1 == loc2:
        return 0.0
    c1 = LOCALITY_COORDINATES.get(loc1)
    c2 = LOCALITY_COORDINATES.get(loc2)
    if not c1 or not c2:
        return 10.0 # general average

    # Haversine formula
    R = 6371.0 # km
    lat1, lon1 = math.radians(c1["lat"]), math.radians(c1["lng"])
    lat2, lon2 = math.radians(c2["lat"]), math.radians(c2["lng"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    crow_dist = R * c
    # Bengaluru road factor (~1.35x crow flies)
    return round(crow_dist * 1.35, 1)

def estimate_travel_time_minutes(distance_km: float) -> int:
    if distance_km <= 0.5:
        return 5
    # Average peak city speed ~18-20 km/h in Bengaluru tech corridors
    minutes = int((distance_km / 18.0) * 60) + 10 # buffer
    return max(15, minutes)

def detect_travel_conflicts(planned_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    travel_conflicts = []
    # Sort events by date and start_time
    sorted_events = sorted(planned_events, key=lambda x: (x.get("date", ""), x.get("start_time", "")))
    n = len(sorted_events)

    for i in range(n - 1):
        ev1 = sorted_events[i]
        ev2 = sorted_events[i + 1]

        # Must be on the same date
        if ev1.get("date") != ev2.get("date"):
            continue

        loc1 = ev1.get("locality", "Koramangala")
        loc2 = ev2.get("locality", "Koramangala")
        
        # If either is online, no physical transit needed
        if loc1.lower() == "online" or loc2.lower() == "online":
            continue
        if loc1.lower() == loc2.lower():
            continue

        # Parse end time of ev1 and start time of ev2
        try:
            h1, m1 = map(int, ev1.get("end_time", "00:00").split(":"))
            h2, m2 = map(int, ev2.get("start_time", "00:00").split(":"))
            end_min1 = h1 * 60 + m1
            start_min2 = h2 * 60 + m2
            
            gap_minutes = start_min2 - end_min1
            
            dist_km = estimate_distance_km(loc1, loc2)
            required_transit = estimate_travel_time_minutes(dist_km)

            if gap_minutes < required_transit:
                travel_conflicts.append({
                    "event_a_id": ev1.get("id"),
                    "event_a_title": ev1.get("title"),
                    "event_a_locality": loc1,
                    "event_a_end": ev1.get("end_time"),
                    "event_b_id": ev2.get("id"),
                    "event_b_title": ev2.get("title"),
                    "event_b_locality": loc2,
                    "event_b_start": ev2.get("start_time"),
                    "date": ev1.get("date"),
                    "distance_km": dist_km,
                    "required_transit_minutes": required_transit,
                    "available_gap_minutes": max(0, gap_minutes),
                    "warning": f"Travel Conflict: {dist_km} km transfer between {loc1} and {loc2} requires ~{required_transit} mins transit in Bengaluru traffic, but your window is only {gap_minutes} mins."
                })
        except Exception:
            pass

    return travel_conflicts
