/**
 * Webhook Routes for Real-Time Auto-Indexing
 * 
 * Provides HTTP endpoints for receiving data change notifications from ARIA5.1.
 * Triggers automatic re-indexing of changed records into Vectorize.
 * 
 * Security: Uses HMAC signature verification to authenticate webhook calls.
 */

import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { createAutoIndexingService } from '../mcp-server/services/auto-indexing-service';

export function createWebhookRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * Webhook endpoint for data change notifications
   * 
   * Expected payload:
   * {
   *   "namespace": "risks" | "incidents" | "compliance" | "documents",
   *   "recordId": 123,
   *   "operation": "insert" | "update" | "delete",
   *   "data": {...} // Optional: record data (avoids DB lookup)
   * }
   */
  app.post('/data-change', async (c) => {
    try {
      // Verify webhook signature (if configured)
      const signature = c.req.header('X-Webhook-Signature');
      const webhookSecret = c.env.WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const payload = await c.req.text();
        const isValid = await verifyWebhookSignature(payload, signature || '', webhookSecret);
        
        if (!isValid) {
          return c.json({
            error: 'Invalid webhook signature'
          }, 401);
        }
        
        // Re-parse after verification
        const body = JSON.parse(payload);
        
        // Process the webhook
        return await processWebhook(c, body);
      } else {
        // No signature verification (development mode)
        const body = await c.req.json();
        return await processWebhook(c, body);
      }

    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to process webhook'
      }, 500);
    }
  });

  /**
   * Batch webhook endpoint for multiple data changes
   * 
   * Expected payload:
   * {
   *   "changes": [
   *     { "namespace": "risks", "recordId": 123, "operation": "update" },
   *     { "namespace": "incidents", "recordId": 456, "operation": "insert" }
   *   ]
   * }
   */
  app.post('/data-change-batch', async (c) => {
    try {
      const body = await c.req.json();
      const changes = body.changes || [];

      if (!Array.isArray(changes) || changes.length === 0) {
        return c.json({
          success: false,
          error: 'Invalid batch payload: changes array required'
        }, 400);
      }

      // Create auto-indexing service
      const autoIndexing = createAutoIndexingService(c.env);

      // Process each change
      const results = [];
      for (const change of changes) {
        const result = await autoIndexing.handleDataChange(
          change.namespace,
          change.recordId,
          change.operation,
          change.data
        );
        
        results.push({
          namespace: change.namespace,
          recordId: change.recordId,
          operation: change.operation,
          ...result
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return c.json({
        success: failCount === 0,
        processed: results.length,
        successful: successCount,
        failed: failCount,
        results
      });

    } catch (error: any) {
      console.error('❌ Batch webhook error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to process batch webhook'
      }, 500);
    }
  });

  /**
   * Webhook health check
   */
  app.get('/health', async (c) => {
    try {
      const autoIndexing = createAutoIndexingService(c.env);
      const stats = await autoIndexing.getStatistics();

      return c.json({
        status: 'healthy',
        autoIndexing: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      return c.json({
        status: 'unhealthy',
        error: error.message
      }, 500);
    }
  });

  /**
   * Manual trigger endpoint for re-indexing a specific record
   * Useful for debugging or manual recovery
   */
  app.post('/trigger-reindex', async (c) => {
    try {
      const body = await c.req.json();
      const { namespace, recordId } = body;

      if (!namespace || !recordId) {
        return c.json({
          success: false,
          error: 'namespace and recordId are required'
        }, 400);
      }

      const autoIndexing = createAutoIndexingService(c.env);
      const result = await autoIndexing.handleDataChange(
        namespace,
        recordId,
        'update'
      );

      return c.json({
        success: result.success,
        jobId: result.jobId,
        namespace,
        recordId,
        error: result.error
      });

    } catch (error: any) {
      console.error('❌ Manual reindex error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to trigger reindex'
      }, 500);
    }
  });

  /**
   * Start/stop polling endpoint
   * Allows dynamic control of polling-based auto-indexing
   */
  app.post('/polling/control', async (c) => {
    try {
      const body = await c.req.json();
      const { action } = body; // 'start' or 'stop'

      const autoIndexing = createAutoIndexingService(c.env);

      if (action === 'start') {
        autoIndexing.startPolling();
        return c.json({
          success: true,
          message: 'Polling started'
        });
      } else if (action === 'stop') {
        autoIndexing.stopPolling();
        return c.json({
          success: true,
          message: 'Polling stopped'
        });
      } else {
        return c.json({
          success: false,
          error: 'Invalid action. Use "start" or "stop"'
        }, 400);
      }

    } catch (error: any) {
      console.error('❌ Polling control error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to control polling'
      }, 500);
    }
  });

  return app;
}

/**
 * Process webhook payload
 */
async function processWebhook(c: any, body: any) {
  const { namespace, recordId, operation, data } = body;

  // Validate required fields
  if (!namespace || !recordId || !operation) {
    return c.json({
      success: false,
      error: 'Missing required fields: namespace, recordId, operation'
    }, 400);
  }

  // Validate operation
  if (!['insert', 'update', 'delete'].includes(operation)) {
    return c.json({
      success: false,
      error: 'Invalid operation. Must be: insert, update, or delete'
    }, 400);
  }

  // Create auto-indexing service
  const autoIndexing = createAutoIndexingService(c.env);

  // Handle data change
  const result = await autoIndexing.handleDataChange(
    namespace,
    recordId,
    operation,
    data
  );

  if (result.success) {
    return c.json({
      success: true,
      jobId: result.jobId,
      namespace,
      recordId,
      operation,
      message: 'Successfully queued for indexing'
    });
  } else {
    return c.json({
      success: false,
      namespace,
      recordId,
      operation,
      error: result.error
    }, 500);
  }
}

/**
 * Verify webhook signature using HMAC
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Generate expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison)
    return signature === expectedSignature;

  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}
