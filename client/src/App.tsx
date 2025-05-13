import React from 'react';
import { BlockchainProvider } from './context/BlockchainContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <BlockchainProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Dashboard />
        </main>
        <footer className="bg-white p-4 shadow-inner mt-10">
          <div className="container mx-auto text-center text-gray-500">
            <p>DAO Treasury - Blockchain Final Project</p>
          </div>
        </footer>
      </div>
    </BlockchainProvider>
  );
}

export default App;
