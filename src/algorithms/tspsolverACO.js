import * as math from 'mathjs';
import numeric from 'numeric';

class AntColonyOptimizer {
  constructor(locations, numAnts = 10, numIterations = 100, alpha = 1.0, beta = 2.0, evaporationRate = 0.5, pheromoneDeposit = 1.0) {
    this.locations = locations;
    this.numAnts = numAnts;
    this.numIterations = numIterations;
    this.alpha = alpha; // Importancia de feromonas
    this.beta = beta;   // Importancia de la distancia
    this.evaporationRate = evaporationRate;
    this.pheromoneDeposit = pheromoneDeposit;
    this.numLocations = locations.length;
    this.distances = numeric.transpose(distanceMatrix(locations, locations));
    this.pheromoneMatrix = numeric.rep([this.numLocations, this.numLocations], 1); // Inicialmente se colocan feromonas de igual nivel en cada camino
  }

  _initializeAnts() {
    return Array.from({ length: this.numAnts }, () => Math.floor(Math.random() * this.numLocations));
  }

  _selectNextLocation(currentLocation, visited) {
    const pheromones = [...this.pheromoneMatrix[currentLocation]];
    const distances = [...this.distances[currentLocation]];
    const probabilities = Array(this.numLocations).fill(0);

    for (let i = 0; i < this.numLocations; i++) {
      if (!visited.has(i)) {
        probabilities[i] = Math.pow(pheromones[i], this.alpha) * Math.pow(1.0 / distances[i], this.beta);
      }
    }

    const total = probabilities.reduce((sum, value) => sum + value, 0);
    if (total > 0) {
      return this._weightedRandom(probabilities);
    } else {
      const unvisited = [...Array(this.numLocations).keys()].filter(i => !visited.has(i));
      return unvisited[Math.randomInt(0, unvisited.length)];
    }
  }

  _weightedRandom(probabilities) {
    const cumulative = probabilities.reduce((acc, value) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + value);
      return acc;
    }, []);

    const r = Math.random() * cumulative[cumulative.length - 1];
    for (let i = 0; i < cumulative.length; i++) {
      if (r <= cumulative[i]) return i;
    }
    return 0;
  }

  _evaluateSolution(path) {
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalCost += this.distances[path[i]][path[i + 1]];
    }
    return totalCost + this.distances[path[path.length - 1]][path[0]]; // Añadir el regreso al punto inicial
  }

  _updatePheromones(allPaths, allCosts) {
    for (let i = 0; i < this.numLocations; i++) {
      for (let j = 0; j < this.numLocations; j++) {
        this.pheromoneMatrix[i][j] *= (1 - this.evaporationRate);
      }
    }

    for (let k = 0; k < allPaths.length; k++) {
      const path = allPaths[k];
      const cost = allCosts[k];
      const pheromoneIncrease = this.pheromoneDeposit / cost;
      for (let i = 0; i < path.length - 1; i++) {
        this.pheromoneMatrix[path[i]][path[i + 1]] += pheromoneIncrease;
        this.pheromoneMatrix[path[i + 1]][path[i]] += pheromoneIncrease;
      }
      this.pheromoneMatrix[path[path.length - 1]][path[0]] += pheromoneIncrease;
      this.pheromoneMatrix[path[0]][path[path.length - 1]] += pheromoneIncrease;
    }
  }

  solve() {
    let path = null;
    let totalCost = Infinity;

    for (let iteration = 0; iteration < this.numIterations; iteration++) {
      const allPaths = [];
      const allCosts = [];

      for (let ant = 0; ant < this.numAnts; ant++) {
        let currentLocation = Math.floor(Math.random() * this.numLocations);
        const path1 = [currentLocation];
        const visited = new Set([currentLocation]);

        for (let step = 0; step < this.numLocations - 1; step++) {
          const nextLocation = this._selectNextLocation(currentLocation, visited);
          path1.push(nextLocation);
          visited.add(nextLocation);
          currentLocation = nextLocation;
        }

        const cost = this._evaluateSolution(path1);
        allPaths.push(path1);
        allCosts.push(cost);

        if (cost < totalCost) {
          totalCost = cost;
          path = path1;
        }
      }

      this._updatePheromones(allPaths, allCosts);

      console.log(`Iteración ${iteration + 1}/${this.numIterations}, Mejor costo encontrado: ${totalCost}`);
    }

    return { path, totalCost };
  }
}

function distanceMatrix(locations1, locations2) {
  const matrix = [];
  for (const loc1 of locations1) {
    const row = [];
    for (const loc2 of locations2) {
        row.push(math.distance([loc1.x, loc1.y], [loc2.x, loc2.y]));
    }
    matrix.push(row);
  }
  return matrix;
}

export function solve_tspACO(coords) {
    console.log('Solving TSP using Ant Colony Optimization');
    const startTime = Date.now();
    const solver = new AntColonyOptimizer(coords);
    const solution = solver.solve();
    console.log(solution);
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime).toFixed(2);
    console.log(`TSP solved in ${elapsedTime}ms`, solution);
    return solution;
}   