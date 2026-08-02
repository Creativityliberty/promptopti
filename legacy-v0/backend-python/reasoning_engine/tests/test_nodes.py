"""
Tests unitaires pour les nœuds
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch

from ..nodes import PromptAnalysisNode, LLMCallNode, ValidationNode, SynthesisNode

class TestPromptAnalysisNode:
    """Tests pour le nœud d'analyse de prompt"""
    
    @pytest.mark.asyncio
    async def test_basic_analysis(self):
        """Test d'analyse basique"""
        node = PromptAnalysisNode()
        shared_data = {
            'original_prompt': 'Comment créer une application web moderne avec React et Node.js?'
        }
        
        result = await node.run_async(shared_data)
        
        assert 'intent' in result
        assert 'complexity' in result
        assert 'domains' in result
        assert 'subproblems' in result
        assert 'keywords' in result
        assert 'question_type' in result
        
        # Vérifier que les domaines incluent la programmation
        assert 'programmation' in result['domains']
        assert result['question_type'] == 'how'
    
    @pytest.mark.asyncio
    async def test_empty_prompt(self):
        """Test avec un prompt vide"""
        node = PromptAnalysisNode()
        shared_data = {'original_prompt': ''}
        
        with pytest.raises(ValueError):
            await node.run_async(shared_data)
    
    @pytest.mark.asyncio
    async def test_complex_prompt(self):
        """Test avec un prompt complexe"""
        node = PromptAnalysisNode()
        shared_data = {
            'original_prompt': '''
            Analysez en détail les implications économiques, sociales et technologiques 
            de l'intelligence artificielle sur le marché du travail dans les 10 prochaines années.
            Considérez les aspects suivants:
            1. Automatisation des emplois
            2. Création de nouveaux métiers
            3. Formation et reconversion
            4. Politiques publiques nécessaires
            '''
        }
        
        result = await node.run_async(shared_data)
        
        assert result['complexity'] == 'high'
        assert len(result['domains']) > 1
        assert len(result['subproblems']) >= 3

class TestLLMCallNode:
    """Tests pour le nœud d'appel LLM"""
    
    @pytest.mark.asyncio
    async def test_successful_llm_call(self):
        """Test d'appel LLM réussi"""
        node = LLMCallNode()
        
        # Mock de la réponse HTTP
        mock_response_data = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': '{"reasoning_steps": [{"step": 1, "description": "Test", "reasoning": "Test reasoning", "conclusion": "Test conclusion"}], "final_answer": "Test answer", "confidence_level": "high"}'
                    }]
                }
            }]
        }
        
        shared_data = {
            'api_key': 'test_key',
            'analysis': {
                'intent': 'analyze',
                'complexity': 'medium',
                'domains': ['test'],
                'subproblems': ['test problem'],
                'keywords': ['test'],
                'question_type': 'what'
            },
            'original_prompt': 'Test prompt'
        }
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_response_data)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await node.run_async(shared_data)
            
            assert 'llm_response' in result
            assert 'raw_content' in result
            assert 'model_used' in result
            assert result['model_used'] == 'gemini-2.0-flash'
    
    @pytest.mark.asyncio
    async def test_missing_api_key(self):
        """Test sans clé API"""
        node = LLMCallNode()
        shared_data = {
            'analysis': {},
            'original_prompt': 'Test prompt'
        }
        
        with pytest.raises(ValueError, match="Clé API manquante"):
            await node.run_async(shared_data)
    
    @pytest.mark.asyncio
    async def test_llm_error_fallback(self):
        """Test du fallback en cas d'erreur LLM"""
        node = LLMCallNode()
        shared_data = {
            'api_key': 'invalid_key',
            'analysis': {
                'intent': 'analyze',
                'complexity': 'medium',
                'domains': ['test'],
                'subproblems': [],
                'keywords': [],
                'question_type': 'what'
            },
            'original_prompt': 'Test prompt'
        }
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 401
            mock_response.text = AsyncMock(return_value='Unauthorized')
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await node.run_async(shared_data)
            
            # Vérifier que le fallback a été utilisé
            assert 'error_fallback' in result
            assert result['error_fallback'] is True

