import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KeyGenerate from './pages/KeyGenerate';
import KeyList from './pages/KeyList';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import { theme } from './theme';
import './App.css';
import ApiDocs from './pages/ApiDocs';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
            <Route index element={<Navigate to="/keys/generate" replace />} />
            <Route path="keys/generate" element={<KeyGenerate />} />
            <Route path="keys/list" element={<KeyList />} />
            <Route path="api" element={<ApiDocs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;