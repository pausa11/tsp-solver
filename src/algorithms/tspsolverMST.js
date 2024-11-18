import * as math from 'mathjs';
import { Graph } from 'graphlib';
import PriorityQueue from 'priorityqueuejs';

class DisjointSet {
    constructor(size) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = Array(size).fill(0);
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
            if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX]++;
            }
        }
    }
}

class TSP_Solver_AStar {
    constructor(locations) {
        this.locations = locations;
        this.graph = this.createCompleteGraph(locations);
        this.startNode = 0;
        this.totalNodes = locations.length;
        this.memoizedHeuristics = new Map();
        this.timeLimit = 99000; // 15 segundos
        this.startTime = Date.now();
        this.bestSolution = null;
        this.lastUpdate = Date.now();
        this.distanceMatrix = this.createDistanceMatrix();
        
        // Crear array de visitados inicial
        this.initialVisited = new Array(this.totalNodes).fill(false);
        this.initialVisited[this.startNode] = true;
    }

    createDistanceMatrix() {
        const matrix = Array(this.totalNodes).fill().map(() => Array(this.totalNodes));
        for (let i = 0; i < this.totalNodes; i++) {
            for (let j = i + 1; j < this.totalNodes; j++) {
                const dist = math.distance(
                    [this.locations[i].x, this.locations[i].y],
                    [this.locations[j].x, this.locations[j].y]
                );
                matrix[i][j] = dist;
                matrix[j][i] = dist;
            }
            matrix[i][i] = 0;
        }
        return matrix;
    }

    createCompleteGraph(locations) {
        const graph = new Graph({ directed: false });
        const numLocations = locations.length;

        for (let i = 0; i < numLocations; i++) {
            for (let j = i + 1; j < numLocations; j++) {
                const dist = math.distance(
                    [locations[i].x, locations[i].y],
                    [locations[j].x, locations[j].y]
                );
                graph.setEdge(i, j, dist);
            }
        }
        return graph;
    }

    getDistance(from, to) {
        return this.distanceMatrix[from][to];
    }

    // Función para convertir array de visitados a string para usar como clave en el cache
    visitedToString(visited, currentNode) {
        return `${currentNode}-${visited.join('')}`;
    }

    // Función para obtener nodos no visitados
    getUnvisitedNodes(visited) {
        const unvisited = [];
        for (let i = 0; i < this.totalNodes; i++) {
            if (!visited[i]) {
                unvisited.push(i);
            }
        }
        return unvisited;
    }

    kruskalMST(unvisitedNodes) {
        if (unvisitedNodes.length <= 1) return 0;
        
        const edges = [];
        const n = unvisitedNodes.length;
        
        for (let i = 0; i < n; i++) {
            const node1 = unvisitedNodes[i];
            for (let j = i + 1; j < n; j++) {
                const node2 = unvisitedNodes[j];
                edges.push({
                    v: node1,
                    w: node2,
                    weight: this.getDistance(node1, node2)
                });
            }
        }

        edges.sort((a, b) => a.weight - b.weight);
        const ds = new DisjointSet(this.totalNodes);
        let mstCost = 0;
        let edgesUsed = 0;
        const neededEdges = n - 1;

        for (const edge of edges) {
            if (ds.find(edge.v) !== ds.find(edge.w)) {
                mstCost += edge.weight;
                ds.union(edge.v, edge.w);
                edgesUsed++;
                if (edgesUsed === neededEdges) break;
            }
        }

        return mstCost;
    }

    calculateMSTHeuristic(currentNode, visited) {
        const unvisitedNodes = this.getUnvisitedNodes(visited);
        if (unvisitedNodes.length === 0) return 0;

        const memoKey = this.visitedToString(visited, currentNode);
        const cached = this.memoizedHeuristics.get(memoKey);
        if (cached !== undefined) {
            return cached;
        }

        // Si solo queda un nodo por visitar, la heurística es la distancia directa
        if (unvisitedNodes.length === 1) {
            const hValue = this.getDistance(currentNode, unvisitedNodes[0]);
            this.memoizedHeuristics.set(memoKey, hValue);
            return hValue;
        }

        const mstCost = this.kruskalMST(unvisitedNodes);

        // Encontrar la distancia mínima desde el nodo actual a cualquier nodo no visitado
        let minToUnvisited = Infinity;
        for (const node of unvisitedNodes) {
            const dist = this.getDistance(currentNode, node);
            if (dist < minToUnvisited) {
                minToUnvisited = dist;
            }
        }

        const heuristicValue = mstCost + minToUnvisited;
        this.memoizedHeuristics.set(memoKey, heuristicValue);
        return heuristicValue;
    }

    countVisited(visited) {
        return visited.reduce((count, v) => count + (v ? 1 : 0), 0);
    }

    updateBestSolution(solution) {
        this.bestSolution = solution;
        const currentTime = Date.now();
        if (currentTime - this.lastUpdate > 1000) {
            this.lastUpdate = currentTime;
            console.log(`Nueva mejor solución encontrada: ${solution.totalCost}`);
        }
    }

