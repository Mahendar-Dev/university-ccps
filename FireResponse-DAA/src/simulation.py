import random

import networkx as nx

from .algorithms import update_traffic
from .models import FireStation, FireTruck, Incident


class SimulationEnv:
    def __init__(self):
        self.graph = nx.Graph()
        self.trucks = []
        self.stations = []
        self.incidents = []
        self.zones = ["North", "East", "Central", "Harbor", "West"]
        self._generate_city_graph()
        self._populate_entities()

    def _generate_city_graph(self, grid_size: int = 7):
        grid = nx.grid_2d_graph(grid_size, grid_size)
        self.graph = nx.convert_node_labels_to_integers(grid, ordering="default")
        for i in self.graph.nodes:
            x = i // grid_size * 20
            y = i % grid_size * 20
            self.graph.nodes[i]["pos"] = (x, y)
            self.graph.nodes[i]["zone"] = random.choice(self.zones)
        for u, v in self.graph.edges:
            self.graph.edges[u, v]["distance"] = random.uniform(5.0, 15.0)
        update_traffic(self.graph)

    def _populate_entities(self):
        nodes = list(self.graph.nodes)
        random.shuffle(nodes)
        for i in range(5):
            node_id = nodes.pop()
            s = FireStation(
                f"S{i + 1}", f"Fire Station {i + 1}", node_id,
                capacity=random.randint(3, 8),
                zone=self.graph.nodes[node_id]["zone"],
            )
            self.stations.append(s)
        for i in range(10):
            node_id = nodes.pop()
            t = FireTruck(
                f"T{i + 1}", node_id,
                water_level=random.uniform(50, 100),
                max_water_capacity=random.uniform(2000, 5000),
                available=True,
                zone=self.graph.nodes[node_id]["zone"],
            )
            self.trucks.append(t)

    def generate_incident(self) -> Incident:
        node_id = random.choice(list(self.graph.nodes))
        zone = self.graph.nodes[node_id]["zone"]
        inc = Incident(f"F{len(self.incidents) + 1}", node_id, random.randint(1, 5), zone)
        self.incidents.append(inc)
        return inc
