'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Collapse,
  IconButton,
  Link,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Visibility,
  VisibilityOff,
  Info as InfoIcon,
} from '@mui/icons-material'

interface AIConfigProps {
  onConfigChange?: (hasValidKey: boolean) => void
}

export function AIConfig({ onConfigChange }: AIConfigProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'none' | 'valid' | 'invalid'>('none')

  useEffect(() => {
    // Check if API key is already set in environment, localStorage, or sessionStorage
    const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    const localKey = localStorage.getItem('openai_api_key')
    const sessionKey = sessionStorage.getItem('openai_api_key')

    if (envKey && envKey !== 'demo-key' && envKey.startsWith('sk-')) {
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else if (localKey && localKey.startsWith('sk-')) {
      setApiKey(localKey)
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else if (sessionKey && sessionKey.startsWith('sk-')) {
      setApiKey(sessionKey)
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else {
      setIsExpanded(true) // Auto-expand if no key is set
    }
  }, []) // Remove onConfigChange from dependency array to prevent infinite loops

  const handleSaveKey = () => {
    const trimmedKey = apiKey.trim()

    if (trimmedKey.startsWith('sk-') && trimmedKey.length > 20) {
      // Store in localStorage for persistence
      localStorage.setItem('openai_api_key', trimmedKey)

      // Also try to set in session storage as backup
      sessionStorage.setItem('openai_api_key', trimmedKey)

      // Note: process.env cannot be modified at runtime in Next.js
      // The API key will be available via localStorage for the session

      setKeyStatus('valid')
      setIsExpanded(false)
      onConfigChange?.(true)

      // API key configured successfully
    } else {
      setKeyStatus('invalid')
      // Invalid API key format
    }
  }

  const handleClearKey = () => {
    // Clear from all storage locations
    localStorage.removeItem('openai_api_key')
    sessionStorage.removeItem('openai_api_key')

    // Note: process.env cannot be modified at runtime in Next.js
    // The API key will be cleared from localStorage and sessionStorage

    setApiKey('')
    setKeyStatus('none')
    setIsExpanded(true)
    onConfigChange?.(false)

    // API key cleared from all storage locations
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" color="primary">
            AI-Powered Thread Generation
          </Typography>
          {keyStatus === 'valid' && (
            <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
              ✅ Active
            </Typography>
          )}
        </Box>
        <Button
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          variant={keyStatus === 'none' ? 'contained' : 'outlined'}
          color={keyStatus === 'none' ? 'warning' : 'primary'}
        >
          {keyStatus === 'none' ? 'Setup Required' : 'Configure'}
        </Button>
      </Box>

      <Collapse in={isExpanded}>
        <Box mt={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>🚀 Enable Expert-Level AI Threads:</strong>
              </Typography>
              <Typography variant="body2">
                Add your OpenAI API key to generate highly technical, engaging threads using GPT-4. 
                Without this, the app uses rule-based generation (still good, but not as dynamic).
              </Typography>
            </Box>
          </Alert>

          <TextField
            fullWidth
            label="OpenAI API Key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowKey(!showKey)}>
                  {showKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
            helperText={
              <>
                Get your API key from{' '}
                <Link href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">
                  OpenAI Platform
                </Link>
                {keyStatus === 'invalid' && (
                  <Typography color="error" component="span" sx={{ ml: 1 }}>
                    Invalid API key format
                  </Typography>
                )}
              </>
            }
            error={keyStatus === 'invalid'}
          />

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
            >
              Save & Enable AI
            </Button>
            {keyStatus === 'valid' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearKey}
              >
                Clear Key
              </Button>
            )}
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <InfoIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Your API key is stored locally in your browser and never sent to our servers. 
              OpenAI charges ~$0.01-0.05 per thread generation.
            </Typography>
          </Alert>
        </Box>
      </Collapse>
    </Paper>
  )
}

