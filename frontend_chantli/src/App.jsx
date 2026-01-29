import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import CreateProperty from './components/CreateProperty';
import PropertyDetail from './components/PropertyDetail';
import Register from './components/Register';
import Profile from './components/Profile';
import HostDashboard from './components/HostDashboard';
import Notifications from './components/Notificactions';
import Chat from './components/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/create" element={<CreateProperty />} />
        <Route path="/propiedad/:id" element={<PropertyDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/chat/:userId" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;