# Traveling Salesman Problem Solver

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)

An interactive web application that solves and visualizes the Traveling Salesman Problem (TSP) using the A* algorithm with Minimum Spanning Tree heuristics.

## 🚀 Features

- **Interactive Visualization**: Real-time display of cities and optimal paths on an interactive map
- **File Support**: Upload and process standard `.tsp` format files
- **Advanced Algorithm**: Implementation of A* search with MST heuristic for efficient pathfinding
- **Performance Optimization**: Efficient handling of problems with hundreds of cities

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/tsp-solver.git
cd tsp-solver
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

## 💡 How It Works

### Algorithm Implementation

The solver uses the A* algorithm enhanced with a Minimum Spanning Tree (MST) heuristic:

1. **MST Heuristic Calculation**
   - Creates a minimal-cost tree connecting all cities using Kruskal's algorithm
   - Provides a lower bound estimate for remaining path costs

2. **A* Search Process**
   - Starts from an initial city
   - Iteratively selects optimal next cities based on combined actual and estimated costs
   - Uses the MST heuristic to guide path selection

### Technical Stack

- **Frontend**: React.js for the user interface
- **Calculations**: `mathjs` library for distance computations
- **Graph Operations**: `graphlib` for efficient graph management

## 📖 Usage Guide

1. **Load Your Data**
   - Upload a `.tsp` file through the interface
   - Or select from provided example problems

2. **Configure Settings**
   - Select the MST heuristic option
   - Adjust any visualization preferences

3. **Solve and Visualize**
   - Click "Solve TSP" to start the algorithm
   - Watch the solution path develop in real-time
   - View final route and total distance

## 📊 Example Problems

The `/public/tspProblems` directory includes sample datasets:

| File | Cities | Description |
|------|---------|-------------|
| `att48.tsp` | 48 | Standard TSPLIB problem |
| `ulysses16.tsp` | 16 | Smaller dataset for testing |
| `a280.tsp` | 280 | Larger challenge problem |

## 🔜 Roadmap

- [ ] Implement Ant Colony Optimization algorithm
- [ ] Add dynamic heuristic selection
- [ ] Develop backend service for larger datasets
- [ ] Add support for custom constraints
- [ ] Implement parallel processing for performance

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

