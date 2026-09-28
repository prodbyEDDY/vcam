import React from 'react';
import {createRoot} from 'react-dom/client';
import CameraApp from '../components/camera-app';
import '../app/globals.css';
import '../app/camera.css';
import '../app/product.css';
createRoot(document.getElementById('root')!).render(<CameraApp/>);
