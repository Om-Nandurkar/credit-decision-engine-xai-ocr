import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  CreditCard,
  Download,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  Loader2,
  Cpu,
  Eye,
  Code,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Target,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ApplicationTimeline,
  getApplicationTimeline,
} from "@/components/ui/ApplicationTimeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
// UPDATED: Import apiBaseUrl alongside supabase
import { supabase, apiBaseUrl } from "@/supabaseClient";

// --- PDF GENERATION IMPORTS ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// --- Types ---
interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  type: 'internal_note' | 'clarification_request' | 'decision_log';
}

interface OCRField {
  value: string;
  confidence: number;
  verified: boolean;
}

interface ApplicationData {
  id: string;
  applicant: {
    name: string;
    email: string;
    phone: string;
    pan: string;
    aadhaar: string;
    address: string;
    employment: string;
    employer: string;
    experience: string;
    salary: number;
  };
  loan: {
    amount: number;
    tenure: number;
    purpose: string;
    emi: number;
  };
  documents: {
    type: string;
    status: string;
    confidence: number;
    path: string; 
  }[];
  ocrData: {
    [key: string]: OCRField;
  };
  ocrJsonRaw: any;
  creditScore: {
    score: number;
    recommendation: string;
    explanation: string;
    shapData: any[];
    limeData: any[]; 
    counterfactuals: string[];
  };
  status: string;
  officerDecision: string | null;
  officerComments: Comment[];
  submittedAt: string;
  lastUpdated: string;
}

