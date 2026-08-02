"""
Collecteur de métriques pour les workflows
"""

import time
import asyncio
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

@dataclass
class WorkflowMetrics:
    """Métriques d'un workflow"""
    workflow_id: str
    workflow_type: str
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    steps: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    success: bool = True
    error: Optional[str] = None
    cache_hit: bool = False
    
    def add_step_metric(self, step_name: str, duration: float, success: bool, **kwargs):
        """Ajoute les métriques d'une étape"""
        self.steps[step_name] = {
            "duration": duration,
            "success": success,
            "timestamp": time.time(),
            **kwargs
        }
    
    def finish(self, success: bool = True, error: Optional[str] = None):
        """Marque le workflow comme terminé"""
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
        self.success = success
        self.error = error

class MetricsCollector:
    """Collecteur de métriques pour les workflows"""
    
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.active_workflows: Dict[str, WorkflowMetrics] = {}
        self.completed_workflows: deque = deque(maxlen=max_history)
        self.aggregated_stats = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def start_workflow(self, workflow_id: str, workflow_type: str) -> WorkflowMetrics:
        """Démarre le tracking d'un workflow"""
        async with self._lock:
            metrics = WorkflowMetrics(
                workflow_id=workflow_id,
                workflow_type=workflow_type,
                start_time=time.time()
            )
            self.active_workflows[workflow_id] = metrics
            
            logger.info(f"📊 Démarrage métriques pour {workflow_id[:8]}... ({workflow_type})")
            return metrics
    
    async def finish_workflow(
        self, 
        workflow_id: str, 
        success: bool = True, 
        error: Optional[str] = None,
        cache_hit: bool = False
    ):
        """Termine le tracking d'un workflow"""
        async with self._lock:
            if workflow_id not in self.active_workflows:
                logger.warning(f"Workflow {workflow_id} non trouvé dans les métriques actives")
                return
            
            metrics = self.active_workflows[workflow_id]
            metrics.finish(success, error)
            metrics.cache_hit = cache_hit
            
            # Déplacer vers l'historique
            self.completed_workflows.append(metrics)
            del self.active_workflows[workflow_id]
            
            # Mettre à jour les stats agrégées
            self.aggregated_stats[metrics.workflow_type].append(metrics.duration)
            
            status = "✅" if success else "❌"
            logger.info(f"📊 {status} Workflow {workflow_id[:8]}... terminé en {metrics.duration:.2f}s")
    
    async def add_step_metric(
        self, 
        workflow_id: str, 
        step_name: str, 
        duration: float, 
        success: bool = True,
        **kwargs
    ):
        """Ajoute les métriques d'une étape"""
        async with self._lock:
            if workflow_id in self.active_workflows:
                self.active_workflows[workflow_id].add_step_metric(
                    step_name, duration, success, **kwargs
                )
    
    async def get_workflow_stats(self, workflow_type: Optional[str] = None) -> Dict[str, Any]:
        """Retourne les statistiques des workflows"""
        async with self._lock:
            if workflow_type:
                workflows = [w for w in self.completed_workflows if w.workflow_type == workflow_type]
            else:
                workflows = list(self.completed_workflows)
            
            if not workflows:
                return {"message": "Aucune donnée disponible"}
            
            durations = [w.duration for w in workflows if w.duration is not None]
            success_count = sum(1 for w in workflows if w.success)
            cache_hits = sum(1 for w in workflows if w.cache_hit)
            
            stats = {
                "total_workflows": len(workflows),
                "success_rate": success_count / len(workflows) if workflows else 0,
                "cache_hit_rate": cache_hits / len(workflows) if workflows else 0,
                "average_duration": sum(durations) / len(durations) if durations else 0,
                "min_duration": min(durations) if durations else 0,
                "max_duration": max(durations) if durations else 0,
                "active_workflows": len(self.active_workflows)
            }
            
            # Stats par type de workflow
            workflow_types = defaultdict(list)
            for w in workflows:
                workflow_types[w.workflow_type].append(w)
            
            stats["by_type"] = {}
            for wf_type, wf_list in workflow_types.items():
                type_durations = [w.duration for w in wf_list if w.duration is not None]
                type_success = sum(1 for w in wf_list if w.success)
                
                stats["by_type"][wf_type] = {
                    "count": len(wf_list),
                    "success_rate": type_success / len(wf_list) if wf_list else 0,
                    "average_duration": sum(type_durations) / len(type_durations) if type_durations else 0
                }
            
            return stats
    
    async def get_recent_workflows(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retourne les workflows récents"""
        async with self._lock:
            recent = list(self.completed_workflows)[-limit:]
            return [
                {
                    "workflow_id": w.workflow_id,
                    "workflow_type": w.workflow_type,
                    "duration": w.duration,
                    "success": w.success,
                    "cache_hit": w.cache_hit,
                    "steps_count": len(w.steps),
                    "timestamp": w.start_time
                }
                for w in recent
            ]

# Instance globale
_metrics_collector = None

def get_metrics_collector() -> MetricsCollector:
    """Récupère l'instance globale du collecteur de métriques"""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector
