"""
Nœud de validation logique
"""

import re
from typing import Any, Dict, List, Optional, Set
from .base import ReasoningNode

class ValidationNode(ReasoningNode):
    """
    Valide la cohérence logique, détecte les contradictions
    et évalue la qualité du raisonnement.
    """
    
    def __init__(self):
        super().__init__("validation", max_retries=2)
        self.logical_connectors = {
            'and': ['et', 'ainsi que', 'de plus', 'également'],
            'or': ['ou', 'soit', 'alternativement'],
            'not': ['ne pas', 'non', 'pas', 'aucun'],
            'if': ['si', 'dans le cas où', 'supposons que'],
            'then': ['alors', 'donc', 'par conséquent', 'ainsi'],
            'because': ['parce que', 'car', 'en raison de', 'du fait que']
        }
    
    async def prepare_data(self, shared: Dict[str, Any]) -> Dict[str, Any]:
        """Prépare les données pour la validation"""
        llm_result = shared.get('llm_result', {})
        analysis = shared.get('analysis', {})
        
        return {
            'llm_response': llm_result.get('llm_response', {}),
            'analysis': analysis,
            'original_prompt': shared.get('original_prompt', ''),
            'reasoning_steps': llm_result.get('llm_response', {}).get('reasoning_steps', [])
        }
    
    async def exec_async(self, prep_res: Dict[str, Any]) -> Dict[str, Any]:
        """Effectue la validation logique"""
        reasoning_steps = prep_res['reasoning_steps']
        llm_response = prep_res['llm_response']
        
        validation_result = {
            'logical_consistency': await self._check_logical_consistency(reasoning_steps),
            'contradiction_analysis': await self._detect_contradictions(reasoning_steps),
            'completeness_check': await self._check_completeness(reasoning_steps, prep_res['analysis']),
            'confidence_validation': await self._validate_confidence(llm_response),
            'assumption_analysis': await self._analyze_assumptions(llm_response.get('assumptions', [])),
            'overall_score': 0.0,
            'validation_warnings': [],
            'validation_errors': []
        }
        
        # Calculer le score global
        validation_result['overall_score'] = await self._calculate_overall_score(validation_result)
        
        # Générer des recommandations
        validation_result['recommendations'] = await self._generate_recommendations(validation_result)
        
        return validation_result
    
    async def _check_logical_consistency(self, reasoning_steps: List[Dict]) -> Dict[str, Any]:
        """Vérifie la cohérence logique entre les étapes"""
        consistency_issues = []
        logical_flow_score = 1.0
        
        for i, step in enumerate(reasoning_steps):
            step_text = f"{step.get('description', '')} {step.get('reasoning', '')} {step.get('conclusion', '')}"
            
            # Vérifier les connecteurs logiques
            connectors_found = self._find_logical_connectors(step_text)
            
            # Vérifier la cohérence avec l'étape précédente
            if i > 0:
                prev_step = reasoning_steps[i-1]
                consistency_score = self._compare_step_consistency(prev_step, step)
                if consistency_score < 0.7:
                    consistency_issues.append({
                        'step_index': i,
                        'issue': f'Incohérence avec l\'étape {i}',
                        'severity': 'medium' if consistency_score > 0.4 else 'high'
                    })
                    logical_flow_score *= consistency_score
        
        return {
            'score': logical_flow_score,
            'issues': consistency_issues,
            'connectors_analysis': self._analyze_connector_usage(reasoning_steps)
        }
    
    async def _detect_contradictions(self, reasoning_steps: List[Dict]) -> Dict[str, Any]:
        """Détecte les contradictions dans le raisonnement"""
        contradictions = []
        statements = []
        
        # Extraire toutes les affirmations
        for i, step in enumerate(reasoning_steps):
            step_statements = self._extract_statements(step)
            for statement in step_statements:
                statements.append({
                    'text': statement,
                    'step_index': i,
                    'step_id': step.get('step', i+1)
                })
        
        # Chercher des contradictions
        for i, stmt1 in enumerate(statements):
            for j, stmt2 in enumerate(statements[i+1:], i+1):
                contradiction_score = self._detect_contradiction_pair(stmt1['text'], stmt2['text'])
                if contradiction_score > 0.7:
                    contradictions.append({
                        'statement1': stmt1,
                        'statement2': stmt2,
                        'contradiction_score': contradiction_score,
                        'type': 'direct' if contradiction_score > 0.9 else 'potential'
                    })
        
        return {
            'contradictions_found': len(contradictions),
            'contradictions': contradictions,
            'severity': 'high' if any(c['contradiction_score'] > 0.9 for c in contradictions) else 'medium'
        }
    
    async def _check_completeness(self, reasoning_steps: List[Dict], analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Vérifie la complétude du raisonnement"""
        subproblems = analysis.get('subproblems', [])
        domains = analysis.get('domains', [])
        
        # Vérifier si tous les sous-problèmes sont adressés
        addressed_subproblems = []
        for subproblem in subproblems:
            is_addressed = any(
                subproblem.lower() in f"{step.get('description', '')} {step.get('reasoning', '')}".lower()
                for step in reasoning_steps
            )
            addressed_subproblems.append({
                'subproblem': subproblem,
                'addressed': is_addressed
            })
        
        # Vérifier la couverture des domaines
        domain_coverage = []
        for domain in domains:
            coverage_score = self._calculate_domain_coverage(domain, reasoning_steps)
            domain_coverage.append({
                'domain': domain,
                'coverage_score': coverage_score
            })
        
        completeness_score = (
            sum(1 for sp in addressed_subproblems if sp['addressed']) / max(len(subproblems), 1) * 0.6 +
            sum(dc['coverage_score'] for dc in domain_coverage) / max(len(domains), 1) * 0.4
        )
        
        return {
            'completeness_score': completeness_score,
            'subproblems_analysis': addressed_subproblems,
            'domain_coverage': domain_coverage,
            'missing_elements': [
                sp['subproblem'] for sp in addressed_subproblems if not sp['addressed']
            ]
        }
    
    async def _validate_confidence(self, llm_response: Dict[str, Any]) -> Dict[str, Any]:
        """Valide le niveau de confiance déclaré"""
        confidence_level = llm_response.get('confidence_level', 'medium')
        reasoning_steps = llm_response.get('reasoning_steps', [])
        assumptions = llm_response.get('assumptions', [])
        limitations = llm_response.get('limitations', [])
        
        # Calculer un score de confiance basé sur l'analyse
        calculated_confidence = self._calculate_confidence_score(reasoning_steps, assumptions, limitations)
        
        # Comparer avec le niveau déclaré
        declared_confidence_score = {'low': 0.3, 'medium': 0.6, 'high': 0.9}.get(confidence_level, 0.6)
        
        confidence_alignment = 1.0 - abs(calculated_confidence - declared_confidence_score)
        
        return {
            'declared_confidence': confidence_level,
            'calculated_confidence_score': calculated_confidence,
            'alignment_score': confidence_alignment,
            'is_overconfident': calculated_confidence < declared_confidence_score - 0.2,
            'is_underconfident': calculated_confidence > declared_confidence_score + 0.2
        }
    
    async def _analyze_assumptions(self, assumptions: List[str]) -> Dict[str, Any]:
        """Analyse la qualité et la pertinence des hypothèses"""
        assumption_analysis = []
        
        for assumption in assumptions:
            analysis = {
                'assumption': assumption,
                'type': self._classify_assumption_type(assumption),
                'validity_score': self._assess_assumption_validity(assumption),
                'impact_level': self._assess_assumption_impact(assumption)
            }
            assumption_analysis.append(analysis)
        
        return {
            'total_assumptions': len(assumptions),
            'assumption_analysis': assumption_analysis,
            'risky_assumptions': [
                a for a in assumption_analysis 
                if a['validity_score'] < 0.6 or a['impact_level'] == 'high'
            ]
        }
    
    async def _calculate_overall_score(self, validation_result: Dict[str, Any]) -> float:
        """Calcule le score global de validation"""
        weights = {
            'logical_consistency': 0.3,
            'contradiction_analysis': 0.25,
            'completeness_check': 0.25,
            'confidence_validation': 0.2
        }
        
        scores = {
            'logical_consistency': validation_result['logical_consistency']['score'],
            'contradiction_analysis': 1.0 - (validation_result['contradiction_analysis']['contradictions_found'] * 0.2),
            'completeness_check': validation_result['completeness_check']['completeness_score'],
            'confidence_validation': validation_result['confidence_validation']['alignment_score']
        }
        
        # Normaliser les scores
        for key in scores:
            scores[key] = max(0.0, min(1.0, scores[key]))
        
        overall_score = sum(scores[key] * weights[key] for key in weights)
        return round(overall_score, 3)
    
    async def _generate_recommendations(self, validation_result: Dict[str, Any]) -> List[str]:
        """Génère des recommandations d'amélioration"""
        recommendations = []
        
        # Recommandations basées sur la cohérence logique
        if validation_result['logical_consistency']['score'] < 0.7:
            recommendations.append("Améliorer la cohérence logique entre les étapes de raisonnement")
        
        # Recommandations basées sur les contradictions
        if validation_result['contradiction_analysis']['contradictions_found'] > 0:
            recommendations.append("Résoudre les contradictions identifiées dans le raisonnement")
        
        # Recommandations basées sur la complétude
        if validation_result['completeness_check']['completeness_score'] < 0.8:
            missing = validation_result['completeness_check']['missing_elements']
            if missing:
                recommendations.append(f"Adresser les éléments manquants: {', '.join(missing[:3])}")
        
        # Recommandations basées sur la confiance
        confidence_val = validation_result['confidence_validation']
        if confidence_val['is_overconfident']:
            recommendations.append("Revoir le niveau de confiance - semble surévalué")
        elif confidence_val['is_underconfident']:
            recommendations.append("Le niveau de confiance pourrait être plus élevé")
        
        return recommendations
    
    # Méthodes utilitaires
    
    def _find_logical_connectors(self, text: str) -> Dict[str, List[str]]:
        """Trouve les connecteurs logiques dans le texte"""
        found_connectors = {}
        text_lower = text.lower()
        
        for connector_type, keywords in self.logical_connectors.items():
            found = [kw for kw in keywords if kw in text_lower]
            if found:
                found_connectors[connector_type] = found
        
        return found_connectors
    
    def _compare_step_consistency(self, prev_step: Dict, current_step: Dict) -> float:
        """Compare la cohérence entre deux étapes"""
        # Implémentation simplifiée - peut être améliorée avec NLP
        prev_conclusion = prev_step.get('conclusion', '').lower()
        current_reasoning = current_step.get('reasoning', '').lower()
        
        # Chercher des mots-clés communs
        prev_words = set(re.findall(r'\b\w+\b', prev_conclusion))
        current_words = set(re.findall(r'\b\w+\b', current_reasoning))
        
        if not prev_words or not current_words:
            return 0.5
        
        overlap = len(prev_words.intersection(current_words))
        return min(1.0, overlap / min(len(prev_words), len(current_words)) * 2)
    
    def _extract_statements(self, step: Dict) -> List[str]:
        """Extrait les affirmations d'une étape"""
        text = f"{step.get('reasoning', '')} {step.get('conclusion', '')}"
        # Diviser par phrases
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def _detect_contradiction_pair(self, stmt1: str, stmt2: str) -> float:
        """Détecte si deux affirmations se contredisent"""
        # Implémentation simplifiée
        negation_words = ['ne pas', 'non', 'pas', 'aucun', 'jamais']
        
        stmt1_lower = stmt1.lower()
        stmt2_lower = stmt2.lower()
        
        # Chercher des négations
        stmt1_has_negation = any(neg in stmt1_lower for neg in negation_words)
        stmt2_has_negation = any(neg in stmt2_lower for neg in negation_words)
        
        # Si une phrase a une négation et l'autre non, et qu'elles parlent du même sujet
        if stmt1_has_negation != stmt2_has_negation:
            # Calculer la similarité des sujets
            words1 = set(re.findall(r'\b\w+\b', stmt1_lower))
            words2 = set(re.findall(r'\b\w+\b', stmt2_lower))
            
            if words1 and words2:
                overlap = len(words1.intersection(words2))
                similarity = overlap / len(words1.union(words2))
                return similarity * 0.8  # Score de contradiction potentielle
        
        return 0.0
    
    def _calculate_domain_coverage(self, domain: str, reasoning_steps: List[Dict]) -> float:
        """Calcule la couverture d'un domaine dans le raisonnement"""
        domain_keywords = {
            'intelligence_artificielle': ['ia', 'algorithme', 'modèle', 'apprentissage', 'neural'],
            'programmation': ['code', 'fonction', 'variable', 'api', 'framework'],
            'business': ['stratégie', 'marché', 'client', 'profit', 'vente'],
            'science': ['hypothèse', 'expérience', 'théorie', 'méthode', 'résultat']
        }
        
        keywords = domain_keywords.get(domain, [domain.lower()])
        
        total_mentions = 0
        for step in reasoning_steps:
            step_text = f"{step.get('description', '')} {step.get('reasoning', '')}".lower()
            total_mentions += sum(1 for kw in keywords if kw in step_text)
        
        return min(1.0, total_mentions / max(len(keywords), 1))
    
    def _calculate_confidence_score(self, reasoning_steps: List[Dict], assumptions: List[str], limitations: List[str]) -> float:
        """Calcule un score de confiance basé sur l'analyse"""
        base_score = 0.6
        
        # Ajuster selon le nombre d'étapes (plus d'étapes = plus de confiance)
        step_bonus = min(0.2, len(reasoning_steps) * 0.05)
        
        # Pénaliser selon le nombre d'hypothèses (plus d'hypothèses = moins de confiance)
        assumption_penalty = min(0.3, len(assumptions) * 0.1)
        
        # Pénaliser selon le nombre de limitations
        limitation_penalty = min(0.2, len(limitations) * 0.08)
        
        return max(0.1, min(1.0, base_score + step_bonus - assumption_penalty - limitation_penalty))
    
    def _classify_assumption_type(self, assumption: str) -> str:
        """Classifie le type d'hypothèse"""
        assumption_lower = assumption.lower()
        
        if any(word in assumption_lower for word in ['supposons', 'admettons', 'si']):
            return 'conditional'
        elif any(word in assumption_lower for word in ['généralement', 'habituellement', 'souvent']):
            return 'statistical'
        elif any(word in assumption_lower for word in ['toujours', 'jamais', 'tous']):
            return 'absolute'
        else:
            return 'implicit'
    
    def _assess_assumption_validity(self, assumption: str) -> float:
        """Évalue la validité d'une hypothèse"""
        # Implémentation simplifiée
        risky_words = ['toujours', 'jamais', 'tous', 'aucun', 'impossible']
        assumption_lower = assumption.lower()
        
        risk_count = sum(1 for word in risky_words if word in assumption_lower)
        return max(0.2, 1.0 - risk_count * 0.3)
    
    def _assess_assumption_impact(self, assumption: str) -> str:
        """Évalue l'impact d'une hypothèse"""
        high_impact_words = ['fondamental', 'essentiel', 'critique', 'crucial']
        assumption_lower = assumption.lower()
        
        if any(word in assumption_lower for word in high_impact_words):
            return 'high'
        elif len(assumption) > 100:  # Hypothèses longues = impact potentiellement élevé
            return 'medium'
        else:
            return 'low'
    
    def _analyze_connector_usage(self, reasoning_steps: List[Dict]) -> Dict[str, Any]:
        """Analyse l'utilisation des connecteurs logiques"""
        all_connectors = {}
        
        for step in reasoning_steps:
            step_text = f"{step.get('description', '')} {step.get('reasoning', '')}"
            connectors = self._find_logical_connectors(step_text)
            
            for connector_type, found_words in connectors.items():
                if connector_type not in all_connectors:
                    all_connectors[connector_type] = []
                all_connectors[connector_type].extend(found_words)
        
        return {
            'connector_types_used': list(all_connectors.keys()),
            'total_connectors': sum(len(words) for words in all_connectors.values()),
            'connector_diversity': len(all_connectors),
            'most_used_type': max(all_connectors.items(), key=lambda x: len(x[1]))[0] if all_connectors else None
        }
    
    def validate_input(self, shared: Dict[str, Any]) -> bool:
        """Valide que les données nécessaires sont présentes"""
        return 'llm_result' in shared and 'analysis' in shared
    
    def validate_output(self, result: Any) -> bool:
        """Valide que le résultat de validation est correct"""
        required_fields = [
            'logical_consistency', 'contradiction_analysis', 
            'completeness_check', 'overall_score'
        ]
        return all(field in result for field in required_fields)
