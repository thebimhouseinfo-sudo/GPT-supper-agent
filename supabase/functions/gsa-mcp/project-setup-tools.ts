// GSA1-S4: Project setup/advice/addins/bootstrap preparation/branch policy tools.
import { registerProjectSetupPrepare } from './project-setup/setup.ts'
import { registerProjectCriteriaAdviceCheck } from './project-setup/criteria-advice.ts'
import { registerProjectRoleAddinsResolve } from './project-setup/role-addins.ts'
import { registerProjectBootstrapChecklistPrepare } from './project-setup/bootstrap-checklist.ts'
import { registerProjectBootstrapReadinessPrepare } from './project-setup/bootstrap-readiness.ts'
import { registerProjectBranchPolicyPrepare } from './project-setup/branch-policy.ts'
import { registerWorkingBranchTools } from './project-setup/working-branch.ts'

export function registerProjectSetupTools(deps: any) {
  registerProjectSetupPrepare(deps)
  registerProjectCriteriaAdviceCheck(deps)
  registerProjectRoleAddinsResolve(deps)
  registerProjectBootstrapChecklistPrepare(deps)
  registerProjectBootstrapReadinessPrepare(deps)
  registerProjectBranchPolicyPrepare(deps)
  registerWorkingBranchTools(deps)
}
