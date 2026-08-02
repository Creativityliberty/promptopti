"""
Routes API optimisées avec cache et métriques
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from ..workflow import get_workflow_engine, WorkflowStatus
from ..cache.memory_cache import get_memory_cache
from ..performance.metrics import get_metrics_collector

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/reasoning", tags=["reasoning"])

# Modèles Pydantic
class WorkflowRequest(BaseModel):
    prompt: str
    workflow_type: str
    parameters: Dict[str, Any] = {}

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    message: str

# Instance du moteur
workflow_engine = get_workflow_engine()
cache = get_memory_cache()
metrics = get_metrics_collector()

@router.post("/execute", response_model=WorkflowResponse)
async def execute_workflow(request: WorkflowRequest):
    """
    Exécute un workflow de raisonnement
    """
    try:
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt requis")
        
        if request.workflow_type not in ["simple_analysis", "structured_reasoning", "logical_validation"]:
            raise HTTPException(status_code=400, detail="Type de workflow invalide")
        
        logger.info(f"🚀 Nouvelle demande de workflow: {request.workflow_type}")
        logger.info(f"📝 Prompt: {request.prompt[:100]}...")
        
        # Exécuter le workflow
        workflow_id = await workflow_engine.execute_workflow(
            prompt=request.prompt,
            workflow_type=request.workflow_type,
            parameters=request.parameters
        )
        
        return WorkflowResponse(
            workflow_id=workflow_id,
            status="running",
            message="Workflow démarré avec succès"
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'exécution du workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """
    Récupère le statut d'un workflow
    """
    try:
        status = await workflow_engine.get_workflow_status(workflow_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Workflow non trouvé")
        
        return {
            "workflow_id": status.workflow_id,
            "status": status.status.value,
            "progress": status.progress,
            "current_step": status.current_step,
            "result": status.result,
            "error": status.error,
            "cache_hit": status.cache_hit,
            "duration": (status.end_time - status.start_time) if status.end_time else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération du statut: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cancel/{workflow_id}")
async def cancel_workflow(workflow_id: str):
    """
    Annule un workflow en cours
    """
    try:
        success = await workflow_engine.cancel_workflow(workflow_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Workflow non trouvé ou déjà terminé")
        
        return {"message": "Workflow annulé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'annulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflows/types")
async def get_workflow_types():
    """
    Retourne les types de workflows disponibles
    """
    try:
        return await workflow_engine.get_workflow_types()
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance/stats")
async def get_performance_stats():
    """
    Retourne les statistiques de performance
    """
    try:
        return await workflow_engine.get_performance_stats()
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance/recent")
async def get_recent_workflows(limit: int = 10):
    """
    Retourne les workflows récents
    """
    try:
        return await metrics.get_recent_workflows(limit)
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des workflows récents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cache/clear")
async def clear_cache():
    """
    Vide le cache
    """
    try:
        await cache.clear()
        return {"message": "Cache vidé avec succès"}
    except Exception as e:
        logger.error(f"❌ Erreur lors du vidage du cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cache/stats")
async def get_cache_stats():
    """
    Retourne les statistiques du cache
    """
    try:
        return await cache.get_stats()
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des stats du cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))
