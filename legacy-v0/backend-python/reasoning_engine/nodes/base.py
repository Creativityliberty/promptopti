"""
Nœud de base pour tous les nœuds de raisonnement Nümtema
"""

import logging
import time
from typing import Any, Dict, Optional
from ..workflow import AsyncNode

logger = logging.getLogger(__name__)

class ReasoningNode(AsyncNode):
    """
    Nœud de base pour tous les nœuds de raisonnement.
    Fournit des fonctionnalités communes comme le logging, les métriques, etc.
    """
    
    def __init__(self, name: str, max_retries: int = 3, wait: float = 1.0):
        super().__init__(max_retries=max_retries, wait=wait)
        self.name = name
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        
    async def prep_async(self, shared: Dict[str, Any]) -> Dict[str, Any]:
        """Préparation avant exécution"""
        self.start_time = time.time()
        logger.info(f"🚀 Démarrage du nœud '{self.name}'")
        
        # Validation des données d'entrée
        if not self.validate_input(shared):
            raise ValueError(f"Données d'entrée invalides pour le nœud '{self.name}'")
            
        return await self.prepare_data(shared)
    
    async def post_async(self, shared: Dict[str, Any], prep_res: Any, exec_res: Any) -> Any:
        """Post-traitement après exécution"""
        self.end_time = time.time()
        duration = self.end_time - (self.start_time or 0)
        
        logger.info(f"✅ Nœud '{self.name}' terminé en {duration:.2f}s")
        
        # Mise à jour des métriques
        self.update_metrics(shared, duration, exec_res)
        
        # Validation des données de sortie
        if not self.validate_output(exec_res):
            logger.warning(f"⚠️ Données de sortie invalides pour le nœud '{self.name}'")
            
        return exec_res
    
    async def exec_fallback_async(self, prep_res: Any, exc: Exception) -> Any:
        """Gestion des erreurs avec fallback"""
        logger.error(f"❌ Erreur dans le nœud '{self.name}': {exc}")
        
        # Tentative de récupération
        fallback_result = await self.handle_error(prep_res, exc)
        if fallback_result is not None:
            logger.info(f"🔄 Récupération réussie pour le nœud '{self.name}'")
            return fallback_result
            
        # Si pas de récupération possible, relancer l'erreur
        raise exc
    
    # Méthodes à implémenter par les nœuds spécialisés
    
    async def prepare_data(self, shared: Dict[str, Any]) -> Dict[str, Any]:
        """Prépare les données pour l'exécution"""
        return shared
    
    async def exec_async(self, prep_res: Dict[str, Any]) -> Any:
        """Logique principale du nœud - À implémenter"""
        raise NotImplementedError(f"exec_async doit être implémenté dans {self.__class__.__name__}")
    
    def validate_input(self, shared: Dict[str, Any]) -> bool:
        """Valide les données d'entrée"""
        return True
    
    def validate_output(self, result: Any) -> bool:
        """Valide les données de sortie"""
        return True
    
    async def handle_error(self, prep_res: Any, exc: Exception) -> Optional[Any]:
        """Gère les erreurs et tente une récupération"""
        return None
    
    def update_metrics(self, shared: Dict[str, Any], duration: float, result: Any):
        """Met à jour les métriques du nœud"""
        if 'metrics' not in shared:
            shared['metrics'] = {}
        
        shared['metrics'][self.name] = {
            'duration': duration,
            'success': True,
            'timestamp': time.time()
        }
