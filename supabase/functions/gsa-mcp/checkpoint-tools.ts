import { registerCheckpointClaimTool } from './checkpoint/claim.ts'
import { registerCheckpointVerificationGateTools } from './checkpoint/verification-gate.ts'

// GSA1-S7: Cohesive Checkpoint claim, verification and gate registrations.
export function registerCheckpointTools(deps: any) {
  registerCheckpointClaimTool(deps)
  registerCheckpointVerificationGateTools(deps)
}