class TestValidationNode:
    """Tests pour le nœud de validation"""
    
    @pytest.mark.asyncio
    async def test_basic_validation(self):
        """Test de validation basique"""
        node = ValidationNode()
        
        shared_data = {
            'analysis': {
                'subproblems': ['Problem 1', 'Problem 2'],
                'domains': ['test_domain']
            },
            'llm_result': {
                'llm_response': {
                    'reasoning_steps': [
                        {
                            'step': 1,
                            'description': 'First step',
                            'reasoning': 'This is the reasoning for step 1',
                            'conclusion': 'Conclusion of step 1'
                        },
                        {
                            'step': 2,
                            'description': 'Second step',
                            'reasoning': 'This is the reasoning for step 2',
                            'conclusion': 'Conclusion of step 2'
                        }
                    ],
                    'confidence_level': 'medium',
                    'assumptions': ['Assumption 1'],
                    'limitations': ['Limitation 1']
                }
            },
            'original_prompt': 'Test prompt'
        }
        
        result = await node.run_async(shared_data)
        
        assert 'logical_consistency' in result
        assert 'contradiction_analysis' in result
        assert 'completeness_check' in result
        assert 'confidence_validation' in result
        assert 'overall_score' in result
        assert 'recommendations' in result
        
        # Vérifier que le score est entre 0 et 1
        assert 0 <= result['overall_score'] <= 1
    
    @pytest.mark.asyncio
    async def test_contradiction_detection(self):
        """Test de détection de contradictions"""
        node = ValidationNode()
        
        shared_data = {
            'analysis': {'subproblems': [], 'domains': []},
            'llm_result': {
                'llm_response': {
                    'reasoning_steps': [
                        {
                            'step': 1,
                            'description': 'First step',
                            'reasoning': 'X est toujours vrai',
                            'conclusion': 'X est vrai'
                        },
                        {
                            'step': 2,
                            'description': 'Second step',
                            'reasoning': 'X n\'est jamais vrai',
                            'conclusion': 'X est faux'
                        }
                    ],
                    'confidence_level': 'medium',
                    'assumptions': [],
                    'limitations': []
                }
            },
            'original_prompt': 'Test prompt'
        }
        
        result = await node.run_async(shared_data)
        
        # Devrait détecter une contradiction potentielle
        assert result['contradiction_analysis']['contradictions_found'] >= 0

