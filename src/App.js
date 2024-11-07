import React, { useState, useRef } from 'react';
import VisualizeTSPmap from './components/visualizeTSPmap';
import LoaderSpinner from './components/loaderSpinner';
import { solve_tsp } from './algorithms/tspsolver';

function App() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [heuristicType, setHeuristicType] = useState(null);
  const [cities, setCities] = useState([]);
  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleUpload = () => {
    const file = fileInputRef.current.files[0];
    if (file) {
      setUploadedFile(file);  
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        const parsedCities = lines
          .slice(lines.findIndex(line => line.includes('NODE_COORD_SECTION')) + 1)
          .filter(line => line && !line.includes('EOF'))
          .map(line => {
            const [, x, y] = line.trim().split(/\s+/);
            return { x: parseFloat(x), y: parseFloat(y) };
          });
        setCities(parsedCities);
        setIsFileUploaded(true);
        alert('File uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const handleExampleUpload = (filePath) => {
    setIsLoading(true);
    fetch(filePath)
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        const parsedCities = lines
          .slice(lines.findIndex(line => line.includes('NODE_COORD_SECTION')) + 1)
          .filter(line => line && !line.includes('EOF'))
          .map(line => {
            const [, x, y] = line.trim().split(/\s+/);
            return { x: parseFloat(x), y: parseFloat(y) };
          });
        setCities(parsedCities);
        setIsFileUploaded(true);
        alert('Example file loaded successfully');
      })
      .catch(error => console.error("Error loading example file:", error))
      .finally(() => setIsLoading(false));
  };

  const handleSolveTSP = () => {
    if (heuristicType === 'mst' && (cities.length > 0 || uploadedFile)) {
      setIsLoading(true);
      const solution = solve_tsp(cities);
      setSolution(solution);
      setIsLoading(false);
    }
  };

  const tspExamples = [
    {
      name: 'att48.tsp',
      filePath: './tspProblems/att48.tsp',
    },
    {
      name: 'ulysses16.tsp',
      filePath: './tspProblems/ulysses16.tsp',
    },
    {
      name:'a280.tsp',
      filePath: './tspProblems/a280.tsp',
    }
  ];

  return (
    <div id="app" style={{ textAlign: 'center', height: '100vh', width: '100vw',display:'flex',flexDirection:'column',alignItems:'center',overflow:'auto' }}>
      
      <h1>Traveling Salesman Problem</h1>
      <p>
        It is a problem in which a salesman has to visit all the cities exactly once and return to the starting city with the minimum cost.
      </p>
      <p>
        For solving this problem we are going to use A* algorithm with 2 heuristic types, ant colony, and minimum tree expansion.
      </p>

      <div id="upload-section">
        <h2>Upload a TSP file</h2>
        <input type="file" ref={fileInputRef} accept=".tsp" />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div id="examples-section">
        <h2>Examples</h2>
        {
          tspExamples.map(example => (
            <button key={example.name} onClick={() => handleExampleUpload(example.filePath)} style={{margin:'2vh'}}>
              {example.name}
            </button>
          ))
        }
      </div>
        
      {
        isFileUploaded && (
          <div style={{width:'100%'}}>
            <div id="map-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
              <VisualizeTSPmap cities={cities} />
            </div>

            <div>
              <h2>Choose a heuristic type</h2>
              <button onClick={() => setHeuristicType('mst')}>MST</button>
              {/* <button onClick={() => setHeuristicType('ant-colony')}>Ant Colony</button> */}
            </div>

            {
              heuristicType && (
                <div>
                  <p>Heuristic type: {heuristicType}</p>
                  <button onClick={handleSolveTSP}>Solve TSP</button>
                </div>
              )
            }

            {
              isLoading && <LoaderSpinner />
            }

            {
              solution && !isLoading && (
                <div style={{width:'100%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
                  <h3>Solution</h3>
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',width:'50%'}}>
                    <p style={{}}>Best path: {solution.path.join(' -> ')}</p>
                  </div>
                  <p>Cost: {solution.totalCost}</p>
                  <div id="map-solution-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
                    <VisualizeTSPmap cities={cities} solution={solution.path} />
                  </div>
                </div>
              )
            }
          </div>
        )
      }
    </div>
  );
}

export default App;
