import random
from typing import List, Tuple

import networkx as nx

from .models import FireStation, FireTruck, Incident


def dijkstra_fastest_route(graph: nx.Graph, source: int, target: int) -> Tuple[List[int], float]:
    """Shortest (fastest) path by travel_time, which already accounts for
    live traffic multipliers. O(V log V + E) with a binary-heap Dijkstra."""
    try:
        path = nx.dijkstra_path(graph, source, target, weight="travel_time")
        length = nx.dijkstra_path_length(graph, source, target, weight="travel_time")
        return path, length
    except nx.NetworkXNoPath:
        return [], float("inf")


def get_zone_trucks(trucks: List[FireTruck], target_zone: str) -> List[FireTruck]:
    """Divide & Conquer zone filtering. Recursively splits the truck list in
    half, filters each half independently, then merges. O(N), but
    demonstrates the D&C decomposition pattern and generalizes to
    parallel/distributed dispatch centers filtering simultaneously."""
    if not trucks:
        return []
    if len(trucks) == 1:
        return trucks if trucks[0].zone == target_zone else []
    mid = len(trucks) // 2
    left_half = trucks[:mid]
    right_half = trucks[mid:]
    left_result = get_zone_trucks(left_half, target_zone)
    right_result = get_zone_trucks(right_half, target_zone)
    return left_result + right_result


def greedy_truck_assignment(incident: Incident, trucks: List[FireTruck], graph: nx.Graph) -> FireTruck:
    """Greedy nearest-available-truck assignment. At each dispatch event we
    take the locally optimal choice (lowest travel time) without
    backtracking. O(K) where K is the number of candidate trucks."""
    best_truck = None
    min_time = float("inf")
    for t in trucks:
        if not t.available or t.water_level < 10:
            continue
        _, travel_time = dijkstra_fastest_route(graph, t.node_id, incident.node_id)
        if travel_time < min_time:
            min_time = travel_time
            best_truck = t
    return best_truck


def dp_water_optimization(truck: FireTruck, incidents: List[Incident], graph: nx.Graph) -> List[Incident]:
    """0/1 Knapsack: choose which pending incidents a truck should respond
    to on this run to MAXIMIZE total severity contained without exceeding
    its remaining water/foam tank. weight = water cost to reach + suppress,
    value = severity. O(P * W) bottom-up DP table with backtracking."""
    n = len(incidents)
    capacity = int(truck.water_level)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    keep = [[False] * (capacity + 1) for _ in range(n + 1)]

    costs = []
    for inc in incidents:
        _, time = dijkstra_fastest_route(graph, truck.node_id, inc.node_id)
        cost = int(time * 0.5)
        costs.append(cost)

    for i in range(1, n + 1):
        w_cost = costs[i - 1]
        severity = incidents[i - 1].severity
        for w in range(capacity + 1):
            if w_cost <= w:
                with_item = severity + dp[i - 1][w - w_cost]
                without_item = dp[i - 1][w]
                if with_item > without_item:
                    dp[i][w] = with_item
                    keep[i][w] = True
                else:
                    dp[i][w] = without_item
            else:
                dp[i][w] = dp[i - 1][w]

    chosen = []
    w = capacity
    for i in range(n, 0, -1):
        if keep[i][w]:
            chosen.append(incidents[i - 1])
            w -= costs[i - 1]
    return chosen[::-1]


def update_traffic(graph: nx.Graph):
    """Randomly re-rolls congestion on every edge (road closures,
    rush-hour, etc.), simulating live traffic and re-weighting
    travel_time = distance * traffic_multiplier."""
    for u, v, data in graph.edges(data=True):
        data["traffic_multiplier"] = random.uniform(1.0, 3.0)
        data["travel_time"] = data["distance"] * data["traffic_multiplier"]
