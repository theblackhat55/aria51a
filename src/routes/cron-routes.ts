/**
 * Cron Routes for Background Jobs
 * Scheduled tasks using Cloudflare Cron Triggers
 * 
 * Configure in wrangler.jsonc:
 * "triggers": {
 *   "crons": ["*/15 * * * *"]  // Every 15 minutes
 * }
 */

import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { TAXIIClientService } from '../lib/taxii-client-service';

export function createCronRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  /**
   * Main cron handler - Called by Cloudflare on schedule
   */
  app.get('/scheduled', async (c) => {
    try {
      console.log('[CRON] Starting scheduled tasks:', new Date().toISOString());
      
      // Execute all background tasks
      const results = await Promise.allSettled([
        pollTAXIICollections(c.env.DB),
        cleanupOldSyncJobs(c.env.DB),
        updateWorkflowStatistics(c.env.DB)
      ]);
      
      // Log results
      results.forEach((result, index) => {
        const taskNames = ['TAXII Polling', 'Sync Job Cleanup', 'Workflow Stats'];
        if (result.status === 'fulfilled') {
          console.log(`[CRON] ${taskNames[index]}: SUCCESS`, result.value);
        } else {
          console.error(`[CRON] ${taskNames[index]}: FAILED`, result.reason);
        }
      });
      
      return c.json({
        success: true,
        timestamp: new Date().toISOString(),
        results: results.map((r, i) => ({
          task: ['taxii_polling', 'sync_cleanup', 'workflow_stats'][i],
          status: r.status,
          data: r.status === 'fulfilled' ? r.value : { error: r.reason?.message }
        }))
      });
      
    } catch (error: any) {
      console.error('[CRON] Error in scheduled tasks:', error);
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * Manual trigger endpoint for testing (requires auth in production)
   */
  app.post('/trigger-manual', async (c) => {
    try {
      const { task } = await c.req.json();
      
      let result;
      switch (task) {
        case 'taxii_polling':
          result = await pollTAXIICollections(c.env.DB);
          break;
        case 'sync_cleanup':
          result = await cleanupOldSyncJobs(c.env.DB);
          break;
        case 'workflow_stats':
          result = await updateWorkflowStatistics(c.env.DB);
          break;
        default:
          return c.json({ success: false, error: 'Invalid task name' }, 400);
      }
      
      return c.json({ success: true, result });
      
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return app;
}

/**
 * Poll all due TAXII collections
 */
async function pollTAXIICollections(db: D1Database): Promise<any> {
  const taxiiClient = new TAXIIClientService(db);
  
  const result = await taxiiClient.pollDueCollections();
  
  console.log(`[TAXII] Polled ${result.collectionsPolled} collections`);
  console.log(`[TAXII] Fetched ${result.totalObjectsFetched} objects`);
  console.log(`[TAXII] Extracted ${result.totalIOCsExtracted} IOCs`);
  
  if (result.errors.length > 0) {
    console.error(`[TAXII] Errors:`, result.errors);
  }
  
  return result;
}

/**
 * Clean up old sync jobs (keep last 100)
 */
async function cleanupOldSyncJobs(db: D1Database): Promise<any> {
  const result = await db.prepare(`
    DELETE FROM incident_sync_jobs
    WHERE id NOT IN (
      SELECT id FROM incident_sync_jobs
      ORDER BY created_at DESC
      LIMIT 100
    )
  `).run();
  
  console.log(`[CLEANUP] Deleted ${result.meta.changes} old sync jobs`);
  
  return {
    deleted: result.meta.changes
  };
}

/**
 * Update workflow execution statistics
 */
async function updateWorkflowStatistics(db: D1Database): Promise<any> {
  // Get total executions per workflow
  const stats = await db.prepare(`
    SELECT 
      workflow_id,
      COUNT(*) as total_executions,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(CASE WHEN status = 'completed' THEN 
        (julianday(completed_at) - julianday(started_at)) * 24 * 60
      ELSE NULL END) as avg_duration_minutes
    FROM incident_workflow_executions
    WHERE started_at >= datetime('now', '-30 days')
    GROUP BY workflow_id
  `).all();
  
  console.log(`[WORKFLOW STATS] Updated stats for ${stats.results?.length || 0} workflows`);
  
  return {
    workflows_updated: stats.results?.length || 0,
    stats: stats.results
  };
}

/**
 * Scheduled handler for Cloudflare Workers
 * This is called automatically by Cloudflare on the cron schedule
 */
export const scheduled: ExportedHandler['scheduled'] = async (event, env, ctx) => {
  console.log('[CRON] Scheduled event triggered:', event.cron);
  
  ctx.waitUntil(
    (async () => {
      try {
        await pollTAXIICollections(env.DB);
        await cleanupOldSyncJobs(env.DB);
        await updateWorkflowStatistics(env.DB);
      } catch (error) {
        console.error('[CRON] Scheduled task error:', error);
      }
    })()
  );
};
