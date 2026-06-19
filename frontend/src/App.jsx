import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import Recover from './components/Login/Recover';
import Restore from './components/Login/Restore';
import PerfilVendedor from './components/Profile/PerfilVendedor';
import Orders from './components/Profile/Orders';
import Mensajes from './components/Profile/Mensajes';

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