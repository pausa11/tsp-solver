import React, { useState, useRef, useEffect } from 'react';
import VisualizeTSPmap from './components/visualizeTSPmap';
import LoaderSpinner from './components/loaderSpinner';
import './App.css';

function App() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [heuristicType, setHeuristicType] = useState(null);
  const [cities, setCities] = useState([]);
  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const mstWorkerRef = useRef(null);
  const acoWorkerRef = useRef(null);
  const mstAndAcoWorkerRef = useRef(null);
  //eslint-disable-next-line
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    // Inicializar el Worker de MST
    mstWorkerRef.current = new Worker(new URL('./workers/tspsolverMSTWorker.worker.js', import.meta.url), { type: 'module' });

    // Configurar el manejador de mensajes para el Worker de MST
    mstWorkerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'solution':
          setSolution(data);
          setIsLoading(false);
          setProgress(null);
          break;
          
        case 'progress':
          setProgress(data);
          break;
          
        case 'error':
          console.error('Error en el Worker MST:', data);
          setIsLoading(false);
          alert(`Error al resolver TSP con MST: ${data}`);
          break;
          
        default:
          console.warn('Mensaje no reconocido del Worker MST:', type);
      }
    };

    // Inicializar el Worker de ACO
    acoWorkerRef.current = new Worker(new URL('./workers/tspsolverACOWorker.worker.js', import.meta.url), { type: 'module' });

    // Configurar el manejador de mensajes para el Worker de ACO
    acoWorkerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'solution':
          setSolution(data);
          setIsLoading(false);
          setProgress(null);
          break;
          
        case 'progress':
          setProgress(data);
          break;
          
        case 'error':
          console.error('Error en el Worker ACO:', data);
          setIsLoading(false);
          alert(`Error al resolver TSP con ACO: ${data}`);
          break;
          
        default:
          console.warn('Mensaje no reconocido del Worker ACO:', type);
      }
    };

    mstAndAcoWorkerRef.current = new Worker(new URL('./workers/tspsolverAcoAndMstWorker.worker.js', import.meta.url), { type: 'module' });

    // Configurar el manejador de mensajes para el Worker de ACO con MST
    mstAndAcoWorkerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'solution':
          setSolution(data);
          setIsLoading(false);
          setProgress(null);
          break;
          
        case 'progress':
          setProgress(data);
          break;
          
        case 'error':
          console.error('Error en el Worker ACO con MST:', data);
          setIsLoading(false);
          alert(`Error al resolver TSP con ACO con MST: ${data}`);
          break;
          
        default:
          console.warn('Mensaje no reconocido del Worker ACO con MST:', type);
      }
    };

    // Manejar errores de los Workers
    const handleWorkerError = (error, workerType) => {
      console.error(`Error en el Worker ${workerType}:`, error);
      setIsLoading(false);
      alert(`Error en el Worker ${workerType}: ${error.message}`);
    };

    mstWorkerRef.current.onerror = (error) => handleWorkerError(error, 'MST');
    acoWorkerRef.current.onerror = (error) => handleWorkerError(error, 'ACO');
    mstAndAcoWorkerRef.current.onerror = (error) => handleWorkerError(error, 'ACO con MST');

    // Limpiar los Workers cuando el componente se desmonte
    return () => {
      if (mstWorkerRef.current) {
        mstWorkerRef.current.terminate();
        console.log('Worker MST terminado');
      }
      if (acoWorkerRef.current) {
        acoWorkerRef.current.terminate();
        console.log('Worker ACO terminado');
      }
      if (mstAndAcoWorkerRef.current) {
        mstAndAcoWorkerRef.current.terminate();
        console.log('Worker ACO con MST terminado');
      }
    };
  }, []);

  useEffect(() => {
    if (isFileUploaded || heuristicType || solution) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isFileUploaded, heuristicType, solution]);

  const handleUpload = () => {
    const file = fileInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsedCities = parseCities(e.target.result);
        setCities(parsedCities);
        setIsFileUploaded(true);
        alert('File uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const handleExampleUpload = async (filePath) => {
    setIsLoading(true);
    try {
      const response = await fetch(filePath);
      const text = await response.text();
      const parsedCities = parseCities(text);
      setCities(parsedCities);
      setIsFileUploaded(true);
      alert('Example file loaded successfully');
    } catch (error) {
      console.error("Error loading example file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCities = (fileContent) => {
    const lines = fileContent.split('\n');
    return lines
      .slice(lines.findIndex(line => line.includes('NODE_COORD_SECTION')) + 1)
      .filter(line => line && !line.includes('EOF'))
      .map(line => {
        const [, x, y] = line.trim().split(/\s+/);
        return { x: parseFloat(x), y: parseFloat(y) };
      });
  };

  const handleSolveTSP = () => {
    setIsLoading(true);
    setSolution(null); // Limpiar solución anterior
    setProgress(null); // Limpiar progreso anterior
    if (heuristicType === 'mst' && cities.length > 0) {
      setIsLoading(true);
      mstWorkerRef.current.postMessage({
        type: 'solve',
        data: cities
      });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    else if (heuristicType === 'aco' && cities.length > 0) {
      setIsLoading(true);
      acoWorkerRef.current.postMessage({
        type: 'solve',
        data: cities
      });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    else if (heuristicType === 'aco_mst' && cities.length > 0) {
      setIsLoading(true);
      mstAndAcoWorkerRef.current.postMessage({
        type: 'solve',
        data: cities
      });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    else {
      alert('Please select a heuristic type');
    }
  };

  const tspExamples = [
    { name: 'att48.tsp', filePath: './tspProblems/att48.tsp' },
    { name: 'ulysses16.tsp', filePath: './tspProblems/ulysses16.tsp' },
    { name: 'a280.tsp', filePath: './tspProblems/a280.tsp' }
  ];

  return (
    <div id="app" style={{ textAlign: 'center', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto'}}>
      
        <div id='title' style={{width:'90%'}}>
          <h1>Traveling Salesman Problem</h1>
          <p>The Traveling Salesman Problem (TSP) requires a salesman to visit all cities exactly once and return to the starting city with minimal cost. We use the A* algorithm with two heuristic types: Minimum Spanning Tree (MST) and Ant Colony Optimization (ACO).</p>
        </div>

        <div id="upload-section">
          <h2>Upload a TSP File</h2>
          <p>you can download tsp files from <a href="https://github.com/mastqe/tsplib/tree/master" target="_blank" rel="noreferrer">TSPLIB</a></p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',flexDirection:'column',gap:'2vh' }}>
            <input type="file" ref={fileInputRef} accept=".tsp" />
            <button onClick={handleUpload} style={{ marginLeft: '1vh' }}>Upload</button>
          </div>

        </div>

        <div id="examples-section">
          <h2>or use Examples</h2>
          {tspExamples.map(example => (
            <button key={example.name} onClick={() => handleExampleUpload(example.filePath)} style={{ margin: '1vh' }}>
              {example.name}
            </button>
          ))}
        </div>

        {isFileUploaded && (
          <div id='file-operations' style={{ width: '95%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center' }}>
            
            <div id="map-container" style={{ width: '95%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
              <VisualizeTSPmap cities={cities} />
            </div>

            <div id='heuristic-seletion' style={{ margin: '5vh' }}>
              <h2>Choose a Heuristic Type</h2>
              <button onClick={() => setHeuristicType('mst')} style={{ marginRight: '1vh' }}>MST</button>
              <button onClick={() => setHeuristicType('aco')} style={{ marginLeft: '1vh' }}>ACO</button>
              <button onClick={() => setHeuristicType('aco_mst')} style={{ marginLeft: '1vh' }}>ACO with MST</button>
            </div>

            {heuristicType && (
              <div id='heuristic' style={{ margin: '5vh' }}>
                <p>Heuristic Type: {heuristicType}</p>
                <button onClick={handleSolveTSP} >Solve TSP</button>
              </div>
            )}

            {isLoading && <LoaderSpinner />}

            {solution && !isLoading && (
              <div id='solution' style={{ padding: '3%', width:'95%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center' }}>
                <h3>Solution</h3>
                <div>
                  <p>Best Path: {solution.path.join(' -> ')}</p>
                </div>
                <p>Cost: {solution.totalCost}</p>
                <div id="map-solution-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <VisualizeTSPmap cities={cities} solution={solution.path} />
                </div>
              </div>
            )}
          </div>)
        }
        <div ref={bottomRef} />
    </div>
  );
}

export default App;