class TestSynthesisNode:
    """Tests pour le nœud de synthèse"""
    
    @pytest.mark.asyncio
    async def test_complete_synthesis(self):
        """Test de synthèse complète"""
        node = SynthesisNode()
        
        shared_data = {
            'analysis': {
                'intent': 'analyze',
                'complexity': 'medium',
                'domains': ['test_domain'],
                'subproblems': ['Problem 1'],
                'keywords': ['test'],
                'question_type': 'what'
            },
            'llm_result': {
                'llm_response': {
                    'reasoning_steps': [
                        {
                            'step': 1,
                            'description': 'Analysis step',
                            'reasoning': 'Detailed reasoning',
                            'conclusion': 'Important conclusion'
                        }
                    ],
                    'final_answer': 'Final synthesized answer',
                    'confidence_level': 'high',
                    'assumptions': ['Key assumption'],
                    'limitations': ['Known limitation'],
                    'next_steps': ['Next action']
                }
            },
            'validation_result': {
                'overall_score': 0.8,
                'logical_consistency': {'score': 0.9},
                'contradiction_analysis': {'contradictions_found': 0},
                'completeness_check': {'completeness_score': 0.7, 'missing_elements': []},
                'confidence_validation': {'alignment_score': 0.8, 'reliability_assessment': 'high'},
                'recommendations': ['Improve completeness']
            },
            'original_prompt': 'Test prompt for synthesis',
            'workflow_id': 'test_workflow_123',
            'metrics': {
                'prompt_analysis': {'duration': 1.5},
                'llm_call': {'duration': 3.2}
            }
        }
        
        result = await node.run_async(shared_data)
        
        # Vérifier la structure de la synthèse
        required_fields = [
            'executive_summary',
            'detailed_analysis', 
            'reasoning_process',
            'quality_assessment',
            'final_recommendations',
            'confidence_assessment',
            'limitations_and_caveats',
            'next_steps',
            'metadata',
            'overall_quality_score',
            'alerts'
        ]
        
        for field in required_fields:
            assert field in result, f"Missing field: {field}"
        
        # Vérifier les types et valeurs
        assert isinstance(result['overall_quality_score'], float)
        assert 0 <= result['overall_quality_score'] <= 1
        assert isinstance(result['alerts'], list)
        assert isinstance(result['final_recommendations'], list)
    
    @pytest.mark.asyncio
    async def test_low_quality_synthesis(self):
        """Test de synthèse avec qualité faible"""
        node = SynthesisNode()
        
        shared_data = {
            'analysis': {'intent': 'analyze', 'complexity': 'low', 'domains': [], 'subproblems': [], 'keywords': [], 'question_type': 'unknown'},
            'llm_result': {
                'llm_response': {
                    'reasoning_steps': [],
                    'final_answer': 'Weak answer',
                    'confidence_level': 'low',
                    'assumptions': ['Many assumptions'],
                    'limitations': ['Major limitations'],
                    'next_steps': []
                }
            },
            'validation_result': {
                'overall_score': 0.3,
                'logical_consistency': {'score': 0.2},
                'contradiction_analysis': {'contradictions_found': 2},
                'completeness_check': {'completeness_score': 0.1, 'missing_elements': ['Element 1', 'Element 2']},
                'confidence_validation': {'alignment_score': 0.4, 'reliability_assessment': 'low'},
                'recommendations': ['Major improvements needed']
            },
            'original_prompt': 'Test prompt',
            'workflow_id': 'test_workflow',
            'metrics': {}
        }
        
        result = await node.run_async(shared_data)
        
        # Devrait générer des alertes pour la qualité faible
        assert len(result['alerts']) > 0
        quality_alerts = [alert for alert in result['alerts'] if alert['type'] == 'quality_warning']
        assert len(quality_alerts) > 0
        
        # Score de qualité devrait être faible
        assert result['overall_quality_score'] < 0.5

# Tests d'intégration
class TestWorkflowIntegration:
    """Tests d'intégration des workflows"""
    
    @pytest.mark.asyncio
    async def test_simple_workflow_integration(self):
        """Test d'intégration du workflow simple"""
        from ..workflows import SimpleAnalysisWorkflow
        
        workflow = SimpleAnalysisWorkflow()
        shared_data = {
            'original_prompt': 'Expliquez le machine learning en termes simples'
        }
        
        result = await workflow.run_async(shared_data)
        
        assert result['workflow_type'] == 'simple_analysis'
        assert 'analysis' in result
        assert 'metrics' in result
        assert result['status'] == 'completed'
    
    @pytest.mark.asyncio 
    async def test_structured_workflow_integration(self):
        """Test d'intégration du workflow structuré (avec mock)"""
        from ..workflows import StructuredReasoningWorkflow
        
        workflow = StructuredReasoningWorkflow()
        shared_data = {
            'original_prompt': 'Analysez l\'impact de l\'IA sur l\'emploi',
            'api_key': 'test_api_key'
        }
        
        # Mock de l'appel LLM
        mock_llm_response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': '{"reasoning_steps": [{"step": 1, "description": "Impact analysis", "reasoning": "AI will transform jobs", "conclusion": "Mixed impact expected"}], "final_answer": "AI will have complex effects on employment", "confidence_level": "medium", "assumptions": ["Current trends continue"], "limitations": ["Uncertain timeline"], "next_steps": ["Monitor developments"]}'
                    }]
                }
            }]
        }
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_llm_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await workflow.run_async(shared_data)
            
            assert result['workflow_type'] == 'structured_reasoning'
            assert 'synthesis' in result
            assert 'analysis' in result
            assert 'llm_result' in result
            assert 'validation_result' in result
            assert result['status'] == 'completed'

if __name__ == '__main__':
    # Exécuter les tests
    pytest.main([__file__, '-v'])
