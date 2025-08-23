'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Snackbar,
  Divider,
} from '@mui/material'
import {
  Twitter as TwitterIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { getTwitterAuthUrl, validateTwitterToken, refreshTwitterToken } from '@/lib/twitter'

interface TwitterAuthProps {
  onAuthSuccess?: (tokens: { accessToken: string; refreshToken?: string }) => void
  onAuthError?: (error: string) => void
  onDisconnect?: () => void
}

interface TwitterAuthState {
  isConnected: boolean
  isLoading: boolean
  username?: string
  error?: string
}

export function TwitterAuth({ onAuthSuccess, onAuthError, onDisconnect }: TwitterAuthProps) {
  const [state, setState] = useState<TwitterAuthState>({
    isConnected: false,
    isLoading: false,
  })
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  useEffect(() => {
    checkTwitterConnection()
  }, [])

  const checkTwitterConnection = async () => {
    const accessToken = localStorage.getItem('twitter_access_token')
    const refreshToken = localStorage.getItem('twitter_refresh_token')

    if (!accessToken) {
      setState(prev => ({ ...prev, isConnected: false }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Validate current token
      const isValid = await validateTwitterToken(accessToken)

      if (isValid) {
        const username = localStorage.getItem('twitter_username') || 'Unknown User'
        setState({
          isConnected: true,
          isLoading: false,
          username,
        })
        onAuthSuccess?.({ accessToken, refreshToken: refreshToken || undefined })
      } else if (refreshToken) {
        // Try to refresh token
        const newTokens = await refreshTwitterToken(refreshToken)
        localStorage.setItem('twitter_access_token', newTokens.access_token)
        if (newTokens.refresh_token) {
          localStorage.setItem('twitter_refresh_token', newTokens.refresh_token)
        }

        setState({
          isConnected: true,
          isLoading: false,
          username: localStorage.getItem('twitter_username') || 'Unknown User',
        })
        onAuthSuccess?.({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token
        })
      } else {
        // Token is invalid and no refresh token
        disconnectTwitter()
      }
    } catch (error) {
      console.error('Twitter connection check failed:', error)
      disconnectTwitter()
    }
  }

  const connectTwitter = () => {
    try {
      const authUrl = getTwitterAuthUrl()
      // Store current URL for redirect back
      sessionStorage.setItem('twitter_auth_redirect', window.location.href)
      window.location.href = authUrl
    } catch (error) {
      const errorMessage = 'Failed to connect to Twitter. Please check your configuration.'
      setState(prev => ({ ...prev, error: errorMessage }))
      onAuthError?.(errorMessage)
      setSnackbarMessage(errorMessage)
      setSnackbarOpen(true)
    }
  }

  const disconnectTwitter = () => {
    localStorage.removeItem('twitter_access_token')
    localStorage.removeItem('twitter_refresh_token')
    localStorage.removeItem('twitter_username')

    setState({
      isConnected: false,
      isLoading: false,
    })
    onDisconnect?.()
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 2,
        border: '2px solid',
        borderColor: state.isConnected ? 'success.main' : 'primary.main',
        backgroundColor: state.isConnected ? 'success.light' : 'primary.light',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TwitterIcon sx={{ color: state.isConnected ? 'success.dark' : 'primary.dark' }} />
          <Typography variant="h6" color={state.isConnected ? 'success.dark' : 'primary.dark'}>
            Twitter Integration
          </Typography>
          {state.isConnected && state.username && (
            <Typography variant="body2" color="success.dark" sx={{ ml: 1 }}>
              @{state.username}
            </Typography>
          )}
        </Box>

        {state.isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Button
            variant={state.isConnected ? 'outlined' : 'contained'}
            color={state.isConnected ? 'inherit' : 'primary'}
            onClick={state.isConnected ? disconnectTwitter : connectTwitter}
            startIcon={state.isConnected ? <UnlinkIcon /> : <LinkIcon />}
            size="small"
          >
            {state.isConnected ? 'Disconnect' : 'Connect Twitter'}
          </Button>
        )}
      </Box>

      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {state.isConnected
          ? '✅ Connected! You can now post threads directly to Twitter with one click.'
          : '🔗 Connect your Twitter account to post threads directly from the app.'
        }
      </Typography>

      {!state.isConnected && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>Benefits:</strong>
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            • Post threads directly to Twitter in one click
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            • No need to copy and paste content
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            • Maintain proper thread formatting
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
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
