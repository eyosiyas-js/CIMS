import React, { useState, Suspense } from "react";
const DetectionMovementMap = React.lazy(() => import("@/components/detections/DetectionMovementMap"));
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Car, Package, Upload, Search, Clock, AlertCircle, Eye, Edit3, Trash2, Save, X, Gavel, Shield, PlayCircle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { DetectionRequest } from "@/data/mockData";
import { useDetections, useCreateDetection, useUpdateDetection, useDeleteDetection } from "@/hooks/use-detections";
import { useActiveFormTemplate } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/api/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const CRIME_TYPES = [
  "Theft", "Robbery", "Assault", "Murder", "Kidnapping",
  "Fraud", "Drug Trafficking", "Vandalism", "Cybercrime",
  "Arson", "Burglary", "Extortion", "Forgery", "Smuggling",
  "Terrorism", "Other"
];

const categoryIcons = { person: User, vehicle: Car };
const statusColors = {
  pending: "bg-muted text-muted-foreground",
  monitoring: "bg-primary/20 text-primary",
  detected: "bg-destructive/20 text-destructive",
  in_progress: "bg-blue-500/20 text-blue-600",
  resolved: "bg-green-500/20 text-green-600",
  failed: "bg-destructive/20 text-destructive",
};

export default function DetectionPage() {
  const [selectedCategory, setSelectedCategory] = useState<"person" | "vehicle">("person");
  const [formData, setFormData] = useState({
    name: "", // Alias / description 
    description: "",
    age: "",
    location: "",
    subcategory: "" as "missing_person" | "criminal" | "",
    crimeType: "",
    plateNumber: "",
    code: "",
    region: "",
    eligibleForAssignment: true,
  });
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<DetectionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    age: "",
    location: "",
    subcategory: "" as "missing_person" | "criminal" | "",
    crimeType: "",
    status: "",
    plateNumber: "",
    code: "",
    region: "",
    eligibleForAssignment: true
  });

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const features = (user as any)?.organizationFeatures || {};
  const detectionsFeature = features.detections || "full";
  const isTrafficPolice = user?.companyType === "traffic_police";

  useEffect(() => {
    if (detectionsFeature === "none") {
      toast({ title: "Access Denied", description: "Your organization does not have access to Detections.", variant: "destructive" });
      navigate("/");
    }
  }, [detectionsFeature, navigate]);

  useEffect(() => {
    if (isTrafficPolice && selectedCategory !== "vehicle") {
      setSelectedCategory("vehicle");
    }
  }, [isTrafficPolice, selectedCategory]);

  const { data: detections = [] } = useDetections();
  const createDetection = useCreateDetection();
  const updateDetection = useUpdateDetection();
  const deleteDetection = useDeleteDetection();
  const { data: activeTemplate } = useActiveFormTemplate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${file.name} is over 10MB.`, variant: "destructive" });
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCardClick = (detection: DetectionRequest) => {
    setSelectedDetection(detection);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    if (selectedDetection) {
      setEditFormData({
        name: selectedDetection.name,
        description: selectedDetection.description,
        age: selectedDetection.age || "",
        location: selectedDetection.location || "",
        subcategory: selectedDetection.subcategory || "",
        crimeType: selectedDetection.crimeType || "",
        status: selectedDetection.status,
        plateNumber: selectedDetection.plateNumber || "",
        code: selectedDetection.code || "",
        region: selectedDetection.region || "",
        eligibleForAssignment: selectedDetection.eligibleForAssignment ?? true
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const statusLabel = newStatus.replace("_", " ");
    if (window.confirm(`Are you sure you want to change the status to "${statusLabel}"?`)) {
      updateDetection.mutate({ id, status: newStatus }, {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Detection status changed to ${statusLabel}.` });
        }
      });
    }
  };

  const handleUpdate = () => {
    if (selectedDetection) {
      updateDetection.mutate(
        {
          id: selectedDetection.id,
          ...editFormData,
          subcategory: editFormData.subcategory || undefined,
          crimeType: editFormData.subcategory === "criminal" ? editFormData.crimeType : undefined,
          plateNumber: editFormData.plateNumber,
          code: editFormData.code,
          region: editFormData.region,
          eligibleForAssignment: editFormData.eligibleForAssignment,
          imageFiles: imageFiles
        },
        {
          onSuccess: (updated) => {
            toast({ title: "Detection Updated", description: "The detection request has been updated successfully." });
            setSelectedDetection(updated);
            setIsEditing(false);
            setImageFiles([]);
            setImagePreviews([]);
          }
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this detection request? This action cannot be undone.")) {
      deleteDetection.mutate(id, {
        onSuccess: () => {
          toast({ title: "Detection Deleted", description: "The detection request has been removed." });
          setIsModalOpen(false);
          setSelectedDetection(null);
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createDetection.mutate(
      {
        category: selectedCategory,
        name: formData.name,
        description: formData.description,
        age: selectedCategory === "person" ? formData.age : undefined,
        location: selectedCategory === "person" ? formData.location : undefined,
        subcategory:
          (selectedCategory === "person" || selectedCategory === "vehicle") && formData.subcategory
            ? (formData.subcategory as "missing_person" | "criminal")
            : undefined,
        crimeType:
          selectedCategory === "person" && formData.subcategory === "criminal" && formData.crimeType
            ? formData.crimeType
            : undefined,
        plateNumber: selectedCategory === "vehicle" ? formData.plateNumber : undefined,
        code: selectedCategory === "vehicle" ? formData.code : undefined,
        region: selectedCategory === "vehicle" ? formData.region : undefined,
        eligibleForAssignment: formData.eligibleForAssignment,
        imageFiles: selectedCategory === "vehicle" ? [] : imageFiles,
        formTemplateId: activeTemplate?.id,
        dynamicData: activeTemplate ? dynamicFormData : undefined,
      },
      {
        onSuccess: async () => {

          /* ======================================================
             TEMPORARY: Forward submission to external backend
             Server: http://172.27.3.47:5000
             Remove or comment this block later
          ====================================================== */

          try {
            if (formData.subcategory === "criminal") {

              const form = new FormData();
              form.append("name", formData.name);
              form.append("father_name", "");
              form.append("gender", "");
              form.append("dob", "");
              form.append("crimes", formData.description);
              form.append("profile_idx", "0");

              imageFiles.forEach((file) => {
                form.append("files", file);
              });

              await fetch("http://172.27.3.47:5000/api/criminal/register/criminal", {
                method: "POST",
                body: form,
              });
            }

            if (formData.subcategory === "missing_person") {

              const form = new FormData();
              form.append("name", formData.name);
              form.append("father_name", "");
              form.append("gender", "");
              form.append("dob", "");
              form.append("crimes", formData.description);
              form.append("profile_idx", "0");

              imageFiles.forEach((file) => {
                form.append("files", file);
              });

              await fetch("http://172.27.3.47:5000/api/criminal/register/missing", {
                method: "POST",
                body: form,
              });
            }

          } catch (err) {
            console.warn("Temporary external submission failed:", err);
          }

          /* ====================================================== */

          toast({
            title: "Detection Request Submitted",
            description: `Monitoring for ${selectedCategory}: ${formData.name}${imageFiles.length > 0 ? ` with ${imageFiles.length} images` : ""
              }`,
          });

          setFormData({
            name: "",
            description: "",
            age: "",
            location: "",
            subcategory: "",
            crimeType: "",
            plateNumber: "",
            code: "",
            region: "",
            eligibleForAssignment: true,
          });
          setDynamicFormData({});
          setImageFiles([]);
          setImagePreviews([]);
        },
      }
    );
  };


  const getStatusIcon = (status: DetectionRequest["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "monitoring": return <Eye className="w-4 h-4" />;
      case "detected": return <AlertCircle className="w-4 h-4" />;
      case "in_progress": return <PlayCircle className="w-4 h-4" />;
      case "resolved": return <Shield className="w-4 h-4" />;
      case "failed": return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout title="Detection Management" subtitle="Submit and monitor detection requests">
      <div className={`grid grid-cols-1 ${detectionsFeature === "full" ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Submission Form */}
        {detectionsFeature === "full" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-primary" />New Detection Request</CardTitle>
            <CardDescription>Submit a person, vehicle, or object for the detection system to monitor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["person", "vehicle"] as const).map((category) => {
                    const isDisabled = isTrafficPolice && category === "person";
                    const Icon = categoryIcons[category];
                    return (
                      <button key={category} type="button" onClick={() => !isDisabled && setSelectedCategory(category)}
                        disabled={isDisabled}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${selectedCategory === category ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <Icon className={`w-6 h-6 ${selectedCategory === category ? "text-primary flex-shrink-0" : "text-muted-foreground flex-shrink-0"}`} />
                        <div className="flex flex-col flex-1 min-w-0 w-full items-center">
                          <span className={`text-sm font-medium capitalize truncate w-full flex-1 max-w-[80%] ${selectedCategory === category ? "text-foreground" : "text-muted-foreground"}`}>{category}</span>
                          {isDisabled && <span className="text-[10px] text-destructive font-bold truncate max-w-full">Restricted</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{selectedCategory === "person" ? "Name / Alias" : "Vehicle Name / Brand"}</Label>
                <Input id="name" placeholder={selectedCategory === "person" ? "Enter name or alias..." : "e.g., Black Toyota Corolla"} value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>

              {selectedCategory === "person" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value as any, crimeType: value !== "criminal" ? "" : prev.crimeType }))}
                      >
                        <SelectTrigger id="subcategory">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="missing_person">Missing Person</SelectItem>
                          <SelectItem value="criminal">Criminal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age (Approx.)</Label>
                      <Input id="age" placeholder="e.g., 35" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Last Known Location</Label>
                      <Input id="location" placeholder="e.g., 5th Avenue, near Central Park" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
                    </div>
                  </div>

                  {/* Crime Type Dropdown — visible when subcategory is "criminal" */}
                  {formData.subcategory === "criminal" && (
                    <div className="space-y-2 p-4 border-2 border-amber-500/30 bg-amber-500/5 rounded-lg">
                      <Label htmlFor="crimeType" className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                        <Gavel className="w-4 h-4" />
                        Crime Type
                      </Label>
                      <Select
                        value={formData.crimeType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, crimeType: value }))}
                      >
                        <SelectTrigger id="crimeType" className="border-amber-500/30 focus:ring-amber-500/30">
                          <SelectValue placeholder="Select crime type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CRIME_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {selectedCategory === "vehicle" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber">Plate Number</Label>
                      <Input id="plateNumber" placeholder="e.g., 123456" value={formData.plateNumber} onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input id="code" placeholder="e.g., 2" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
                        required
                      >
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AA">Addis Ababa (AA)</SelectItem>
                          <SelectItem value="OR">Oromia (OR)</SelectItem>
                          <SelectItem value="AM">Amhara (AM)</SelectItem>
                          <SelectItem value="SD">Sidama (SD)</SelectItem>
                          <SelectItem value="HR">Harari (HR)</SelectItem>
                          <SelectItem value="TR">Tigray (TR)</SelectItem>
                          <SelectItem value="SN">SNNPR (SN)</SelectItem>
                          <SelectItem value="DR">Dire Dawa (DR)</SelectItem>
                          <SelectItem value="BG">Benishangul (BG)</SelectItem>
                          <SelectItem value="GG">Gambela (GG)</SelectItem>
                          <SelectItem value="AF">Afar (AF)</SelectItem>
                          <SelectItem value="SM">Somali (SM)</SelectItem>
                          <SelectItem value="SP">South West (SP)</SelectItem>
                          <SelectItem value="ET">Ethiopia (ET)</SelectItem>
                          <SelectItem value="AU">Africa Union (AU)</SelectItem>
                          <SelectItem value="UN">United Nation (UN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_subcategory">Subcategory</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value as any }))}
                      >
                        <SelectTrigger id="vehicle_subcategory">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="missing_person">Stolen / Missing</SelectItem>
                          <SelectItem value="criminal">Wanted for Crime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_location">Last Known Location</Label>
                      <Input id="vehicle_location" placeholder="e.g., Bole Road" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea id="description" placeholder="Provide detailed description including physical characteristics, clothing, distinguishing features..." rows={4} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} required />
              </div>

              <div className="flex flex-row items-center gap-3 p-4 border border-border rounded-lg bg-card/50 hover:bg-card transition-colors">
                <Checkbox 
                  id="eligibleForAssignment" 
                  checked={formData.eligibleForAssignment} 
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setFormData(prev => ({ ...prev, eligibleForAssignment: isChecked }));
                  }} 
                />
                <div className="space-y-1">
                  <Label htmlFor="eligibleForAssignment" className="text-sm font-semibold cursor-pointer">Eligible for External Assignment</Label>
                  <p className="text-xs text-muted-foreground">
                    If checked, this detection will be automatically assigned to the nearest available security company. Otherwise, it will remain internal.
                  </p>
                </div>
              </div>

              {/* Dynamic Form Template Fields */}
              {activeTemplate && activeTemplate.fields && activeTemplate.fields.length > 0 && (
                <div className="space-y-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <Label className="text-sm font-semibold text-primary">{activeTemplate.name}</Label>
                    <span className="text-xs text-muted-foreground">— Additional fields</span>
                  </div>
                  {activeTemplate.fields.map((field: any) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={`dyn-${field.id}`} className="text-sm">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={`dyn-${field.id}`}
                          placeholder={field.placeholder}
                          value={dynamicFormData[field.id] || ""}
                          onChange={(e) => setDynamicFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          rows={3}
                          required={field.required}
                        />
                      ) : field.type === "select" ? (
                        <Select
                          value={dynamicFormData[field.id] || ""}
                          onValueChange={(val) => setDynamicFormData(prev => ({ ...prev, [field.id]: val }))}
                        >
                          <SelectTrigger id={`dyn-${field.id}`}>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options || []).map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`dyn-${field.id}`}
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          placeholder={field.placeholder}
                          value={dynamicFormData[field.id] || ""}
                          onChange={(e) => setDynamicFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedCategory !== "vehicle" && (
                <div className="space-y-2">
                  <Label>Reference Images (Multiple Selection Possible)</Label>
                  {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border-2 border-primary/20 rounded-lg">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group aspect-square border-2 border-primary/30 rounded-md overflow-hidden bg-muted">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white p-1 truncate text-center">
                            {imageFiles[idx]?.name || "Image"}
                          </p>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/30 rounded-md cursor-pointer hover:bg-primary/5 transition-colors">
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        <Upload className="w-6 h-6 text-primary/60" />
                        <span className="text-[10px] font-medium mt-1">Add More</span>
                      </label>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <input type="file" multiple accept="image/png,image/jpeg,image/jpg" onChange={handleImageChange} className="hidden" />
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Select multiple images or drag to upload</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB each</p>
                    </label>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createDetection.isPending}>
                <Search className="w-4 h-4 mr-2" />{createDetection.isPending ? "Submitting..." : "Submit Detection Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Active Detections List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />Active Detection Requests</CardTitle>
            <CardDescription>Monitor status of submitted detection requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="monitoring">Active</TabsTrigger>
                <TabsTrigger value="detected">Alerts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                {detections.map((detection) => <DetectionCard key={detection.id} detection={detection} onClick={() => handleCardClick(detection)} />)}
              </TabsContent>
              <TabsContent value="monitoring" className="space-y-3">
                {detections.filter(d => d.status === "monitoring" || d.status === "pending").map((detection) => <DetectionCard key={detection.id} detection={detection} onClick={() => handleCardClick(detection)} />)}
              </TabsContent>
              <TabsContent value="detected" className="space-y-3">
                {detections.filter(d => d.status === "detected").map((detection) => <DetectionCard key={detection.id} detection={detection} onClick={() => handleCardClick(detection)} />)}
              </TabsContent>
              <TabsContent value="history" className="space-y-3">
                {detections.filter(d => d.status === "resolved" || d.status === "failed").map((detection) => <DetectionCard key={detection.id} detection={detection} onClick={() => handleCardClick(detection)} />)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                {selectedDetection && categoryIcons[selectedDetection.category] && (
                  <div className={`p-2 rounded-lg ${selectedDetection.status === "detected" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                    {React.createElement(categoryIcons[selectedDetection.category], { className: "w-5 h-5" })}
                  </div>
                )}
                {isEditing ? `Editing: ${selectedDetection?.name}` : "Detection Details"}
              </DialogTitle>
              {!isEditing && detectionsFeature === "full" && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleEditClick} className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => selectedDetection && handleDelete(selectedDetection.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <DialogDescription>
              {isEditing ? "Update the information for this detection request." : "Detailed information about the submitted detection request."}
            </DialogDescription>
          </DialogHeader>

          {selectedDetection && (
            <div className="space-y-6 py-4">
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name / Description</Label>
                    <Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editFormData.status} onValueChange={(val) => setEditFormData(prev => ({ ...prev, status: val }))}>
                        <SelectTrigger id="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="monitoring">Monitoring</SelectItem>
                          <SelectItem value="detected">Detected</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedDetection.category === "person" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-subcategory">Subcategory</Label>
                        <Select value={editFormData.subcategory} onValueChange={(val) => setEditFormData(prev => ({ ...prev, subcategory: val as any }))}>
                          <SelectTrigger id="edit-subcategory">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="missing_person">Missing Person</SelectItem>
                            <SelectItem value="criminal">Criminal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {selectedDetection.category === "person" && editFormData.subcategory === "criminal" && (
                    <div className="space-y-2 p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg">
                      <Label htmlFor="edit-crimeType" className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                        <Gavel className="w-4 h-4" /> Crime Type
                      </Label>
                      <Select value={editFormData.crimeType} onValueChange={(val) => setEditFormData(prev => ({ ...prev, crimeType: val }))}>
                        <SelectTrigger id="edit-crimeType" className="border-amber-500/30">
                          <SelectValue placeholder="Select crime type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CRIME_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}



                  {selectedDetection.category === "vehicle" && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-plateNumber">Plate Number</Label>
                          <Input id="edit-plateNumber" value={editFormData.plateNumber} onChange={(e) => setEditFormData(prev => ({ ...prev, plateNumber: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-code">Code</Label>
                          <Input id="edit-code" value={editFormData.code} onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-region">Region</Label>
                          <Input id="edit-region" value={editFormData.region} onChange={(e) => setEditFormData(prev => ({ ...prev, region: e.target.value }))} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-vehicle_subcategory">Subcategory</Label>
                          <Select value={editFormData.subcategory} onValueChange={(val) => setEditFormData(prev => ({ ...prev, subcategory: val as any }))}>
                            <SelectTrigger id="edit-vehicle_subcategory">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="missing_person">Stolen / Missing</SelectItem>
                              <SelectItem value="criminal">Wanted for Crime</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-vehicle_location">Location</Label>
                          <Input id="edit-vehicle_location" value={editFormData.location} onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Detailed Description</Label>
                    <Textarea id="edit-description" rows={4} value={editFormData.description} onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))} />
                  </div>

                  <div className="flex flex-row items-center gap-3 p-4 border border-border rounded-lg bg-card/50">
                    <Checkbox 
                      id="edit-eligibleForAssignment" 
                      checked={editFormData.eligibleForAssignment} 
                      onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, eligibleForAssignment: !!checked }))} 
                    />
                    <div className="space-y-1">
                      <Label htmlFor="edit-eligibleForAssignment" className="text-sm font-semibold cursor-pointer">Eligible for External Assignment</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow external security companies to handle this detection.
                      </p>
                    </div>
                  </div>

                  {selectedDetection.category !== "vehicle" && (
                  <div className="space-y-2">
                    <Label>Update / Add Reference Images</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-square border-2 border-primary/20 rounded-md overflow-hidden bg-muted">
                          <img src={preview} alt={`Edit Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-white"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50">
                        <input type="file" multiple onChange={handleImageChange} className="hidden" />
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-0.5">Add</span>
                      </label>
                    </div>
                  </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={handleUpdate} disabled={updateDetection.isPending}>
                      <Save className="w-4 h-4 mr-2" /> {updateDetection.isPending ? "Updating..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Name / Description</p>
                      <p className="text-base font-semibold">{selectedDetection.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[selectedDetection.status]}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(selectedDetection.status)}
                            <span className="capitalize">{selectedDetection.status.replace("_", " ")}</span>
                          </span>
                        </Badge>
                        {detectionsFeature === "full" && (
                          <div className="flex items-center gap-1 border-l pl-2 ml-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" title="Change Status">
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(selectedDetection.id, "in_progress")}
                                  className="flex items-center gap-2 cursor-pointer text-blue-600"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>In Progress</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(selectedDetection.id, "resolved")}
                                  className="flex items-center gap-2 cursor-pointer text-green-600"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Resolved</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(selectedDetection.id, "failed")}
                                  className="flex items-center gap-2 cursor-pointer text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Failed</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(selectedDetection.id, "monitoring")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Monitoring</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="text-base capitalize">{selectedDetection.category}</p>
                    </div>
                    {selectedDetection.subcategory && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Subcategory</p>
                        <Badge variant="secondary" className="capitalize">
                          {selectedDetection.subcategory.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                    {selectedDetection.crimeType && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5 text-amber-500" /> Crime Type
                        </p>
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25">
                          {selectedDetection.crimeType}
                        </Badge>
                      </div>
                    )}
                    {selectedDetection.category === "person" && selectedDetection.age && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Approx. Age</p>
                        <p className="text-base">{selectedDetection.age}</p>
                      </div>
                    )}
                    {selectedDetection.category === "vehicle" && selectedDetection.plateNumber && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Plate Number</p>
                          <p className="text-base font-semibold text-blue-600">{selectedDetection.plateNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Code</p>
                          <Badge variant="outline" className="font-mono text-base">{selectedDetection.code}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Region</p>
                          <p className="text-base">{selectedDetection.region}</p>
                        </div>
                      </>
                    )}
                    {selectedDetection.location && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Known Location</p>
                        <p className="text-base">{selectedDetection.location}</p>
                      </div>
                    )}
                  </div>

                  {selectedDetection.handlingStatus && selectedDetection.handlingStatus !== 'unassigned' && (
                    <div className="space-y-3 p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg mt-4">
                      <p className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Assignment & Resolution Details
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5 col-span-2">
                          <p className="text-xs font-medium text-muted-foreground">Assigned To</p>
                          {(selectedDetection as any).assignmentType === 'user' ? (
                            (selectedDetection as any).assignedOfficers && (selectedDetection as any).assignedOfficers.length > 0 ? (
                              <div className="space-y-2 mt-1">
                                {(selectedDetection as any).assignedOfficers.map((officer: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-blue-50 border border-blue-200">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold text-blue-900">{officer.officerName}</span>
                                      <span className="text-xs text-muted-foreground">{officer.officerEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {officer.distanceKm != null && (
                                        <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 bg-blue-50">
                                          📍 {officer.distanceKm} km
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={officer.status === 'closed_resolved' ? 'default' : officer.status === 'assigned' ? 'secondary' : officer.status === 'closed_failed' ? 'destructive' : 'outline'}
                                        className="text-[10px] capitalize"
                                      >
                                        {officer.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-yellow-600">Pending Officer Match (Geo-dispatching...)</p>
                            )
                          ) : (
                            <p className="text-sm font-semibold text-blue-800">{selectedDetection.assignedCompanyName || "Local Response Team"}</p>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-muted-foreground">Handling Status</p>
                          <Badge variant={selectedDetection.handlingStatus === 'resolved' ? 'default' : selectedDetection.handlingStatus === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                            {selectedDetection.handlingStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                        {selectedDetection.handlingNotes && (
                          <div className="space-y-0.5 col-span-2">
                            <p className="text-xs font-medium text-muted-foreground">Handling Notes</p>
                            <p className="text-sm">{selectedDetection.handlingNotes}</p>
                          </div>
                        )}
                      </div>
                      {selectedDetection.handlingProofUrls && selectedDetection.handlingProofUrls.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Proof Images</p>
                          <div className="flex gap-2">
                            {selectedDetection.handlingProofUrls.map((url, idx) => (
                              <div 
                                key={idx} 
                                className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center w-16 h-16 cursor-pointer"
                                onClick={() => setExpandedImage(getMediaUrl(url))}  
                              >
                                <img src={getMediaUrl(url)} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover transition-transform hover:scale-110" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Detailed Description</p>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm border">
                      {selectedDetection.description}
                    </div>
                  </div>

                  {/* Resolved Dynamic Form Data */}
                  {selectedDetection.resolvedDynamicData && selectedDetection.resolvedDynamicData.length > 0 && (
                    <div className="space-y-3 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                      <p className="text-sm font-semibold text-primary flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Additional Information
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDetection.resolvedDynamicData.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                            <p className="text-sm">{String(item.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movement Tracking Map */}
                  {selectedDetection.detectionEvents && selectedDetection.detectionEvents.length > 0 && selectedDetection.detectionEvents.some(e => e.lat && e.lng) && (
                    <Suspense fallback={<div className="h-[280px] w-full bg-muted animate-pulse rounded-xl" />}>
                      <DetectionMovementMap events={selectedDetection.detectionEvents} />
                    </Suspense>
                  )}

                  {selectedDetection.detectionEvents && selectedDetection.detectionEvents.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Detection History
                      </p>
                      <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {selectedDetection.detectionEvents.map((event, idx) => (
                          <div key={event.id || idx} className="relative pl-10">
                            <div className="absolute left-0 top-1 w-[35px] h-[35px] rounded-full border-4 border-background bg-primary/20 flex items-center justify-center z-10">
                              <Eye className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4 border space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-semibold text-sm">{event.cameraName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase">Proof Available</Badge>
                              </div>
                              {(event.snapshotUrls && event.snapshotUrls.length > 0) ? (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {event.snapshotUrls.map((url: string, imgIdx: number) => (
                                    <div 
                                      key={imgIdx}
                                      className="rounded-md overflow-hidden border bg-black/5 w-24 h-24 flex-shrink-0 flex items-center justify-center cursor-pointer"
                                      onClick={() => setExpandedImage(getMediaUrl(url))}
                                    >
                                      <img 
                                        src={getMediaUrl(url)} 
                                        alt={`Detection ${imgIdx + 1} at ${event.cameraName}`}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : event.snapshotUrl ? (
                                <div 
                                  className="rounded-md overflow-hidden border bg-black/5 w-32 h-32 flex items-center justify-center cursor-pointer"
                                  onClick={() => setExpandedImage(getMediaUrl(event.snapshotUrl))}
                                >
                                  <img 
                                    src={getMediaUrl(event.snapshotUrl)} 
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

                  {((selectedDetection.imageUrls && selectedDetection.imageUrls.length > 0) || selectedDetection.id === "det-001" || selectedDetection.id === "det-004") && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Reference Images ({selectedDetection.imageUrls?.length || 1})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(selectedDetection.imageUrls && selectedDetection.imageUrls.length > 0) ? (
                          selectedDetection.imageUrls.map((url, idx) => (
                            <div 
                              key={idx} 
                              className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center p-1 w-24 h-24 cursor-pointer"
                              onClick={() => setExpandedImage(getMediaUrl(url))}  
                            >
                              <img
                                src={getMediaUrl(url)}
                                alt={`Reference ${idx + 1}`}
                                className="w-full h-full object-cover rounded-md shadow-sm transition-transform hover:scale-105"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center p-4 sm:col-span-2">
                            <img
                              src={`https://images.unsplash.com/photo-${selectedDetection.category === "person" ? "1507003211169-0a1dd7228f2d" : "1533473359331-0135ef1b58bf"}?auto=format&fit=crop&q=80&w=800`}
                              alt="Reference"
                              className="max-h-80 object-contain rounded-md shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t text-xs text-muted-foreground flex justify-between">
                    <span>Created: {new Date(selectedDetection.createdAt).toLocaleString()}</span>
                    <span>Last Updated: {new Date(selectedDetection.updatedAt).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!expandedImage} onOpenChange={(open) => !open && setExpandedImage(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none flex justify-center items-center [&>button]:text-white [&>button]:bg-black/50 [&>button]:p-2 [&>button]:rounded-full hover:[&>button]:bg-black/70">
          <img src={expandedImage || ""} alt="Expanded view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function DetectionCard({ detection, onClick }: { detection: DetectionRequest, onClick?: () => void }) {
  const category = (detection.category || "unknown").toLowerCase();
  const Icon = categoryIcons[category as keyof typeof categoryIcons] || AlertCircle;
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-200 hover:border-primary/50 cursor-pointer hover:shadow-md ${
        detection.status === "detected" ? "border-destructive/30 bg-destructive/5" : 
        detection.status === "resolved" ? "border-green-500/30 bg-green-500/5" :
        detection.status === "failed" ? "border-destructive/30 bg-destructive/5" :
        "border-border bg-card/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
          detection.status === "detected" ? "bg-destructive/20" : 
          detection.status === "in_progress" ? "bg-blue-500/20" :
          detection.status === "resolved" ? "bg-green-500/20" :
          detection.status === "failed" ? "bg-destructive/20" :
          "bg-muted"
        }`}>
          <Icon className={`w-5 h-5 ${
            detection.status === "detected" ? "text-destructive" : 
            detection.status === "in_progress" ? "text-blue-600" :
            detection.status === "resolved" ? "text-green-600" :
            detection.status === "failed" ? "text-destructive" :
            "text-muted-foreground"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{detection.name}</span>
            <Badge variant="outline" className={statusColors[detection.status]}>{detection.status}</Badge>
            {detection.subcategory && (
              <Badge variant="secondary" className="capitalize">{detection.subcategory.replace("_", " ")}</Badge>
            )}
            {detection.crimeType && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                <Gavel className="w-3 h-3 mr-0.5" />{detection.crimeType}
              </Badge>
            )}
            {detection.detectedCameraIds && detection.detectedCameraIds.length > 0 && (
              <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />{detection.detectedCameraIds.length} camera(s)</Badge>
            )}
          </div>
          {(detection.age || detection.location) && (
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              {detection.age && <span>Age: {detection.age}</span>}
              {detection.location && <span>Location: {detection.location}</span>}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{detection.description}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Updated: {new Date(detection.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
