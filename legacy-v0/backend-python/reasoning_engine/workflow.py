"""
Gestionnaire de workflows avec optimisations
"""

import asyncio
import uuid
import time
import logging
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass

from .nodes.base import BaseNode
from .nodes.prompt_analysis import PromptAnalysisNode
from .nodes.llm_call import LLMCallNode
from .nodes.validation import ValidationNode
from .nodes.synthesis import SynthesisNode
from .cache.memory_cache import get_memory_cache
from .performance.metrics import get_metrics_collector

logger = logging.getLogger(__name__)

class WorkflowStatus(Enum):
    """États possibles d'un workflow"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"

@dataclass
class WorkflowResult:
    """Résultat d'un workflow"""
    workflow_id: str
    status: WorkflowStatus
    progress: float
    current_step: Optional[str]
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    start_time: float
    end_time: Optional[float]
    cache_hit: bool = False

class OptimizedWorkflowEngine:
    """Moteur de workflow optimisé avec cache et métriques"""
    
    def __init__(self):
        self.active_workflows: Dict[str, WorkflowResult] = {}
        self.cache = get_memory_cache()
        self.metrics = get_metrics_collector()
        self._lock = asyncio.Lock()
        
        # Workflows prédéfinis
        self.workflow_definitions = {
            "simple_analysis": {
                "name": "Analyse Simple",
                "description": "Analyse rapide du prompt avec extraction d'informations clés",
                "steps": ["prompt_analysis"],
                "estimated_duration": "10-20 secondes",
                "nodes": [PromptAnalysisNode()]
            },
            "structured_reasoning": {
                "name": "Raisonnement Structuré",
                "description": "Workflow complet avec analyse, raisonnement LLM, validation et synthèse",
                "steps": ["prompt_analysis", "llm_call", "validation", "synthesis"],
                "estimated_duration": "60-120 secondes",
                "nodes": [
                    PromptAnalysisNode(),
                    LLMCallNode(),
                    ValidationNode(),
                    SynthesisNode()
                ]
            },
            "logical_validation": {
                "name": "Validation Logique",
                "description": "Focus sur la validation logique et la détection de contradictions",
                "steps": ["prompt_analysis", "validation", "synthesis"],
                "estimated_duration": "30-60 secondes",
                "nodes": [
                    PromptAnalysisNode(),
                    ValidationNode(),
                    SynthesisNode()
                ]
            }
        }
    
    async def execute_workflow(
        self,
        prompt: str,
        workflow_type: str,
        parameters: Dict[str, Any],
        progress_callback: Optional[Callable] = None
    ) -> str:
        """
        Exécute un workflow de manière optimisée
        """
        workflow_id = str(uuid.uuid4())
        
        # Vérifier le cache d'abord
        cached_result = await self.cache.get(prompt, workflow_type, parameters)
        if cached_result:
            logger.info(f"🎯 Résultat trouvé en cache pour {workflow_id[:8]}...")
            
            # Créer un résultat "instantané" depuis le cache
            workflow_result = WorkflowResult(
                workflow_id=workflow_id,
                status=WorkflowStatus.COMPLETED,
                progress=1.0,
                current_step="cache_hit",
                result=cached_result,
                error=None,
                start_time=time.time(),
                end_time=time.time(),
                cache_hit=True
            )
            
            async with self._lock:
                self.active_workflows[workflow_id] = workflow_result
            
            # Enregistrer les métriques
            await self.metrics.finish_workflow(workflow_id, True, None, cache_hit=True)
            
            return workflow_id
        
        # Initialiser le workflow
        workflow_result = WorkflowResult(
            workflow_id=workflow_id,
            status=WorkflowStatus.RUNNING,
            progress=0.0,
            current_step="initialization",
            result=None,
            error=None,
            start_time=time.time(),
            end_time=None
        )
        
        async with self._lock:
            self.active_workflows[workflow_id] = workflow_result
        
        # Démarrer les métriques
        await self.metrics.start_workflow(workflow_id, workflow_type)
        
        # Exécuter le workflow en arrière-plan
        asyncio.create_task(self._execute_workflow_async(
            workflow_id, prompt, workflow_type, parameters, progress_callback
        ))
        
        return workflow_id
    
    async def _execute_workflow_async(
        self,
        workflow_id: str,
        prompt: str,
        workflow_type: str,
        parameters: Dict[str, Any],
        progress_callback: Optional[Callable] = None
    ):
        """Exécution asynchrone du workflow"""
        try:
            # Récupérer la définition du workflow
            if workflow_type not in self.workflow_definitions:
                raise ValueError(f"Type de workflow inconnu: {workflow_type}")
            
            definition = self.workflow_definitions[workflow_type]
            nodes = definition["nodes"]
            
            # Données partagées
            shared_data = {
                "original_prompt": prompt,
                "workflow_type": workflow_type,
                "parameters": parameters,
                "workflow_id": workflow_id,
                "metrics": {}
            }
            
            # Exécuter chaque nœud
            total_steps = len(nodes)
            for i, node in enumerate(nodes):
                step_name = node.__class__.__name__.replace("Node", "").lower()
                
                # Mettre à jour le statut
                progress = (i + 0.5) / total_steps
                await self._update_workflow_status(
                    workflow_id, 
                    progress=progress, 
                    current_step=step_name
                )
                
                if progress_callback:
                    await progress_callback(workflow_id, progress, step_name)
                
                # Exécuter le nœud avec métriques
                step_start = time.time()
                try:
                    logger.info(f"🔄 Exécution de {step_name} pour {workflow_id[:8]}...")
                    shared_data = await node.process_async(shared_data)
                    step_duration = time.time() - step_start
                    
                    # Enregistrer les métriques de l'étape
                    await self.metrics.add_step_metric(
                        workflow_id, step_name, step_duration, True
                    )
                    
                    logger.info(f"✅ {step_name} terminé en {step_duration:.2f}s")
                    
                except Exception as e:
                    step_duration = time.time() - step_start
                    await self.metrics.add_step_metric(
                        workflow_id, step_name, step_duration, False, error=str(e)
                    )
                    raise
            
            # Workflow terminé avec succès
            await self._update_workflow_status(
                workflow_id,
                status=WorkflowStatus.COMPLETED,
                progress=1.0,
                current_step="completed",
                result=shared_data
            )
            
            # Mettre en cache le résultat
            await self.cache.set(prompt, workflow_type, parameters, shared_data)
            
            # Finaliser les métriques
            await self.metrics.finish_workflow(workflow_id, True)
            
            logger.info(f"🎉 Workflow {workflow_id[:8]}... terminé avec succès")
            
        except Exception as e:
            logger.error(f"❌ Erreur dans le workflow {workflow_id[:8]}...: {e}")
            
            await self._update_workflow_status(
                workflow_id,
                status=WorkflowStatus.ERROR,
                error=str(e)
            )
            
            # Finaliser les métriques avec erreur
            await self.metrics.finish_workflow(workflow_id, False, str(e))
    
    async def _update_workflow_status(
        self,
        workflow_id: str,
        status: Optional[WorkflowStatus] = None,
        progress: Optional[float] = None,
        current_step: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """Met à jour le statut d'un workflow"""
        async with self._lock:
            if workflow_id in self.active_workflows:
                workflow = self.active_workflows[workflow_id]
                
                if status is not None:
                    workflow.status = status
                if progress is not None:
                    workflow.progress = progress
                if current_step is not None:
                    workflow.current_step = current_step
                if result is not None:
                    workflow.result = result
                if error is not None:
                    workflow.error = error
                
                if status in [WorkflowStatus.COMPLETED, WorkflowStatus.ERROR, WorkflowStatus.CANCELLED]:
                    workflow.end_time = time.time()
    
    async def get_workflow_status(self, workflow_id: str) -> Optional[WorkflowResult]:
        """Récupère le statut d'un workflow"""
        async with self._lock:
            return self.active_workflows.get(workflow_id)
    
    async def cancel_workflow(self, workflow_id: str) -> bool:
        """Annule un workflow"""
        async with self._lock:
            if workflow_id in self.active_workflows:
                workflow = self.active_workflows[workflow_id]
                if workflow.status == WorkflowStatus.RUNNING:
                    workflow.status = WorkflowStatus.CANCELLED
                    workflow.end_time = time.time()
                    
                    # Finaliser les métriques
                    await self.metrics.finish_workflow(workflow_id, False, "Cancelled by user")
                    
                    logger.info(f"🛑 Workflow {workflow_id[:8]}... annulé")
                    return True
            return False
    
    async def get_workflow_types(self) -> Dict[str, Any]:
        """Retourne les types de workflows disponibles"""
        return {
            key: {
                "name": definition["name"],
                "description": definition["description"],
                "steps": definition["steps"],
                "estimated_duration": definition["estimated_duration"]
            }
            for key, definition in self.workflow_definitions.items()
        }
    
    async def get_performance_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques de performance"""
        cache_stats = await self.cache.get_stats()
        workflow_stats = await self.metrics.get_workflow_stats()
        
        return {
            "cache": cache_stats,
            "workflows": workflow_stats,
            "active_workflows": len(self.active_workflows)
        }

# Instance globale
_workflow_engine = None

def get_workflow_engine() -> OptimizedWorkflowEngine:
    """Récupère l'instance globale du moteur de workflow"""
    global _workflow_engine
    if _workflow_engine is None:
        _workflow_engine = OptimizedWorkflowEngine()
    return _workflow_engine
