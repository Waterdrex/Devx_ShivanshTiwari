import math
from typing import Dict, Any, List, Optional

# Supported multi-city clusters with active tech hubs
SUPPORTED_CITIES = {
    "Bengaluru": {
        "lat": 12.9716,
        "lng": 77.5946,
        "localities": {
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
    },
    "Mumbai": {
        "lat": 19.0760,
        "lng": 72.8777,
        "localities": {
            "Bandra": {"lat": 19.0596, "lng": 72.8295},
            "Andheri": {"lat": 19.1136, "lng": 72.8697},
            "Powai": {"lat": 19.1176, "lng": 72.9060},
            "BKC": {"lat": 19.0657, "lng": 72.8687},
            "Navi Mumbai": {"lat": 19.0330, "lng": 73.0297},
            "Lower Parel": {"lat": 18.9953, "lng": 72.8306},
        }
    },
    "Delhi NCR": {
        "lat": 28.6139,
        "lng": 77.2090,
        "localities": {
            "Cyber City": {"lat": 28.4950, "lng": 77.0895},
            "Connaught Place": {"lat": 28.6315, "lng": 77.2167},
            "Noida Sector 62": {"lat": 28.6280, "lng": 77.3649},
            "Hauz Khas": {"lat": 28.5494, "lng": 77.2001},
            "Okhla": {"lat": 28.5355, "lng": 77.2732},
        }
    },
    "Hyderabad": {
        "lat": 17.3850,
        "lng": 78.4867,
        "localities": {
            "HITEC City": {"lat": 17.4435, "lng": 78.3772},
            "Gachibowli": {"lat": 17.4401, "lng": 78.3489},
            "Madhapur": {"lat": 17.4483, "lng": 78.3915},
            "Jubilee Hills": {"lat": 17.4319, "lng": 78.4073},
            "Kondapur": {"lat": 17.4689, "lng": 78.3578},
        }
    },
    "Pune": {
        "lat": 18.5204,
        "lng": 73.8567,
        "localities": {
            "Hinjawadi": {"lat": 18.5913, "lng": 73.7389},
            "Baner": {"lat": 18.5590, "lng": 73.7868},
            "Viman Nagar": {"lat": 18.5679, "lng": 73.9143},
            "Koregaon Park": {"lat": 18.5362, "lng": 73.8940},
        }
    }
}

LOCALITY_COORDINATES = SUPPORTED_CITIES["Bengaluru"]["localities"]

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    R = 6371.0 # km
    rlat1, rlon1 = math.radians(lat1), math.radians(lon1)
    rlat2, rlon2 = math.radians(lat2), math.radians(lon2)
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = math.sin(dlat / 2)**2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def estimate_distance_km(loc1: str, loc2: str) -> float:
    if loc1 == loc2:
        return 0.0
    c1 = None
    c2 = None
    # Search across all supported cities
    for city_data in SUPPORTED_CITIES.values():
        locs = city_data.get("localities", {})
        if loc1 in locs:
            c1 = locs[loc1]
        if loc2 in locs:
            c2 = locs[loc2]

    if not c1 or not c2:
        return 10.0 # general fallback average

    crow_dist = haversine_distance_km(c1["lat"], c1["lng"], c2["lat"], c2["lng"])
    # Urban road factor (~1.35x crow flies)
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
