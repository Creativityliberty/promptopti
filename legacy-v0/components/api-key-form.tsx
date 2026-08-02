"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Check, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useLocalStorage<string>("gemini-api-key", "")
  const [inputKey, setInputKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<"idle" | "validating" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  // Debug: log the API key state
  useEffect(() => {
    console.log("🔑 API Key dans ApiKeyForm:", apiKey ? `${apiKey.substring(0, 8)}...` : "Absente")
  }, [apiKey])

  const validateApiKey = async () => {
    if (!inputKey.trim()) {
      setError("La clé API ne peut pas être vide")
      return
    }

    if (!inputKey.startsWith("AIza")) {
      setError("Format de clé API Gemini invalide")
      return
    }

    setStatus("validating")
    setError(null)

    try {
      console.log("🔄 Validation de la clé API...")

      // Test direct avec l'API Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${inputKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Test",
                  },
                ],
              },
            ],
          }),
        },
      )

      if (response.ok) {
        console.log("✅ Clé API validée, sauvegarde...")
        setApiKey(inputKey)
        setStatus("success")
        setInputKey("")
        console.log("✅ Clé API sauvegardée dans localStorage")

        // Force refresh pour s'assurer que les autres composants voient le changement
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        setStatus("error")
        setError(errorData.error?.message || "Clé API invalide")
        console.log("❌ Validation échouée:", errorData)
      }
    } catch (err) {
      setStatus("error")
      setError("Erreur de connexion lors de la validation")
      console.error("❌ Erreur de validation:", err)
    }
  }

  const clearApiKey = () => {
    console.log("🗑️ Suppression de la clé API...")
    setApiKey("")
    setStatus("idle")
    setError(null)
    console.log("🗑️ Clé API supprimée")

    // Force refresh
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-emerald-500" />
          Clé API Gemini
        </CardTitle>
        <CardDescription>Entrez votre clé API Gemini pour activer le générateur de prompts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!apiKey ? (
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Entrez votre clé API Gemini (AIza...)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Clé API configurée ({apiKey.substring(0, 8)}...)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearApiKey}>
                Changer
              </Button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {apiKey && <div className="text-sm text-emerald-600 dark:text-emerald-400">✓ Clé API prête à utiliser</div>}
        </div>
      </CardContent>
      {!apiKey && (
        <CardFooter>
          <Button
            onClick={validateApiKey}
            disabled={status === "validating" || !inputKey}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {status === "validating" ? "Validation..." : "Valider la clé API"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
