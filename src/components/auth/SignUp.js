import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData.email, formData.password, {
        displayName: formData.displayName
      });
      
      if (result.success) {
        console.log('✅ Signup successful');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f8f9fa' 
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2rem', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#4ecdc4', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
            🎨 CraftAI Studio
          </h1>
          <p style={{ color: '#666', margin: 0 }}>Create your artisan account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#4ecdc4',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#666', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4ecdc4', fontWeight: 'bold', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
