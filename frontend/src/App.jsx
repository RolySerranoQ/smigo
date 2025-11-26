import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { AuthProvider } from './context/AuthContext'; // Importamos el contexto
import Navbar from './components/Navbar'; // Barra de navegación
import Footer from './components/Footer'; // Pie de página
import ProtectedRoute from './components/ProtectedRoute'; // Ruta protegida
import Home from './pages/Home'; // Página de inicio
import Behavior from './pages/Behavior'; // Monitor de comportamiento
import Login from './pages/Login'; // Página de login
import Stress from './pages/Stress'; // Página de estrés térmico
import Test from './pages/Test'; // Página de test



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="min-h-screen flex flex-col bg-smigo-cream font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/parto" element={<ProtectedRoute><Behavior /></ProtectedRoute>} />
            <Route path="/estres" element={<ProtectedRoute><Stress /></ProtectedRoute>} />
            <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
