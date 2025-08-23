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

    console.log('🔍 Checking for existing API key:', {
      envKey: envKey ? 'present' : 'not found',
      localKey: localKey ? 'present' : 'not found',
      sessionKey: sessionKey ? 'present' : 'not found'
    })

    if (envKey && envKey !== 'demo-key' && envKey.startsWith('sk-')) {
      console.log('✅ Found valid API key in environment')
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else if (localKey && localKey.startsWith('sk-')) {
      console.log('✅ Found valid API key in localStorage')
      setApiKey(localKey)
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else if (sessionKey && sessionKey.startsWith('sk-')) {
      console.log('✅ Found valid API key in sessionStorage')
      setApiKey(sessionKey)
      setKeyStatus('valid')
      onConfigChange?.(true)
    } else {
      console.log('❌ No valid API key found')
      setIsExpanded(true) // Auto-expand if no key is set
    }
  }, [onConfigChange])

  const handleSaveKey = () => {
    const trimmedKey = apiKey.trim()

    if (trimmedKey.startsWith('sk-') && trimmedKey.length > 20) {
      // Store in localStorage for persistence
      localStorage.setItem('openai_api_key', trimmedKey)

      // Also try to set in session storage as backup
      sessionStorage.setItem('openai_api_key', trimmedKey)

      // Set it in process.env for immediate use (though this may not persist)
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = trimmedKey

      setKeyStatus('valid')
      setIsExpanded(false)
      onConfigChange?.(true)

      console.log('✅ API key configured successfully:', {
        keyLength: trimmedKey.length,
        keyPrefix: trimmedKey.substring(0, 10) + '...',
        storedInLocalStorage: !!localStorage.getItem('openai_api_key'),
        storedInSessionStorage: !!sessionStorage.getItem('openai_api_key')
      })
    } else {
      setKeyStatus('invalid')
      console.log('❌ Invalid API key format:', {
        startsWithSk: trimmedKey.startsWith('sk-'),
        length: trimmedKey.length,
        minLengthRequired: 20
      })
    }
  }

  const handleClearKey = () => {
    // Clear from all storage locations
    localStorage.removeItem('openai_api_key')
    sessionStorage.removeItem('openai_api_key')

    // Clear from process.env if it was set
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = ''
    }

    setApiKey('')
    setKeyStatus('none')
    setIsExpanded(true)
    onConfigChange?.(false)

    console.log('🗑️ API key cleared from all storage locations')
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

