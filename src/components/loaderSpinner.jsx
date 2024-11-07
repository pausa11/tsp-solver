import React from 'react';
import './loaderSpinner.css';

function LoaderSpinner() {
  return (
    <div className="loader-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

export default LoaderSpinner;
