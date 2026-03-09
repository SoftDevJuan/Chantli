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
import Inbox from './components/Inbox';
import PublicProfile from './components/PublicProfile';
import Checkout from './components/Checkout';
import AddCard from './components/AddCard';
import Invoices from './components/Invoices';
import VerificationProfile from './components/VerificationProfile';
import AdminVerifications from './components/AdminVerifications';
import Favorites from './components/Favorites';
import HistorialRentas from './components/HistorialRentas';
import EditProperty from './components/EditProperty';
import GameView from './components/CameView';



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
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/public-profile/:id" element={<PublicProfile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/add-card" element={<AddCard />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/verification" element={<VerificationProfile />} />
        <Route path="/admin-panel" element={<AdminVerifications />} />   
        <Route path="/favorites" element={<Favorites />} />   
        <Route path="/historial-rentas" element={<HistorialRentas />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
        <Route path="/arcade" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );

  
}

const PUBLIC_VAPID_KEY = 'BFNNtkj2cYP6XF7DhCKi637rSmn5orTcWMHiFFZCQQAdNoihC_pgr7Q0Gr2XYi6T1S5h74-AgbcvagVw1C5Qf-o'; // La misma del Paso 1

// Función mágica para convertir la llave al formato que pide el navegador
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};

export const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registration = await navigator.serviceWorker.ready;

    try {
        // Pedimos la suscripción al navegador (Google/Apple)
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        // Enviamos esa suscripción a nuestro Django
        const token = localStorage.getItem('chantli_token');
        await fetch(`${import.meta.env.VITE_API_URL}/webpush/save_information/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                status_type: 'subscribe',
                subscription: subscription.toJSON(),
                browser: navigator.userAgent,
                endpoint: subscription.endpoint
            })
        });
        
        console.log("¡Suscripción Push Exitosa!");
    } catch (error) {
        console.error("Error al suscribir al Push:", error);
    }
};

export default App;