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

class AntColony {
    constructor(distanceMatrix, numAnts = 10, iterations = 5, evaporationRate = 0.1, alpha = 1, beta = 2) {
        this.distanceMatrix = distanceMatrix;
        this.numCities = distanceMatrix.length;
        this.numAnts = numAnts;
        this.iterations = iterations;
        this.evaporationRate = evaporationRate;
        this.alpha = alpha;
        this.beta = beta;
        this.pheromoneMatrix = Array(this.numCities).fill().map(() => 
            Array(this.numCities).fill(1.0 / this.numCities)
        );
        this.bestTourLength = Infinity;
        this.bestTour = null;
    }

    runIteration(startCity, visitedNodes) {
        let bestIterationLength = Infinity;

        for (let ant = 0; ant < this.numAnts; ant++) {
            const tour = this.constructSolution(startCity, visitedNodes);
            const tourLength = this.calculateTourLength(tour);

            if (tourLength < bestIterationLength) {
                bestIterationLength = tourLength;
            }

            if (tourLength < this.bestTourLength) {
                this.bestTourLength = tourLength;
                this.bestTour = [...tour];
            }
        }

        this.updatePheromones(this.bestTour, this.bestTourLength);
        return bestIterationLength;
    }

    constructSolution(startCity, visitedNodes) {
        const available = new Array(this.numCities).fill(true);
        visitedNodes.forEach(node => available[node] = false);
        
        const tour = [startCity];
        let currentCity = startCity;

        while (tour.length < this.numCities - visitedNodes.length + 1) {
            const nextCity = this.selectNextCity(currentCity, available);
            tour.push(nextCity);
            available[nextCity] = false;
            currentCity = nextCity;
        }

        return tour;
    }

    selectNextCity(currentCity, available) {
        const probabilities = [];
        let totalProbability = 0;

        for (let city = 0; city < this.numCities; city++) {
            if (available[city]) {
                const pheromone = Math.pow(this.pheromoneMatrix[currentCity][city], this.alpha);
                const distance = 1.0 / Math.pow(this.distanceMatrix[currentCity][city], this.beta);
                const probability = pheromone * distance;
                probabilities.push({ city, probability });
                totalProbability += probability;
            }
        }

        let random = Math.random() * totalProbability;
        let sum = 0;

        for (const { city, probability } of probabilities) {
            sum += probability;
            if (random <= sum) {
                return city;
            }
        }

        return probabilities[probabilities.length - 1].city;
    }

    calculateTourLength(tour) {
        let length = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            length += this.distanceMatrix[tour[i]][tour[i + 1]];
        }
        return length;
    }

    updatePheromones(tour, tourLength) {
        // Evaporación
        for (let i = 0; i < this.numCities; i++) {
            for (let j = 0; j < this.numCities; j++) {
                this.pheromoneMatrix[i][j] *= (1 - this.evaporationRate);
            }
        }

        // Depósito de feromonas
        const pheromoneDeposit = 1.0 / tourLength;
        for (let i = 0; i < tour.length - 1; i++) {
            const from = tour[i];
            const to = tour[i + 1];
            this.pheromoneMatrix[from][to] += pheromoneDeposit;
            this.pheromoneMatrix[to][from] += pheromoneDeposit;
        }
    }
}

class HybridHeuristic {
    constructor(distanceMatrix) {
        this.distanceMatrix = distanceMatrix;
        this.numCities = distanceMatrix.length;
        this.antColony = new AntColony(distanceMatrix);
        this.weightMST = 0.6;  // Peso para MST
        this.weightACO = 0.4;  // Peso para ACO
    }

