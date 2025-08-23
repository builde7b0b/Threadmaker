'use client'

import { useState, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Snackbar,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { createWorker } from 'tesseract.js'
import { UploadedImage } from '@/types'
import { validateFileUpload, validateInput, logSecurityEvent } from '@/lib/security'

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [extractedText, setExtractedText] = useState<string>('')
  const [showTextPreview, setShowTextPreview] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>('')

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const copyTextToClipboard = async () => {
    if (!extractedText.trim()) {
      setSnackbarMessage('No text to copy')
      setSnackbarOpen(true)
      return
    }

    try {
      await navigator.clipboard.writeText(extractedText.trim())
      setCopiedToClipboard(true)
      setSnackbarMessage('Text copied to clipboard! 📋')
      setSnackbarOpen(true)

      // Reset copied state after 3 seconds
      setTimeout(() => setCopiedToClipboard(false), 3000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      setSnackbarMessage('Failed to copy text. Try selecting and copying manually.')
      setSnackbarOpen(true)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setLoading(true)
    setOcrProgress(0)
    setOcrStatus('')

    // Use security validation
    const validation = validateFileUpload(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setLoading(false)

      // Log security event
      logSecurityEvent({
        type: 'file_upload',
        userAgent: navigator.userAgent,
        details: {
          filename: file.name,
          size: file.size,
          type: file.type,
          error: validation.error
        }
      })

      return
    }

    // Sanitize the filename
    const sanitizedFilename = validateInput.filename(file.name)

        try {
      // Create preview URL
      const preview = URL.createObjectURL(file)

      // Store file and preview for later use
      setProcessedFile(file)
      setFilePreview(preview)

      // Extract text from image using OCR
      const content = await extractTextFromImage(file)

      // Store extracted text for copy functionality
      setExtractedText(content)
      setShowTextPreview(true)

      const uploadedImage: UploadedImage = {
        file,
        preview,
        content,
      }

      // Always show text preview first, let user decide what to do
      // Users can copy text or proceed to thread generation
      // onImageUpload(uploadedImage) will be called when user clicks "Generate Thread"
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image. Please try again.')
    } finally {
      setLoading(false)
      setOcrProgress(0)
      setOcrStatus('')
      // Don't reset showTextPreview in finally block - let it persist
    }
  }

  // OCR function using Tesseract.js with retry logic
  const extractTextFromImage = async (file: File, retryCount = 0): Promise<string> => {
    const maxRetries = 2

    setOcrStatus(`Initializing OCR engine...${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`)
    setOcrProgress(10)

    let worker
    try {
      worker = await createWorker('eng')

      setOcrStatus('Language model loaded')
      setOcrProgress(30)

      setOcrStatus('Analyzing image...')
      setOcrProgress(50)

      // Simulate progress updates during recognition
      const progressInterval = setInterval(() => {
        setOcrProgress(prev => {
          if (prev < 90) {
            return prev + 5
          }
          return prev
        })
      }, 200)

      const { data: { text } } = await worker.recognize(file)

      clearInterval(progressInterval)
      setOcrProgress(100)
      setOcrStatus('Text extraction complete!')

      await worker.terminate()

      if (!text.trim()) {
        throw new Error('No text detected in image. Please ensure the image contains clear, readable text.')
      }

      return text.trim()
    } catch (err) {
      if (worker) {
        await worker.terminate()
      }

      console.error('OCR Error:', err)

      // Retry logic for temporary failures
      if (retryCount < maxRetries && (
        err instanceof Error && (
          err.message.includes('network') ||
          err.message.includes('importScripts') ||
          err.message.includes('worker') ||
          err.message.includes('Failed to execute')
        )
      )) {
        console.log(`OCR failed, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        return extractTextFromImage(file, retryCount + 1)
      }

      // Provide more specific error messages
      let errorMessage = 'Failed to extract text from image.'

      if (err instanceof Error) {
        if (err.message.includes('worker') || err.message.includes('Content Security Policy')) {
          errorMessage = 'OCR worker failed to initialize due to security restrictions. You can still enter text manually or try refreshing the page.'
        } else if (err.message.includes('network') || err.message.includes('importScripts') || err.message.includes('data:')) {
          errorMessage = 'OCR worker could not load required files due to security restrictions. You can still enter text manually.'
        } else if (err.message.includes('timeout')) {
          errorMessage = 'OCR processing timed out. Please try with a smaller image or enter text manually.'
        } else if (err.message.includes('Failed to execute')) {
          errorMessage = 'OCR service is currently unavailable. Please try again later or enter text manually.'
        } else {
          errorMessage = err.message
        }
      }

      throw new Error(errorMessage)
    }
  }

  return (
    <Box>
      <Paper
        elevation={dragActive ? 8 : 2}
        sx={{
          p: 6,
          textAlign: 'center',
          border: dragActive ? '2px dashed' : '2px dashed transparent',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          backgroundColor: dragActive ? 'primary.50' : 'background.paper',
          transition: 'all 0.3s ease',
          cursor: loading || showTextPreview ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: loading || showTextPreview ? 'background.paper' : 'grey.50',
            borderColor: loading || showTextPreview ? 'grey.300' : 'primary.light',
          },
        }}
        onDragEnter={!loading && !showTextPreview ? handleDrag : undefined}
        onDragLeave={!loading && !showTextPreview ? handleDrag : undefined}
        onDragOver={!loading && !showTextPreview ? handleDrag : undefined}
        onDrop={!loading && !showTextPreview ? handleDrop : undefined}
        onClick={!loading && !showTextPreview ? () => document.getElementById('file-input')?.click() : undefined}
      >
        {loading ? (
          <Box>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {ocrStatus || 'Processing your screenshot...'}
            </Typography>
            {ocrProgress > 0 && (
              <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={ocrProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {ocrProgress}% complete
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <UploadIcon 
              sx={{ 
                fontSize: 64, 
                color: dragActive ? 'primary.main' : 'grey.400',
                mb: 2 
              }} 
            />
            <Typography variant="h6" gutterBottom>
              Drop your ChatGPT screenshot here
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              or click to browse files
            </Typography>
            <Button
              variant="contained"
              startIcon={<ImageIcon />}
              sx={{ mb: 2 }}
            >
              Choose Image
            </Button>
            <Typography variant="caption" display="block" color="text.secondary">
              Supported formats: PNG, JPG, JPEG (max 10MB)
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const manualText = prompt('Enter your text manually:', '')
                if (manualText && manualText.trim()) {
                  setExtractedText(manualText.trim())
                  setShowTextPreview(true)
                  setSnackbarMessage('✅ Text entered manually!')
                  setSnackbarOpen(true)
                }
              }}
              sx={{ mt: 1 }}
            >
              ✏️ Or Enter Text Manually
            </Button>
          </Box>
        )}
      </Paper>

      {/* Text Preview Section */}
      <Collapse in={showTextPreview} timeout="auto">
        <Paper
          elevation={3}
          sx={{
            mt: 3,
            p: isMobile ? 3 : 4,
            backgroundColor: 'success.light',
            border: '2px solid',
            borderColor: 'success.main',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="success.dark" fontWeight="bold">
              📋 Extracted Text ({extractedText.length} characters)
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowTextPreview(false)}
              sx={{ color: 'success.dark' }}
            >
              <ExpandLessIcon />
            </IconButton>
          </Box>

          <Paper
            elevation={1}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: 'background.paper',
              maxHeight: isMobile ? '200px' : '300px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: 1.5,
            }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit',
              }}
            >
              {extractedText || 'No text extracted'}
            </Typography>
          </Paper>

          <Box
            display="flex"
            gap={2}
            flexDirection={isMobile ? 'column' : 'row'}
            alignItems={isMobile ? 'stretch' : 'center'}
            flexWrap="wrap"
          >
            <Button
              variant="contained"
              size="large"
              onClick={copyTextToClipboard}
              disabled={!extractedText.trim()}
              startIcon={<CopyIcon />}
              sx={{
                flex: isMobile ? 1 : '0 1 auto',
                minHeight: isMobile ? '48px' : 'auto',
                fontSize: isMobile ? '1.1rem' : '1rem',
                fontWeight: 'bold',
                backgroundColor: copiedToClipboard ? 'success.main' : 'primary.main',
                '&:hover': {
                  backgroundColor: copiedToClipboard ? 'success.dark' : 'primary.dark',
                },
              }}
            >
              {copiedToClipboard ? '✅ Copied!' : '📋 Copy All Text'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                if (processedFile && filePreview && extractedText) {
                  const uploadedImage: UploadedImage = {
                    file: processedFile,
                    preview: filePreview,
                    content: extractedText,
                  }
                  onImageUpload(uploadedImage)
                }
              }}
              disabled={!processedFile || !extractedText}
              sx={{
                flex: isMobile ? 1 : '0 1 auto',
                minHeight: isMobile ? '48px' : 'auto',
                fontSize: isMobile ? '1rem' : '1rem',
              }}
            >
              🧵 Generate Thread
            </Button>

            <Button
              variant="text"
              size="large"
              onClick={() => {
                const manualText = prompt('Enter your text manually:', extractedText || '')
                if (manualText && manualText.trim()) {
                  setExtractedText(manualText.trim())
                  setSnackbarMessage('✅ Text updated manually!')
                  setSnackbarOpen(true)
                }
              }}
              sx={{
                flex: isMobile ? 1 : '0 1 auto',
                minHeight: isMobile ? '48px' : 'auto',
                fontSize: isMobile ? '0.875rem' : '0.875rem',
                color: 'text.secondary',
              }}
            >
              ✏️ Edit Text
            </Button>

            <Button
              variant="text"
              size="large"
              onClick={() => {
                // Reset all state to allow uploading another image
                setExtractedText('')
                setShowTextPreview(false)
                setProcessedFile(null)
                setFilePreview('')
                setCopiedToClipboard(false)
                setError(null)
              }}
              sx={{
                flex: isMobile ? 1 : '0 1 auto',
                minHeight: isMobile ? '48px' : 'auto',
                fontSize: isMobile ? '0.875rem' : '0.875rem',
                color: 'text.secondary',
              }}
            >
              📷 Upload Another
            </Button>
          </Box>
        </Paper>
      </Collapse>

      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            error.includes('OCR') || error.includes('security') ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setError(null)
                  // Allow manual text entry even without image
                  const manualText = prompt('Enter your text manually:', '')
                  if (manualText && manualText.trim()) {
                    setExtractedText(manualText.trim())
                    setShowTextPreview(true)
                    setSnackbarMessage('✅ Text entered manually!')
                    setSnackbarOpen(true)
                  }
                }}
              >
                Enter Text Manually
              </Button>
            ) : null
          }
        >
          {error}
          {(error.includes('OCR') || error.includes('security')) && (
            <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
              💡 <strong>Alternative:</strong> You can enter text manually or try with a different image.
            </Box>
          )}
        </Alert>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'left' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={copiedToClipboard ? 'success' : 'error'}
          variant="filled"
          sx={{
            width: isMobile ? '90vw' : 'auto',
            fontSize: isMobile ? '1rem' : '0.875rem',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
