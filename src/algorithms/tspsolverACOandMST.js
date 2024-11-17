import * as math from 'mathjs';
import numeric from 'numeric';

class AntColonyOptimizer {
  constructor(
    locations,
    numAnts = 50,
    numIterations = 200,
    alpha = 1.0,
    beta = 5.0,
    evaporationRate = 0.3,
    pheromoneDeposit = 100
  ) {
    this.locations = locations;
    this.numAnts = numAnts;
    this.numIterations = numIterations;
    this.alpha = alpha; // Importancia de feromonas
    this.beta = beta;   // Importancia de la distancia
    this.evaporationRate = evaporationRate;
    this.pheromoneDeposit = pheromoneDeposit;
    this.numLocations = locations.length;
    this.distances = distanceMatrix(locations, locations);
    this.pheromoneMatrix = numeric.rep([this.numLocations, this.numLocations], 1); // Inicialmente se colocan feromonas de igual nivel en cada camino
  }

  _nearestNeighborSolution(startNode = 0) {
    const path = [startNode];
    const visited = new Set(path);
    let currentNode = startNode;

    while (visited.size < this.numLocations) {
      const neighbors = this.distances[currentNode]
        .map((dist, idx) => ({ idx, dist }))
        .filter(nbr => !visited.has(nbr.idx));

      if (neighbors.length === 0) break;

      const nextNode = neighbors.reduce((a, b) => (a.dist < b.dist ? a : b)).idx;
      visited.add(nextNode);
      path.push(nextNode);
      currentNode = nextNode;
    }

    return path;
  }

  _initializeAnts() {
    const ants = [];
    for (let i = 0; i < this.numAnts; i++) {
      // Generar una solución inicial usando la heurística del vecino más cercano
      const startNode = Math.floor(Math.random() * this.numLocations);
      const nnPath = this._nearestNeighborSolution(startNode);
      ants.push({ currentLocation: startNode, path: nnPath, visited: new Set(nnPath) });
    }
    return ants;
  }

  _selectNextLocation(currentLocation, visited) {
    const pheromones = this.pheromoneMatrix[currentLocation];
    const distances = this.distances[currentLocation];
    const probabilities = [];

    let sum = 0;
    for (let i = 0; i < this.numLocations; i++) {
      if (!visited.has(i)) {
        const pheromone = Math.pow(pheromones[i], this.alpha);
        const heuristic = Math.pow(1.0 / distances[i], this.beta);
        const probability = pheromone * heuristic;
        probabilities[i] = probability;
        sum += probability;
      } else {
        probabilities[i] = 0;
      }
    }

    if (sum === 0) {
      // Si todas las probabilidades son cero, seleccionamos un nodo no visitado aleatoriamente
      const unvisited = [...Array(this.numLocations).keys()].filter(i => !visited.has(i));
      return unvisited[Math.floor(Math.random() * unvisited.length)];
    } else {
      // Seleccionar el próximo nodo basado en las probabilidades
      const r = Math.random() * sum;
      let cumulative = 0;
      for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        if (r <= cumulative) {
          return i;
        }
      }
    }
    // Fallback
    return 0;
  }

  _evaluateSolution(path) {
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalCost += this.distances[path[i]][path[i + 1]];
    }
    // Añadir el regreso al punto inicial
    totalCost += this.distances[path[path.length - 1]][path[0]];
    return totalCost;
  }

  _updatePheromones(allPaths, allCosts) {
    // Evaporación de feromonas
    for (let i = 0; i < this.numLocations; i++) {
      for (let j = 0; j < this.numLocations; j++) {
        this.pheromoneMatrix[i][j] *= (1 - this.evaporationRate);
        if (this.pheromoneMatrix[i][j] < 1e-6) {
          this.pheromoneMatrix[i][j] = 1e-6; // Evitar valores demasiado bajos
        }
      }
    }

    // Depósito de feromonas
    for (let k = 0; k < allPaths.length; k++) {
      const path = allPaths[k];
      const cost = allCosts[k];
      const pheromoneIncrease = this.pheromoneDeposit / cost;
      for (let i = 0; i < path.length - 1; i++) {
        this.pheromoneMatrix[path[i]][path[i + 1]] += pheromoneIncrease;
        this.pheromoneMatrix[path[i + 1]][path[i]] += pheromoneIncrease;
      }
      // Añadir feromonas para el regreso al inicio
      this.pheromoneMatrix[path[path.length - 1]][path[0]] += pheromoneIncrease;
      this.pheromoneMatrix[path[0]][path[path.length - 1]] += pheromoneIncrease;
    }
  }

  solve() {
    let bestPath = null;
    let bestCost = Infinity;

    for (let iteration = 0; iteration < this.numIterations; iteration++) {
      const allPaths = [];
      const allCosts = [];

      const ants = this._initializeAnts();

      for (const ant of ants) {
        let { currentLocation, path, visited } = ant;

        // Construcción de la solución
        while (visited.size < this.numLocations) {
          const nextLocation = this._selectNextLocation(currentLocation, visited);
          path.push(nextLocation);
          visited.add(nextLocation);
          currentLocation = nextLocation;
        }

        const cost = this._evaluateSolution(path);
        allPaths.push(path);
        allCosts.push(cost);

        if (cost < bestCost) {
          bestCost = cost;
          bestPath = path.slice();
        }
      }

      this._updatePheromones(allPaths, allCosts);

      console.log(`Iteración ${iteration + 1}/${this.numIterations}, Mejor costo encontrado: ${bestCost.toFixed(2)}`);
    }

    return { path: bestPath, totalCost: bestCost };
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

export function solve_tspACO_MST(coords) {
  console.log('Resolviendo TSP usando Ant Colony Optimization con heurística de vecino más cercano');
  const startTime = Date.now();
  const solver = new AntColonyOptimizer(coords);
  const solution = solver.solve();
  console.log(solution);
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime).toFixed(2);
  console.log(`TSP resuelto en ${elapsedTime}ms`, solution);
  return solution;
}
