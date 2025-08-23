'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Twitter as TwitterIcon,
  Favorite as HeartIcon,
  Repeat as RetweetIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material'
import { GeneratedThread } from '@/types'

interface ThreadPreviewProps {
  thread: GeneratedThread
  onReset: () => void
}

export function ThreadPreview({ thread, onReset }: ThreadPreviewProps) {
  const [copiedTweet, setCopiedTweet] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const copyTweet = async (content: string, tweetId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedTweet(tweetId)
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyFullThread = async () => {
    const fullThread = thread.tweets
      .map((tweet, index) => `${index + 1}/${thread.totalTweets}\n\n${tweet.content}`)
      .join('\n\n---\n\n')
    
    try {
      await navigator.clipboard.writeText(fullThread)
      setCopiedTweet('full')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Failed to copy thread:', err)
    }
  }

  const downloadThread = () => {
    const fullThread = thread.tweets
      .map((tweet, index) => `Tweet ${index + 1}/${thread.totalTweets}\n\n${tweet.content}`)
      .join('\n\n' + '='.repeat(50) + '\n\n')
    
    const blob = new Blob([fullThread], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${thread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_thread.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {thread.title}
          </Typography>
          <Chip 
            label={`${thread.totalTweets} tweets`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={onReset}
            startIcon={<RefreshIcon />}
          >
            New Thread
          </Button>
          <Button
            variant="contained"
            onClick={copyFullThread}
            startIcon={<CopyIcon />}
          >
            Copy All
          </Button>
          <Button
            variant="contained"
            onClick={downloadThread}
            startIcon={<DownloadIcon />}
            color="secondary"
          >
            Download
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {thread.tweets.map((tweet, index) => (
          <Grid item xs={12} key={tweet.id}>
            <Card 
              elevation={2}
              sx={{ 
                borderLeft: index === 0 ? '4px solid' : '2px solid',
                borderLeftColor: index === 0 ? 'primary.main' : 'grey.300',
                transition: 'all 0.2s ease',
                '&:hover': {
                  elevation: 4,
                  borderLeftColor: 'primary.main',
                }
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" component="div" color="primary">
                      @username
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {index + 1}/{thread.totalTweets}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Hook" size="small" color="success" variant="outlined" />
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => copyTweet(tweet.content, tweet.id)}
                    color={copiedTweet === tweet.id ? 'success' : 'default'}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-line',
                    lineHeight: 1.6,
                    fontSize: '1.125rem'
                  }}
                  mb={3}
                >
                  {tweet.content}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                      <IconButton size="small" color="inherit">
                        <ReplyIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption">12</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                      <IconButton size="small" color="inherit">
                        <RetweetIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption">47</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                      <IconButton size="small" color="inherit">
                        <HeartIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption">156</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {tweet.content.length}/280 characters
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'primary.50' }}>
        <Typography variant="h6" gutterBottom color="primary">
          📈 Pro Tips for Maximum Engagement
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              • Post between 9-10 AM or 7-9 PM for best reach
            </Typography>
            <Typography variant="body2" gutterBottom>
              • Pin the first tweet to your profile
            </Typography>
            <Typography variant="body2">
              • Engage with replies within the first hour
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              • Tag relevant accounts for more visibility
            </Typography>
            <Typography variant="body2" gutterBottom>
              • Add relevant hashtags to the last tweet
            </Typography>
            <Typography variant="body2">
              • Cross-post to LinkedIn for extra reach
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {copiedTweet === 'full' ? 'Full thread copied!' : 'Tweet copied to clipboard!'}
        </Alert>
      </Snackbar>
    </Box>
  )
}
