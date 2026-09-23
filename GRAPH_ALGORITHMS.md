# UNDERWEB — Graph Theory & Algorithmic Analysis

---

## 1. Graph Data Model

The website architecture is modeled as a Directed Multigraph $G = (V, E)$ where:
- $V$ is the set of heterogeneous nodes: `WEBSITE`, `FRAMEWORK`, `LIBRARY`, `API`, `DOMAIN`, `CDN`, `HOST`, `TRACKER`.
- $E$ is the set of directed, weighted edges representing semantic relationships:
  - `USES` ($A \to B$): Website utilizes Framework/Library.
  - `CALLS` ($A \to B$): Website or Script invokes API endpoint.
  - `CONNECTS_TO` ($A \to B$): Website opens socket/connection to Domain.
  - `DELIVERED_BY` ($A \to B$): Content delivered via Edge CDN.
  - `HOSTED_BY` ($A \to B$): Domain served from Cloud Host.
  - `TRACKS` ($A \to B$): Tracker monitors user interaction on Website.

---

## 2. Algorithms Implemented

### 2.1 Shortest Path (Dijkstra / Unweighted BFS)
- **Problem**: What is the shortest dependency path between the user's browser session and an external service or tracker?
- **Complexity**: $O(V + E)$ for unweighted graphs.
- **Application**: Traces data leakage paths from the primary origin to tracking networks.

### 2.2 Degree Centrality (In-Degree & Out-Degree)
- **Problem**: Which components are the most heavily depended-upon, and which components generate the most outgoing traffic?
- **Formula**:
  - $C_{\text{in}}(v) = \deg^-(v)$ (Incoming dependencies)
  - $C_{\text{out}}(v) = \deg^+(v)$ (Outgoing requests)

### 2.3 Betweenness Centrality (Brandes' Algorithm)
- **Problem**: Which node serves as the most critical architectural "bridge"?
- **Algorithm**: Brandes' $O(V \cdot E)$ formulation:
  $$C_B(v) = \sum_{s \ne v \ne t \in V} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
  where $\sigma_{st}$ is the total number of shortest paths from $s$ to $t$ and $\sigma_{st}(v)$ is the number of those paths passing through $v$.
- **Insight**: Identifies critical points of failure (e.g. a shared API gateway, core bundle chunk, or tag manager).

### 2.4 Connected Components
- **Problem**: Are there isolated subgraphs or disconnected third-party beacons?
- **Complexity**: $O(V + E)$ using iterative queue traversal.

### 2.5 Maximum & Average Dependency Depth
- **Problem**: How deep is the critical execution chain before interactive DOM stabilization?
- **Metric**: Longest directed path from root to leaf node.
