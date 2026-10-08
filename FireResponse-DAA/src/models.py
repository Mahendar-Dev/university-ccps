from dataclasses import dataclass


@dataclass
class FireStation:
    id: str
    name: str
    node_id: int
    capacity: int  # number of trucks it can refill/house
    zone: str


@dataclass
class FireTruck:
    id: str
    node_id: int
    water_level: float  # % of onboard water/foam tank remaining
    max_water_capacity: float  # liters (used as knapsack weight budget)
    available: bool
    zone: str

    def use_water(self, amount: float):
        self.water_level = max(0.0, self.water_level - amount)
        if self.water_level <= 0:
            self.available = False


@dataclass
class Incident:
    id: str
    node_id: int
    severity: int  # 1 (small/contained) - 5 (raging structure fire)
    zone: str
    assigned_truck_id: str = None
