/**
 * Queue Client
 * 
 * Provides a type-safe wrapper around Cloudflare Queues
 * for asynchronous job processing and message handling.
 */

export interface QueueMessage<T = any> {
  id: string;
  body: T;
  timestamp: Date;
  attempts: number;
}

export interface SendOptions {
  delay?: number;  // Delay in seconds before message becomes available
  contentType?: string;
}

export class QueueClient {
  private static instance: QueueClient | null = null;
  private queue: Queue | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): QueueClient {
    if (!QueueClient.instance) {
      QueueClient.instance = new QueueClient();
    }
    return QueueClient.instance;
  }

  /**
   * Initialize the queue
   */
  public initialize(queue: Queue): void {
    this.queue = queue;
  }

  /**
   * Get the queue instance
   * @throws Error if queue not initialized
   */
  private getQueue(): Queue {
    if (!this.queue) {
      throw new Error('Queue not initialized. Call initialize() first.');
    }
    return this.queue;
  }

  /**
   * Send a message to the queue
   */
  public async send<T>(body: T, options?: SendOptions): Promise<void> {
    const queue = this.getQueue();
    
    const message: MessageSendRequest = {
      body: JSON.stringify(body)
    };

    if (options?.delay) {
      message.delaySeconds = options.delay;
    }

    if (options?.contentType) {
      message.contentType = options.contentType;
    }

    await queue.send(message);
  }

  /**
   * Send multiple messages in a batch
   */
  public async sendBatch<T>(bodies: T[], options?: SendOptions): Promise<void> {
    const queue = this.getQueue();
    
    const messages: MessageSendRequest[] = bodies.map(body => {
      const message: MessageSendRequest = {
        body: JSON.stringify(body)
      };

      if (options?.delay) {
        message.delaySeconds = options.delay;
      }

      if (options?.contentType) {
        message.contentType = options.contentType;
      }

      return message;
    });

    await queue.sendBatch(messages);
  }

  /**
   * Process messages from the queue
   * Note: This is typically called by the queue consumer worker
   */
  public parseMessage<T>(message: Message): QueueMessage<T> {
    return {
      id: message.id,
      body: JSON.parse(message.body as string) as T,
      timestamp: new Date(message.timestamp),
      attempts: message.attempts
    };
  }

  /**
   * Check if queue is initialized
   */
  public isInitialized(): boolean {
    return this.queue !== null;
  }
}

/**
 * Queue Consumer Handler
 * 
 * Base class for queue message handlers
 */
export abstract class QueueConsumerHandler<T = any> {
  /**
   * Handle a single message
   * Override this method with your message processing logic
   */
  public abstract handle(message: QueueMessage<T>): Promise<void>;

  /**
   * Handle a batch of messages
   * Default implementation processes messages sequentially
   */
  public async handleBatch(messages: Message[]): Promise<void> {
    const queueClient = QueueClient.getInstance();
    
    for (const rawMessage of messages) {
      const message = queueClient.parseMessage<T>(rawMessage);
      
      try {
        await this.handle(message);
        await this.onSuccess(message);
      } catch (error) {
        await this.onError(message, error as Error);
        
        // Re-throw to let Cloudflare Queues handle retry logic
        throw error;
      }
    }
  }

  /**
   * Hook called after successful message processing
   */
  protected async onSuccess(message: QueueMessage<T>): Promise<void> {
    // Override for logging, metrics, etc.
  }

  /**
   * Hook called when message processing fails
   */
  protected async onError(message: QueueMessage<T>, error: Error): Promise<void> {
    // Override for error logging, dead letter queue, etc.
    console.error(`Failed to process message ${message.id}:`, error);
  }
}
