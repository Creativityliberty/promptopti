"""
Nœud de synthèse des résultats
"""

from typing import Any, Dict, List, Optional
from .base import ReasoningNode

class SynthesisNode(ReasoningNode):
    """
    Synthétise tous les résultats des nœuds précédents pour produire
    une réponse finale cohérente et structurée.
    """
    
    def __init__(self):
        super().__init__("synthesis", max_retries=2)
    
    async def prepare_data(self, shared: Dict[str, Any]) -> Dict[str, Any]:
        """Prépare toutes les données pour la synthèse"""
        return {
            'analysis': shared.get('analysis', {}),
            'llm_result': shared.get('llm_result', {}),
            'validation_result': shared.get('validation_result', {}),
            'original_prompt': shared.get('original_prompt', ''),
            'workflow_id': shared.get('workflow_id', ''),
            'metrics': shared.get('metrics', {})
        }
    
    async def exec_async(self, prep_res: Dict[str, Any]) -> Dict[str, Any]:
        """Effectue la synthèse complète"""
        analysis = prep_res['analysis']
        llm_result = prep_res['llm_result']
        validation_result = prep_res['validation_result']
        
        # Construire la réponse synthétisée
        synthesis = {
            'executive_summary': await self._create_executive_summary(analysis, llm_result, validation_result),
            'detailed_analysis': await self._create_detailed_analysis(analysis),
            'reasoning_process': await self._synthesize_reasoning(llm_result),
            'quality_assessment': await self._assess_quality(validation_result),
            'final_recommendations': await self._generate_final_recommendations(llm_result, validation_result),
            'confidence_assessment': await self._assess_final_confidence(llm_result, validation_result),
            'limitations_and_caveats': await self._compile_limitations(llm_result, validation_result),
            'next_steps': await self._suggest_next_steps(llm_result, validation_result),
            'metadata': await self._compile_metadata(prep_res)
        }
        
        # Calculer un score de qualité global
        synthesis['overall_quality_score'] = await self._calculate_overall_quality(synthesis, validation_result)
        
        # Générer des alertes si nécessaire
        synthesis['alerts'] = await self._generate_alerts(validation_result, synthesis)
        
        return synthesis
    
    async def _create_executive_summary(self, analysis: Dict, llm_result: Dict, validation_result: Dict) -> Dict[str, Any]:
        """Crée un résumé exécutif"""
        llm_response = llm_result.get('llm_response', {})
        
        return {
            'original_intent': analysis.get('intent', 'Non définie'),
            'complexity_level': analysis.get('complexity', 'Non évaluée'),
            'domains_covered': analysis.get('domains', []),
            'main_conclusion': llm_response.get('final_answer', 'Aucune conclusion disponible'),
            'confidence_level': llm_response.get('confidence_level', 'medium'),
            'validation_score': validation_result.get('overall_score', 0.0),
            'key_insights': await self._extract_key_insights(llm_response),
            'critical_issues': await self._identify_critical_issues(validation_result)
        }
    
    async def _create_detailed_analysis(self, analysis: Dict) -> Dict[str, Any]:
        """Crée une analyse détaillée du prompt initial"""
        return {
            'prompt_characteristics': {
                'intent': analysis.get('intent', 'Non définie'),
                'complexity': analysis.get('complexity', 'Non évaluée'),
                'question_type': analysis.get('question_type', 'Non classifié'),
                'keywords': analysis.get('keywords', []),
                'estimated_domains': analysis.get('domains', [])
            },
            'decomposition': {
                'subproblems_identified': len(analysis.get('subproblems', [])),
                'subproblems': analysis.get('subproblems', []),
                'complexity_factors': await self._identify_complexity_factors(analysis)
            },
            'scope_analysis': {
                'breadth': await self._assess_scope_breadth(analysis),
                'depth': await self._assess_scope_depth(analysis),
                'interdisciplinary_nature': len(analysis.get('domains', [])) > 1
            }
        }
    
    async def _synthesize_reasoning(self, llm_result: Dict) -> Dict[str, Any]:
        """Synthétise le processus de raisonnement"""
        llm_response = llm_result.get('llm_response', {})
        reasoning_steps = llm_response.get('reasoning_steps', [])
        
        return {
            'total_steps': len(reasoning_steps),
            'reasoning_chain': [
                {
                    'step_number': step.get('step', i+1),
                    'description': step.get('description', ''),
                    'key_reasoning': step.get('reasoning', ''),
                    'conclusion': step.get('conclusion', ''),
                    'logical_strength': await self._assess_step_strength(step)
                }
                for i, step in enumerate(reasoning_steps)
            ],
            'reasoning_patterns': await self._identify_reasoning_patterns(reasoning_steps),
            'logical_flow_quality': await self._assess_logical_flow(reasoning_steps),
            'evidence_usage': await self._analyze_evidence_usage(reasoning_steps)
        }
    
    async def _assess_quality(self, validation_result: Dict) -> Dict[str, Any]:
        """Évalue la qualité globale"""
        return {
            'overall_score': validation_result.get('overall_score', 0.0),
            'quality_breakdown': {
                'logical_consistency': validation_result.get('logical_consistency', {}).get('score', 0.0),
                'completeness': validation_result.get('completeness_check', {}).get('completeness_score', 0.0),
                'confidence_alignment': validation_result.get('confidence_validation', {}).get('alignment_score', 0.0)
            },
            'quality_level': await self._determine_quality_level(validation_result.get('overall_score', 0.0)),
            'strengths': await self._identify_strengths(validation_result),
            'weaknesses': await self._identify_weaknesses(validation_result),
            'improvement_areas': validation_result.get('recommendations', [])
        }
    
    async def _generate_final_recommendations(self, llm_result: Dict, validation_result: Dict) -> List[Dict[str, Any]]:
        """Génère les recommandations finales"""
        recommendations = []
        
        # Recommandations du LLM
        llm_next_steps = llm_result.get('llm_response', {}).get('next_steps', [])
        for step in llm_next_steps:
            recommendations.append({
                'type': 'next_step',
                'priority': 'medium',
                'description': step,
                'source': 'llm_analysis'
            })
        
        # Recommandations de validation
        validation_recs = validation_result.get('recommendations', [])
        for rec in validation_recs:
            recommendations.append({
                'type': 'improvement',
                'priority': 'high',
                'description': rec,
                'source': 'validation_analysis'
            })
        
        # Recommandations basées sur la qualité
        quality_score = validation_result.get('overall_score', 0.0)
        if quality_score < 0.6:
            recommendations.append({
                'type': 'quality_improvement',
                'priority': 'high',
                'description': 'Revoir et améliorer la structure du raisonnement',
                'source': 'quality_assessment'
            })
        
        return recommendations
    
    async def _assess_final_confidence(self, llm_result: Dict, validation_result: Dict) -> Dict[str, Any]:
        """Évalue la confiance finale"""
        llm_confidence = llm_result.get('llm_response', {}).get('confidence_level', 'medium')
        validation_score = validation_result.get('overall_score', 0.0)
        confidence_validation = validation_result.get('confidence_validation', {})
        
        # Ajuster la confiance basée sur la validation
        adjusted_confidence = await self._calculate_adjusted_confidence(
            llm_confidence, validation_score, confidence_validation
        )
        
        return {
            'declared_confidence': llm_confidence,
            'validation_score': validation_score,
            'adjusted_confidence': adjusted_confidence,
            'confidence_factors': {
                'logical_consistency': validation_result.get('logical_consistency', {}).get('score', 0.0),
                'completeness': validation_result.get('completeness_check', {}).get('completeness_score', 0.0),
                'contradiction_free': validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0) == 0
            },
            'reliability_assessment': await self._assess_reliability(validation_score, confidence_validation)
        }
    
    async def _compile_limitations(self, llm_result: Dict, validation_result: Dict) -> List[Dict[str, Any]]:
        """Compile toutes les limitations identifiées"""
        limitations = []
        
        # Limitations du LLM
        llm_limitations = llm_result.get('llm_response', {}).get('limitations', [])
        for limitation in llm_limitations:
            limitations.append({
                'type': 'analysis_limitation',
                'description': limitation,
                'impact': 'medium',
                'source': 'llm_analysis'
            })
        
        # Limitations de validation
        if validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0) > 0:
            limitations.append({
                'type': 'logical_inconsistency',
                'description': 'Contradictions détectées dans le raisonnement',
                'impact': 'high',
                'source': 'validation'
            })
        
        # Limitations de complétude
        missing_elements = validation_result.get('completeness_check', {}).get('missing_elements', [])
        if missing_elements:
            limitations.append({
                'type': 'incomplete_analysis',
                'description': f'Éléments non adressés: {", ".join(missing_elements[:3])}',
                'impact': 'medium',
                'source': 'completeness_check'
            })
        
        return limitations
    
    async def _suggest_next_steps(self, llm_result: Dict, validation_result: Dict) -> List[Dict[str, Any]]:
        """Suggère les prochaines étapes"""
        next_steps = []
        
        # Étapes basées sur la qualité
        quality_score = validation_result.get('overall_score', 0.0)
        
        if quality_score < 0.7:
            next_steps.append({
                'priority': 'high',
                'category': 'quality_improvement',
                'action': 'Revoir et améliorer le raisonnement',
                'details': 'Score de qualité faible détecté'
            })
        
        # Étapes basées sur les contradictions
        contradictions = validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0)
        if contradictions > 0:
            next_steps.append({
                'priority': 'high',
                'category': 'logical_consistency',
                'action': 'Résoudre les contradictions identifiées',
                'details': f'{contradictions} contradiction(s) détectée(s)'
            })
        
        # Étapes du LLM
        llm_next_steps = llm_result.get('llm_response', {}).get('next_steps', [])
        for step in llm_next_steps:
            next_steps.append({
                'priority': 'medium',
                'category': 'follow_up',
                'action': step,
                'details': 'Suggéré par l\'analyse LLM'
            })
        
        return next_steps
    
    async def _compile_metadata(self, prep_res: Dict) -> Dict[str, Any]:
        """Compile les métadonnées"""
        metrics = prep_res.get('metrics', {})
        
        return {
            'workflow_id': prep_res.get('workflow_id', ''),
            'processing_metrics': metrics,
            'total_processing_time': sum(
                metric.get('duration', 0) for metric in metrics.values() 
                if isinstance(metric, dict)
            ),
            'nodes_executed': list(metrics.keys()),
            'timestamp': prep_res.get('timestamp'),
            'version': '1.0'
        }
    
    async def _calculate_overall_quality(self, synthesis: Dict, validation_result: Dict) -> float:
        """Calcule le score de qualité global"""
        base_score = validation_result.get('overall_score', 0.0)
        
        # Ajustements basés sur la synthèse
        confidence_assessment = synthesis.get('confidence_assessment', {})
        limitations = synthesis.get('limitations_and_caveats', [])
        
        # Pénaliser pour les limitations critiques
        critical_limitations = sum(1 for lim in limitations if lim.get('impact') == 'high')
        limitation_penalty = min(0.3, critical_limitations * 0.1)
        
        # Bonus pour la cohérence de confiance
        confidence_bonus = 0.0
        if confidence_assessment.get('reliability_assessment', 'medium') == 'high':
            confidence_bonus = 0.1
        
        final_score = max(0.0, min(1.0, base_score - limitation_penalty + confidence_bonus))
        return round(final_score, 3)
    
    async def _generate_alerts(self, validation_result: Dict, synthesis: Dict) -> List[Dict[str, Any]]:
        """Génère des alertes si nécessaire"""
        alerts = []
        
        # Alerte qualité faible
        if synthesis.get('overall_quality_score', 0.0) < 0.5:
            alerts.append({
                'type': 'quality_warning',
                'severity': 'high',
                'message': 'Score de qualité faible détecté',
                'action_required': True
            })
        
        # Alerte contradictions
        contradictions = validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0)
        if contradictions > 0:
            alerts.append({
                'type': 'logical_inconsistency',
                'severity': 'high',
                'message': f'{contradictions} contradiction(s) détectée(s)',
                'action_required': True
            })
        
        # Alerte confiance
        confidence_assessment = synthesis.get('confidence_assessment', {})
        if confidence_assessment.get('reliability_assessment') == 'low':
            alerts.append({
                'type': 'confidence_warning',
                'severity': 'medium',
                'message': 'Niveau de confiance questionnable',
                'action_required': False
            })
        
        return alerts
    
    # Méthodes utilitaires
    
    async def _extract_key_insights(self, llm_response: Dict) -> List[str]:
        """Extrait les insights clés"""
        insights = []
        
        reasoning_steps = llm_response.get('reasoning_steps', [])
        for step in reasoning_steps:
            conclusion = step.get('conclusion', '')
            if conclusion and len(conclusion) > 20:
                insights.append(conclusion)
        
        return insights[:5]  # Limiter à 5 insights
    
    async def _identify_critical_issues(self, validation_result: Dict) -> List[str]:
        """Identifie les problèmes critiques"""
        issues = []
        
        if validation_result.get('overall_score', 0.0) < 0.5:
            issues.append('Score de validation très faible')
        
        contradictions = validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0)
        if contradictions > 0:
            issues.append(f'{contradictions} contradiction(s) logique(s)')
        
        return issues
    
    async def _identify_complexity_factors(self, analysis: Dict) -> List[str]:
        """Identifie les facteurs de complexité"""
        factors = []
        
        if len(analysis.get('domains', [])) > 2:
            factors.append('Multidisciplinaire')
        
        if len(analysis.get('subproblems', [])) > 3:
            factors.append('Nombreux sous-problèmes')
        
        if analysis.get('complexity') == 'high':
            factors.append('Complexité intrinsèque élevée')
        
        return factors
    
    async def _assess_scope_breadth(self, analysis: Dict) -> str:
        """Évalue l'étendue du scope"""
        domains_count = len(analysis.get('domains', []))
        if domains_count > 2:
            return 'large'
        elif domains_count > 1:
            return 'medium'
        else:
            return 'narrow'
    
    async def _assess_scope_depth(self, analysis: Dict) -> str:
        """Évalue la profondeur du scope"""
        subproblems_count = len(analysis.get('subproblems', []))
        if subproblems_count > 4:
            return 'deep'
        elif subproblems_count > 2:
            return 'medium'
        else:
            return 'shallow'
    
    async def _assess_step_strength(self, step: Dict) -> str:
        """Évalue la force logique d'une étape"""
        reasoning = step.get('reasoning', '')
        conclusion = step.get('conclusion', '')
        
        if len(reasoning) > 100 and len(conclusion) > 50:
            return 'strong'
        elif len(reasoning) > 50:
            return 'medium'
        else:
            return 'weak'
    
    async def _identify_reasoning_patterns(self, reasoning_steps: List[Dict]) -> List[str]:
        """Identifie les patterns de raisonnement"""
        patterns = []
        
        if len(reasoning_steps) > 3:
            patterns.append('Raisonnement séquentiel')
        
        # Chercher des patterns spécifiques
        has_hypothesis = any('hypothèse' in step.get('reasoning', '').lower() for step in reasoning_steps)
        if has_hypothesis:
            patterns.append('Raisonnement hypothético-déductif')
        
        has_comparison = any('compar' in step.get('reasoning', '').lower() for step in reasoning_steps)
        if has_comparison:
            patterns.append('Analyse comparative')
        
        return patterns
    
    async def _assess_logical_flow(self, reasoning_steps: List[Dict]) -> str:
        """Évalue la qualité du flux logique"""
        if len(reasoning_steps) < 2:
            return 'insufficient'
        
        # Vérifier la progression logique
        has_clear_progression = all(
            step.get('step', 0) == i + 1 
            for i, step in enumerate(reasoning_steps)
        )
        
        if has_clear_progression and len(reasoning_steps) >= 3:
            return 'excellent'
        elif has_clear_progression:
            return 'good'
        else:
            return 'needs_improvement'
    
    async def _analyze_evidence_usage(self, reasoning_steps: List[Dict]) -> Dict[str, Any]:
        """Analyse l'utilisation des preuves"""
        evidence_keywords = ['preuve', 'évidence', 'données', 'fait', 'étude', 'recherche']
        
        steps_with_evidence = 0
        for step in reasoning_steps:
            step_text = f"{step.get('reasoning', '')} {step.get('conclusion', '')}".lower()
            if any(keyword in step_text for keyword in evidence_keywords):
                steps_with_evidence += 1
        
        return {
            'steps_with_evidence': steps_with_evidence,
            'evidence_ratio': steps_with_evidence / max(len(reasoning_steps), 1),
            'evidence_quality': 'high' if steps_with_evidence / max(len(reasoning_steps), 1) > 0.6 else 'medium'
        }
    
    async def _determine_quality_level(self, score: float) -> str:
        """Détermine le niveau de qualité"""
        if score >= 0.8:
            return 'excellent'
        elif score >= 0.6:
            return 'good'
        elif score >= 0.4:
            return 'fair'
        else:
            return 'poor'
    
    async def _identify_strengths(self, validation_result: Dict) -> List[str]:
        """Identifie les forces"""
        strengths = []
        
        if validation_result.get('logical_consistency', {}).get('score', 0.0) > 0.8:
            strengths.append('Cohérence logique excellente')
        
        if validation_result.get('completeness_check', {}).get('completeness_score', 0.0) > 0.8:
            strengths.append('Analyse complète')
        
        if validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0) == 0:
            strengths.append('Absence de contradictions')
        
        return strengths
    
    async def _identify_weaknesses(self, validation_result: Dict) -> List[str]:
        """Identifie les faiblesses"""
        weaknesses = []
        
        if validation_result.get('logical_consistency', {}).get('score', 0.0) < 0.6:
            weaknesses.append('Cohérence logique faible')
        
        contradictions = validation_result.get('contradiction_analysis', {}).get('contradictions_found', 0)
        if contradictions > 0:
            weaknesses.append(f'{contradictions} contradiction(s) détectée(s)')
        
        if validation_result.get('completeness_check', {}).get('completeness_score', 0.0) < 0.6:
            weaknesses.append('Analyse incomplète')
        
        return weaknesses
    
    async def _calculate_adjusted_confidence(self, llm_confidence: str, validation_score: float, confidence_validation: Dict) -> str:
        """Calcule la confiance ajustée"""
        confidence_scores = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
        base_score = confidence_scores.get(llm_confidence, 0.6)
        
        # Ajuster selon la validation
        adjusted_score = base_score * validation_score
        
        # Ajuster selon l'alignement de confiance
        alignment = confidence_validation.get('alignment_score', 1.0)
        adjusted_score *= alignment
        
        if adjusted_score >= 0.7:
            return 'high'
        elif adjusted_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    async def _assess_reliability(self, validation_score: float, confidence_validation: Dict) -> str:
        """Évalue la fiabilité"""
        if validation_score > 0.8 and confidence_validation.get('alignment_score', 0.0) > 0.8:
            return 'high'
        elif validation_score > 0.6:
            return 'medium'
        else:
            return 'low'
    
    def validate_input(self, shared: Dict[str, Any]) -> bool:
        """Valide que toutes les données nécessaires sont présentes"""
        required_keys = ['analysis', 'llm_result', 'validation_result']
        return all(key in shared for key in required_keys)
    
    def validate_output(self, result: Any) -> bool:
        """Valide que la synthèse est complète"""
        required_fields = [
            'executive_summary', 'detailed_analysis', 'reasoning_process',
            'quality_assessment', 'overall_quality_score'
        ]
        return all(field in result for field in required_fields)
