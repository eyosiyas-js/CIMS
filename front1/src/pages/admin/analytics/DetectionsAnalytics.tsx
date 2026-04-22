import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminCompanies, useDetailedAnalytics, useRawSubmissions } from "@/hooks/use-admin";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { useState, useMemo } from "react";
import { Download, Filter, Search, FileText, Building2, MapPin, Tag, ArrowRight, Eye, Clock, CheckCircle2, XCircle, TrendingUp, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { RawSubmission } from "@/api/services/adminService";
import { useAuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    color: "hsl(var(--foreground))",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
};

const HANDLING_STATUS_COLORS: Record<string, string> = {
    "Pending Verification": "hsl(38, 92%, 50%)",
    "Detected \u2013 Awaiting Action": "hsl(199, 89%, 48%)",
    "Resolved (Successful)": "hsl(152, 69%, 41%)",
    "Closed (Unsuccessful)": "hsl(0, 72%, 51%)",
    // Keep legacy keys for raw data table backwards compat
    unassigned: "hsl(38, 92%, 50%)",
    pending: "hsl(38, 92%, 50%)",
    in_progress: "hsl(199, 89%, 48%)",
    resolved: "hsl(152, 69%, 41%)",
    failed: "hsl(0, 72%, 51%)",
};

/** Maps internal handling_status values to standardized display labels */
const HANDLING_STATUS_LABEL_MAP: Record<string, string> = {
    unassigned: "Pending Verification",
    pending: "Pending Verification",
    in_progress: "Detected \u2013 Awaiting Action",
    resolved: "Resolved (Successful)",
    failed: "Closed (Unsuccessful)",
};

function StatCard({ title, value, icon: Icon, trend, color, subtitle }: any) {
    return (
        <Card className="overflow-hidden border-none bg-secondary/20 shadow-none">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                        {trend !== undefined && (
                            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                            </p>
                        )}
                        {subtitle && <p className="text-xs mt-1 text-muted-foreground">{subtitle}</p>}
                    </div>
                    <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function DetectionsAnalytics() {
    const [searchParams] = useSearchParams();
    const [selectedRow, setSelectedRow] = useState<RawSubmission | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [filters, setFilters] = useState({ 
        companyId: searchParams.get("companyId") || "all", 
        includeChildren: true,
        category: "all", 
        status: "all",
        location: "",
        startDate: "",
        endDate: "",
        timeSeries: "monthly",
    });
    const { user } = useAuthContext();
    const isSuperAdmin = user?.role === "Super Admin";
    const { data: companies = [] } = useAdminCompanies();
    const { data: analytics, isLoading } = useDetailedAnalytics(filters);
    const { data: rawDataObj } = useRawSubmissions(filters);

    const rawData = useMemo(() => {
        return (rawDataObj ?? []).filter((r: any) => r.type === "detection");
    }, [rawDataObj]);

    const colors = ["hsl(199, 89%, 48%)", "hsl(152, 69%, 41%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(270, 60%, 55%)"];

    if (isLoading) return <div className="p-8 text-center">Loading Detections Analytics...</div>;

    return (
        <AdminLayout title="Detections Analytics" subtitle="Comprehensive detection-focused insights & performance metrics">
            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-xl mb-6 border border-border/50">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                { (user?.role === "Super Admin" || user?.role === "Company Admin") && (
                    <div className="flex items-center gap-3">
                        <Select value={filters.companyId} onValueChange={(v) => setFilters({ ...filters, companyId: v })}>
                            <SelectTrigger className="w-[200px] h-9">
                                <Building2 className="w-3.5 h-3.5 mr-2 opacity-70" />
                                <SelectValue placeholder="All Companies" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Companies</SelectItem>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 px-3 h-9 bg-background/50 border border-border/50 rounded-md">
                            <Switch 
                                id="include-children" 
                                checked={filters.includeChildren} 
                                onCheckedChange={(v) => setFilters({ ...filters, includeChildren: v })} 
                            />
                            <Label htmlFor="include-children" className="text-[10px] uppercase tracking-wider font-bold opacity-70 cursor-pointer whitespace-nowrap">
                                Include Children
                            </Label>
                        </div>
                    </div>
                )}

                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                    <SelectTrigger className="w-[160px] h-9">
                        <Tag className="w-3.5 h-3.5 mr-2 opacity-70" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="person">Person</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger className="w-[220px] h-9">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 opacity-70" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending_verification">Pending Verification</SelectItem>
                        <SelectItem value="in_progress">Detected – Awaiting Action</SelectItem>
                        <SelectItem value="resolved">Resolved (Successful)</SelectItem>
                        <SelectItem value="failed">Closed (Unsuccessful)</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input 
                        type="date" 
                        className="h-9 w-[140px]" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        placeholder="Start"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input 
                        type="date" 
                        className="h-9 w-[140px]" 
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        placeholder="End"
                    />
                </div>

                <div className="flex-1" />
                <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Download className="w-4 h-4" /> Export Report
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview" className="gap-2">
                        <Eye className="w-4 h-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2">
                        <TrendingUp className="w-4 h-4" /> Performance
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="gap-2">
                        <FileText className="w-4 h-4" /> Raw Data
                    </TabsTrigger>
                </TabsList>

                {/* ── Overview Tab ── */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard 
                            title="Total Detections" 
                            value={analytics?.totalDetections ?? 0} 
                            icon={Search} 
                            color="primary" 
                        />
                        <StatCard 
                            title="Resolution Rate" 
                            value={`${analytics?.resolutionRate ?? 0}%`} 
                            icon={CheckCircle2} 
                            color="emerald" 
                            subtitle="Of assigned detections"
                        />
                        <StatCard 
                            title="Avg Resolution Time" 
                            value={analytics?.avgResolutionTimeHours != null ? `${analytics.avgResolutionTimeHours}h` : "N/A"} 
                            icon={Clock} 
                            color="orange" 
                            subtitle="Detection → Resolution/Closure"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-card overflow-hidden border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" />
                                    Detection Categories
                                </CardTitle>
                                <CardDescription>Breakdown by detected object type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row items-center justify-around gap-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={analytics?.recordsByCategory ?? []}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={80}
                                                paddingAngle={5} dataKey="count" nameKey="category"
                                            >
                                                {(analytics?.recordsByCategory ?? []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={tooltipStyle} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-3 w-full max-w-[200px]">
                                        {(analytics?.recordsByCategory ?? []).map((item: any, i: number) => (
                                            <div key={item.category} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                                    <span className="capitalize">{item.category}</span>
                                                </div>
                                                <span className="font-semibold">{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Handling Status Breakdown */}
                        <Card className="glass-card overflow-hidden border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Handling Status Breakdown
                                </CardTitle>
                                <CardDescription>Detection lifecycle status distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row items-center justify-around gap-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={analytics?.handlingStatusBreakdown ?? []}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={80}
                                                paddingAngle={5} dataKey="count" nameKey="status"
                                            >
                                                {(analytics?.handlingStatusBreakdown ?? []).map((item: any, i: number) => (
                                                    <Cell key={i} fill={HANDLING_STATUS_COLORS[item.status] || colors[i % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={tooltipStyle} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-3 w-full max-w-[200px]">
                                        {(analytics?.handlingStatusBreakdown ?? []).map((item: any) => (
                                            <div key={item.status} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HANDLING_STATUS_COLORS[item.status] || "#888" }} />
                                                    <span>{item.status}</span>
                                                </div>
                                                <span className="font-semibold">{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Detection Zones */}
                        <Card className="glass-card overflow-hidden border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    Top Detection Zones
                                </CardTitle>
                                <CardDescription>Locations with highest activity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={analytics?.recordsByLocation ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="location" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                                        <Bar dataKey="count" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Detection Volume Trends */}
                        <Card className="glass-card overflow-hidden border-border/50 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Detection Trends
                            </CardTitle>
                            <CardDescription>Frequency of detections over the selected period</CardDescription>
                        </div>
                        <Select value={filters.timeSeries} onValueChange={(v) => setFilters({ ...filters, timeSeries: v })}>
                            <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-none shadow-none">
                                <Clock className="w-3 h-3 mr-2 opacity-70" />
                                <SelectValue placeholder="Interval" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={analytics?.monthlyTrends ?? []}>
                                        <defs>
                                            <linearGradient id="colorDetOnly" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="detections" stroke="hsl(199, 89%, 48%)" fillOpacity={1} fill="url(#colorDetOnly)" strokeWidth={2} name="Total Detections" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Performance Tab ── */}
                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="overflow-hidden border-none bg-emerald-500/10 shadow-none">
                            <CardContent className="p-6 text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Resolution Rate</p>
                                <h3 className="text-4xl font-bold text-emerald-500">{analytics?.resolutionRate ?? 0}%</h3>
                                <p className="text-xs text-muted-foreground mt-2">Of assigned detections resolved successfully</p>
                            </CardContent>
                        </Card>
                        <Card className="overflow-hidden border-none bg-orange-500/10 shadow-none">
                            <CardContent className="p-6 text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Average Resolution Time</p>
                                <h3 className="text-4xl font-bold text-orange-500">
                                    {analytics?.avgResolutionTimeHours != null ? `${analytics.avgResolutionTimeHours}h` : "N/A"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-2">Average time from detection to resolution or closure</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="glass-card overflow-hidden border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">Handling Status Pipeline</CardTitle>
                            <CardDescription>How detections flow through the handling lifecycle</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics?.handlingStatusBreakdown ?? []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={180} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                                        {(analytics?.handlingStatusBreakdown ?? []).map((item: any, i: number) => (
                                            <Cell key={i} fill={HANDLING_STATUS_COLORS[item.status] || colors[i % colors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Raw Data Tab ── */}
                <TabsContent value="raw">
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Raw Detection Data</CardTitle>
                                <CardDescription>Detailed audit trail of detections</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search detections..." className="pl-9 h-9" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Title/Subject</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Crime Type</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Handling</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rawData.map((row: any) => (
                                            <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-medium max-w-[150px] truncate">{row.title}</TableCell>
                                                <TableCell className="capitalize">{row.category}</TableCell>
                                                <TableCell className="text-xs">{row.crimeType || "—"}</TableCell>
                                                <TableCell>{row.location}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{row.companyName}</TableCell>
                                                <TableCell className="text-xs">{row.assignedCompanyName || "—"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'detected' || row.status === 'monitoring' ? 'bg-blue-500' : 'bg-primary'}`} />
                                                        <span className="text-xs capitalize">{row.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-[10px] capitalize px-1.5 py-0"
                                                        style={{ borderColor: HANDLING_STATUS_COLORS[row.handlingStatus] || undefined, color: HANDLING_STATUS_COLORS[row.handlingStatus] || undefined }}
                                                    >
                                                        {HANDLING_STATUS_LABEL_MAP[row.handlingStatus || "unassigned"] || row.handlingStatus || "Pending Verification"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-[11px]">
                                                    {format(new Date(row.timestamp), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                                                        onClick={() => setSelectedRow(row)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rawData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                    No detection records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Detection Detail Modal ── */}
            <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedRow?.title}
                            <Badge variant="outline" className="capitalize text-xs">
                                {selectedRow?.category}
                            </Badge>
                        </DialogTitle>
                        <UIDialogDescription>
                            Detection ID: {selectedRow?.id} • {selectedRow?.timestamp && format(new Date(selectedRow.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </UIDialogDescription>
                    </DialogHeader>

                    {selectedRow && (
                        <div className="space-y-6 mt-4">
                            {/* Images */}
                            {selectedRow.imageUrls && selectedRow.imageUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {selectedRow.imageUrls.map((url, i) => (
                                        <div key={i} className="rounded-md overflow-hidden bg-muted aspect-video border border-border/50">
                                            <img src={`http://localhost:8000${url}`} alt="Detection" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-1">Core details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Description:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.description || "—"}</span></div>
                                        <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Location:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.location || "—"}</span></div>
                                        <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Status:</span><span className="col-span-2 text-foreground font-medium capitalize">{selectedRow.status || "—"}</span></div>
                                        <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Company:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.companyName || "—"}</span></div>
                                    </div>
                                </div>

                                {/* Extended Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-1">Categorical details</h4>
                                    <div className="space-y-2 text-sm">
                                        {selectedRow.subcategory && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Subcategory:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.subcategory}</span></div>}
                                        {selectedRow.crimeType && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Crime Type:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.crimeType}</span></div>}
                                        {selectedRow.age && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Est. Age:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.age}</span></div>}
                                        
                                        {/* Vehicle specific */}
                                        {selectedRow.category === "vehicle" && (
                                            <>
                                                {selectedRow.plateNumber && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Plate Number:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.plateNumber}</span></div>}
                                                {selectedRow.code && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Code:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.code}</span></div>}
                                                {selectedRow.region && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Region:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.region}</span></div>}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Handling Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-1">Handling Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Assigned To:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.assignedCompanyName || "Unassigned"}</span></div>
                                        <div className="grid grid-cols-3 text-muted-foreground">
                                            <span className="col-span-1">Action Status:</span>
                                            <span className="col-span-2 font-medium" style={{ color: HANDLING_STATUS_COLORS[selectedRow.handlingStatus || "unassigned"] }}>
                                                {HANDLING_STATUS_LABEL_MAP[selectedRow.handlingStatus || "unassigned"] || selectedRow.handlingStatus || "Pending Verification"}
                                            </span>
                                        </div>
                                        {selectedRow.handlingNotes && <div className="grid grid-cols-3 text-muted-foreground"><span className="col-span-1">Notes:</span><span className="col-span-2 text-foreground font-medium">{selectedRow.handlingNotes}</span></div>}
                                    </div>
                                </div>

                                {/* Dynamic Form Data */}
                                {selectedRow.resolvedDynamicData && selectedRow.resolvedDynamicData.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm border-b pb-1 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" /> Dynamic Form Fields
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {selectedRow.resolvedDynamicData.map((field, i) => (
                                                <div key={i} className="grid grid-cols-3 text-muted-foreground">
                                                    <span className="col-span-1">{field.label}:</span>
                                                    <span className="col-span-2 text-foreground font-medium">{String(field.value) || "—"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {selectedRow.handlingProofUrls && selectedRow.handlingProofUrls.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-1">Resolution Proof Images</h4>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {selectedRow.handlingProofUrls.map((url, i) => (
                                            <div key={i} className="rounded-md overflow-hidden bg-muted aspect-square border border-border/50 cursor-pointer" onClick={() => setExpandedImage(`http://localhost:8000${url}`)}>
                                                <img src={`http://localhost:8000${url}`} alt="Proof" className="w-full h-full object-cover transition-transform hover:scale-105" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedRow.detectionEvents && selectedRow.detectionEvents.length > 0 && (
                                <div className="space-y-4 pt-2">
                                    <h4 className="font-semibold text-sm border-b pb-1 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" /> Detection History
                                    </h4>
                                    <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                        {selectedRow.detectionEvents.map((event: any, idx: number) => (
                                            <div key={event.id || idx} className="relative pl-10">
                                                <div className="absolute left-0 top-1 w-[35px] h-[35px] rounded-full border-4 border-background bg-primary/20 flex items-center justify-center z-10">
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-4 border space-y-3">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="font-semibold text-sm">{event.cameraName || "Unknown Camera"}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : "Unknown time"}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] uppercase">Detected</Badge>
                                                    </div>
                                                    {(event.snapshotUrls && event.snapshotUrls.length > 0) ? (
                                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                                            {event.snapshotUrls.map((url: string, imgIdx: number) => (
                                                                <div 
                                                                    key={imgIdx}
                                                                    className="rounded-md overflow-hidden border bg-black/5 w-24 h-24 flex-shrink-0 flex items-center justify-center cursor-pointer"
                                                                    onClick={() => setExpandedImage(`http://localhost:8000${url}`)}
                                                                >
                                                                    <img 
                                                                        src={`http://localhost:8000${url}`} 
                                                                        alt={`Detection ${imgIdx + 1}`}
                                                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : event.snapshotUrl ? (
                                                        <div 
                                                            className="rounded-md overflow-hidden border bg-black/5 w-32 h-32 flex items-center justify-center cursor-pointer"
                                                            onClick={() => setExpandedImage(`http://localhost:8000${event.snapshotUrl}`)}
                                                        >
                                                            <img 
                                                                src={`http://localhost:8000${event.snapshotUrl}`} 
                                                                alt={`Detection at ${event.cameraName}`}
                                                                className="w-full h-full object-cover transition-transform hover:scale-105"
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Expanded Image Modal ── */}
            <Dialog open={!!expandedImage} onOpenChange={(open) => !open && setExpandedImage(null)}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black border-none flex items-center justify-center">
                    {expandedImage && (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/90 p-4">
                            <img 
                                src={expandedImage} 
                                alt="Expanded view" 
                                className="max-w-full max-h-[85vh] object-contain rounded-md"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </AdminLayout>
    );
}
