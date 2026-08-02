"""
Workflow de raisonnement structuré complet
"""

from ..workflow import AsyncFlow
from ..nodes import PromptAnalysisNode, LLMCallNode, ValidationNode, SynthesisNode

class StructuredReasoningWorkflow(AsyncFlow):
    """
    Workflow complet avec analyse, appel LLM, validation et synthèse
    """
    
    def __init__(self):
        # Créer les nœuds
        analysis_node = PromptAnalysisNode()
        llm_node = LLMCallNode()
        validation_node = ValidationNode()
        synthesis_node = SynthesisNode()
        
        # Chaîner les nœuds
        analysis_node >> llm_node >> validation_node >> synthesis_node
        
        # Initialiser le flow
        super().__init__(start=analysis_node)
        
        self.workflow_type = "structured_reasoning"
        self.estimated_duration = "30-60 secondes"
        self.description = "Raisonnement complet avec validation logique"
    
    async def prep_async(self, shared):
        """Préparation spécifique au workflow structuré"""
        # Vérifier que la clé API est présente
        if 'api_key' not in shared and 'parameters' in shared:
            api_key = shared['parameters'].get('api_key')
            if api_key:
                shared['api_key'] = api_key
        
        return shared
    
    async def _orch_async(self, shared, params=None):
        """Orchestration personnalisée pour le workflow structuré"""
        # Étape 1: Analyse du prompt
        shared['current_step'] = 'prompt_analysis'
        analysis_result = await self.start_node.run_async(shared)
        shared['analysis'] = analysis_result
        
        # Étape 2: Appel LLM
        shared['current_step'] = 'llm_call'
        llm_node = LLMCallNode()
        llm_result = await llm_node.run_async(shared)
        shared['llm_result'] = llm_result
        
        # Étape 3: Validation
        shared['current_step'] = 'validation'
        validation_node = ValidationNode()
        validation_result = await validation_node.run_async(shared)
        shared['validation_result'] = validation_result
        
        # Étape 4: Synthèse
        shared['current_step'] = 'synthesis'
        synthesis_node = SynthesisNode()
        synthesis_result = await synthesis_node.run_async(shared)
        
        return synthesis_result
    
    async def post_async(self, shared, prep_res, exec_res):
        """Post-traitement spécifique au workflow structuré"""
        return {
            'workflow_type': self.workflow_type,
            'synthesis': exec_res,
            'analysis': shared.get('analysis', {}),
            'llm_result': shared.get('llm_result', {}),
            'validation_result': shared.get('validation_result', {}),
            'metrics': shared.get('metrics', {}),
            'status': 'completed'
        }
