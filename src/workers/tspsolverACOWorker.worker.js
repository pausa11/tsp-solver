/* eslint-disable no-restricted-globals */
import * as math from 'mathjs';
import { Graph } from 'graphlib';
import PriorityQueue from 'priorityqueuejs';

class AntColony {
    constructor(distanceMatrix, numAnts = 100, iterations = 50, evaporationRate = 0.2, alpha = 1, beta = 3) {
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
        let bestIterationTour = null;

        // Para cada hormiga
        for (let ant = 0; ant < this.numAnts; ant++) {
            const tour = this.constructSolution(startCity, visitedNodes);
            const tourLength = this.calculateTourLength(tour);

            if (tourLength < bestIterationLength) {
                bestIterationLength = tourLength;
                bestIterationTour = [...tour];
            }

            if (tourLength < this.bestTourLength) {
                this.bestTourLength = tourLength;
                this.bestTour = [...tour];
            }
        }

        this.updatePheromones(bestIterationTour, bestIterationLength);
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
        this.antColony = new AntColony(this.distanceMatrix);
        
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

    visitedToString(visited, currentNode) {
        return `${currentNode}-${visited.join('')}`;
    }

    getVisitedNodes(visited) {
        return visited.reduce((acc, v, i) => {
            if (v) acc.push(i);
            return acc;
        }, []);
    }

    calculateACOHeuristic(currentNode, visited) {
        const memoKey = this.visitedToString(visited, currentNode);
        const cached = this.memoizedHeuristics.get(memoKey);
        if (cached !== undefined) {
            return cached;
        }

        const visitedNodes = this.getVisitedNodes(visited);
        const heuristicValue = this.antColony.runIteration(currentNode, visitedNodes);
        
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
            h: this.calculateACOHeuristic(this.startNode, this.initialVisited),
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

            if (currentTime - lastProgressUpdate > 1000) {
                console.log(`Progreso: ${nodesExplored} nodos explorados, mejor solución: ${this.bestSolution.totalCost}`);
                lastProgressUpdate = currentTime;
            }

            const state = openSet.deq();
            nodesExplored++;

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

            if (this.bestSolution && state.f >= this.bestSolution.totalCost * 1.1) {
                continue;
            }

            for (let neighbor = 0; neighbor < this.totalNodes; neighbor++) {
                if (!state.visited[neighbor]) {
                    const newVisited = [...state.visited];
                    newVisited[neighbor] = true;
                    
                    const gCost = state.g + this.getDistance(state.currentNode, neighbor);

                    if (this.bestSolution && gCost >= this.bestSolution.totalCost) {
                        continue;
                    }

                    const hCost = this.calculateACOHeuristic(neighbor, newVisited);
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

            if (nodesExplored % 10000 === 0) {
                if (this.memoizedHeuristics.size > 1000000) {
                    this.memoizedHeuristics.clear();
                }
            }
        }

        return this.bestSolution;
    }
}

// function solve_tspACO(coords) {
//   console.log('Iniciando TSP con A* y heurística ACO');
//   console.log(`Número de ciudades: ${coords.length}`);
//   const startTime = Date.now();
//   const solver = new TSP_Solver_AStar(coords);
//   const solution = solver.solve();
//   const endTime = Date.now();
//   const timeElapsed = (endTime - startTime) / 1000;
//   console.log('\nResultados finales:');
//   console.log(`Costo total: ${solution.totalCost}`);
//   console.log(`Tiempo total: ${timeElapsed} segundos`);
//   console.log(`Ruta: ${solution.path.join(' -> ')}`);
//   return solution;
// }   

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'solve') {
        try {
            console.log('Worker: Starting TSP solution');
            const solver = new TSP_Solver_AStar(data);
            const solution = solver.solve();
            
            // Enviar actualizaciones de progreso
            const progressUpdate = {
                type: 'progress',
                data: {
                    nodesExplored: solver.nodesExplored,
                    currentBest: solver.bestSolution?.totalCost
                }
            };
            self.postMessage(progressUpdate);
            
            // Enviar la solución final
            self.postMessage({
                type: 'solution',
                data: solution
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: error.message
            });
        }
    }
};