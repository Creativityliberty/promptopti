"""
Client pour l'API Gemini de Google
"""

import google.generativeai as genai
import asyncio
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import json
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

@dataclass
class GeminiResponse:
    """Réponse structurée de Gemini"""
    content: str
    usage: Dict[str, Any]
    model: str
    finish_reason: str

class GeminiClient:
    """Client pour interagir avec l'API Gemini"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Clé API Gemini requise")
        
        # Configuration de l'API
        genai.configure(api_key=self.api_key)
        
        # Modèles disponibles
        self.models = {
            "gemini-2.0-flash-exp": "gemini-2.0-flash-exp",
            "gemini-1.5-pro": "gemini-1.5-pro-latest",
            "gemini-1.5-flash": "gemini-1.5-flash-latest"
        }
        
        self.default_model = "gemini-2.0-flash-exp"
        
    async def generate_text(
        self,
        prompt: str,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        system_instruction: str = None
    ) -> GeminiResponse:
        """
        Génère du texte avec Gemini
        """
        try:
            model_name = model or self.default_model
            
            # Configuration du modèle
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                candidate_count=1
            )
            
            # Création du modèle
            if system_instruction:
                model_instance = genai.GenerativeModel(
                    model_name=self.models.get(model_name, model_name),
                    generation_config=generation_config,
                    system_instruction=system_instruction
                )
            else:
                model_instance = genai.GenerativeModel(
                    model_name=self.models.get(model_name, model_name),
                    generation_config=generation_config
                )
            
            # Génération asynchrone
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: model_instance.generate_content(prompt)
            )
            
            # Extraction du contenu
            content = response.text if response.text else ""
            
            # Informations d'usage (simulées car pas toujours disponibles)
            usage = {
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(content.split()),
                "total_tokens": len(prompt.split()) + len(content.split())
            }
            
            return GeminiResponse(
                content=content,
                usage=usage,
                model=model_name,
                finish_reason=response.candidates[0].finish_reason.name if response.candidates else "STOP"
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération avec Gemini: {e}")
            raise
    
    async def generate_structured_response(
        self,
        prompt: str,
        schema: Dict[str, Any],
        model: str = None,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        Génère une réponse structurée selon un schéma JSON
        """
        try:
            # Construction du prompt avec instructions de format
            structured_prompt = f"""
{prompt}

IMPORTANT: Répondez UNIQUEMENT avec un JSON valide qui respecte exactement ce schéma:
{json.dumps(schema, indent=2, ensure_ascii=False)}

Votre réponse doit être un JSON valide sans texte supplémentaire avant ou après.
"""
            
            response = await self.generate_text(
                prompt=structured_prompt,
                model=model,
                temperature=temperature,
                system_instruction="Tu es un assistant qui répond toujours avec du JSON valide."
            )
            
            # Tentative de parsing JSON
            try:
                # Nettoyage du contenu (suppression des balises markdown si présentes)
                content = response.content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Erreur de parsing JSON: {e}")
                logger.error(f"Contenu reçu: {response.content}")
                
                # Fallback: retourner une structure d'erreur
                return {
                    "error": "Erreur de parsing JSON",
                    "raw_content": response.content,
                    "parsing_error": str(e)
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de la génération structurée: {e}")
            raise

    async def analyze_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Analyse spécialisée d'un prompt
        """
        schema = {
            "intent": "string (analyze|create|explain|general)",
            "complexity": "string (low|medium|high)",
            "domains": ["array of strings"],
            "keywords": ["array of strings"],
            "subproblems": ["array of strings"],
            "question_type": "string (what|how|why|statement)",
            "estimated_response_length": "string (short|medium|long)",
            "requires_reasoning": "boolean",
            "confidence_score": "number (0-1)"
        }
        
        analysis_prompt = f"""
Analysez ce prompt en détail et extrayez les informations suivantes:

PROMPT À ANALYSER:
"{prompt}"

Analysez:
1. L'intention principale (analyze, create, explain, general)
2. Le niveau de complexité (low, medium, high)
3. Les domaines de connaissance impliqués
4. Les mots-clés importants
5. Les sous-problèmes identifiés
6. Le type de question
7. La longueur de réponse estimée
8. Si un raisonnement complexe est requis
9. Votre niveau de confiance dans cette analyse (0-1)
"""
        
        return await self.generate_structured_response(
            prompt=analysis_prompt,
            schema=schema,
            temperature=0.3
        )

    async def generate_reasoning(
        self, 
        prompt: str, 
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Génère un raisonnement structuré pour un prompt
        """
        schema = {
            "reasoning_steps": [
                {
                    "step": "number",
                    "description": "string",
                    "reasoning": "string", 
                    "conclusion": "string"
                }
            ],
            "final_answer": "string",
            "confidence_level": "string (low|medium|high)",
            "assumptions": ["array of strings"],
            "limitations": ["array of strings"],
            "next_steps": ["array of strings"]
        }
        
        reasoning_prompt = f"""
Générez un raisonnement structuré pour répondre à ce prompt:

PROMPT: "{prompt}"

ANALYSE PRÉLIMINAIRE:
- Intention: {analysis.get('intent', 'unknown')}
- Complexité: {analysis.get('complexity', 'unknown')}
- Domaines: {', '.join(analysis.get('domains', []))}

Fournissez un raisonnement étape par étape avec:
1. Les étapes de raisonnement numérotées
2. Une réponse finale claire
3. Votre niveau de confiance
4. Les hypothèses formulées
5. Les limitations identifiées
6. Les prochaines étapes suggérées
"""
        
        return await self.generate_structured_response(
            prompt=reasoning_prompt,
            schema=schema,
            temperature=0.7
        )

# Instance globale du client
_gemini_client = None

def get_gemini_client() -> GeminiClient:
    """Récupère l'instance globale du client Gemini"""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client
