"""
Workflow de validation logique
"""

from ..workflow import AsyncFlow
from ..nodes import PromptAnalysisNode, ValidationNode, SynthesisNode

class LogicalValidationWorkflow(AsyncFlow):
    """
    Workflow focalisé sur la validation logique
    """
    
    def __init__(self):
        # Créer les nœuds
        analysis_node = PromptAnalysisNode()
        validation_node = ValidationNode()
        synthesis_node = SynthesisNode()
        
        # Chaîner les nœuds
        analysis_node >> validation_node >> synthesis_node
        
        # Initialiser le flow
        super().__init__(start=analysis_node)
        
        self.workflow_type = "logical_validation"
        self.estimated_duration = "15-30 secondes"
        self.description = "Focus sur la validation et la cohérence logique"
    
    async def _orch_async(self, shared, params=None):
        """Orchestration personnalisée pour la validation logique"""
        # Étape 1: Analyse du prompt
        shared['current_step'] = 'prompt_analysis'
        analysis_result = await self.start_node.run_async(shared)
        shared['analysis'] = analysis_result
        
        # Créer un résultat LLM basique pour la validation
        shared['llm_result'] = {
            'llm_response': {
                'reasoning_steps': [
                    {
                        'step': 1,
                        'description': 'Analyse du prompt',
                        'reasoning': f"Le prompt demande: {shared.get('original_prompt', '')}",
                        'conclusion': 'Analyse préliminaire effectuée'
                    }
                ],
                'final_answer': 'Analyse basée sur la validation logique',
                'confidence_level': 'medium',
                'assumptions': ['Analyse basée uniquement sur la structure du prompt'],
                'limitations': ['Pas d\'appel LLM complet'],
                'next_steps': ['Effectuer une analyse plus approfondie si nécessaire']
            }
        }
        
        # Étape 2: Validation
        shared['current_step'] = 'validation'
        validation_node = ValidationNode()
        validation_result = await validation_node.run_async(shared)
        shared['validation_result'] = validation_result
        
        # Étape 3: Synthèse
        shared['current_step'] = 'synthesis'
        synthesis_node = SynthesisNode()
        synthesis_result = await synthesis_node.run_async(shared)
        
        return synthesis_result
    
    async def post_async(self, shared, prep_res, exec_res):
        """Post-traitement spécifique au workflow de validation"""
        return {
            'workflow_type': self.workflow_type,
            'synthesis': exec_res,
            'analysis': shared.get('analysis', {}),
            'validation_result': shared.get('validation_result', {}),
            'metrics': shared.get('metrics', {}),
            'status': 'completed',
            'note': 'Workflow focalisé sur la validation logique'
        }
