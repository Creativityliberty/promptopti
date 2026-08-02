"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  Database,
  Cpu,
  RefreshCw,
  Download,
} from "lucide-react"

interface AnalyticsData {
  performance: {
    total_workflows: number
    success_rate: number
    average_duration: number
    cache_hit_rate: number
    active_workflows: number
  }
  trends: Array<{
    date: string
    workflows: number
    success_rate: number
    avg_duration: number
  }>
  workflow_types: Array<{
    name: string
    count: number
    success_rate: number
    avg_duration: number
  }>
  recent_activity: Array<{
    workflow_id: string
    type: string
    status: string
    duration: number
    timestamp: number
  }>
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Simuler des données analytics réalistes
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData: AnalyticsData = {
        performance: {
          total_workflows: 1247,
          success_rate: 0.94,
          average_duration: 45.2,
          cache_hit_rate: 0.67,
          active_workflows: 3,
        },
        trends: [
          { date: "2024-01-01", workflows: 45, success_rate: 0.92, avg_duration: 48.5 },
          { date: "2024-01-02", workflows: 67, success_rate: 0.95, avg_duration: 42.1 },
          { date: "2024-01-03", workflows: 89, success_rate: 0.91, avg_duration: 51.3 },
          { date: "2024-01-04", workflows: 123, success_rate: 0.97, avg_duration: 39.8 },
          { date: "2024-01-05", workflows: 156, success_rate: 0.93, avg_duration: 46.7 },
          { date: "2024-01-06", workflows: 134, success_rate: 0.96, avg_duration: 41.2 },
          { date: "2024-01-07", workflows: 178, success_rate: 0.94, avg_duration: 44.9 },
        ],
        workflow_types: [
          { name: "Analyse Simple", count: 567, success_rate: 0.98, avg_duration: 12.4 },
          { name: "Raisonnement Structuré", count: 423, success_rate: 0.89, avg_duration: 78.6 },
          { name: "Validation Logique", count: 257, success_rate: 0.95, avg_duration: 34.2 },
        ],
        recent_activity: [
          {
            workflow_id: "wf_abc123",
            type: "structured_reasoning",
            status: "completed",
            duration: 67.3,
            timestamp: Date.now() - 300000,
          },
          {
            workflow_id: "wf_def456",
            type: "simple_analysis",
            status: "completed",
            duration: 8.9,
            timestamp: Date.now() - 600000,
          },
          {
            workflow_id: "wf_ghi789",
            type: "logical_validation",
            status: "error",
            duration: 23.1,
            timestamp: Date.now() - 900000,
          },
        ],
      }

      setData(mockData)
    } catch (error) {
      console.error("Erreur lors du chargement des analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  const exportData = () => {
    if (!data) return
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analytics-${new Date().toISOString().split("T")[0]}.json`
    link.click()
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${(seconds / 60).toFixed(1)}min`
  }

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `il y a ${days}j`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Chargement des analytics...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p>Erreur lors du chargement des données</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400">Métriques et insights de performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.total_workflows.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.performance.success_rate * 100).toFixed(1)}%</div>
            <Progress value={data.performance.success_rate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.performance.average_duration)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1 text-green-500" />
              -8% cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.performance.cache_hit_rate * 100).toFixed(1)}%</div>
            <Progress value={data.performance.cache_hit_rate * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Volume de Workflows</CardTitle>
                <CardDescription>Évolution du nombre de workflows exécutés</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [value, "Workflows"]}
                    />
                    <Area type="monotone" dataKey="workflows" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de Succès</CardTitle>
                <CardDescription>Évolution du taux de succès des workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis domain={[0.8, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Taux de succès"]}
                    />
                    <Line type="monotone" dataKey="success_rate" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Type</CardTitle>
                <CardDescription>Distribution des types de workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.workflow_types}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.workflow_types.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance par Type</CardTitle>
                <CardDescription>Durée moyenne par type de workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.workflow_types}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatDuration(value), "Durée moyenne"]} />
                    <Bar dataKey="avg_duration" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détails par Type de Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.workflow_types.map((workflow, index) => (
                  <div key={workflow.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{workflow.count} exécutions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{(workflow.success_rate * 100).toFixed(1)}% succès</Badge>
                        <Badge variant="secondary">{formatDuration(workflow.avg_duration)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
              <CardDescription>Indicateurs clés de performance du système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Utilisation CPU</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">45% - Normal</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Utilisation Mémoire</span>
                  </div>
                  <Progress value={67} className="h-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">67% - Normal</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Workflows Actifs</span>
                  </div>
                  <div className="text-2xl font-bold">{data.performance.active_workflows}</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">En cours d'exécution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Derniers workflows exécutés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_activity.map((activity) => (
                  <div key={activity.workflow_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium">{activity.workflow_id}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{activity.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDuration(activity.duration)}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
