'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Alert,
} from '@mui/material'

import {
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material'
import { UploadedImage, GeneratedThread } from '@/types'
import { generateThreadFromText } from '@/lib/threadGenerator'
import { canUserGenerateThread, incrementThreadUsage } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface ThreadGeneratorProps {
  image: UploadedImage
  onThreadGenerated: (thread: GeneratedThread) => void
  currentUser?: User | null
}

export function ThreadGenerator({ image, onThreadGenerated, currentUser }: ThreadGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentWallActive, setPaymentWallActive] = useState(false)

  // Debug logging
  console.log('ThreadGenerator render:', {
    hasImage: !!image,
    hasContent: !!image?.content,
    contentLength: image?.content?.length,
    generating,
    currentUser: currentUser?.email,
    paymentWallActive
  })

  const generateThread = async () => {
    // Check payment wall first
    if (currentUser) {
      try {
        const canGenerate = await canUserGenerateThread(currentUser.id)
        if (!canGenerate) {
          setPaymentWallActive(true)
          setError('You\'ve reached your free tier limit. Upgrade to premium for unlimited thread generation!')
          setGenerating(false)
          return
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setError('Unable to verify subscription status. Please try again.')
        setGenerating(false)
        return
      }
    }

    setGenerating(true)
    setError(null)
    setPaymentWallActive(false)

    try {
      if (!image.content) {
        throw new Error('No text content found in image')
      }

      console.log('🚀 Starting thread generation process...')

      // Generate thread based on extracted text using AI
      const thread = await generateThreadFromText({
        extractedText: image.content,
        style: 'viral', // Default to viral style for maximum engagement
        useAI: true // Enable AI-powered generation
      })

      // Increment usage for authenticated users
      if (currentUser) {
        try {
          await incrementThreadUsage(currentUser.id)
          console.log('📊 Usage incremented for user:', currentUser.id)
        } catch (usageError) {
          console.warn('Failed to increment usage:', usageError)
          // Don't fail the thread generation for usage tracking errors
        }
      }

      console.log('✅ Thread generation completed:', thread.title)
      onThreadGenerated(thread)
    } catch (err) {
      console.error('❌ Thread generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate thread. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={4}
        mb={2}
      >
        <Box flex={{ xs: '1', md: '1' }} minWidth={0}>
          <Card elevation={2}>
            <CardMedia
              component="img"
              image={image.preview}
              alt="Uploaded screenshot"
              sx={{ 
                maxHeight: 400, 
                objectFit: 'contain',
                backgroundColor: 'grey.100'
              }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📸 Your Screenshot
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${(image.file.size / 1024 / 1024).toFixed(1)} MB`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
                {image.content && (
                  <Chip 
                    label={`${image.content.length} chars extracted`} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                )}
              </Box>
              
              {image.content && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PreviewIcon fontSize="small" />
                    Extracted Text Preview:
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      maxHeight: 150, 
                      overflow: 'auto', 
                      bgcolor: 'grey.50',
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {image.content.length > 300 
                        ? `${image.content.substring(0, 300)}...` 
                        : image.content
                      }
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex={{ xs: '1', md: '1' }} minWidth={0}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Box textAlign="center">
              <AIIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {localStorage.getItem('openai_api_key') && localStorage.getItem('openai_api_key') !== 'demo-key'
                  ? '🤖 AI-Powered Thread Generator'
                  : '📝 Rule-Based Thread Generator'
                }
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                {localStorage.getItem('openai_api_key') && localStorage.getItem('openai_api_key') !== 'demo-key'
                  ? '🤖 GPT-4 will analyze your content and create expert-level, technical threads optimized for developer engagement and viral potential.'
                  : '📝 Smart algorithms will analyze your content and create engaging threads. For even better results, configure OpenAI API above.'
                }
              </Typography>

              {generating ? (
                <Box>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {localStorage.getItem('openai_api_key') && localStorage.getItem('openai_api_key') !== 'demo-key'
                      ? '🤖 GPT-4 is analyzing content and crafting expert-level thread...'
                      : '📝 Analyzing content and crafting your thread...'
                    }
                  </Typography>
                  {localStorage.getItem('openai_api_key') && localStorage.getItem('openai_api_key') !== 'demo-key' && (
                    <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
                      ✨ AI-powered generation active - creating viral-worthy content
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  {!image.content && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No text content found in the image. Please try uploading again.
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={generateThread}
                    startIcon={<AIIcon />}
                    sx={{ px: 4, py: 1.5 }}
                    disabled={!image.content}
                  >
                    Generate Thread
                  </Button>
                </Box>
              )}

                    {/* Payment Wall */}
      {paymentWallActive && (
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Upgrade Now
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Free Tier Limit Reached!</strong>
          </Typography>
          <Typography variant="body2">
            You've used all 5 free threads this month. Upgrade to Premium for unlimited thread generation and Twitter integration!
          </Typography>
        </Alert>
      )}

      <Box mt={3}>
        <Typography variant="caption" display="block" color="text.secondary">
          ✨ Features included:
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          • Viral hook optimization • Engagement boosters • Proper thread formatting
        </Typography>
        {!currentUser && (
          <Typography variant="caption" display="block" color="primary.main" sx={{ mt: 1 }}>
            💡 Sign up for an account to unlock premium features and track your usage!
          </Typography>
        )}
      </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={generateThread}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
    </Box>
  )
}
