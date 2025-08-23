export interface ThreadTweet {
  id: string
  content: string
  order: number
}

export interface GeneratedThread {
  tweets: ThreadTweet[]
  title: string
  totalTweets: number
}

export interface UploadedImage {
  file: File
  preview: string
  content?: string
}
