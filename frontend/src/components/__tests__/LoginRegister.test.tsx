import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginRegister from '../user_components/LoginRegister';
import { authAPI } from '../../api/api';

jest.mock('../../api/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn()
  }
}));

describe('LoginRegister Component', () => {
  const mockOnLoginSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders login form by default', () => {
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
  
  it('switches to register mode when register button is clicked', () => {
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.click(screen.getByText(/Register/i));
    
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
  
  it('handles login submission', async () => {
    (authAPI.login as jest.Mock).mockResolvedValue({ 
      user: { username: 'testuser' }, 
      access_token: 'token123'
    });
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));
    
    expect(authAPI.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
    
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles registration submission', async () => {
    (authAPI.register as jest.Mock).mockResolvedValue({ 
      user: { username: 'newuser' }, 
      access_token: 'token123'
    });
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.click(screen.getByText(/Register/i));
    
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /register/i }));
    
    expect(authAPI.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    });
    
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
  
  it('displays error message when login fails', async () => {
    (authAPI.login as jest.Mock).mockRejectedValue(new Error('Invalid username or password'));
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });
    
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });
});