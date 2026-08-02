"""
Nümtema Reasoning Engine
========================

Moteur de raisonnement avancé basé sur des workflows pour la génération
de prompts structurés avec validation logique.
"""

__version__ = "0.1.0"
__author__ = "Nümtema Team"

from .workflow import (
    BaseNode,
    Node,
    AsyncNode,
    Flow,
    AsyncFlow,
    BatchNode,
    AsyncBatchNode,
    AsyncParallelBatchNode,
    BatchFlow,
    AsyncBatchFlow,
    AsyncParallelBatchFlow
)

from .nodes import (
    PromptAnalysisNode,
    LLMCallNode,
    ValidationNode,
    SynthesisNode
)

from .workflows import (
    SimpleAnalysisWorkflow,
    StructuredReasoningWorkflow,
    LogicalValidationWorkflow
)

__all__ = [
    # Core workflow classes
    "BaseNode", "Node", "AsyncNode", "Flow", "AsyncFlow",
    "BatchNode", "AsyncBatchNode", "AsyncParallelBatchNode",
    "BatchFlow", "AsyncBatchFlow", "AsyncParallelBatchFlow",
    
    # Specialized nodes
    "PromptAnalysisNode", "LLMCallNode", "ValidationNode", "SynthesisNode",
    
    # Predefined workflows
    "SimpleAnalysisWorkflow", "StructuredReasoningWorkflow", "LogicalValidationWorkflow"
]
