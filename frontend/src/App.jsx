import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import Recover from './pages/Login/Recover';
import Restore from './pages/Login/Restore';
import PerfilVendedor from './pages/Profile/PerfilVendedor';
import Orders from './pages/Profile/Orders';
import Mensajes from './pages/Profile/Mensajes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/restore" element={<Restore />} />
        <Route path="/profile" element={<PerfilVendedor />} />
        <Route path="/PerfilVendedor" element={<PerfilVendedor />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/messages" element={<Mensajes />} />
      </Routes>
    </Router>
  );
}

export default App;