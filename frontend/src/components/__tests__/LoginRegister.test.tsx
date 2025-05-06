import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginRegister from '../user_components/LoginRegister';
import { authAPI } from '../../api/api';

// Mock the API
mock('../../api/api', () => ({
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
    
    // Should show login header
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Should have username and password fields
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    
    // Should not have email field in login mode
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    
    // Should have login button
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
  
  it('switches to register mode when register button is clicked', () => {
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    // Click the "Register" button to switch modes
    fireEvent.click(screen.getByText('Register'));
    
    // Should show register header
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Should have username, email, and password fields
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    
    // Should have register button
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });
  
  it('handles login submission', async () => {
    // Mock successful login
    (authAPI.login as jest.Mock).mockResolvedValue({ 
      user: { username: 'testuser' }, 
      access_token: 'token123'
    });
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    // Fill out the login form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Check that the API was called with correct parameters
    expect(authAPI.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
    
    // Wait for the login process to complete
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles registration submission', async () => {
    // Mock successful registration
    (authAPI.register as jest.Mock).mockResolvedValue({ 
      user: { username: 'newuser' }, 
      access_token: 'token123'
    });
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    // Switch to register mode
    fireEvent.click(screen.getByText('Register'));
    
    // Fill out the registration form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    // Check that the API was called with correct parameters
    expect(authAPI.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    });
    
    // Wait for the registration process to complete
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
  
  it('displays error message when login fails', async () => {
    // Mock failed login
    (authAPI.login as jest.Mock).mockRejectedValue(new Error('Invalid username or password'));
    
    render(<LoginRegister onLoginSuccess={mockOnLoginSuccess} />);
    
    // Fill out the login form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });
    
    // The success callback should not have been called
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });
});