"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Network, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { ReasoningData } from "@/types/reasoning"

interface ReasoningVisualizerProps {
  data: ReasoningData
}

interface Node {
  id: string
  label: string
  type: string
  x: number
  y: number
  color: string
  size: number
}

interface Edge {
  from: string
  to: string
  label: string
  color: string
}

export function ReasoningVisualizer({ data }: ReasoningVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewMode, setViewMode] = useState<"overview" | "knowledge" | "chain" | "logic">("overview")
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!canvasRef.current || !data) return
    drawVisualization()
  }, [data, viewMode, zoom, offset])

  const generateNodes = (): Node[] => {
    const nodes: Node[] = []

    switch (viewMode) {
      case "overview":
        // Central goal node
        if (data.wm?.g) {
          nodes.push({
            id: "goal",
            label: data.wm.g,
            type: "goal",
            x: 400,
            y: 200,
            color: "#10b981",
            size: 50,
          })
        }

        // Expertise nodes
        data.exp?.forEach((exp, index) => {
          const angle = (index * 2 * Math.PI) / (data.exp?.length || 1)
          nodes.push({
            id: `exp-${index}`,
            label: exp,
            type: "expertise",
            x: 400 + 150 * Math.cos(angle),
            y: 200 + 150 * Math.sin(angle),
            color: "#6366f1",
            size: 30,
          })
        })

        // Progress nodes
        data.wm?.pr?.completed?.forEach((step, index) => {
          nodes.push({
            id: `completed-${index}`,
            label: step,
            type: "completed",
            x: 200 + index * 80,
            y: 350,
            color: "#22c55e",
            size: 25,
          })
        })

        data.wm?.pr?.current?.forEach((step, index) => {
          nodes.push({
            id: `current-${index}`,
            label: step,
            type: "current",
            x: 200 + index * 80,
            y: 400,
            color: "#f59e0b",
            size: 25,
          })
        })
        break

      case "knowledge":
        // Knowledge graph visualization
        const entities = new Set<string>()
        data.kg?.tri?.forEach((triplet) => {
          entities.add(triplet.sub)
          entities.add(triplet.obj)
        })

        Array.from(entities).forEach((entity, index) => {
          const angle = (index * 2 * Math.PI) / entities.size
          nodes.push({
            id: entity,
            label: entity,
            type: "entity",
            x: 400 + 200 * Math.cos(angle),
            y: 300 + 200 * Math.sin(angle),
            color: "#8b5cf6",
            size: 35,
          })
        })
        break

      case "chain":
        // Reasoning chain visualization
        data.chain?.steps?.forEach((step, index) => {
          nodes.push({
            id: `step-${step.index}`,
            label: `${step.index}: ${step.description}`,
            type: "step",
            x: 100 + (index % 3) * 250,
            y: 100 + Math.floor(index / 3) * 150,
            color: "#06b6d4",
            size: 40,
          })
        })
        break

      case "logic":
        // Logic components visualization
        const yOffset = 100

        data.logic?.propos?.forEach((prop, index) => {
          nodes.push({
            id: `prop-${index}`,
            label: `${prop.symb}: ${prop.nl}`,
            type: "proposition",
            x: 150,
            y: yOffset + index * 60,
            color: "#3b82f6",
            size: 30,
          })
        })

        data.logic?.proofs?.forEach((proof, index) => {
          nodes.push({
            id: `proof-${index}`,
            label: `${proof.symb}: ${proof.nl}`,
            type: "proof",
            x: 450,
            y: yOffset + index * 60,
            color: "#22c55e",
            size: 30,
          })
        })

        data.logic?.crits?.forEach((crit, index) => {
          nodes.push({
            id: `crit-${index}`,
            label: crit.nl,
            type: "critique",
            x: 650,
            y: yOffset + index * 60,
            color: "#f97316",
            size: 25,
          })
        })
        break
    }

    return nodes
  }

  const generateEdges = (nodes: Node[]): Edge[] => {
    const edges: Edge[] = []

    switch (viewMode) {
      case "overview":
        // Connect goal to expertise
        nodes.forEach((node) => {
          if (node.type === "expertise") {
            edges.push({
              from: "goal",
              to: node.id,
              label: "utilise",
              color: "#94a3b8",
            })
          }
        })
        break

      case "knowledge":
        // Connect entities based on triplets
        data.kg?.tri?.forEach((triplet) => {
          edges.push({
            from: triplet.sub,
            to: triplet.obj,
            label: triplet.pred,
            color: "#a855f7",
          })
        })
        break

      case "chain":
        // Connect steps based on dependencies
        data.chain?.steps?.forEach((step) => {
          step.depends_on?.forEach((depIndex) => {
            const fromNode = nodes.find((n) => n.id === `step-${depIndex}`)
            if (fromNode) {
              edges.push({
                from: `step-${depIndex}`,
                to: `step-${step.index}`,
                label: "précède",
                color: "#0891b2",
              })
            }
          })
        })
        break

      case "logic":
        // Connect propositions to proofs
        data.logic?.propos?.forEach((prop, propIndex) => {
          data.logic?.proofs?.forEach((proof, proofIndex) => {
            if (proof.nl.includes(prop.symb)) {
              edges.push({
                from: `prop-${propIndex}`,
                to: `proof-${proofIndex}`,
                label: "prouve",
                color: "#16a34a",
              })
            }
          })
        })
        break
    }

    return edges
  }

  const drawVisualization = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = 600

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    const nodes = generateNodes()
    const edges = generateEdges(nodes)

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)

      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.strokeStyle = edge.color
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw edge label
        const midX = (fromNode.x + toNode.x) / 2
        const midY = (fromNode.y + toNode.y) / 2
        ctx.fillStyle = edge.color
        ctx.font = "12px Poppins, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(edge.label, midX, midY - 5)
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
      ctx.fillStyle = node.color + "20" // Add transparency
      ctx.fill()
      ctx.strokeStyle = node.color
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw node label
      ctx.fillStyle = "#1f2937"
      ctx.font = "14px Poppins, sans-serif"
      ctx.textAlign = "center"

      // Wrap text if too long
      const maxWidth = node.size * 2
      const words = node.label.split(" ")
      let line = ""
      let y = node.y + 5

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " "
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, node.x, y)
          line = words[n] + " "
          y += 16
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, node.x, y)
    })

    ctx.restore()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `reasoning-${viewMode}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-500" />
            Visualisation du Raisonnement
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Vue d'ensemble</SelectItem>
                <SelectItem value="knowledge">Graphe de connaissances</SelectItem>
                <SelectItem value="chain">Chaîne de raisonnement</SelectItem>
                <SelectItem value="logic">Composants logiques</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="w-full h-[600px] border rounded-lg cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="mt-4 text-center text-sm text-slate-500">
          <p>
            {viewMode === "overview" && "Vue d'ensemble du système de raisonnement avec objectifs et expertise"}
            {viewMode === "knowledge" && "Graphe de connaissances montrant les relations sémantiques"}
            {viewMode === "chain" && "Chaîne de raisonnement avec dépendances entre étapes"}
            {viewMode === "logic" && "Composants logiques: propositions, preuves et critiques"}
          </p>
          <p className="mt-1">Glissez pour déplacer • Utilisez les boutons pour zoomer • Téléchargez l'image</p>
        </div>
      </CardContent>
    </Card>
  )
}
