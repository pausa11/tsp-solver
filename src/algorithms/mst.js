const math = require('mathjs');
const { Graph } = require('graphlib');
const PriorityQueue = require('priorityqueuejs');

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

function solve_tspAStar(coords) {
    console.log('Iniciando TSP con A* y heurística MST mejorada');
    console.log(`Número de ciudades: ${coords.length}`);
    const startTime = Date.now();
    
    const solver = new TSP_Solver_AStar(coords);
    const solution = solver.solve();
    
    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000;
    
    console.log('\nResultados finales:');
    console.log(`Costo total: ${solution.totalCost}`);
    console.log(`Tiempo total: ${timeElapsed} segundos`);
    console.log(`Ruta: ${solution.path.join(' -> ')}`);
    
    return solution;
}

// Ejemplo de uso con más ciudades
const coords = [

    // { x: 38.24, y: 20.42 },
    // { x: 39.57, y: 26.15 },
    // { x: 40.56, y: 25.32 },
    // { x: 36.26, y: 23.12 },
    // { x: 33.48, y: 10.54 },
    // { x: 37.56, y: 12.19 },
    // { x: 38.42, y: 13.11 },
    // { x: 37.52, y: 20.44 },
    // { x: 41.23, y: 9.10 },
    // { x: 41.17, y: 13.05 },
    // { x: 36.08, y: -5.21 },
    // { x: 38.47, y: 15.13 },
    // { x: 38.15, y: 15.35 },
    // { x: 37.51, y: 15.17 },
    // { x: 35.49, y: 14.32 },

    { x: 6734, y: 1453 },
    { x: 2233, y: 10 },
    { x: 5530, y: 1424 },
    { x: 401, y: 841 },
    { x: 3082, y: 1644 },
    { x: 7608, y: 4458 },
    { x: 7573, y: 3716 },
    { x: 7265, y: 1268 },
    { x: 6898, y: 1885 },
    { x: 1112, y: 2049 },
    { x: 5468, y: 2606 },
    { x: 5989, y: 2873 },
    { x: 4706, y: 2674 },
    { x: 4612, y: 2035 },
    { x: 6347, y: 2683 },
    { x: 6107, y: 669 },
    { x: 7611, y: 5184 },
    { x: 7462, y: 3590 },
    { x: 7732, y: 4723 },
    { x: 5900, y: 3561 },
    { x: 4483, y: 3369 },
    { x: 6101, y: 1110 },
    { x: 5199, y: 2182 },
    { x: 1633, y: 2809 },
    { x: 4307, y: 2322 },
    { x: 675, y: 1006 },
    { x: 7555, y: 4819 },
    { x: 7541, y: 3981 },
    { x: 3177, y: 756 },
    { x: 7352, y: 4506 },
    { x: 7545, y: 2801 },
    { x: 3245, y: 3305 },
    { x: 6426, y: 3173 },
    { x: 4608, y: 1198 },
    { x: 23, y: 2216 },
    { x: 7248, y: 3779 },
    { x: 7762, y: 4595 },
    { x: 7392, y: 2244 },
    { x: 3484, y: 2829 },
    { x: 6271, y: 2135 },
    { x: 4985, y: 140 },
    { x: 1916, y: 1569 },
    { x: 7280, y: 4899 },
    { x: 7509, y: 3239 },
    { x: 10, y: 2676 },
    { x: 6807, y: 2993 },
    { x: 5185, y: 3258 },
    { x: 3023, y: 1942 }
];

console.log(solve_tspAStar(coords));