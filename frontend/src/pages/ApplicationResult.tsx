import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Download,
  MessageCircle,
  BarChart3,
  Target,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BrainCircuit, 
  FileSignature,
  Briefcase,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// PDF GENERATION
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas"; 

// --- Types ---
interface ApplicationData {
  name: string;
  pan: string;
  score: number;
  modelStatus: string;
  officerDecision: string | null;
  officerReason: string | null;
  loanAmount: number;
  loanTenure: number;
  sanctionedAmount: number | null;
  interestRate: number | null;
  shapValues: { feature: string; impact: number }[];
  limeValues: { feature: string; impact: number }[]; 
  counterfactuals: string[]; 
  explanation: string;
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

export default function ApplicationResult() {
  const { appId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApplicationData | null>(null);
  
  const [counterfactualIncome, setCounterfactualIncome] = useState([55000]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const [xaiMode, setXaiMode] = useState<"SHAP" | "LIME">("SHAP");

  useEffect(() => {
    if (appId) fetchResultData();
  }, [appId]);

  const fetchResultData = async () => {
    try {
      setLoading(true);

      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('first_name, last_name, pan_number, credit_score, loan_status, officer_decision, officer_comments, loan_amount, loan_tenure, sanctioned_amount, interest_rate')
        .eq('application_id', appId)
        .single();

      if (loanError) throw loanError;

      const { data: xai, error: xaiError } = await supabase
        .from('xai_data')
        .select('shap_values, lime_values, counterfactuals, explanation_output')
        .eq('application_id', appId)
        .single();

      if (xaiError) console.error("XAI Fetch Error:", xaiError);

      let latestReason = null;
      if (loan.officer_comments && Array.isArray(loan.officer_comments)) {
        const decisionLogs = loan.officer_comments.filter((c: any) => c.type === 'decision_log');
        if (decisionLogs.length > 0) {
            latestReason = decisionLogs[decisionLogs.length - 1].text;
        }
      }

      const rawPan = loan.pan_number || "Unknown";
      const maskedPan = rawPan.length > 4 
        ? rawPan.substring(0, 2) + "*****" + rawPan.substring(rawPan.length - 2)
        : "****";

      setData({
        name: `${loan.first_name} ${loan.last_name}`,
        pan: maskedPan,
        score: loan.credit_score || 0,
        modelStatus: loan.loan_status || "Pending",
        officerDecision: loan.officer_decision,
        officerReason: latestReason,
        loanAmount: loan.loan_amount || 0,
        loanTenure: loan.loan_tenure || 0,
        sanctionedAmount: loan.sanctioned_amount,
        interestRate: loan.interest_rate,
        shapValues: xai?.shap_values || [],
        limeValues: xai?.lime_values || [], 
        counterfactuals: xai?.counterfactuals || [], 
        explanation: xai?.explanation_output || "Analysis pending..."
      });

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load results.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-500";
    if (score >= 650) return "text-yellow-500";
    return "text-red-500";
  };

  const renderDecisionBadge = (status: string, label: string) => {
    const s = status?.toLowerCase() || "";
    let colorClass = "bg-slate-500/20 text-slate-400 border-slate-500/50";
    let Icon = AlertCircle;

    if (s.includes("approv")) {
        colorClass = "bg-green-500/20 text-green-400 border-green-500/50";
        Icon = CheckCircle;
    } else if (s.includes("reject")) {
        colorClass = "bg-red-500/20 text-red-400 border-red-500/50";
        Icon = XCircle;
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</span>
            <Badge variant="outline" className={`px-3 py-1.5 flex items-center gap-2 ${colorClass}`}>
                <Icon className="w-4 h-4" />
                {status?.toUpperCase() || "PENDING"}
            </Badge>
        </div>
    );
  };

  const calculateEMI = (principal: number, rate: number, months: number) => {
    if (!principal || !rate || !months) return 0;
    const monthlyRate = (rate / 100) / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const handleDownloadReport = async () => {
    if (!data) return;
    toast({ title: "Generating Report...", description: "Please wait while we compile your PDF." });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("FynXai Credit Assessment Report", 14, 22);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 28, pageWidth - 14, 28);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`Applicant Name: ${data.name}`, 14, 40);
    doc.text(`PAN Number: ${data.pan}`, 14, 48);
    
    doc.setFont("helvetica", "bold");
    doc.text(`AI Credit Score: ${data.score} / 900`, 14, 56);
    doc.text(`AI Recommendation: ${(data.modelStatus || "Pending").toUpperCase()}`, 14, 64);
    
    let currentY = 72;
    if (data.officerDecision) {
        doc.text(`Final Officer Decision: ${data.officerDecision.toUpperCase()}`, 14, currentY);
        currentY += 8;
    }

    if (data.modelStatus === 'approved' && data.sanctionedAmount && data.interestRate) {
        currentY += 4;
        doc.setFontSize(14);
        doc.setTextColor(21, 128, 61); 
        doc.text("Personalized Offer Details", 14, currentY);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        currentY += 8;
        doc.text(`Requested Amount: Rs. ${data.loanAmount.toLocaleString('en-IN')}`, 14, currentY);
        currentY += 6;
        doc.setFont("helvetica", "bold");
        doc.text(`Sanctioned Amount: Rs. ${data.sanctionedAmount.toLocaleString('en-IN')}`, 14, currentY);
        doc.setFont("helvetica", "normal");
        currentY += 6;
        doc.text(`Interest Rate: ${data.interestRate}% p.a. for ${data.loanTenure} months`, 14, currentY);
        currentY += 6;
        const emi = calculateEMI(data.sanctionedAmount, data.interestRate, data.loanTenure);
        doc.text(`Estimated EMI: Rs. ${emi.toLocaleString('en-IN')} / month`, 14, currentY);
        currentY += 12;
    } else {
        currentY += 8;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("AI Assessment", 14, currentY);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const explanationLines = doc.splitTextToSize(data.explanation, pageWidth - 28);
    doc.text(explanationLines, 14, currentY + 8);
    
    currentY += (explanationLines.length * 5) + 12;

    if (data.officerReason) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Officer's Remarks", 14, currentY);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        const reasonLines = doc.splitTextToSize(`"${data.officerReason}"`, pageWidth - 28);
        doc.text(reasonLines, 14, currentY + 8);
        
        currentY += (reasonLines.length * 5) + 12;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Influencing Factors (SHAP)", 14, currentY + 5);

    const tableData = data.shapValues.map(item => [
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
        willDrawCell: function (cellData) {
            if (cellData.section === 'body' && cellData.column.index === 1) {
                if (cellData.cell.raw === 'Positive') doc.setTextColor(34, 197, 94);
                else doc.setTextColor(239, 68, 68);
            }
        }
    });

    try {
        // Capture the Comparative SHAP vs LIME Chart for the PDF
        const compareElement = document.getElementById("pdf-compare-capture");
        if (compareElement && data.shapValues.length > 0) {
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

    const safePan = data.pan.replace(/\*/g, 'X');
    doc.save(`FynXai_Report_${safePan}.pdf`);
    toast({ title: "Success", description: "Report downloaded successfully." });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  if (!data) return <div className="text-center pt-20">Result not found.</div>;

  const activeXaiValues = xaiMode === "SHAP" ? data.shapValues : data.limeValues;
  const comparisonData = data.shapValues.map(s => {
    const l = data.limeValues.find(lx => lx.feature === s.feature);
    return {
      feature: s.feature,
      SHAP: s.impact,
      LIME: l ? l.impact : 0
    };
  });

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* UPDATED: Dynamic Hero Card (Light & Dark Mode) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary/80" />
                  <span className="text-lg font-medium text-muted-foreground">
                    Hello, {data.name}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                  Credit Application Result
                </h1>
                <p className="text-muted-foreground font-mono mb-6">PAN: {data.pan}</p>
                
                <div className="flex flex-wrap gap-6 p-4 bg-slate-900/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-md">
                    {renderDecisionBadge(data.modelStatus, "AI Recommendation")}
                    {data.officerDecision && (
                        <>
                            <div className="w-px bg-border mx-2 hidden md:block"></div>
                            {renderDecisionBadge(data.officerDecision, "Officer Decision")}
                        </>
                    )}
                </div>
              </div>

              <div className="text-center bg-slate-900/5 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-xl min-w-[200px]">
                <p className="text-sm text-muted-foreground mb-1">Your AI Credit Score</p>
                <div className={`text-6xl font-black ${getScoreColor(data.score)} tracking-tighter`}>
                  {data.score}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-wider">
                  Out of 900
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {data.modelStatus === 'approved' && data.sanctionedAmount && data.interestRate && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <Card className="p-6 border-green-500/50 bg-green-50/30 dark:bg-green-950/20 shadow-lg relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-5">
                            <Briefcase className="w-32 h-32 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-5 text-green-700 dark:text-green-500 flex items-center gap-2 relative z-10">
                            <CheckCircle className="w-6 h-6" /> Your Personalized Offer
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            <div className="p-4 bg-background rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Requested</p>
                                <p className="text-2xl font-bold">₹{data.loanAmount.toLocaleString('en-IN')}</p>
                            </div>
                            
                            <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-xl border border-green-300 dark:border-green-800 md:scale-105 shadow-md">
                                <p className="text-xs text-green-800 dark:text-green-300 uppercase tracking-wider font-bold mb-1">Sanctioned</p>
                                <p className="text-3xl font-black text-green-900 dark:text-green-100">
                                    ₹{data.sanctionedAmount.toLocaleString('en-IN')}
                                </p>
                                {data.sanctionedAmount < data.loanAmount && (
                                    <p className="text-[10px] text-green-700 dark:text-green-400 mt-1 leading-tight">
                                        *Adjusted dynamically based on your verified repayment capacity.
                                    </p>
                                )}
                            </div>
                            
                            <div className="p-4 bg-background rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Interest Rate</p>
                                <p className="text-2xl font-bold">{data.interestRate}% <span className="text-sm font-normal text-muted-foreground">p.a.</span></p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Est. EMI: ₹{calculateEMI(data.sanctionedAmount, data.interestRate, data.loanTenure).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}


            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid gap-6">
                <Card className="p-6 border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-transparent">
                    <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">
                        <BrainCircuit className="w-5 h-5 text-primary"/>
                        AI Assessment
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {data.explanation}
                    </p>
                </Card>

                {data.officerDecision && data.officerReason && (
                    <Card className={`p-6 border-l-4 shadow-md bg-gradient-to-r to-transparent ${data.officerDecision === 'approved' ? 'border-l-green-500 from-green-500/10' : 'border-l-red-500 from-red-500/10'}`}>
                        <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">
                            <FileSignature className="w-5 h-5"/>
                            Officer's Remarks
                        </h2>
                        <p className="text-foreground/80 leading-relaxed italic">
                            "{data.officerReason}"
                        </p>
                    </Card>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Key Factors Influencing Score
                </h2>

                <div className="flex bg-muted p-1 rounded-lg self-start md:self-auto">
                    <button 
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${xaiMode === 'SHAP' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
                        onClick={() => setXaiMode('SHAP')}
                    >
                        SHAP
                    </button>
                    <button 
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${xaiMode === 'LIME' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
                        onClick={() => setXaiMode('LIME')}
                    >
                        LIME
                    </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {activeXaiValues && activeXaiValues.length > 0 ? (
                  activeXaiValues.map((feature, index) => {
                    const isPositive = feature.impact > 0;
                    const absImpact = Math.abs(feature.impact);
                    
                    return (
                      <Card key={index} className="p-5 hover:shadow-lg transition-all duration-300 border-l-4 group" style={{ borderLeftColor: isPositive ? '#22c55e' : '#ef4444' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {isPositive ? (
                                <TrendingUp className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                              )}
                              <h3 className="font-semibold text-lg">{feature.feature}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isPositive ? "Positive impact" : "Negative impact"} on your creditworthiness.
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={isPositive ? "default" : "destructive"} 
                              className={`text-md px-3 py-1 ${isPositive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                              {isPositive ? "+" : "-"}{Math.round(absImpact)} pts
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                      No {xaiMode} factors available. Please request a new scoring run.
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                  <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Scale className="w-4 h-4"/> Compare SHAP vs LIME
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
                                        <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 'bold' }} />
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
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className="p-6 border-primary/20 bg-primary/5 shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-xl">Score Simulator</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Estimate how increasing your income could impact your credit potential.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Projected Monthly Income</Label>
                      <span className="font-mono font-bold text-primary">₹{counterfactualIncome[0].toLocaleString()}</span>
                    </div>
                    <Slider
                      defaultValue={[55000]}
                      max={200000}
                      step={5000}
                      onValueChange={setCounterfactualIncome}
                      className="py-4"
                    />
                  </div>
                  
                  <div className="p-4 bg-background rounded-lg border text-center shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Potential Score Boost</p>
                    <p className="text-3xl font-bold text-green-600">+{Math.floor((counterfactualIncome[0] - 50000) / 2000 * 1.5)} pts</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="space-y-3">
                <Button 
                    className="w-full h-12 text-lg gap-2 shadow-lg" 
                    variant="default"
                    onClick={handleDownloadReport}
                >
                    <Download className="w-5 h-5" /> Download Report
                </Button>
                
                <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full h-12 text-lg gap-2" variant="outline">
                            <MessageCircle className="w-5 h-5" /> Request Review
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Manual Review</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Label>Reason for review</Label>
                            <Textarea placeholder="Explain why you believe the score needs review..." />
                            <Button className="w-full" onClick={() => {
                                toast({ title: "Request Sent", description: "An officer will review your case." });
                                setReviewModalOpen(false);
                            }}>Submit Request</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
          </div>
        </div>



        {/* PATH TO APPROVAL */}
            {data.modelStatus !== 'approved' && data.counterfactuals && data.counterfactuals.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mb-8">
                    <Card className="p-6 border-l-4 border-l-blue-500 shadow-md bg-blue-50/30 dark:bg-blue-950/20">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Target className="w-6 h-6" /> Suggestions to Improve Your Score
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Our AI has calculated the fastest ways to improve your credit profile. Fulfilling any ONE of these options can move your application into the approval range:
                        </p>
                        <div className="grid gap-4 md:grid-cols-1">
                            {data.counterfactuals.map((cf, idx) => (
                                <div key={idx} className="p-4 bg-background rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3 shadow-sm">
                                    <Badge className="bg-blue-600 shrink-0 mt-0.5">Option {idx + 1}</Badge>
                                    <p className="text-sm font-medium leading-relaxed">{cf}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            )}

        {/* Feedback Widget */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-8 text-center">
              <h3 className="text-xl font-bold mb-4">
                Did this explanation help?
              </h3>
              <p className="text-muted-foreground mb-6">
                Your feedback helps us improve our support and explainability.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" className="hover-lift">
                  👍 Yes, helpful
                </Button>
                <Button variant="outline" className="hover-lift">
                  👎 Needs improvement
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
        {/* Hidden Chart strictly for high-quality PDF Export Capture */}
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
          
          {/* Chart: SHAP vs LIME Comparison (Standalone SHAP removed as requested) */}
          {comparisonData && comparisonData.length > 0 && (
            <div id="pdf-compare-capture" style={{ width: "800px", height: "600px", backgroundColor: "#ffffff", padding: "20px" }}>
              <h4 style={{ fontFamily: "sans-serif", fontSize: "18px", marginBottom: "20px", color: "#0f172a" }}>AI Model Comparison (SHAP vs LIME)</h4>
              <BarChart width={760} height={550} data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                <XAxis type="number" tick={{ fill: '#64748b' }} />
                {/* PDF Chart YAxis - Using a deep slate bold color for excellent print contrast */}
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