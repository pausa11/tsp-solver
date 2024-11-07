import * as math from 'mathjs';
import { Graph, alg } from 'graphlib';

class TSP_Solver {
    constructor(locations) {
        this.locations = locations;
        this.graph = this.createCompleteGraph(locations);
        this.startNode = 0;
    }

    createCompleteGraph(locations) {
        const graph = new Graph({ directed: false });
        const numLocations = locations.length;

        // Crear una matriz de distancias
        for (let i = 0; i < numLocations; i++) {
            for (let j = i + 1; j < numLocations; j++) {
                const dist = math.distance([locations[i].x, locations[i].y], [locations[j].x, locations[j].y]);
                graph.setEdge(i, j, dist);
            }
        }
        return graph;
    }

    mst() {
        // Calcula el MST usando el algoritmo de Kruskal
        const mstEdges = alg.kruskal(this.graph);
        const mstGraph = new Graph({ directed: false });
        mstEdges.forEach(edge => {
            mstGraph.setEdge(edge.v, edge.w, edge.weight);
        });
        return mstGraph;
    }

    aStarMSTHeuristic() {
        const path = [this.startNode];
        const visited = new Set(path);
        let currentNode = this.startNode;
        let totalCost = 0;

        while (visited.size < this.locations.length) {
            // Crear copia de currentNode para mantener su valor en cada iteración
            const localCurrentNode = currentNode;

            const neighbors = this.graph.neighbors(localCurrentNode)
                .filter(nbr => !visited.has(parseInt(nbr)))
                .map(nbr => [this.graph.edge(localCurrentNode, nbr), parseInt(nbr)]);

            if (neighbors.length === 0) break;

            const [minDist, nextNode] = neighbors.reduce((a, b) => a[0] < b[0] ? a : b);
            visited.add(nextNode);
            path.push(nextNode);
            totalCost += minDist;
            currentNode = nextNode;
        }

        path.push(this.startNode);
        totalCost += this.graph.edge(currentNode, this.startNode);
        return { path, totalCost };
    }
}

export function solve_tsp(coords) {
    const solver = new TSP_Solver(coords);
    const solution = solver.aStarMSTHeuristic();
    return solution;
}
