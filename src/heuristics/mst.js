// Helper function to calculate the Euclidean distance between two cities
function distance(city1, city2) {
    const dx = city1.x - city2.x;
    const dy = city1.y - city2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Disjoint Set Union (DSU) for Kruskal's Algorithm
class DSU {
    constructor(size) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = Array(size).fill(1);
    }
    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]); 
        }
        return this.parent[x];
    }
    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX !== rootY) {
            // Union by rank
            if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX] += 1;
            }
            return true;
        }
        return false;
    }
}

export function calculateMST(cities, visitedCities) {
    console.log('In calculateMST');
    
    // Filtra las ciudades no visitadas
    const unvisitedCities = cities.filter((_, index) => !visitedCities.includes(index));
    if (unvisitedCities.length === 0) return 0; // Si no hay ciudades, el costo es 0
    
    // Construye todos los bordes entre las ciudades no visitadas
    const edges = [];
    for (let i = 0; i < unvisitedCities.length; i++) {
        for (let j = i + 1; j < unvisitedCities.length; j++) {
            const dist = distance(unvisitedCities[i], unvisitedCities[j]);
            edges.push({ i, j, weight: dist });
        }
    }

    // Ordena los bordes por peso
    edges.sort((a, b) => a.weight - b.weight);

    // Calcula el MST usando Kruskal
    const dsu = new DSU(unvisitedCities.length);
    let mstCost = 0;
    let edgesUsed = 0;

    for (const edge of edges) {
        if (dsu.union(edge.i, edge.j)) {
            mstCost += edge.weight;
            edgesUsed++;
            if (edgesUsed === unvisitedCities.length - 1) break; // Si ya conectamos todas las ciudades, terminamos
        }
    }

    return mstCost;
}
