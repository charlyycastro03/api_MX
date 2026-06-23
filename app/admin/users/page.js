'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        if (res.status === 401) {
          router.push('/');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();

      if (res.ok) {
        setSuccess('Usuario creado exitosamente');
        setForm({ name: '', email: '', password: '', role: 'AGENT' });
        fetchUsers();
      } else {
        setError(data.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header glass-panel">
        <div className="header-left">
          <button className="btn-back" onClick={() => router.push('/')}>
            ← Volver al Dashboard
          </button>
          <h1>Control de Perfiles</h1>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-card glass-panel">
          <h2>Crear Nuevo Usuario</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Contraseña Temporal</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>

            <div className="form-group">
              <label>Rol</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="AGENT">Agente (Consulta y CRM)</option>
                <option value="ADMIN">Administrador (Puede crear perfiles)</option>
                <option value="SUPERADMIN">Super Admin (Control total)</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>

        <div className="admin-card glass-panel">
          <h2>Usuarios Registrados ({users.length})</h2>
          {loading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role.toLowerCase()}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
