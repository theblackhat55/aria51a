/**
 * ARIA5 Continuous Compliance Monitoring Engine
 * 
 * Provides real-time compliance monitoring capabilities including:
 * - Continuous control monitoring and alerting
 * - Anomaly detection and drift analysis  
 * - Automated threshold monitoring
 * - Intelligent alert prioritization
 * - Proactive risk identification
 */

export interface MonitoringRule {
  ruleId: string;
  name: string;
  frameworkId: number;
  controlIds: number[];
  ruleType: 'threshold' | 'anomaly' | 'compliance_drift' | 'certification_expiry' | 'control_failure';
  monitoringQuery: any;
  checkFrequency: number; // seconds
  alertConditions: any;
  severityLevels: any;
  isActive: boolean;
}

export interface ComplianceAlert {
  alertId: string;
  ruleId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggerData: any;
  affectedControls: number[];
  riskAssessment: any;
  aiAnalysis?: any;
  suggestedActions?: any[];
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
  createdAt: Date;
}

export interface MonitoringMetrics {
  totalRules: number;
  activeRules: number;
  alertsLast24h: number;
  criticalAlerts: number;
  averageResolutionTime: number;
  complianceDrift: number;
  monitoringCoverage: number;
}

export class ComplianceMonitoringEngine {
  private db: D1Database;

  constructor(database: D1Database) {
    this.db = database;
  }

  /**
   * Create a new monitoring rule
   */
  async createMonitoringRule(rule: Partial<MonitoringRule>, createdBy: number): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await this.db.prepare(`
      INSERT INTO compliance_monitoring_rules
      (rule_id, framework_id, control_ids, rule_name, rule_description, rule_type,
       monitoring_query, check_frequency, alert_conditions, severity_levels, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ruleId,
      rule.frameworkId,
      JSON.stringify(rule.controlIds || []),
      rule.name,
      `Automated monitoring rule for ${rule.ruleType}`,
      rule.ruleType,
      JSON.stringify(rule.monitoringQuery || {}),
      rule.checkFrequency || 3600, // Default 1 hour
      JSON.stringify(rule.alertConditions || {}),
      JSON.stringify(rule.severityLevels || { default: 'medium' }),
      rule.isActive !== false
    ).run();

    return ruleId;
  }

  /**
   * Execute monitoring checks for all active rules
   */
  async runMonitoringChecks(): Promise<ComplianceAlert[]> {
    const rules = await this.getActiveMonitoringRules();
    const alerts: ComplianceAlert[] = [];

    for (const rule of rules) {
      try {
        const ruleAlerts = await this.executeMonitoringRule(rule);
        alerts.push(...ruleAlerts);
      } catch (error) {
        console.error(`Failed to execute monitoring rule ${rule.ruleId}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Execute a specific monitoring rule
   */
  private async executeMonitoringRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    switch (rule.ruleType) {
      case 'threshold':
        alerts.push(...await this.checkThresholdRule(rule));
        break;
      case 'anomaly':
        alerts.push(...await this.checkAnomalyRule(rule));
        break;
      case 'compliance_drift':
        alerts.push(...await this.checkComplianceDriftRule(rule));
        break;
      case 'certification_expiry':
        alerts.push(...await this.checkCertificationExpiryRule(rule));
        break;
      case 'control_failure':
        alerts.push(...await this.checkControlFailureRule(rule));
        break;
    }

    // Store alerts in database
    for (const alert of alerts) {
      await this.createAlert(alert, rule.ruleId);
    }

    return alerts;
  }

