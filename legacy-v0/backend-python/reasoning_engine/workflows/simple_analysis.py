"""
Workflow d'analyse simple
"""

from ..workflow import AsyncFlow
from ..nodes import PromptAnalysisNode

class SimpleAnalysisWorkflow(AsyncFlow):
    """
    Workflow simple qui effectue uniquement l'analyse du prompt
    """
    
    def __init__(self):
        # Créer le nœud d'analyse
        analysis_node = PromptAnalysisNode()
        
        # Initialiser le flow avec le nœud de départ
        super().__init__(start=analysis_node)
        
        self.workflow_type = "simple_analysis"
        self.estimated_duration = "5-10 secondes"
        self.description = "Analyse basique du prompt avec extraction d'informations"
    
    async def post_async(self, shared, prep_res, exec_res):
        """Post-traitement spécifique au workflow simple"""
        return {
            'workflow_type': self.workflow_type,
            'analysis': exec_res,
            'metrics': shared.get('metrics', {}),
            'status': 'completed'
        }
