# 🚒 FireGrid: Intelligent Multi-Fire-Truck Emergency Response System

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![NetworkX](https://img.shields.io/badge/NetworkX-Graph%20Engine-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://networkx.org/)
[![Algorithms](https://img.shields.io/badge/Algorithms-DAA%2FCCP-1D9E75?style=for-the-badge)](#-core-algorithms)

**FireGrid** is a live simulation and command dashboard for city-wide fire emergency response. It solves a **real-world dispatch problem**: given multiple fire stations, a limited fleet of trucks, unpredictable incidents, live traffic, and finite onboard water — who gets sent where, by what route, and which fires get prioritized when resources run short.

This repository contains the complete source code and documentation for the **Design and Analysis of Algorithms (DAA) — Complex Computing Problem (CCP)** submission.

---

## 🔥 The Real-World Problem Solved

City fire departments dispatch trucks under constant uncertainty: incidents appear at random locations with varying severity, roads congest unpredictably, and every truck carries only a finite water/foam supply before it must return to base.

- **The Challenge:** A single greedy "send whoever's closest" rule ignores zone structure, live congestion, and the fact that a truck may need to choose between several fires before it runs dry.
- **The Solution:** FireGrid layers four classical algorithmic paradigms on top of a live traffic-weighted city graph — each one solving a different sub-problem in the dispatch pipeline, from candidate filtering to final route to resource-constrained prioritization.

---

## 🏗️ Architecture Overview

The system follows a clean **simulation-engine + dashboard** separation, so the algorithms can be tested independently of the UI.

1. **Simulation Environment:** A `networkx` grid graph represents the city, with randomized zones, road distances, and live traffic multipliers regenerated on demand.
2. **Data Models:** Plain dataclasses (`FireStation`, `FireTruck`, `Incident`) hold state — no ORM, no database, fully in-memory for fast iteration.
3. **Algorithm Layer:** Four independent, unit-testable functions implement Divide & Conquer, Greedy, Dijkstra, and Dynamic Programming respectively.
4. **Dashboard (UI):** A **Streamlit** single-page app renders the live city map (Matplotlib), a control sidebar, and a real-time fleet status board.

---

## 📁 Repository Structure

```
📦 FireResponse-DAA
 ┣ 📂 src
 ┃ ┣ 📜 models.py          # FireStation, FireTruck, Incident dataclasses
 ┃ ┣ 📜 algorithms.py      # Dijkstra, Greedy, Divide & Conquer, DP Knapsack
 ┃ ┗ 📜 simulation.py      # City grid generation + entity population
 ┣ 📜 app.py               # Streamlit dashboard (entry point)
 ┣ 📜 requirements.txt     # Python dependencies
 ┗ 📜 README.md            # Documentation
```

---

## 🧮 Core Algorithms

- [x] **Divide & Conquer — Zone Filtering:** `get_zone_trucks` recursively splits the truck list to isolate candidates in an incident's zone. `O(N)`
- [x] **Greedy — Nearest-Truck Assignment:** `greedy_truck_assignment` picks the locally optimal (lowest travel-time) available truck with no backtracking. `O(K)`
- [x] **Dijkstra — Fastest Routing:** `dijkstra_fastest_route` computes shortest paths under live, randomized traffic weights — used twice per dispatch (truck → incident, then incident → nearest refill station). `O(V log V + E)`
- [x] **Dynamic Programming — Water-Constrained Prioritization:** `dp_water_optimization` solves a 0/1 Knapsack (weight = travel cost, value = severity) to choose which pending incidents a truck should respond to without exceeding its remaining water. `O(P · W)`
- [x] **Live Traffic Simulation:** `update_traffic` re-rolls congestion multipliers on every edge on demand, so routing decisions are demonstrably dynamic, not hardcoded.

---

## 🛠️ Deployment Instructions (For a Fresh Clone)

### Prerequisites

1. **Python 3.10+** installed.
2. **pip** (comes with Python).

### Step 1: Get into the project folder

```bash
cd FireResponse-DAA
```

### Step 2: Create and activate a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (Git Bash)
source venv/Scripts/activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Run the dashboard

```bash
python -m streamlit run app.py
```

The app opens automatically at `http://localhost:8501`. If it doesn't, paste that URL into your browser.

---

## 🎛️ Dashboard Controls

| Control | What it does |
|---|---|
| 🔄 **Reset Simulation** | Regenerates the city grid, trucks, and fire stations from scratch |
| 🔄 **Update Traffic dynamically** | Re-rolls congestion on every road, changing future routing decisions |
| 🔥 **Generate Random Incident** | Spawns a fire and runs the full dispatch pipeline live on the map |
| 💧 **Run DP Analysis** | Solves the knapsack optimization for a random truck against all pending incidents |

---

*Developed for the Design and Analysis of Algorithms (DAA) course as a Complex Computing Problem (CCP) submission.*
