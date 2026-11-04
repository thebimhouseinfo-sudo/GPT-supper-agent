// GSA1: cohesive Run Execution registrations (begin, knowledge, goal, verification, completion).
import { registerRunBegin } from './run/run-begin.ts'
import { registerRelationshipKnowledge } from './run/relationship-knowledge.ts'
import { registerGoalRecheck } from './run/goal-recheck.ts'
import { registerRunVerification } from './run/verification.ts'
import { registerRunComplete } from './run/complete.ts'

export function registerRunExecutionTools(deps: any) {
  registerRunBegin(deps)
  registerRelationshipKnowledge(deps)
  registerGoalRecheck(deps)
  registerRunVerification(deps)
  registerRunComplete(deps)
}