    findInitialSolution() {
        // Encuentra una solución inicial usando el vecino más cercano
        const visited = new Array(this.totalNodes).fill(false);
        visited[this.startNode] = true;
        let currentNode = this.startNode;
        const path = [this.startNode];
        let totalCost = 0;
        
        for (let i = 1; i < this.totalNodes; i++) {
            let nearestNode = -1;
            let minDistance = Infinity;
            
            for (let j = 0; j < this.totalNodes; j++) {
                if (!visited[j]) {
                    const distance = this.getDistance(currentNode, j);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestNode = j;
                    }
                }
            }
            
            visited[nearestNode] = true;
            path.push(nearestNode);
            totalCost += minDistance;
            currentNode = nearestNode;
        }
        
        // Agregar el costo de retorno al nodo inicial
        totalCost += this.getDistance(currentNode, this.startNode);
        path.push(this.startNode);
        
        return {
            path: path,
            totalCost: totalCost
        };
    }

    solve() {
        // Encontrar una solución inicial usando el vecino más cercano
        this.bestSolution = this.findInitialSolution();
        console.log(`Solución inicial encontrada: ${this.bestSolution.totalCost}`);

        const openSet = new PriorityQueue((a, b) => b.f - a.f);
        
        const startState = {
            currentNode: this.startNode,
            visited: [...this.initialVisited],
            path: [this.startNode],
            g: 0,
            h: this.calculateMSTHeuristic(this.startNode, this.initialVisited),
            f: 0
        };
        startState.f = startState.g + startState.h;

        openSet.enq(startState);
        let nodesExplored = 0;
        let lastProgressUpdate = Date.now();

        while (!openSet.isEmpty()) {
            const currentTime = Date.now();
            if (currentTime - this.startTime > this.timeLimit) {
                console.log(`Tiempo límite alcanzado. Nodos explorados: ${nodesExplored}`);
                console.log(`Mejor solución encontrada: ${this.bestSolution.totalCost}`);
                return this.bestSolution;
            }

            // Actualizar progreso cada segundo
            if (currentTime - lastProgressUpdate > 1000) {
                console.log(`Progreso: ${nodesExplored} nodos explorados, mejor solución: ${this.bestSolution.totalCost}`);
                lastProgressUpdate = currentTime;
            }

            const state = openSet.deq();
            nodesExplored++;

            // Verificar si hemos visitado todos los nodos
            if (this.countVisited(state.visited) === this.totalNodes) {
                const returnCost = this.getDistance(state.currentNode, this.startNode);
                const totalCost = state.g + returnCost;
                const totalPath = [...state.path, this.startNode];

                if (!this.bestSolution || totalCost < this.bestSolution.totalCost) {
                    this.updateBestSolution({
                        path: totalPath,
                        totalCost: totalCost
                    });
                }
                continue;
            }

            // Podar ramas no prometedoras
            if (this.bestSolution && state.f >= this.bestSolution.totalCost * 1.1) {
                continue;
            }

            // Explorar vecinos no visitados
            for (let neighbor = 0; neighbor < this.totalNodes; neighbor++) {
                if (!state.visited[neighbor]) {
                    const newVisited = [...state.visited];
                    newVisited[neighbor] = true;
                    
                    const gCost = state.g + this.getDistance(state.currentNode, neighbor);

                    if (this.bestSolution && gCost >= this.bestSolution.totalCost) {
                        continue;
                    }

                    const hCost = this.calculateMSTHeuristic(neighbor, newVisited);
                    const fCost = gCost + hCost;

                    if (this.bestSolution && fCost >= this.bestSolution.totalCost) {
                        continue;
                    }

                    openSet.enq({
                        currentNode: neighbor,
                        visited: newVisited,
                        path: [...state.path, neighbor],
                        g: gCost,
                        h: hCost,
                        f: fCost
                    });
                }
            }

            // Liberar memoria periódicamente
            if (nodesExplored % 10000 === 0) {
                if (this.memoizedHeuristics.size > 1000000) {
                    this.memoizedHeuristics.clear();
                }
            }
        }

        return this.bestSolution;
    }
}

// function solve_tspAStar(coords) {
//     console.log('Iniciando TSP con A* y heurística MST mejorada');
//     console.log(`Número de ciudades: ${coords.length}`);
//     const startTime = Date.now();
    
//     const solver = new TSP_Solver_AStar(coords);
//     const solution = solver.solve();
    
//     const endTime = Date.now();
//     const timeElapsed = (endTime - startTime) / 1000;
    
//     console.log('\nResultados finales:');
//     console.log(`Costo total: ${solution.totalCost}`);
//     console.log(`Tiempo total: ${timeElapsed} segundos`);
//     console.log(`Ruta: ${solution.path.join(' -> ')}`);
    
//     return solution;
// }

export function solve_tspMST(coords) {
    console.log('Iniciando TSP con A* y heurística MST mejorada');
    console.log(`Número de ciudades: ${coords.length}`);
    const startTime = Date.now();
    const solver = new TSP_Solver_AStar(coords);
    const solution = solver.solve();
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime).toFixed(2);
    console.log('\nResultados finales:');
    console.log(`Costo total: ${solution.totalCost}`);
    console.log(`Tiempo total: ${elapsedTime} ms`);
    console.log(`Ruta: ${solution.path.join(' -> ')}`);
    return solution;
}