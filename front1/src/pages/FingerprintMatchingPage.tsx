import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Fingerprint,
    Upload,
    Search,
    CheckCircle2,
    XCircle,
    User as UserIcon,
    Info,
    Calendar,
    Globe,
    Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface FingerprintMatch {
    name: string;
    age: number;
    gender: string;
    nationality: string;
    remark: string;
    matchScore: number;
    facePhotoB64?: string;
    rawFingerprintB64?: string;
}

const mockMatch: FingerprintMatch = {
    name: "John Doe",
    age: 38,
    gender: "Male",
    nationality: "American",
    remark: "Identified in Detection #det-001. Known associate of interest.",
    matchScore: 0.98,
};

export default function FingerprintMatchingPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [matchingProgress, setMatchingProgress] = useState(0);
    const [matchResult, setMatchResult] = useState<FingerprintMatch | null>(null);
    const [noMatchFound, setNoMatchFound] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { user } = useAuthContext();
    const features = (user as any)?.organizationFeatures || {};
    const fingerprintFeature = features.fingerprint || "full";

    useEffect(() => {
        if (fingerprintFeature === "none") {
            toast.error("Your organization does not have access to Fingerprint Matching.");
            navigate("/");
        }
    }, [fingerprintFeature, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                toast.error("Please upload an image file (PNG, JPG, BMP).");
                return;
            }
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
            setMatchResult(null);
            setNoMatchFound(false);
            setMatchingProgress(0);
        }
    };

    const startMatching = async () => {
        if (!file) return;

        setIsMatching(true);
        setMatchingProgress(0);
        setMatchResult(null);
        setNoMatchFound(false);

        try {
            // Simulate progress while calling API
            const progressInterval = setInterval(() => {
                setMatchingProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }, 500);

            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("http://172.27.3.47:8080/api/fingerprints/match", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setMatchingProgress(100);

            if (response.ok) {
                const data = await response.json();
                // Check if data actually contains a match (assuming firstName existence means match)
                if (data && data.fullName) {
                    setMatchResult({
                        name: data.fullName,
                        age: data.dateOfBirth, // Static placeholder
                        gender: data.sex, // Static placeholder
                        nationality: data.nationality, // Static placeholder
                        remark: "Biometric identification match confirmed via central database.",
                        matchScore: 0.99,
                        facePhotoB64: data.facePhotoB64,
                        rawFingerprintB64: data.rawFingerprintB64
                    });
                    toast.success("Identity Match Found!");
                } else {
                    setNoMatchFound(true);
                    toast.error("No identity match found in database.");
                }
            } else {
                throw new Error("API call failed");
            }
        } catch (error) {
            console.error("Match error:", error);
            setNoMatchFound(true);
            toast.error("Failed to connect to matching service.");
        } finally {
            setIsMatching(false);
        }
    };

    const clearAll = () => {
        setFile(null);
        setPreview(null);
        setMatchResult(null);
        setNoMatchFound(false);
        setMatchingProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <AppLayout title="Fingerprint Matching" subtitle="Biometric identity verification">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-6">

                {/* Left Side: Upload & Scan */}
                <div className="space-y-6">
                    <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] relative border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
                        {!preview ? (
                            <div
                                className="flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium">Upload Fingerprint</p>
                                    <p className="text-sm text-muted-foreground">Click to browse or drag and drop image</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={matchResult?.rawFingerprintB64 ? `data:image/jpeg;base64,${matchResult.rawFingerprintB64}` : preview}
                                    alt="Fingerprint"
                                    className={cn(
                                        "max-h-[300px] object-contain rounded-lg shadow-lg transition-all duration-500",
                                        isMatching && "opacity-50 blur-[2px]",
                                        matchResult?.rawFingerprintB64 && "border-2 border-success/50"
                                    )}
                                />

                                {isMatching && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-1 bg-primary/50 absolute top-0 animate-scan"></div>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                            <p className="text-primary font-bold tracking-widest uppercase">Scanning...</p>
                                        </div>
                                    </div>
                                )}

                                {!isMatching && !matchResult && !noMatchFound && (
                                    <div className="absolute -bottom-4 right-0 flex gap-2">
                                        <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
                                        <Button size="sm" onClick={startMatching}>Start Matching</Button>
                                    </div>
                                )}
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    {isMatching && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Database Search Status</span>
                                <span>{matchingProgress}%</span>
                            </div>
                            <Progress value={matchingProgress} className="h-2" />
                        </div>
                    )}
                </div>

                {/* Right Side: Identity Details */}
                <div className="space-y-6">
                    <div className={cn(
                        "glass-card p-8 min-h-[400px] transition-all duration-500 flex flex-col",
                        matchResult ? "border-success/30 bg-success/5" :
                            noMatchFound ? "border-destructive/30 bg-destructive/5" : ""
                    )}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                matchResult ? "bg-success/20 text-success" :
                                    noMatchFound ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                            )}>
                                <Fingerprint className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Verification Result</h2>
                                <p className="text-sm text-muted-foreground">Automated matching against Public Safety System database</p>
                            </div>
                            {matchResult && (
                                <Badge variant="outline" className="ml-auto flex gap-1 animate-pulse bg-success/10 text-success border-success/30">
                                    <CheckCircle2 className="w-3 h-3" /> Match Found
                                </Badge>
                            )}
                            {noMatchFound && (
                                <Badge variant="destructive" className="ml-auto flex gap-1">
                                    <XCircle className="w-3 h-3" /> No Match
                                </Badge>
                            )}
                        </div>

                        {matchResult ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-6 p-4 rounded-xl bg-background/50 border border-border">
                                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                                        {matchResult.facePhotoB64 ? (
                                            <img
                                                src={`data:image/jpeg;base64,${matchResult.facePhotoB64}`}
                                                alt="Matched User"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="w-12 h-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-foreground">{matchResult.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Badge variant="outline" className="font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Badge>
                                            <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Confidence: {(matchResult.matchScore * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase mb-1">
                                            <Calendar className="w-3 h-3" /> Date of birth
                                        </div>
                                        <p className="font-semibold">{matchResult.age}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase mb-1">
                                            <UserIcon className="w-3 h-3" /> Gender
                                        </div>
                                        <p className="font-semibold">{matchResult.gender}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase mb-1">
                                            <Globe className="w-3 h-3" /> Nationality
                                        </div>
                                        <p className="font-semibold">{matchResult.nationality}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase mb-1">
                                            <Tag className="w-3 h-3" /> Status
                                        </div>
                                        <p className="font-semibold text-warning">Flagged</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                                    <div className="flex items-center gap-2 text-xs text-warning uppercase mb-2 font-bold">
                                        <Info className="w-4 h-4" /> Remark
                                    </div>
                                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                                        "{matchResult.remark}"
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button className="flex-1 gap-2" variant="default" onClick={() => window.location.href = '/detection'}>
                                        View Detections
                                    </Button>
                                    <Button variant="outline" onClick={clearAll}>New Search</Button>
                                </div>
                            </div>
                        ) : noMatchFound ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                                    <XCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Match Found</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    The uploaded fingerprint does not match any records in the surveillance database.
                                    Please try another scan or verify the image quality.
                                </p>
                                <Button variant="outline" className="mt-6" onClick={clearAll}>Try Again</Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                                <Fingerprint className="w-16 h-16 mb-4 opacity-20" />
                                <p className="max-w-xs">
                                    Upload a fingerprint image and click 'Start Matching' to verify against the Public Safety System biometric database.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
        </AppLayout>
    );
}
