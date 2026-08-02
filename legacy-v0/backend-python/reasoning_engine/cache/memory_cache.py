"""
Cache en mémoire pour les résultats de workflows
"""

import asyncio
import time
import hashlib
import json
from typing import Any, Dict, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Entrée de cache avec métadonnées"""
    data: Any
    timestamp: float
    ttl: float
    access_count: int = 0
    last_access: float = 0

class MemoryCache:
    """Cache en mémoire avec TTL et LRU"""
    
    def __init__(self, max_size: int = 1000, default_ttl: float = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()
        
        # Statistiques
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "size": 0
        }
        
    def _generate_key(self, prompt: str, workflow_type: str, parameters: Dict[str, Any]) -> str:
        """Génère une clé de cache unique"""
        # Créer un hash des paramètres pour la clé
        content = {
            "prompt": prompt.strip().lower(),
            "workflow_type": workflow_type,
            "parameters": {k: v for k, v in parameters.items() if k != "gemini_api_key"}
        }
        
        content_str = json.dumps(content, sort_keys=True)
        return hashlib.sha256(content_str.encode()).hexdigest()[:16]
    
    async def get(self, prompt: str, workflow_type: str, parameters: Dict[str, Any]) -> Optional[Any]:
        """Récupère une entrée du cache"""
        async with self._lock:
            key = self._generate_key(prompt, workflow_type, parameters)
            
            if key not in self._cache:
                self.stats["misses"] += 1
                return None
            
            entry = self._cache[key]
            current_time = time.time()
            
            # Vérifier l'expiration
            if current_time - entry.timestamp > entry.ttl:
                del self._cache[key]
                self.stats["misses"] += 1
                self.stats["size"] = len(self._cache)
                return None
            
            # Mettre à jour les statistiques d'accès
            entry.access_count += 1
            entry.last_access = current_time
            self.stats["hits"] += 1
            
            logger.info(f"🎯 Cache HIT pour {key[:8]}... (accès #{entry.access_count})")
            return entry.data
    
    async def set(
        self, 
        prompt: str, 
        workflow_type: str, 
        parameters: Dict[str, Any], 
        data: Any, 
        ttl: Optional[float] = None
    ):
        """Stocke une entrée dans le cache"""
        async with self._lock:
            key = self._generate_key(prompt, workflow_type, parameters)
            current_time = time.time()
            
            # Éviction LRU si nécessaire
            if len(self._cache) >= self.max_size:
                await self._evict_lru()
            
            # Créer l'entrée
            entry = CacheEntry(
                data=data,
                timestamp=current_time,
                ttl=ttl or self.default_ttl,
                last_access=current_time
            )
            
            self._cache[key] = entry
            self.stats["size"] = len(self._cache)
            
            logger.info(f"💾 Cache SET pour {key[:8]}... (TTL: {entry.ttl}s)")
    
    async def _evict_lru(self):
        """Éviction LRU (Least Recently Used)"""
        if not self._cache:
            return
        
        # Trouver l'entrée la moins récemment utilisée
        lru_key = min(
            self._cache.keys(),
            key=lambda k: self._cache[k].last_access
        )
        
        del self._cache[lru_key]
        self.stats["evictions"] += 1
        logger.info(f"🗑️ Cache EVICTION de {lru_key[:8]}...")
    
    async def clear(self):
        """Vide le cache"""
        async with self._lock:
            self._cache.clear()
            self.stats["size"] = 0
            logger.info("🧹 Cache vidé")
    
    async def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        hit_rate = 0
        total_requests = self.stats["hits"] + self.stats["misses"]
        if total_requests > 0:
            hit_rate = self.stats["hits"] / total_requests
        
        return {
            **self.stats,
            "hit_rate": hit_rate,
            "total_requests": total_requests
        }

# Instance globale
_memory_cache = None

def get_memory_cache() -> MemoryCache:
    """Récupère l'instance globale du cache"""
    global _memory_cache
    if _memory_cache is None:
        _memory_cache = MemoryCache()
    return _memory_cache
