"""
Nœud pour les appels LLM avec Gemini
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from .base import BaseNode
from ..integrations.gemini_client import get_gemini_client

logger = logging.getLogger(__name__)

class LLMCallNode(BaseNode):
    """
    Nœud pour effectuer des appels vers les LLMs (Gemini)
    """
    
    def __init__(self, model: str = "gemini-2.0-flash-exp", temperature: float = 0.7):
        super().__init__()
        self.model = model
        self.temperature = temperature
        self.gemini_client = get_gemini_client()
        
    async def process_async(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite les données avec un appel LLM
        """
        try:
            start_time = asyncio.get_event_loop().time()
            
            # Récupération des données d'entrée
            prompt = data.get("original_prompt", "")
            analysis = data.get("analysis", {})
            
            if not prompt:
                raise ValueError("Prompt original requis pour l'appel LLM")
            
            logger.info(f"🤖 Appel LLM pour le prompt: {prompt[:100]}...")
            
            # Génération du raisonnement avec Gemini
            llm_result = await self.gemini_client.generate_reasoning(prompt, analysis)
            
            # Calcul des métriques
            end_time = asyncio.get_event_loop().time()
            processing_time = end_time - start_time
            
            # Mise à jour des métriques
            data.setdefault("metrics", {})["llm_call"] = {
                "duration": processing_time,
                "model_used": self.model,
                "temperature": self.temperature,
                "success": True,
                "tokens_used": llm_result.get("usage", {}).get("total_tokens", 0) if isinstance(llm_result.get("usage"), dict) else 0
            }
            
            # Ajout du résultat aux données
            data["llm_result"] = {
                **llm_result,
                "model_used": self.model,
                "temperature": self.temperature,
                "raw_content": llm_result.get("raw_content", "")
            }
            
            logger.info(f"✅ Appel LLM terminé en {processing_time:.2f}s")
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'appel LLM: {e}")
            
            # Mise à jour des métriques d'erreur
            data.setdefault("metrics", {})["llm_call"] = {
                "duration": 0,
                "model_used": self.model,
                "success": False,
                "error": str(e)
            }
            
            raise
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Version synchrone (wrapper)"""
        return asyncio.run(self.process_async(data))
