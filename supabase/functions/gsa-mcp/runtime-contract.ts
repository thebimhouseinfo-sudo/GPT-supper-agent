import { edgeFunctionSlug } from './platform-utils.ts'

export const EXECUTION_CONTRACT_VALUES = ['V2_STABLE', 'NEXT'] as const
export type ExecutionContract = typeof EXECUTION_CONTRACT_VALUES[number]
export const DEFAULT_EXECUTION_CONTRACT: ExecutionContract = 'V2_STABLE'

export const NEXT_MEMORY_NAMESPACE_VALUES = ['TEST_LAB', 'PRODUCTION'] as const
export type NextMemoryNamespace = typeof NEXT_MEMORY_NAMESPACE_VALUES[number]
export const DEFAULT_NEXT_MEMORY_NAMESPACE: NextMemoryNamespace = 'TEST_LAB'

export function resolveExecutionContract(value: unknown): ExecutionContract | null {
  if (value == null || value === '') return DEFAULT_EXECUTION_CONTRACT
  return value === 'V2_STABLE' || value === 'NEXT' ? value : null
}

export function jobExecutionContract(job: any): ExecutionContract | null {
  return resolveExecutionContract(job?.execution_contract)
}


export function invalidExecutionContract() {
  return {
    content: [{ type: 'text' as const, text: 'Invalid execution_contract. Expected V2_STABLE or NEXT; missing defaults to V2_STABLE.' }],
    isError: true,
  }
}



export function runtimeSurface(req: Request) {
  return edgeFunctionSlug(req) === 'gsa-mcp' ? 'PRODUCTION' as const : 'STAGING_NEXT' as const
}

export function jobCreationExecutionContractDefault(req: Request): ExecutionContract {
  return runtimeSurface(req) === 'PRODUCTION' ? 'NEXT' : 'V2_STABLE'
}

export function nextMemoryNamespaceForRequest(req: Request): NextMemoryNamespace {
  return runtimeSurface(req) === 'PRODUCTION' ? 'PRODUCTION' : 'TEST_LAB'
}
