"""
Script de démarrage pour le développement
"""

import os
import sys
import subprocess
import logging

def check_requirements():
    """Vérifie que les dépendances sont installées"""
    try:
        import fastapi
        import uvicorn
        import google.generativeai
        print("✅ Toutes les dépendances sont installées")
        return True
    except ImportError as e:
        print(f"❌ Dépendance manquante: {e}")
        print("📦 Installez les dépendances avec: pip install -r requirements.txt")
        return False

def check_env():
    """Vérifie la configuration d'environnement"""
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("⚠️  GEMINI_API_KEY non configurée")
        print("📝 Créez un fichier .env avec votre clé API Gemini")
        return False
    
    print("✅ Configuration d'environnement OK")
    return True

def main():
    """Point d'entrée principal"""
    print("🚀 Démarrage du moteur de raisonnement Nümtema")
    print("=" * 50)
    
    # Vérifications préliminaires
    if not check_requirements():
        sys.exit(1)
    
    if not check_env():
        print("⚠️  Continuons sans clé API (mode dégradé)")
    
    # Démarrage du serveur
    print("\n🌟 Démarrage du serveur FastAPI...")
    print("📡 URL: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("🔄 Rechargement automatique activé")
    print("\n💡 Appuyez sur Ctrl+C pour arrêter")
    print("=" * 50)
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Arrêt du serveur")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
