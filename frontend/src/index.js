import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then(() => navigator.serviceWorker.ready)
			.then(() => {
				const reloaded = sessionStorage.getItem('sw-controlled-reload');
				if (!navigator.serviceWorker.controller && !reloaded) {
					sessionStorage.setItem('sw-controlled-reload', '1');
					window.location.reload();
				}
			})
			.catch((error) => {
				console.error('Service worker registration failed:', error);
			});
	});
}
