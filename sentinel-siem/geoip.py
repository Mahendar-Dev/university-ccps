"""
geoip.py — Source IP geolocation for the threat map.

Real SOC dashboards plot attacker source IPs on a world map. Two modes:

1. LIVE mode — uses the free ip-api.com JSON endpoint (no key required,
   45 req/min limit) when the host has internet access. This is the
   "real" path and is what you'd point at in production / for the demo
   if the lab machine has internet.

2. OFFLINE / SIMULATION mode — this lab's generator.py fabricates IPs
   from a handful of private/reserved ranges (they aren't real routable
   attacker IPs), so a live lookup would return nothing useful for them
   anyway. For those, and as a fallback when there's no internet, we use
   a deterministic offline table so the map and demo still work air-gapped.
   This is clearly documented so it's not misrepresented as live geo-data
   in the FYP report — it's a substitute for a data source the lab
   environment cannot reach, not a claim of real attacker locations.

Swap LIVE_LOOKUP = True once you have internet, or replace _live_lookup's
implementation with a paid GeoIP2 database (MaxMind) for a fully offline
but still "real" dataset — that's noted as a future-work item.
"""
import requests

LIVE_LOOKUP = False  # set True on a machine with internet access

# Deterministic offline fallback table, keyed by the IP prefixes generator.py
# actually produces, so demo runs are reproducible without internet.
_OFFLINE_TABLE = {
    "203.0.113": {"country": "United States", "lat": 38.9, "lon": -77.0, "city": "Washington DC (sim)"},
    "198.51.100": {"country": "Germany", "lat": 52.5, "lon": 13.4, "city": "Berlin (sim)"},
    "45.33": {"country": "Russia", "lat": 55.75, "lon": 37.6, "city": "Moscow (sim)"},
    "10.0.0": {"country": "Internal Network", "lat": 0, "lon": 0, "city": "Internal (private range)"},
    "192.168.1": {"country": "Internal Network", "lat": 0, "lon": 0, "city": "Internal (private range)"},
}
_DEFAULT = {"country": "Unknown", "lat": 0, "lon": 0, "city": "Unknown"}

_cache = {}


def _prefix_of(ip):
    parts = ip.split(".")
    for n in (3, 2):
        p = ".".join(parts[:n])
        if p in _OFFLINE_TABLE:
            return p
    return None


def _offline_lookup(ip):
    prefix = _prefix_of(ip)
    return _OFFLINE_TABLE.get(prefix, _DEFAULT)


def _live_lookup(ip):
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}", timeout=2)
        d = r.json()
        if d.get("status") == "success":
            return {"country": d.get("country", "Unknown"), "lat": d.get("lat", 0),
                     "lon": d.get("lon", 0), "city": d.get("city", "Unknown")}
    except Exception:
        pass
    return None


def lookup(ip):
    """Return {country, city, lat, lon} for an IP. Cached per-process."""
    if ip in _cache:
        return _cache[ip]

    result = None
    if LIVE_LOOKUP:
        result = _live_lookup(ip)
    if result is None:
        result = _offline_lookup(ip)

    _cache[ip] = result
    return result


def lookup_many(ips):
    return {ip: lookup(ip) for ip in set(ips)}