// --- Custom Tooltip Component for Dark Mode Visibility ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-slate-200 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-mono font-medium">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ApplicationDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  
  const [comment, setComment] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false); // NEW
  
  const [approvalReason, setApprovalReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const [xaiMode, setXaiMode] = useState<"SHAP" | "LIME">("SHAP");

  useEffect(() => {
    if (appId) {
      fetchApplicationDetails();
    }
  }, [appId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('application_id', appId)
        .single();

      if (loanError) throw loanError;

      const { data: xaiResponse, error: xaiError } = await supabase
        .from('xai_data')
        .select('*')
        .eq('application_id', appId)
        .order('created_at', { ascending: false });

      if (xaiError) console.error("XAI Fetch Error:", xaiError);

      const xaiData = (xaiResponse && xaiResponse.length > 0) ? xaiResponse[0] : null;

      const documents = loanData.document_urls ? Object.entries(loanData.document_urls).map(([key, path]) => ({
        type: key.replace(/_/g, ' ').toUpperCase(),
        status: "verified", 
        confidence: 0.98,
        path: String(path) 
      })) : [];

      const ocrJson = xaiData?.ocr_json || {};
      const panData = ocrJson.pan_card || {};
      const bankData = ocrJson.bank_statement || {};
      const payslipData = ocrJson.payslips || {};
      
      let monthEndBalance = "0";
      if (bankData && typeof bankData === 'object') {
         const monthKeys = Object.keys(bankData).filter(k => k.includes('-'));
         if (monthKeys.length > 0) {
            const latest = monthKeys[monthKeys.length - 1];
            monthEndBalance = bankData[latest]?.month_end_balance || "0";
         }
      }

      const firstPayslipKey = Object.keys(payslipData)[0];
      const firstPayslip = firstPayslipKey ? payslipData[firstPayslipKey] : {};
      const employerName = firstPayslip.employer_name || bankData.employer_name || "N/A";

      const transformedApp: ApplicationData = {
        id: loanData.application_id,
        applicant: {
          name: `${loanData.first_name} ${loanData.last_name}`,
          email: loanData.email,
          phone: loanData.phone_number,
          pan: loanData.pan_number,
          aadhaar: "****-****-5678",
          address: ocrJson?.aadhaar_card?.back?.address || "Address not detected",
          employment: firstPayslip.employer_category || "Salaried",
          employer: employerName,
          experience: ocrJson?.employment_info?.employment_tenure_years ? `${ocrJson.employment_info.employment_tenure_years} years` : "N/A",
          salary: loanData.monthly_income,
        },
        loan: {
          amount: loanData.loan_amount,
          tenure: loanData.loan_tenure,
          purpose: loanData.loan_purpose,
          emi: Math.round((loanData.loan_amount * (10.5/1200) * Math.pow(1 + 10.5/1200, loanData.loan_tenure)) / (Math.pow(1 + 10.5/1200, loanData.loan_tenure) - 1)) || 0,
        },
        documents: documents,
        ocrData: {
          name: { value: panData.name || "N/A", confidence: 0.98, verified: true },
          pan: { value: panData.pan_number || loanData.pan_number, confidence: 0.99, verified: true },
          salary: { value: String(loanData.monthly_income), confidence: 0.85, verified: false },
          employer: { value: employerName, confidence: 0.88, verified: true },
          bankBalance: { value: String(monthEndBalance), confidence: 0.92, verified: true },
        },
        ocrJsonRaw: xaiData?.ocr_json || null,
        creditScore: {
          score: loanData.credit_score || 0,
          recommendation: (loanData.credit_score || 0) > 700 ? "approved" : "needs_review",
          explanation: xaiData?.explanation_output || "AI Analysis pending...",
          shapData: xaiData?.shap_values || [],
          limeData: xaiData?.lime_values || [], 
          counterfactuals: xaiData?.counterfactuals || [],
        },
        status: loanData.loan_status || 'pending',
        officerDecision: loanData.officer_decision || null,
        officerComments: Array.isArray(loanData.officer_comments) ? loanData.officer_comments : [],
        submittedAt: loanData.created_at,
        lastUpdated: loanData.created_at,
      };

      setApplication(transformedApp);

    } catch (error) {
      console.error("Error fetching application details:", error);
      toast({
        title: "Error",
        description: "Failed to load application details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (path: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('loan_documents')
        .createSignedUrl(path, 60);

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast({ title: "Error", description: "URL generation failed", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error opening document:", err);
      toast({ title: "Error", description: "Could not open document.", variant: "destructive" });
    }
  };

  const handleProceedToScoring = async () => {
    try {
      setLoading(true);

      // UPDATED: Used apiBaseUrl variable
      const response = await fetch(`${apiBaseUrl}/calculate-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loan_id: appId }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI Engine');
      }

      setApplication((prev) => prev ? ({ ...prev, status: 'under_credit_scoring' }) : null);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      toast({ 
        title: "AI Scoring Started", 
        description: "The model is analyzing the data. Results will appear shortly." 
      });

      setTimeout(() => {
          fetchApplicationDetails();
      }, 3000);

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to trigger scoring.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleApprove = async () => {
     try {
        const decisionComment: Comment = {
            id: Date.now().toString(),
            text: `LOAN APPROVED. Officer Note: ${approvalReason || "No additional notes."}`,
            author: "Loan Officer",
            timestamp: new Date().toISOString(),
            type: "decision_log"
        };
        const updatedComments = [...(application?.officerComments || []), decisionComment];

        const { error } = await supabase.from('loans').update({ 
            officer_decision: 'approved',
            officer_comments: updatedComments
        }).eq('application_id', appId);

        if(error) throw error;

        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#16a34a'] });
        toast({ title: "Approved", description: "Loan successfully approved." });
        
        setApplication((prev) => prev ? ({ 
            ...prev, 
            officerDecision: 'approved',
            officerComments: updatedComments 
        }) : null);
        setIsApproveModalOpen(false);
     } catch(e) { 
        console.error(e);
        toast({ title: "Error", description: "Failed to approve loan", variant: "destructive" });
     }
  };

  const handleReject = async () => {
     try {
        const decisionComment: Comment = {
            id: Date.now().toString(),
            text: `LOAN REJECTED. Reason: ${rejectionReason}`,
            author: "Loan Officer",
            timestamp: new Date().toISOString(),
            type: "decision_log"
        };
        const updatedComments = [...(application?.officerComments || []), decisionComment];

        const { error } = await supabase.from('loans').update({ 
            officer_decision: 'rejected',
            officer_comments: updatedComments
        }).eq('application_id', appId);

        if(error) throw error;

        toast({ title: "Rejected", description: "Loan has been rejected." });
        
        setApplication((prev) => prev ? ({ 
            ...prev, 
            officerDecision: 'rejected',
            officerComments: updatedComments 
        }) : null);
        setIsRejectModalOpen(false);
     } catch(e) { 
        console.error(e);
        toast({ title: "Error", description: "Failed to reject loan", variant: "destructive" });
     }
  };

  const handleRequestClarification = async () => {
    if (!clarificationReason.trim()) {
      toast({ title: "Required", description: "Please enter a message.", variant: "destructive" });
      return;
    }

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        text: clarificationReason,
        author: "Loan Officer",
        timestamp: new Date().toISOString(),
        type: "clarification_request"
      };

      const currentComments = application?.officerComments || [];
      const updatedComments = [...currentComments, newComment];

      const { error } = await supabase
        .from('loans')
        .update({ 
          loan_status: 'under_clarification',
          officer_comments: updatedComments
        })
        .eq('application_id', appId);

      if (error) throw error;

      toast({ title: "Request Sent", description: "Applicant has been notified." });
      setApplication((prev) => prev ? ({ 
        ...prev, 
        status: 'under_clarification',
        officerComments: updatedComments
      }) : null);
      setIsClarifyModalOpen(false);
      setClarificationReason("");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to send request.", variant: "destructive" });
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text: comment,
      author: "Loan Officer",
      timestamp: new Date().toISOString(),
      type: "internal_note"
    };

    const currentComments = application?.officerComments || [];
    const updatedComments = [...currentComments, newComment];

    try {
        const { error } = await supabase
            .from('loans')
            .update({ officer_comments: updatedComments })
            .eq('application_id', appId);
        
        if (error) throw error;

        setApplication((prev) => prev ? ({ ...prev, officerComments: updatedComments }) : null);
        setComment("");
        toast({ title: "Note Added", description: "Internal note saved." });
    } catch(e) { 
        console.error(e);
        toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string) => {
    setApplication((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ocrData: {
          ...prev.ocrData,
          [field]: { ...prev.ocrData[field], value: editValue, verified: true },
        },
      };
    });
    setEditingField(null);
    setEditValue("");
    toast({ title: "Field Updated", description: "Value updated locally. Submit to save to DB." });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600";
    if (score >= 650) return "text-yellow-600";
    return "text-red-600";
  };

  const handleExportReport = async () => {
    if (!application) return;

    toast({ title: "Generating Report...", description: "Please wait while we compile the PDF." });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("FynXai Application Report", 14, 22);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 28, pageWidth - 14, 28);

    // 2. Applicant Details
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Applicant Details", 14, 40);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`Name: ${application.applicant.name}`, 14, 48);
    doc.text(`PAN: ${application.applicant.pan}`, 14, 54);
    doc.text(`Email: ${application.applicant.email}`, 14, 60);
    doc.text(`Phone: ${application.applicant.phone}`, 14, 66);
    doc.text(`Monthly Income: Rs. ${application.applicant.salary.toLocaleString('en-IN')}`, 14, 72);

    // 3. Loan Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Loan Details", 120, 40);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`Requested Amount: Rs. ${application.loan.amount.toLocaleString('en-IN')}`, 120, 48);
    doc.text(`Tenure: ${application.loan.tenure} months`, 120, 54);
    doc.text(`Purpose: ${application.loan.purpose}`, 120, 60);

    // 4. AI Score
    let currentY = 85;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Credit Assessment", 14, currentY);

    currentY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`AI Credit Score: ${application.creditScore.score} / 900`, 14, currentY);
    currentY += 6;
    doc.text(`AI Recommendation: ${application.creditScore.recommendation.replace('_', ' ').toUpperCase()}`, 14, currentY);
    currentY += 6;
    
    if (application.officerDecision) {
        doc.setFont("helvetica", "bold");
        doc.text(`Final Officer Decision: ${application.officerDecision.toUpperCase()}`, 14, currentY);
        doc.setFont("helvetica", "normal");
        currentY += 6;
    }

    currentY += 6;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Assessment", 14, currentY);
    
    currentY += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const explanationLines = doc.splitTextToSize(application.creditScore.explanation, pageWidth - 28);
    doc.text(explanationLines, 14, currentY);
    
    currentY += (explanationLines.length * 5) + 8;

    // SHAP Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Influencing Factors (SHAP)", 14, currentY + 5);

    const tableData = application.creditScore.shapData.map(item => [
        item.feature,
        item.impact > 0 ? "Positive" : "Negative",
        `${item.impact > 0 ? '+' : ''}${Math.round(item.impact)} pts`
    ]);

    autoTable(doc, {
        startY: currentY + 10,
        head: [['Factor', 'Impact Type', 'Points']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { font: "helvetica", fontSize: 10 },
        columnStyles: {
            1: { cellWidth: 30 },
            2: { cellWidth: 30, halign: 'right' }
        },
        willDrawCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
                if (data.cell.raw === 'Positive') {
                    doc.setTextColor(34, 197, 94);
                } else {
                    doc.setTextColor(239, 68, 68);
                }
            }
        }
    });

    try {
        // Capture the Comparative SHAP vs LIME Chart for the PDF
        const compareElement = document.getElementById("pdf-compare-capture");
        if (compareElement && application.creditScore.shapData.length > 0) {
            const canvas2 = await html2canvas(compareElement, { 
                scale: 2, 
                backgroundColor: "#ffffff" 
            });
            const imgData2 = canvas2.toDataURL("image/png");

            doc.addPage();
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text("AI Model Comparison (SHAP vs LIME)", 14, 20);

            const imgHeight2 = (canvas2.height * 180) / canvas2.width;
            
            doc.addImage(imgData2, "PNG", 14, 30, 180, imgHeight2);
        }
    } catch (err) {
        console.error("Error capturing chart for PDF:", err);
    }

    doc.save(`FynXai_Application_${application.id.slice(0, 8)}.pdf`);
    toast({ title: "Success", description: "Report downloaded successfully." });
  };

  const currentChartData = xaiMode === 'SHAP' ? application?.creditScore.shapData : application?.creditScore.limeData;

  // Calculate comparison data for the modal and PDF
  const comparisonData = application?.creditScore.shapData.map(s => {
    const l = application.creditScore.limeData.find(lx => lx.feature === s.feature);
    return {
      feature: s.feature,
      SHAP: s.impact,
      LIME: l ? l.impact : 0
    };
  }) || [];

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!application) return <div className="text-center pt-20">Application not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/officer")} className="hover-lift">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Application Review</h1>
              <p className="text-muted-foreground">ID: {application.id ? application.id.slice(0,8) + '...' : 'ID'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {application.officerDecision && (
                <Badge className={`text-md px-3 py-1 ${application.officerDecision === 'approved' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {application.officerDecision === 'approved' ? <ShieldCheck className="w-4 h-4 mr-2"/> : <ShieldAlert className="w-4 h-4 mr-2"/>}
                    OFFICER DECISION: {application.officerDecision.toUpperCase()}
                </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="h-5 w-5 mr-2" /> Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimeline stages={getApplicationTimeline(application.status || 'pending', "officer")} vertical={false} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="scoring" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="applicant">Applicant Info</TabsTrigger>
                <TabsTrigger value="ocr-data">OCR Data</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="scoring">AI Scoring</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="applicant">
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center"><User className="h-5 w-5 mr-2" /> Personal Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Name</Label><p className="text-muted-foreground">{application.applicant.name}</p></div>
                            <div><Label>Email</Label><p className="text-muted-foreground">{application.applicant.email}</p></div>
                            <div><Label>Phone</Label><p className="text-muted-foreground">{application.applicant.phone}</p></div>
                            <div><Label>PAN</Label><p className="text-muted-foreground">{application.applicant.pan}</p></div>
                        </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2" /> Loan Request</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Amount</Label><p className="text-lg font-semibold">₹{application.loan.amount.toLocaleString()}</p></div>
                        <div><Label>Tenure</Label><p className="text-muted-foreground">{application.loan.tenure} months</p></div>
                        <div><Label>Purpose</Label><p className="text-muted-foreground">{application.loan.purpose}</p></div>
                        <div><Label>EMI</Label><p className="text-lg font-semibold text-primary">₹{application.loan.emi.toLocaleString()}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ocr-data">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Code className="h-5 w-5 mr-2" /> Raw Extracted Data
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchApplicationDetails}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Reload Data
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {application.ocrJsonRaw ? (
                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px] border border-slate-200 dark:border-slate-800 shadow-inner">
                            <pre className="text-xs font-mono whitespace-pre-wrap dark:text-green-400 text-slate-800">
                                {JSON.stringify(application.ocrJsonRaw, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="mb-4">No extracted OCR data available.</p>
                            <Button variant="outline" onClick={fetchApplicationDetails}>Retry Fetch</Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Uploaded Documents</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {application.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.type}</p>
                                <p className="text-sm text-muted-foreground">Confidence: {(doc.confidence * 100).toFixed(0)}%</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={doc.status === "verified" ? "default" : "secondary"}>
                                {doc.status === "verified" ? "Verified" : "Review"}
                              </Badge>
                              {doc.path ? (
                                <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.path)}>
                                    <Eye className="h-4 w-4 mr-2" /> View
                                </Button>
                              ) : <span className="text-xs text-muted-foreground">No File</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle>Extracted Fields</CardTitle>
                        <p className="text-sm text-muted-foreground">Verify extracted values against documents</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(application.ocrData).map(([field, data]) => (
                            <div key={field} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                                {editingField === field ? (
                                    <div className="flex gap-2 mt-1">
                                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                                      <Button size="sm" onClick={() => saveEdit(field)}><Save className="h-3 w-3" /></Button>
                                      <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                                    </div>
                                ) : ( <p className="text-sm font-mono">{data.value}</p> )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {data.verified ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                {editingField !== field && (
                                  <Button size="sm" variant="ghost" onClick={() => startEdit(field, data.value)}>
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="scoring">
                <Card>
                    <CardHeader><CardTitle>Credit Score Analysis</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <div className={`text-6xl font-bold ${getScoreColor(application.creditScore.score)}`}>
                          {application.creditScore.score}
                        </div>
                        <p className="text-muted-foreground">out of 900</p>
                        <div className="mt-4">
                           {application.creditScore.score > 0 ? (
                                application.creditScore.score > 700 ? <Badge className="bg-green-600">AI Recommendation: Approve</Badge> : <Badge variant="destructive">AI Recommendation: Review</Badge>
                           ) : <Badge variant="outline">Not Calculated</Badge>}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Feature Importance</h4>
                          <div className="flex items-center gap-2">
                              <div className="flex bg-muted p-1 rounded-lg">
                                <button 
                                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${xaiMode === 'SHAP' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
                                  onClick={() => setXaiMode('SHAP')}
                                >
                                  Global (SHAP)
                                </button>
                                <button 
                                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${xaiMode === 'LIME' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
                                  onClick={() => setXaiMode('LIME')}
                                >
                                  Local (LIME)
                                </button>
                              </div>
                              {/* OFFICER COMPARISON BUTTON */}
                              <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 ml-2">
                                        <Scale className="w-3.5 h-3.5"/> Compare
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>AI Model Comparison (SHAP vs LIME)</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <p className="text-sm text-muted-foreground mb-6">
                                            This chart compares the global feature impact (SHAP) against your local linear approximation (LIME).
                                        </p>
                                        
                                        {comparisonData && comparisonData.length > 0 && comparisonData.some(d => d.LIME !== 0) ? (
                                            <ResponsiveContainer width="100%" height={500}>
                                                <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" />
                                                    {/* DYNAMIC YAXIS TEXT COLOR */}
                                                    <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 'bold' }} />
                                                    {/* DARK MODE TOOLTIP */}
                                                    <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                                    <Legend />
                                                    <Bar dataKey="SHAP" fill="hsl(var(--primary))" name="SHAP Impact" />
                                                    <Bar dataKey="LIME" fill="#9333ea" name="LIME Impact" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                                               Comparison data is incomplete. Please request a new scoring run.
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                              </Dialog>
                          </div>
                        </div>

                        {currentChartData && currentChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={500}>
                            <BarChart 
                              data={currentChartData} 
                              layout="vertical" 
                              margin={{ left: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              {/* DYNAMIC YAXIS TEXT COLOR */}
                              <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 'bold' }} />
                              {/* DARK MODE TOOLTIP */}
                              <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                              <Bar 
                                dataKey="impact" 
                                fill={xaiMode === 'SHAP' ? "hsl(var(--primary))" : "#9333ea"} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                             No {xaiMode} data available. Please re-run credit scoring.
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg border border-border">
                        <h4 className="font-bold mb-2 flex items-center">
                            <Cpu className="w-4 h-4 mr-2 text-primary"/> AI Explanation
                        </h4>
                        <p className="text-sm leading-relaxed">{application.creditScore.explanation}</p>
                      </div>

                      {/* OFFICER VIEW - PATH TO APPROVAL */}
                      {application.creditScore.counterfactuals && application.creditScore.counterfactuals.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                          <h4 className="font-bold mb-2 flex items-center text-blue-700 dark:text-blue-400">
                              <Target className="w-4 h-4 mr-2"/> Suggestions to Improve the Score (Counterfactuals)
                          </h4>
                          <div className="space-y-2 mt-3">
                              {application.creditScore.counterfactuals.map((cf, idx) => (
                                  <div key={idx} className="text-sm p-3 bg-white dark:bg-slate-900 rounded-md border border-blue-100 dark:border-blue-800/50 shadow-sm">
                                      <span className="font-semibold text-blue-600 mr-2">Option {idx + 1}:</span>
                                      {cf}
                                  </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="comments">
                <Card>
                  <CardHeader><CardTitle>History & Notes</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {application.officerComments.length > 0 ? (
                          application.officerComments.map((c) => (
                            <div 
                              key={c.id} 
                              className={`p-3 border rounded-lg ${
                                c.type === 'decision_log' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                                c.type === 'clarification_request' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900' : 
                                'bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                            >
                                <div className="flex justify-between mb-1">
                                <span className="font-medium text-sm">{c.author}</span>
                                <span className="text-xs text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm dark:text-slate-200">{c.text}</p>
                                
                                {c.type === 'decision_log' && (
                                    <Badge className="mt-2 bg-blue-600 hover:bg-blue-700">Official Decision</Badge>
                                )}
                                {c.type === 'clarification_request' && (
                                  <Badge 
                                    variant="outline" 
                                    className="mt-2 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
                                  >
                                    Request Sent
                                  </Badge>
                                )}
                            </div>
                          ))
                      ) : <p className="text-center text-muted-foreground py-4">No comments yet.</p>}
                      
                      <div className="border-t pt-4">
                        <Label>Add Internal Note</Label>
                        <div className="flex gap-2 mt-2">
                          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Private note..." />
                          <Button onClick={handleAddComment}><MessageSquare className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader><CardTitle>Officer Actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                
                <Button 
                    className="w-full button-glow bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleProceedToScoring}
                    disabled={application.status === 'under_credit_scoring' || !!application.officerDecision}
                >
                    <Cpu className="h-4 w-4 mr-2" />
                    Proceed for Credit Scoring
                </Button>

                <Dialog open={isClarifyModalOpen} onOpenChange={setIsClarifyModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" disabled={!!application.officerDecision}>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Clarification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Request Clarification</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Label>Message to Applicant</Label>
                      <Textarea 
                        placeholder="E.g., Please re-upload clear Aadhaar card..." 
                        value={clarificationReason}
                        onChange={(e) => setClarificationReason(e.target.value)}
                      />
                      <Button onClick={handleRequestClarification} className="w-full">Send Request</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                    <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                className="text-green-600 border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/20"
                                disabled={!!application.officerDecision}
                            >
                                Approve
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Confirm Approval</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Are you sure you want to finalize this loan as <strong>APPROVED</strong>? This action will be logged.</p>
                                <Label>Approval Note (Optional)</Label>
                                <Textarea 
                                    value={approvalReason} 
                                    onChange={(e) => setApprovalReason(e.target.value)} 
                                    placeholder="E.g., Verified income and clean history."
                                />
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                                    Confirm Approve
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                className="text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                                disabled={!!application.officerDecision}
                            >
                                Reject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Confirm Rejection</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Are you sure you want to finalize this loan as <strong>REJECTED</strong>? This action cannot be undone.</p>
                                <Label>Rejection Reason (Required)</Label>
                                <Textarea 
                                    value={rejectionReason} 
                                    onChange={(e) => setRejectionReason(e.target.value)} 
                                    placeholder="E.g., High risk score, unstable employment..."
                                />
                                <Button variant="destructive" className="w-full" onClick={handleReject} disabled={!rejectionReason.trim()}>
                                    Confirm Reject
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Model Recommendation:</span>
                    <Badge variant="secondary">{application.status.replace(/_/g, " ").toUpperCase()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Chart strictly for high-quality PDF Export Capture */}
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
          
          {/* Chart: SHAP vs LIME Comparison (Standalone SHAP removed) */}
          {comparisonData && comparisonData.length > 0 && (
            <div id="pdf-compare-capture" style={{ width: "800px", height: "600px", backgroundColor: "#ffffff", padding: "20px" }}>
              <h4 style={{ fontFamily: "sans-serif", fontSize: "18px", marginBottom: "20px", color: "#0f172a" }}>AI Model Comparison (SHAP vs LIME)</h4>
              <BarChart width={760} height={550} data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                <XAxis type="number" tick={{ fill: '#64748b' }} />
                <YAxis dataKey="feature" type="category" width={200} tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 'bold' }} />
                <Legend />
                <Bar dataKey="SHAP" fill="#2563eb" name="SHAP Impact" />
                <Bar dataKey="LIME" fill="#9333ea" name="LIME Impact" />
              </BarChart>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}