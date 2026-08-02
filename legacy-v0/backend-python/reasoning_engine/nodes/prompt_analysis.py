"""
Nœud d'analyse de prompt avec Gemini
"""

import asyncio
import logging
import re
from typing import Any, Dict, List
from .base import BaseNode
from ..integrations.gemini_client import get_gemini_client

logger = logging.getLogger(__name__)

class PromptAnalysisNode(BaseNode):
    """
    Nœud pour analyser un prompt avec Gemini
    """
    
    def __init__(self):
        super().__init__()
        self.gemini_client = get_gemini_client()
        
    async def process_async(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyse le prompt avec Gemini
        """
        try:
            start_time = asyncio.get_event_loop().time()
            
            # Récupération du prompt
            prompt = data.get("original_prompt", "")
            if not prompt:
                raise ValueError("Prompt original requis pour l'analyse")
            
            logger.info(f"🔍 Analyse du prompt: {prompt[:100]}...")
            
            # Analyse avec Gemini
            analysis_result = await self.gemini_client.analyze_prompt(prompt)
            
            # Calcul des métriques
            end_time = asyncio.get_event_loop().time()
            processing_time = end_time - start_time
            
            # Mise à jour des métriques
            data.setdefault("metrics", {})["prompt_analysis"] = {
                "duration": processing_time,
                "success": True,
                "prompt_length": len(prompt),
                "words_count": len(prompt.split())
            }
            
            # Ajout de l'analyse aux données
            data["analysis"] = analysis_result
            
            logger.info(f"✅ Analyse terminée en {processing_time:.2f}s")
            logger.info(f"📊 Résultats: Intent={analysis_result.get('intent')}, Complexité={analysis_result.get('complexity')}")
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'analyse: {e}")
            
            # Mise à jour des métriques d'erreur
            data.setdefault("metrics", {})["prompt_analysis"] = {
                "duration": 0,
                "success": False,
                "error": str(e)
            }
            
            raise
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Version synchrone (wrapper)"""
        return asyncio.run(self.process_async(data))
