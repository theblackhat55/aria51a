import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

export function createSystemHealthRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Get current system health status
  app.get('/status', async (c) => {
    try {
      // Get current system health status from database
      const healthStatus = await c.env.DB.prepare(`
        SELECT 
          service_name,
          display_name,
          status,
          uptime_percentage,
          last_check,
          response_time_ms,
          datetime(last_check, 'localtime') as last_check_formatted
        FROM system_health_status 
        ORDER BY service_name
      `).all();

      // Get latest API performance metrics (last hour average)
      const apiMetrics = await c.env.DB.prepare(`
        SELECT 
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) as request_count,
          SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM api_performance_metrics 
        WHERE created_at > datetime('now', '-1 hour')
      `).first();

      // Get latest security scan info
      const securityScan = await c.env.DB.prepare(`
        SELECT 
          scan_type,
          status,
          findings_count,
          critical_count + high_count as urgent_findings,
          datetime(started_at, 'localtime') as started_at_formatted,
          datetime(completed_at, 'localtime') as completed_at_formatted,
          scan_duration_seconds
        FROM security_scan_results 
        ORDER BY started_at DESC 
        LIMIT 1
      `).first();

      // Get latest backup info
      const backupInfo = await c.env.DB.prepare(`
        SELECT 
          backup_type,
          status,
          size_bytes,
          datetime(started_at, 'localtime') as started_at_formatted,
          datetime(completed_at, 'localtime') as completed_at_formatted,
          duration_seconds
        FROM backup_operations 
        ORDER BY started_at DESC 
        LIMIT 1
      `).first();

      // Update real-time calculations
      const currentTime = new Date().toISOString();
      
      // Calculate API service status based on recent performance
      let apiStatus = 'operational';
      let apiUptime = 99.9;
      if (apiMetrics) {
        const successRate = apiMetrics.success_rate || 0;
        const responseTime = apiMetrics.avg_response_time || 0;
        
        if (successRate < 95 || responseTime > 2000) {
          apiStatus = 'degraded';
          apiUptime = successRate;
        } else if (successRate < 98 || responseTime > 1000) {
          apiStatus = 'operational';
          apiUptime = Math.min(99.9, successRate + 1);
        }
      }

      // Calculate database status (assume operational if we can query it)
      const dbStatus = 'operational';
      const dbUptime = 100.0;

      // Calculate security scan status
      let securityStatus = 'operational';
      let securityDisplay = 'Last: Unknown';
      if (securityScan) {
        if (securityScan.status === 'running') {
          securityStatus = 'scanning';
          securityDisplay = 'Running now';
        } else if (securityScan.status === 'completed') {
          securityStatus = securityScan.urgent_findings > 0 ? 'warning' : 'operational';
          const hoursAgo = Math.floor((Date.now() - new Date(securityScan.started_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
          securityDisplay = `Last: ${hoursAgo} hours ago`;
        } else if (securityScan.status === 'failed') {
          securityStatus = 'error';
          securityDisplay = 'Last scan failed';
        }
      }

      // Calculate backup status
      let backupStatus = 'operational';
      let backupDisplay = 'Last: Unknown';
      if (backupInfo) {
        if (backupInfo.status === 'running') {
          backupStatus = 'running';
          backupDisplay = 'Running now';
        } else if (backupInfo.status === 'completed') {
          backupStatus = 'operational';
          const hoursAgo = Math.floor((Date.now() - new Date(backupInfo.completed_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
          backupDisplay = `Last: ${hoursAgo} hours ago`;
        } else if (backupInfo.status === 'failed') {
          backupStatus = 'error';
          backupDisplay = 'Last backup failed';
        }
      }

      // Update system health status in database with real-time data
      await c.env.DB.batch([
        c.env.DB.prepare(`
          UPDATE system_health_status 
          SET status = ?, uptime_percentage = ?, response_time_ms = ?, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE service_name = 'api_services'
        `).bind(apiStatus, apiUptime, Math.round(apiMetrics?.avg_response_time || 0)),
        
        c.env.DB.prepare(`
          UPDATE system_health_status 
          SET status = ?, uptime_percentage = ?, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE service_name = 'database'
        `).bind(dbStatus, dbUptime),
        
        c.env.DB.prepare(`
          UPDATE system_health_status 
          SET status = ?, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE service_name = 'security_scan'
        `).bind(securityStatus),
        
        c.env.DB.prepare(`
          UPDATE system_health_status 
          SET status = ?, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE service_name = 'backups'
        `).bind(backupStatus)
      ]);

      return c.json({
        timestamp: currentTime,
        overall_status: 'operational', // Calculate based on individual services
        services: {
          api_services: {
            name: 'API Services',
            status: apiStatus,
            uptime: `${apiUptime.toFixed(1)}%`,
            response_time: `${Math.round(apiMetrics?.avg_response_time || 0)}ms`,
            details: `${Math.round(apiMetrics?.request_count || 0)} requests/hour`
          },
          database: {
            name: 'Database',
            status: dbStatus,
            uptime: `${dbUptime}%`,
            details: 'Connection stable'
          },
          security_scan: {
            name: 'Security Scan',
            status: securityStatus,
            details: securityDisplay,
            findings: securityScan ? {
              total: securityScan.findings_count,
              critical: securityScan.urgent_findings
            } : null
          },
          backups: {
            name: 'Backups',
            status: backupStatus,
            details: backupDisplay,
            last_size: backupInfo ? `${Math.round(backupInfo.size_bytes / 1024 / 1024)}MB` : null
          }
        }
      });
      
    } catch (error) {
      console.error('Error fetching system health:', error);
      return c.json({
        error: 'Failed to fetch system health',
        timestamp: new Date().toISOString(),
        services: {
          api_services: { name: 'API Services', status: 'unknown', details: 'Health check failed' },
          database: { name: 'Database', status: 'unknown', details: 'Health check failed' },
          security_scan: { name: 'Security Scan', status: 'unknown', details: 'Health check failed' },
          backups: { name: 'Backups', status: 'unknown', details: 'Health check failed' }
        }
      }, 503);
    }
  });

  // Log API performance metric (called by middleware)
  app.post('/metrics/api', async (c) => {
    try {
      const { endpoint, method, response_time_ms, status_code, user_id, ip_address } = await c.req.json();
      
      await c.env.DB.prepare(`
        INSERT INTO api_performance_metrics (endpoint, method, response_time_ms, status_code, user_id, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(endpoint, method, response_time_ms, status_code, user_id, ip_address).run();

      return c.json({ success: true });
    } catch (error) {
      console.error('Error logging API metric:', error);
      return c.json({ error: 'Failed to log metric' }, 500);
    }
  });

  // Trigger security scan (simulate)
  app.post('/scan/security', async (c) => {
    try {
      const { scan_type = 'vulnerability' } = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT INTO security_scan_results (scan_type, status, started_at)
        VALUES (?, 'running', CURRENT_TIMESTAMP)
      `).bind(scan_type).run();

      // Simulate scan completion after 30 seconds (in real app, this would be async)
      // For demo purposes, we'll mark it as completed immediately with mock results
      setTimeout(async () => {
        try {
          await c.env.DB.prepare(`
            UPDATE security_scan_results 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                findings_count = 8,
                critical_count = 0,
                high_count = 1,
                medium_count = 3,
                low_count = 4,
                scan_duration_seconds = 30
            WHERE id = ?
          `).bind(result.meta.last_row_id).run();
        } catch (error) {
          console.error('Error updating scan result:', error);
        }
      }, 2000); // 2 seconds for demo

      return c.json({ 
        success: true, 
        scan_id: result.meta.last_row_id,
        message: 'Security scan started'
      });
    } catch (error) {
      console.error('Error starting security scan:', error);
      return c.json({ error: 'Failed to start scan' }, 500);
    }
  });

  // Trigger backup operation (simulate)
  app.post('/backup/start', async (c) => {
    try {
      const { backup_type = 'database' } = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT INTO backup_operations (backup_type, status, started_at)
        VALUES (?, 'running', CURRENT_TIMESTAMP)
      `).bind(backup_type).run();

      // Simulate backup completion (in real app, this would be async)
      setTimeout(async () => {
        try {
          const sizeBytes = backup_type === 'database' ? 52428800 : 104857600; // 50MB or 100MB
          await c.env.DB.prepare(`
            UPDATE backup_operations 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                size_bytes = ?,
                duration_seconds = 120,
                backup_location = ?
            WHERE id = ?
          `).bind(sizeBytes, `/backups/${backup_type}_${new Date().toISOString().slice(0, 10)}.tar.gz`, result.meta.last_row_id).run();
        } catch (error) {
          console.error('Error updating backup result:', error);
        }
      }, 3000); // 3 seconds for demo

      return c.json({ 
        success: true, 
        backup_id: result.meta.last_row_id,
        message: 'Backup started'
      });
    } catch (error) {
      console.error('Error starting backup:', error);
      return c.json({ error: 'Failed to start backup' }, 500);
    }
  });

  return app;
}