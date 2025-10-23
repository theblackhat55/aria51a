/**
 * Platform Resources (Placeholder for Phase 2)
 */
import type { MCPResource } from '../types/mcp-types';

export const riskRegisterResource: MCPResource = {
  uri: 'risk_register://current',
  name: 'Current Risk Register',
  description: 'Current state of risk register',
  mimeType: 'application/json',
  async fetch(env: any) {
    return { uri: 'risk_register://current', mimeType: 'application/json', text: '{"message": "Phase 2"}' };
  }
};

export const complianceFrameworkResource: MCPResource = {
  uri: 'compliance://frameworks',
  name: 'Compliance Frameworks',
  description: 'Available compliance frameworks',
  mimeType: 'application/json',
  async fetch(env: any) {
    return { uri: 'compliance://frameworks', mimeType: 'application/json', text: '{"message": "Phase 2"}' };
  }
};
