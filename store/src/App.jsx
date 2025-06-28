import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import Shop from './components/Shop';
import Contact from './components/Contact';
import Cart from './components/Cart';
import Login from './components/Login';
import AdminManageBats from './components/admin/AdminManageBats';
import AdminViewBats from './components/admin/AdminViewBats';
import Order from './components/Order';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app-layout">
        <NavBar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order" element={<Order />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/manage-bats" element={<AdminManageBats />} />
            <Route path="/admin/sold-bats" element={<AdminViewBats />} />
          </Routes>
        </div>
        <Footer />
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        theme="light"
        closeButton={false}
      />
    </Router>
  );
};

export default App;