  /**
   * Check threshold-based monitoring rules
   */
  private async checkThresholdRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];
    const conditions = rule.alertConditions;

    // Get current compliance metrics for controlled controls
    const metrics = await this.db.prepare(`
      SELECT 
        c.id,
        c.control_id,
        c.title,
        c.implementation_status,
        c.implementation_progress,
        c.risk_level,
        COUNT(tr.id) as recent_test_failures
      FROM compliance_controls c
      LEFT JOIN compliance_test_results tr ON c.id = tr.test_id 
        AND tr.status = 'fail' 
        AND tr.executed_at > datetime('now', '-7 days')
      WHERE c.id IN (${rule.controlIds.map(() => '?').join(',')})
      GROUP BY c.id
    `).bind(...rule.controlIds).all();

    for (const metric of metrics.results || []) {
      // Check implementation progress threshold
      if (conditions.minImplementationProgress && 
          metric.implementation_progress < conditions.minImplementationProgress) {
        alerts.push({
          alertId: `threshold_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.ruleId,
          alertType: 'implementation_below_threshold',
          severity: this.calculateSeverity(metric.implementation_progress, conditions.minImplementationProgress),
          title: `Implementation Progress Below Threshold`,
          description: `Control ${metric.control_id} implementation at ${metric.implementation_progress}%, below threshold of ${conditions.minImplementationProgress}%`,
          triggerData: { currentProgress: metric.implementation_progress, threshold: conditions.minImplementationProgress },
          affectedControls: [metric.id],
          riskAssessment: {
            riskLevel: metric.risk_level,
            impact: 'medium',
            likelihood: 'high'
          },
          suggestedActions: [
            'Review implementation plan',
            'Allocate additional resources',
            'Identify blocking issues'
          ],
          status: 'open',
          createdAt: new Date()
        });
      }

      // Check test failure threshold
      if (conditions.maxTestFailures && 
          metric.recent_test_failures > conditions.maxTestFailures) {
        alerts.push({
          alertId: `threshold_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.ruleId,
          alertType: 'test_failures_threshold',
          severity: 'high',
          title: `Excessive Test Failures Detected`,
          description: `Control ${metric.control_id} has ${metric.recent_test_failures} test failures in the last 7 days, exceeding threshold of ${conditions.maxTestFailures}`,
          triggerData: { failureCount: metric.recent_test_failures, threshold: conditions.maxTestFailures },
          affectedControls: [metric.id],
          riskAssessment: {
            riskLevel: 'high',
            impact: 'high',
            likelihood: 'high'
          },
          suggestedActions: [
            'Investigate root cause of failures',
            'Review control implementation',
            'Update test procedures if necessary'
          ],
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check anomaly detection rules
   */
  private async checkAnomalyRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Get historical performance data for anomaly detection
    const historicalData = await this.db.prepare(`
      SELECT 
        DATE(tr.executed_at) as test_date,
        COUNT(*) as total_tests,
        COUNT(CASE WHEN tr.status = 'pass' THEN 1 END) as passed_tests,
        COUNT(CASE WHEN tr.status = 'fail' THEN 1 END) as failed_tests,
        AVG(CASE WHEN tr.status = 'pass' THEN 1.0 ELSE 0.0 END) as pass_rate
      FROM compliance_test_results tr
      JOIN compliance_automated_tests at ON tr.test_id = at.id
      JOIN compliance_controls c ON at.control_id = c.id
      WHERE c.id IN (${rule.controlIds.map(() => '?').join(',')})
        AND tr.executed_at > datetime('now', '-30 days')
      GROUP BY DATE(tr.executed_at)
      ORDER BY test_date DESC
    `).bind(...rule.controlIds).all();

    const data = historicalData.results || [];
    
    if (data.length >= 7) { // Need at least a week of data
      const recentPassRate = data[0]?.pass_rate || 0;
      const historicalAverage = data.slice(1, 8).reduce((sum: number, day: any) => sum + day.pass_rate, 0) / 7;
      const threshold = rule.alertConditions.anomalyThreshold || 0.2; // 20% deviation

      if (Math.abs(recentPassRate - historicalAverage) > threshold) {
        alerts.push({
          alertId: `anomaly_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.ruleId,
          alertType: 'compliance_anomaly',
          severity: recentPassRate < historicalAverage ? 'high' : 'medium',
          title: 'Compliance Performance Anomaly Detected',
          description: `Unusual change in compliance test performance. Current pass rate: ${(recentPassRate * 100).toFixed(1)}%, Historical average: ${(historicalAverage * 100).toFixed(1)}%`,
          triggerData: { 
            currentPassRate: recentPassRate, 
            historicalAverage, 
            deviation: Math.abs(recentPassRate - historicalAverage) 
          },
          affectedControls: rule.controlIds,
          riskAssessment: {
            riskLevel: recentPassRate < historicalAverage ? 'high' : 'medium',
            impact: 'medium',
            likelihood: 'medium'
          },
          aiAnalysis: {
            confidence: 0.85,
            analysis: 'Statistical anomaly detected in compliance testing patterns',
            rootCauseHypotheses: [
              'Environmental changes affecting test execution',
              'Process changes impacting compliance',
              'System configuration changes'
            ]
          },
          suggestedActions: [
            'Investigate recent changes to systems or processes',
            'Review test execution logs',
            'Validate test configuration and parameters'
          ],
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check compliance drift rules
   */
  private async checkComplianceDriftRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Calculate compliance drift by comparing current state to baseline
    const driftAnalysis = await this.db.prepare(`
      SELECT 
        c.id,
        c.control_id,
        c.title,
        c.implementation_status,
        c.implementation_progress,
        c.updated_at,
        COALESCE(
          (SELECT implementation_progress 
           FROM ai_compliance_assessments aca 
           WHERE aca.control_id = c.id 
           ORDER BY created_at DESC LIMIT 1), 
          c.implementation_progress
        ) as ai_assessed_progress
      FROM compliance_controls c
      WHERE c.id IN (${rule.controlIds.map(() => '?').join(',')})
        AND c.updated_at < datetime('now', '-7 days')
    `).bind(...rule.controlIds).all();

    for (const control of driftAnalysis.results || []) {
      const progressDrift = Math.abs(control.implementation_progress - control.ai_assessed_progress);
      const driftThreshold = rule.alertConditions.maxDrift || 15; // 15% default

      if (progressDrift > driftThreshold) {
        alerts.push({
          alertId: `drift_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.ruleId,
          alertType: 'compliance_drift',
          severity: progressDrift > 25 ? 'high' : 'medium',
          title: 'Compliance Drift Detected',
          description: `Control ${control.control_id} shows ${progressDrift.toFixed(1)}% drift between recorded and assessed implementation progress`,
          triggerData: { 
            recordedProgress: control.implementation_progress,
            assessedProgress: control.ai_assessed_progress,
            drift: progressDrift
          },
          affectedControls: [control.id],
          riskAssessment: {
            riskLevel: 'medium',
            impact: 'medium',
            likelihood: 'high'
          },
          suggestedActions: [
            'Update implementation progress records',
            'Re-assess control implementation',
            'Review control maintenance procedures'
          ],
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check certification expiry rules
   */
  private async checkCertificationExpiryRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Check for upcoming certification expirations
    const expirations = await this.db.prepare(`
      SELECT 
        f.id,
        f.name,
        f.regulatory_body,
        COUNT(c.id) as total_controls,
        COUNT(CASE WHEN c.implementation_status = 'implemented' THEN 1 END) as implemented_controls
      FROM compliance_frameworks f
      JOIN compliance_controls c ON f.id = c.framework_id
      WHERE f.id = ?
      GROUP BY f.id
    `).bind(rule.frameworkId).first();

    if (expirations) {
      const implementationRate = (expirations.implemented_controls / expirations.total_controls) * 100;
      const requiredRate = rule.alertConditions.minCertificationReadiness || 95;

      if (implementationRate < requiredRate) {
        alerts.push({
          alertId: `cert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.ruleId,
          alertType: 'certification_readiness',
          severity: implementationRate < 80 ? 'critical' : 'high',
          title: 'Certification Readiness Alert',
          description: `Framework ${expirations.name} at ${implementationRate.toFixed(1)}% implementation, below required ${requiredRate}% for certification`,
          triggerData: { 
            implementationRate,
            requiredRate,
            implementedControls: expirations.implemented_controls,
            totalControls: expirations.total_controls
          },
          affectedControls: rule.controlIds,
          riskAssessment: {
            riskLevel: 'high',
            impact: 'high',
            likelihood: 'medium'
          },
          suggestedActions: [
            'Prioritize incomplete control implementations',
            'Schedule certification readiness review',
            'Engage with certification body'
          ],
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check control failure rules
   */
  private async checkControlFailureRule(rule: MonitoringRule): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Check for repeated control test failures
    const failures = await this.db.prepare(`
      SELECT 
        c.id,
        c.control_id,
        c.title,
        c.risk_level,
        COUNT(tr.id) as failure_count,
        MAX(tr.executed_at) as last_failure
      FROM compliance_controls c
      JOIN compliance_automated_tests at ON c.id = at.control_id
      JOIN compliance_test_results tr ON at.id = tr.test_id
      WHERE c.id IN (${rule.controlIds.map(() => '?').join(',')})
        AND tr.status = 'fail'
        AND tr.executed_at > datetime('now', '-7 days')
      GROUP BY c.id
      HAVING COUNT(tr.id) >= ?
    `).bind(...rule.controlIds, rule.alertConditions.maxConsecutiveFailures || 3).all();

    for (const failure of failures.results || []) {
      alerts.push({
        alertId: `failure_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ruleId: rule.ruleId,
        alertType: 'control_failure',
        severity: failure.risk_level === 'critical' ? 'critical' : 'high',
        title: 'Repeated Control Test Failures',
        description: `Control ${failure.control_id} has failed ${failure.failure_count} times in the last 7 days`,
        triggerData: { 
          failureCount: failure.failure_count,
          lastFailure: failure.last_failure,
          riskLevel: failure.risk_level
        },
        affectedControls: [failure.id],
        riskAssessment: {
          riskLevel: failure.risk_level,
          impact: 'high',
          likelihood: 'high'
        },
        suggestedActions: [
          'Immediate investigation required',
          'Review control implementation',
          'Consider control redesign or replacement'
        ],
        status: 'open',
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Get active monitoring rules
   */
  private async getActiveMonitoringRules(): Promise<MonitoringRule[]> {
    const rules = await this.db.prepare(`
      SELECT * FROM compliance_monitoring_rules 
      WHERE is_active = 1
    `).all();

    return (rules.results || []).map(rule => ({
      ruleId: rule.rule_id,
      name: rule.rule_name,
      frameworkId: rule.framework_id,
      controlIds: JSON.parse(rule.control_ids as string),
      ruleType: rule.rule_type as any,
      monitoringQuery: JSON.parse(rule.monitoring_query as string),
      checkFrequency: rule.check_frequency,
      alertConditions: JSON.parse(rule.alert_conditions as string),
      severityLevels: JSON.parse(rule.severity_levels as string),
      isActive: rule.is_active
    }));
  }

  /**
   * Create an alert in the database
   */
  private async createAlert(alert: ComplianceAlert, ruleId: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO compliance_monitoring_alerts
      (alert_id, rule_id, alert_type, severity, title, description, trigger_data,
       affected_controls, risk_assessment, ai_analysis, suggested_actions, status)
      VALUES (?, (SELECT id FROM compliance_monitoring_rules WHERE rule_id = ?), 
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.alertId,
      ruleId,
      alert.alertType,
      alert.severity,
      alert.title,
      alert.description,
      JSON.stringify(alert.triggerData),
      JSON.stringify(alert.affectedControls),
      JSON.stringify(alert.riskAssessment),
      JSON.stringify(alert.aiAnalysis || {}),
      JSON.stringify(alert.suggestedActions || []),
      alert.status
    ).run();
  }

  /**
   * Calculate severity based on threshold breach
   */
  private calculateSeverity(current: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const deviation = Math.abs(current - threshold) / threshold;
    
    if (deviation >= 0.5) return 'critical';
    if (deviation >= 0.3) return 'high';
    if (deviation >= 0.15) return 'medium';
    return 'low';
  }

  /**
   * Get monitoring metrics and dashboard data
   */
  async getMonitoringMetrics(): Promise<MonitoringMetrics> {
    const [ruleStats, alertStats, avgResolution] = await Promise.all([
      this.db.prepare(`
        SELECT 
          COUNT(*) as total_rules,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_rules
        FROM compliance_monitoring_rules
      `).first(),
      
      this.db.prepare(`
        SELECT 
          COUNT(*) as alerts_24h,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts
        FROM compliance_monitoring_alerts
        WHERE created_at > datetime('now', '-24 hours')
      `).first(),
      
      this.db.prepare(`
        SELECT AVG(
          (julianday(resolved_at) - julianday(created_at)) * 24 * 60
        ) as avg_resolution_minutes
        FROM compliance_monitoring_alerts
        WHERE status = 'resolved' 
          AND resolved_at > datetime('now', '-30 days')
      `).first()
    ]);

    return {
      totalRules: ruleStats?.total_rules || 0,
      activeRules: ruleStats?.active_rules || 0,
      alertsLast24h: alertStats?.alerts_24h || 0,
      criticalAlerts: alertStats?.critical_alerts || 0,
      averageResolutionTime: avgResolution?.avg_resolution_minutes || 0,
      complianceDrift: 0, // Would be calculated based on historical data
      monitoringCoverage: 0 // Would be calculated based on controls covered
    };
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 20): Promise<ComplianceAlert[]> {
    const alerts = await this.db.prepare(`
      SELECT a.*, r.rule_name
      FROM compliance_monitoring_alerts a
      JOIN compliance_monitoring_rules r ON a.rule_id = r.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return (alerts.results || []).map(alert => ({
      alertId: alert.alert_id,
      ruleId: alert.rule_id,
      alertType: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      triggerData: JSON.parse(alert.trigger_data as string),
      affectedControls: JSON.parse(alert.affected_controls as string),
      riskAssessment: JSON.parse(alert.risk_assessment as string),
      aiAnalysis: JSON.parse(alert.ai_analysis as string || '{}'),
      suggestedActions: JSON.parse(alert.suggested_actions as string || '[]'),
      status: alert.status,
      createdAt: new Date(alert.created_at)
    }));
  }

  /**
   * Setup default monitoring rules for a framework
   */
  async setupDefaultMonitoringRules(frameworkId: number): Promise<string[]> {
    const ruleIds: string[] = [];

    // Get all controls for the framework
    const controls = await this.db.prepare(`
      SELECT id FROM compliance_controls WHERE framework_id = ?
    `).bind(frameworkId).all();

    const controlIds = (controls.results || []).map(c => c.id);

    // Rule 1: Implementation Progress Monitoring
    const progressRule = await this.createMonitoringRule({
      name: 'Implementation Progress Monitoring',
      frameworkId,
      controlIds,
      ruleType: 'threshold',
      monitoringQuery: { type: 'implementation_progress' },
      checkFrequency: 86400, // Daily
      alertConditions: {
        minImplementationProgress: 70,
        maxTestFailures: 5
      },
      severityLevels: { default: 'medium' },
      isActive: true
    }, 1);
    ruleIds.push(progressRule);

    // Rule 2: Anomaly Detection
    const anomalyRule = await this.createMonitoringRule({
      name: 'Compliance Performance Anomaly Detection',
      frameworkId,
      controlIds,
      ruleType: 'anomaly',
      monitoringQuery: { type: 'performance_anomaly' },
      checkFrequency: 43200, // Twice daily
      alertConditions: {
        anomalyThreshold: 0.2, // 20% deviation
        minDataPoints: 7
      },
      severityLevels: { default: 'medium' },
      isActive: true
    }, 1);
    ruleIds.push(anomalyRule);

    // Rule 3: Compliance Drift Detection
    const driftRule = await this.createMonitoringRule({
      name: 'Compliance Drift Detection',
      frameworkId,
      controlIds,
      ruleType: 'compliance_drift',
      monitoringQuery: { type: 'drift_analysis' },
      checkFrequency: 604800, // Weekly
      alertConditions: {
        maxDrift: 15, // 15% drift threshold
      },
      severityLevels: { default: 'medium' },
      isActive: true
    }, 1);
    ruleIds.push(driftRule);

    return ruleIds;
  }
}

export default ComplianceMonitoringEngine;