    calculateMSTCost(unvisitedNodes) {
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
                    weight: this.distanceMatrix[node1][node2]
                });
            }
        }

        edges.sort((a, b) => a.weight - b.weight);
        const ds = new DisjointSet(this.numCities);
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

    calculateACOCost(currentNode, visitedNodes) {
        return this.antColony.runIteration(currentNode, visitedNodes);
    }

    getMinUnvisitedDistance(currentNode, unvisitedNodes) {
        let minDistance = Infinity;
        for (const node of unvisitedNodes) {
            const dist = this.distanceMatrix[currentNode][node];
            if (dist < minDistance) {
                minDistance = dist;
            }
        }
        return minDistance;
    }

    calculateHybridHeuristic(currentNode, visited) {
        const visitedNodes = visited.reduce((acc, v, i) => {
            if (v) acc.push(i);
            return acc;
        }, []);
        
        const unvisitedNodes = visited.reduce((acc, v, i) => {
            if (!v) acc.push(i);
            return acc;
        }, []);

        if (unvisitedNodes.length === 0) return 0;

        // Calcular MST
        const mstCost = this.calculateMSTCost(unvisitedNodes);
        const minToUnvisited = this.getMinUnvisitedDistance(currentNode, unvisitedNodes);
        const mstHeuristic = mstCost + minToUnvisited;

        // Calcular ACO
        const acoCost = this.calculateACOCost(currentNode, visitedNodes);

        // Combinar heurísticas
        return (this.weightMST * mstHeuristic + this.weightACO * acoCost);
    }

    // Método para ajustar los pesos dinámicamente basado en el rendimiento
    adjustWeights(mstSuccess, acoSuccess) {
        const adaptationRate = 0.1;
        if (mstSuccess && !acoSuccess) {
            this.weightMST = Math.min(0.8, this.weightMST + adaptationRate);
            this.weightACO = 1 - this.weightMST;
        } else if (!mstSuccess && acoSuccess) {
            this.weightACO = Math.min(0.8, this.weightACO + adaptationRate);
            this.weightMST = 1 - this.weightACO;
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
        this.timeLimit = 99000;
        this.startTime = Date.now();
        this.bestSolution = null;
        this.lastUpdate = Date.now();
        this.distanceMatrix = this.createDistanceMatrix();
        this.hybridHeuristic = new HybridHeuristic(this.distanceMatrix);
        
        this.initialVisited = new Array(this.totalNodes).fill(false);
        this.initialVisited[this.startNode] = true;

        // Para el seguimiento del rendimiento de las heurísticas
        this.mstSuccesses = 0;
        this.acoSuccesses = 0;
        this.totalAttempts = 0;
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

    visitedToString(visited, currentNode) {
        return `${currentNode}-${visited.join('')}`;
    }

    calculateHeuristic(currentNode, visited) {
        const memoKey = this.visitedToString(visited, currentNode);
        const cached = this.memoizedHeuristics.get(memoKey);
        if (cached !== undefined) {
            return cached;
        }

        const heuristicValue = this.hybridHeuristic.calculateHybridHeuristic(currentNode, visited);
        this.memoizedHeuristics.set(memoKey, heuristicValue);
        
        this.totalAttempts++;
        if (this.totalAttempts % 100 === 0) {
            this.hybridHeuristic.adjustWeights(
                this.mstSuccesses / this.totalAttempts > 0.5,
                this.acoSuccesses / this.totalAttempts > 0.5
            );
        }

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
            console.log(`Pesos actuales - MST: ${this.hybridHeuristic.weightMST.toFixed(2)}, ACO: ${this.hybridHeuristic.weightACO.toFixed(2)}`);
        }
    }

    findInitialSolution() {
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
        
        totalCost += this.getDistance(currentNode, this.startNode);
        path.push(this.startNode);
        
        return {
            path: path,
            totalCost: totalCost
        };
    }

    solve() {
        this.bestSolution = this.findInitialSolution();
        console.log(`Solución inicial encontrada: ${this.bestSolution.totalCost}`);

        const openSet = new PriorityQueue((a, b) => b.f - a.f);
        
        const startState = {
            currentNode: this.startNode,
            visited: [...this.initialVisited],
            path: [this.startNode],
            g: 0,
            h: this.calculateHeuristic(this.startNode, this.initialVisited),
            f: 0
        };
        startState.f = startState.g + startState.h;

        openSet.enq(startState);
        let nodesExplored = 0;
        let lastProgressUpdate = Date.now();

        while (!openSet.isEmpty()) {
            const currentTime = Date.now();
            if (currentTime - this.startTime > this.timeLimit) {
                console.log("Tiempo límite alcanzado");
                return this.bestSolution;
            }

            if (currentTime - lastProgressUpdate > 5000) {
                console.log(`Nodos explorados: ${nodesExplored}`);
                lastProgressUpdate = currentTime;
            }

            const current = openSet.deq();
            nodesExplored++;

            // Verificar si hemos completado un tour válido
            if (this.countVisited(current.visited) === this.totalNodes) {
                const finalCost = current.g + this.getDistance(current.currentNode, this.startNode);
                const completePath = [...current.path, this.startNode];

                if (!this.bestSolution || finalCost < this.bestSolution.totalCost) {
                    this.updateBestSolution({
                        path: completePath,
                        totalCost: finalCost
                    });
                }
                continue;
            }

            // Explorar vecinos no visitados
            for (let nextNode = 0; nextNode < this.totalNodes; nextNode++) {
                if (current.visited[nextNode]) continue;

                const distance = this.getDistance(current.currentNode, nextNode);
                const newG = current.g + distance;

                // Si ya tenemos una mejor solución, podamos esta rama
                if (this.bestSolution && newG >= this.bestSolution.totalCost) {
                    continue;
                }

                const newVisited = [...current.visited];
                newVisited[nextNode] = true;

                const newH = this.calculateHeuristic(nextNode, newVisited);
                const newF = newG + newH;

                // Crear nuevo estado
                const newState = {
                    currentNode: nextNode,
                    visited: newVisited,
                    path: [...current.path, nextNode],
                    g: newG,
                    h: newH,
                    f: newF
                };

                // Si la estimación total es menor que la mejor solución actual, explora este camino
                if (!this.bestSolution || newF < this.bestSolution.totalCost) {
                    openSet.enq(newState);
                }
            }

            // Limpieza periódica de la memoria caché de heurísticas
            if (nodesExplored % 1000 === 0) {
                this.memoizedHeuristics.clear();
            }
        }

        console.log(`Búsqueda completada. Nodos explorados: ${nodesExplored}`);
        return this.bestSolution;
    }
}

function solveTSP(coords) {
    console.log('Iniciando TSP con A* y heurística ACO');
    console.log(`Número de ciudades: ${coords.length}`);
    const startTime = Date.now();

    const solver = new TSP_Solver_AStar(coords);
    const solution = solver.solve();

    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;

    console.log('\nResultados finales:');
    console.log(`Costo total: ${solution.totalCost}`);
    console.log(`Tiempo total: ${timeElapsed} segundos`);
    console.log(`Ruta: ${solution.path.join(' -> ')}`);
    
    return solution;
}

// Coordenadas de prueba
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
    // { x: 39.36, y: 19.56 }

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

solveTSP(coords);