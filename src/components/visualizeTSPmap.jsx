import React, { useEffect, useRef } from "react";

function VisualizeTSPmap({ cities }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Define scaling factors to fit cities within the canvas
        const padding = 20;
        const maxX = Math.max(...Object.values(cities).map(city => city.x));
        const maxY = Math.max(...Object.values(cities).map(city => city.y));
        const scaleX = (canvas.width - padding * 2) / maxX;
        const scaleY = (canvas.height - padding * 2) / maxY;
        
        // Draw each city as a circle on the canvas
        Object.values(cities).forEach(city => {
            const x = city.x * scaleX + padding;
            const y = city.y * scaleY + padding;
            
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2); // Radius 5 for each city
            context.fillStyle = "blue";
            context.fill();
            context.stroke();
        });
    }, [cities]);

    return (
        <div id="map" style={{ height: '100%', width: '50%' }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: ".2vh solid black", width: '100%', height: '100%' }}
            />
        </div>
    );
}

export default VisualizeTSPmap;
