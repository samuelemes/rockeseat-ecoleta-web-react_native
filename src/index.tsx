import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

/**Solicitando o React renderizar tudo dentro do elemtno root que esta la no index.html */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
