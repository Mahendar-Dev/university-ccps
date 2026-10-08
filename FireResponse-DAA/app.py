import random

import matplotlib.pyplot as plt
import networkx as nx
import streamlit as st

from src.algorithms import (
    dijkstra_fastest_route,
    dp_water_optimization,
    get_zone_trucks,
    greedy_truck_assignment,
    update_traffic,
)
from src.simulation import SimulationEnv

st.set_page_config(page_title="Fire Emergency Response", layout="wide")
st.title("🚒 Intelligent Multi-Fire-Truck Emergency Response System")
st.markdown("**DAA / CCP Project — Dijkstra · Greedy · Divide & Conquer · Dynamic Programming**")

if "env" not in st.session_state:
    st.session_state.env = SimulationEnv()
env = st.session_state.env

for key in ["current_incident", "assigned_truck", "station", "path", "station_path"]:
    if key not in st.session_state:
        st.session_state[key] = None
for key in ["time_to_incident", "station_time"]:
    if key not in st.session_state:
        st.session_state[key] = 0.0

st.sidebar.header("Controls")

if st.sidebar.button("🔄 Reset Simulation"):
    st.session_state.env = SimulationEnv()
    for key in ["current_incident", "assigned_truck", "station", "path", "station_path"]:
        st.session_state[key] = None
    for key in ["time_to_incident", "station_time"]:
        st.session_state[key] = 0.0
    st.rerun()

if st.sidebar.button("🔄 Update Traffic dynamically"):
    update_traffic(env.graph)
    st.sidebar.success("Traffic Updated!")

st.sidebar.subheader("🔥 Trigger Fire Incident")
if st.sidebar.button("Generate Random Incident"):
    incident = env.generate_incident()
    st.session_state.current_incident = incident

    zone_trucks = get_zone_trucks(env.trucks, incident.zone)
    if not zone_trucks:
        zone_trucks = env.trucks

    best_truck = greedy_truck_assignment(incident, zone_trucks, env.graph)
    if best_truck:
        st.session_state.assigned_truck = best_truck
        best_truck.available = False

        path_to_incident, time_to_incident = dijkstra_fastest_route(
            env.graph, best_truck.node_id, incident.node_id
        )
        st.session_state.path = path_to_incident
        st.session_state.time_to_incident = time_to_incident

        best_station = None
        min_station_time = float("inf")
        station_path = []
        for s in env.stations:
            if s.capacity > 0:
                s_path, s_time = dijkstra_fastest_route(env.graph, incident.node_id, s.node_id)
                if s_time < min_station_time:
                    min_station_time = s_time
                    best_station = s
                    station_path = s_path
        st.session_state.station = best_station
        st.session_state.station_path = station_path
        st.session_state.station_time = min_station_time

        total_time = time_to_incident + (min_station_time if min_station_time != float("inf") else 0)
        best_truck.use_water(total_time * 0.5)
    else:
        st.session_state.assigned_truck = None

st.sidebar.subheader("💧 DP Water Optimization")
if st.sidebar.button("Run DP Analysis"):
    if env.trucks and env.incidents:
        truck = random.choice(env.trucks)
        optimal = dp_water_optimization(truck, env.incidents, env.graph)
        st.sidebar.write(f"Truck {truck.id} (Water: {truck.water_level:.1f}%)")
        st.sidebar.write(f"Optimal incidents to respond to (max severity contained): {[i.id for i in optimal]}")

col1, col2 = st.columns([3, 1])

with col1:
    st.subheader("🗺️ Live City Map")
    fig, ax = plt.subplots(figsize=(10, 8))
    pos = nx.get_node_attributes(env.graph, "pos")

    nx.draw_networkx_nodes(env.graph, pos, node_color="lightgray", node_size=50, ax=ax)

    edges = env.graph.edges()
    traffic = [env.graph[u][v]["traffic_multiplier"] for u, v in edges]
    nx.draw_networkx_edges(
        env.graph, pos, edgelist=edges, edge_color=traffic, edge_cmap=plt.cm.RdYlGn_r, width=2, ax=ax
    )

    station_nodes = [s.node_id for s in env.stations]
    nx.draw_networkx_nodes(
        env.graph, pos, nodelist=station_nodes, node_color="blue", node_size=800, node_shape="s", ax=ax
    )

    truck_nodes = [t.node_id for t in env.trucks if t.available]
    nx.draw_networkx_nodes(
        env.graph, pos, nodelist=truck_nodes, node_color="green", node_size=600, node_shape="^", ax=ax
    )

    if st.session_state.path:
        path_edges = list(zip(st.session_state.path, st.session_state.path[1:]))
        nx.draw_networkx_edges(env.graph, pos, edgelist=path_edges, edge_color="red", width=4, ax=ax)
        if st.session_state.current_incident:
            nx.draw_networkx_nodes(
                env.graph, pos, nodelist=[st.session_state.current_incident.node_id],
                node_color="orange", node_size=900, node_shape="*", ax=ax,
            )

    if st.session_state.station_path:
        path_edges = list(zip(st.session_state.station_path, st.session_state.station_path[1:]))
        nx.draw_networkx_edges(env.graph, pos, edgelist=path_edges, edge_color="purple", width=4, ax=ax)

    labels = {}
    for s in env.stations:
        labels[s.node_id] = s.id
    for t in env.trucks:
        labels[t.node_id] = t.id
    if st.session_state.current_incident:
        labels[st.session_state.current_incident.node_id] = st.session_state.current_incident.id

    nx.draw_networkx_labels(
        env.graph, pos, labels=labels, font_size=13, font_weight="bold", font_color="black",
        bbox=dict(facecolor="white", edgecolor="black", boxstyle="round,pad=0.3", alpha=0.9), ax=ax,
    )
    ax.set_title("City Fire Response Grid (Blue=Station, Green=Truck, Orange *=Incident)")
    ax.axis("off")
    st.pyplot(fig)

with col2:
    st.subheader("📊 Status Board")
    if st.session_state.current_incident:
        inc = st.session_state.current_incident
        st.write(f"**Incident**: Fire {inc.id} (Severity {inc.severity}) in {inc.zone}")
        if st.session_state.assigned_truck:
            st.success(f"**Dispatched**: {st.session_state.assigned_truck.id}")
            st.write(f"Estimated Time to Incident: {st.session_state.time_to_incident:.2f} mins")
            if st.session_state.station:
                st.info(f"**Refill Station**: {st.session_state.station.name}")
                st.write(f"Time to Station: {st.session_state.station_time:.2f} mins")
        else:
            st.error("No truck available or enough water!")

    st.markdown("---")
    st.write("**Fire Truck Fleet:**")
    for t in env.trucks:
        status = "🟢" if t.available else "🔴"
        st.write(f"{status} {t.id} | Water: {t.water_level:.1f}%")
