"""
Tests pour l'API du moteur de raisonnement
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

# Simuler l'application FastAPI pour les tests
from fastapi import FastAPI
from ..api.routes import router

app = FastAPI()
app.include_router(router)

client = TestClient(app)

class TestReasoningAPI:
    """Tests pour l'API de raisonnement"""
    
    def test_get_workflow_types(self):
        """Test de récupération des types de workflows"""
        response = client.get("/api/v2/reasoning/workflows/types")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "simple_analysis" in data
        assert "structured_reasoning" in data
        assert "logical_validation" in data
        
        # Vérifier la structure des données
        for workflow_type, details in data.items():
            assert "name" in details
            assert "description" in details
            assert "steps" in details
            assert "estimated_duration" in details
    
    def test_execute_simple_workflow(self):
        """Test d'exécution d'un workflow simple"""
        request_data = {
            "prompt": "Qu'est-ce que l'intelligence artificielle?",
            "workflow_type": "simple_analysis",
            "parameters": {}
        }
        
        response = client.post("/api/v2/reasoning/execute", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "workflow_id" in data
        assert data["status"] == "running"
        assert len(data["workflow_id"]) > 0
    
    def test_execute_workflow_missing_prompt(self):
        """Test d'exécution sans prompt"""
        request_data = {
            "workflow_type": "simple_analysis",
            "parameters": {}
        }
        
        response = client.post("/api/v2/reasoning/execute", json=request_data)
        
        # Devrait échouer car le prompt est requis
        assert response.status_code == 422  # Validation error
    
    def test_get_workflow_status_not_found(self):
        """Test de récupération de statut pour un workflow inexistant"""
        response = client.get("/api/v2/reasoning/status/nonexistent_id")
        
        assert response.status_code == 404
        data = response.json()
        assert "Workflow non trouvé" in data["detail"]
    
    def test_cancel_workflow_not_found(self):
        """Test d'annulation d'un workflow inexistant"""
        response = client.delete("/api/v2/reasoning/cancel/nonexistent_id")
        
        assert response.status_code == 404
        data = response.json()
        assert "Workflow non trouvé" in data["detail"]
    
    @patch('backend.reasoning_engine.api.routes.run_simple_analysis_workflow')
    def test_workflow_execution_flow(self, mock_workflow):
        """Test du flux complet d'exécution"""
        # Mock du résultat du workflow
        mock_workflow.return_value = {
            'workflow_type': 'simple_analysis',
            'analysis': {
                'intent': 'explain',
                'complexity': 'medium',
                'domains': ['intelligence_artificielle']
            },
            'status': 'completed'
        }
        
        # Exécuter le workflow
        request_data = {
            "prompt": "Expliquez l'IA",
            "workflow_type": "simple_analysis"
        }
        
        response = client.post("/api/v2/reasoning/execute", json=request_data)
        assert response.status_code == 200
        
        workflow_id = response.json()["workflow_id"]
        
        # Simuler l'attente et vérifier le statut
        # Note: Dans un vrai test, il faudrait attendre que le workflow se termine
        import time
        time.sleep(0.1)  # Petite pause pour simuler l'exécution
        
        # Le workflow devrait être dans active_workflows
        from ..api.routes import active_workflows
        assert workflow_id in active_workflows

class TestWorkflowExecution:
    """Tests spécifiques à l'exécution des workflows"""
    
    @pytest.mark.asyncio
    async def test_simple_analysis_execution(self):
        """Test d'exécution du workflow d'analyse simple"""
        from ..api.routes import run_simple_analysis_workflow
        
        shared_data = {
            'original_prompt': 'Test prompt for analysis',
            'workflow_id': 'test_123',
            'parameters': {},
            'metrics': {}
        }
        
        result = await run_simple_analysis_workflow(shared_data, 'test_123')
        
        assert result['workflow_type'] == 'simple_analysis'
        assert 'analysis' in result
        assert 'metrics' in result
    
    @pytest.mark.asyncio
    async def test_structured_reasoning_execution(self):
        """Test d'exécution du workflow de raisonnement structuré"""
        from ..api.routes import run_structured_reasoning_workflow
        
        shared_data = {
            'original_prompt': 'Analysez cette question complexe',
            'workflow_id': 'test_456',
            'parameters': {'api_key': 'test_key'},
            'metrics': {}
        }
        
        # Mock de l'appel LLM
        mock_llm_response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': '{"reasoning_steps": [{"step": 1, "description": "Test", "reasoning": "Test", "conclusion": "Test"}], "final_answer": "Test", "confidence_level": "medium", "assumptions": [], "limitations": [], "next_steps": []}'
                    }]
                }
            }]
        }
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_llm_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await run_structured_reasoning_workflow(shared_data, 'test_456')
            
            assert result['workflow_type'] == 'structured_reasoning'
            assert 'synthesis' in result
            assert 'analysis' in result
    
    @pytest.mark.asyncio
    async def test_logical_validation_execution(self):
        """Test d'exécution du workflow de validation logique"""
        from ..api.routes import run_logical_validation_workflow
        
        shared_data = {
            'original_prompt': 'Validez cette logique',
            'workflow_id': 'test_789',
            'parameters': {},
            'metrics': {}
        }
        
        result = await run_logical_validation_workflow(shared_data, 'test_789')
        
        assert result['workflow_type'] == 'logical_validation'
        assert 'synthesis' in result
        assert 'analysis' in result
        assert 'validation_result' in result

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
