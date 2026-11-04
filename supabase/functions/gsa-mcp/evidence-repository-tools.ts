import { registerEvidencePublishPrepare } from './evidence-repo/publish-prepare.ts'
import { registerEvidencePublishFinalize } from './evidence-repo/publish-finalize.ts'
import { registerEvidenceProbe } from './evidence-repo/probe.ts'

export function registerRepositoryEvidenceTools(deps: any) {
  registerEvidencePublishPrepare(deps)
  registerEvidencePublishFinalize(deps)
  registerEvidenceProbe(deps)
}
