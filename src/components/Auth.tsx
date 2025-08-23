'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { supabase, signUp, signIn, signOut, getCurrentUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthProps {
  onAuthSuccess?: (user: User) => void
  onAuthError?: (error: string) => void
  onSignOut?: () => void
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  mode: 'signin' | 'signup'
  email: string
  password: string
  confirmPassword: string
  showPassword: boolean
  error: string | null
}

export function Auth({ onAuthSuccess, onAuthError, onSignOut }: AuthProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    mode: 'signin',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    error: null,
  })
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  useEffect(() => {
    checkAuthState()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (event === 'SIGNED_IN' && session?.user) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: session.user,
            isLoading: false,
          }))
          onAuthSuccess?.(session.user)
        } else if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            isLoading: false,
          }))
          onSignOut?.()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [onAuthSuccess, onSignOut])

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
        }))
        onAuthSuccess?.(user)
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
        }))
      }
    } catch (error) {
      console.error('Error checking auth state:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setState(prev => ({ ...prev, error: 'Please fill in all fields' }))
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password)
        if (error) throw error

        setSnackbarMessage('Account created! Please check your email to verify your account.')
        setSnackbarOpen(true)

        // Switch to sign in mode
        setState(prev => ({
          ...prev,
          mode: 'signin',
          password: '',
          confirmPassword: '',
          isLoading: false,
        }))
      } else {
        const { data, error } = await signIn(email, password)
        if (error) throw error

        // Auth state will be updated via the listener
        setSnackbarMessage('Successfully signed in!')
        setSnackbarOpen(true)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      const errorMessage = error.message || 'Authentication failed'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      onAuthError?.(errorMessage)
    }
  }

  const handleSignOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const { error } = await signOut()
      if (error) throw error

      setSnackbarMessage('Successfully signed out!')
      setSnackbarOpen(true)
    } catch (error: any) {
      console.error('Sign out error:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Sign out failed',
        isLoading: false
      }))
    }
  }

  const toggleMode = () => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === 'signin' ? 'signup' : 'signin',
      error: null,
      password: '',
      confirmPassword: '',
    }))
  }

  const {
    isAuthenticated,
    user,
    isLoading,
    mode,
    email,
    password,
    confirmPassword,
    showPassword,
    error,
  } = state

  if (isLoading && !isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (isAuthenticated && user) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 2,
          border: '2px solid',
          borderColor: 'success.main',
          backgroundColor: 'success.light',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ color: 'success.dark' }} />
            <Box>
              <Typography variant="h6" color="success.dark">
                Welcome back!
              </Typography>
              <Typography variant="body2" color="success.dark">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleSignOut}
            color="inherit"
            disabled={isLoading}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
        <Typography variant="h5" color="primary">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: (
              <IconButton
                onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }}
        />

        {mode === 'signup' && (
          <TextField
            fullWidth
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          sx={{ mb: 2, py: 1.5 }}
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            mode === 'signin' ? 'Sign In' : 'Sign Up'
          )}
        </Button>
      </form>

      <Divider sx={{ my: 2 }} />

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
        </Typography>
        <Button
          variant="text"
          onClick={toggleMode}
          disabled={isLoading}
        >
          {mode === 'signin' ? 'Sign Up' : 'Sign In'}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
