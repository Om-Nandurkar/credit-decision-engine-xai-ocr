import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Edit3,
  Download,
  Eye,
  Loader2,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  Lock,
  FileImage,
  MessageSquare,
  UploadCloud, // New Icon
  RefreshCw    // New Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase, apiBaseUrl } from "@/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExtractedField {
  value: string;
  confidence: number;
  verified: boolean;
  jsonPath: string[];
}

interface DocumentData {
  id: number;
  name: string;
  type: string;
  status: string;
  path: string;
  isViewOnly: boolean;
  fields: { [label: string]: ExtractedField };
}

export default function DocumentVerification() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [processingUpdate, setProcessingUpdate] = useState(false); // New: For re-upload loading
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [rawOcrJson, setRawOcrJson] = useState<any>({});
  const [reviewCount, setReviewCount] = useState(0);
  const [loanStatus, setLoanStatus] = useState("pending");
  const [clarificationNote, setClarificationNote] = useState<string | null>(null);
  
  const [editingField, setEditingField] = useState<{ docId: number; key: string } | null>(null);
  const [tempValue, setTempValue] = useState("");

  // --- NEW: Refs and State for File Upload ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  useEffect(() => {
    if (appId) fetchData();
  }, [appId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Loan Info
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('document_urls, loan_status, review_count, officer_comments')
        .eq('application_id', appId)
        .single();

      if (loanError) throw loanError;
      setReviewCount(loan.review_count || 0);
      setLoanStatus(loan.loan_status);

      // Extract Officer Note
      if (loan.officer_comments && Array.isArray(loan.officer_comments)) {
        const requests = loan.officer_comments.filter((c: any) => c.type === 'clarification_request');
        if (requests.length > 0) {
            setClarificationNote(requests[requests.length - 1].text);
        }
      }

      // 2. Fetch OCR Data (Order by created_at desc to get the LATEST one)
      const { data: xai, error: xaiError } = await supabase
        .from('xai_data')
        .select('ocr_json')
        .eq('application_id', appId)
        .order('created_at', { ascending: false }) 
        .limit(1)
        .single();

      if (xaiError && xaiError.code !== 'PGRST116') console.error("OCR Error", xaiError);

      const ocrJson = xai?.ocr_json || {};
      setRawOcrJson(ocrJson);

      // 3. Map Documents
      const docs: DocumentData[] = [];
      const urls = loan.document_urls || {};
      let docIdCounter = 1;

      const getVal = (obj: any, path: string[]) => {
        return path.reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : "", obj);
      };

      const findKey = (candidates: string[]) => candidates.find(k => urls[k]);
      
      const panKey = findKey(['pan_card', 'pan']);
      const aadhaarFrontKey = findKey(['aadhaar_card_front', 'aadhaar_front', 'adhaar_front']);
      const aadhaarBackKey = findKey(['aadhaar_card_back', 'aadhaar_back', 'adhaar_back']);
      const bankKey = findKey(['bank_statement', 'bankstatement']); 

      // A. PAN CARD
      if (panKey) {
        docs.push({
          id: docIdCounter++,
          name: "PAN CARD",
          type: "pan_card",
          status: "uploaded",
          path: urls[panKey],
          isViewOnly: false,
          fields: {
            "Name": { value: getVal(ocrJson, ['pan_card', 'name']), confidence: 0.98, verified: true, jsonPath: ['pan_card', 'name'] },
            "PAN Number": { value: getVal(ocrJson, ['pan_card', 'pan_number']), confidence: 0.99, verified: true, jsonPath: ['pan_card', 'pan_number'] },
            "Father Name": { value: getVal(ocrJson, ['pan_card', 'father_name']), confidence: 0.90, verified: true, jsonPath: ['pan_card', 'father_name'] },
            "Date of Birth": { value: getVal(ocrJson, ['pan_card', 'date_of_birth']), confidence: 0.95, verified: true, jsonPath: ['pan_card', 'date_of_birth'] }
          }
        });
      }

      // B. AADHAAR FRONT
      if (aadhaarFrontKey) {
        docs.push({
          id: docIdCounter++,
          name: "AADHAAR CARD (FRONT)",
          type: "aadhaar_front",
          status: "uploaded",
          path: urls[aadhaarFrontKey],
          isViewOnly: false,
          fields: {
            "Name": { value: getVal(ocrJson, ['aadhaar_card', 'front', 'name']), confidence: 0.95, verified: true, jsonPath: ['aadhaar_card', 'front', 'name'] },
            "Date of Birth": { value: getVal(ocrJson, ['aadhaar_card', 'front', 'date_of_birth']), confidence: 0.92, verified: true, jsonPath: ['aadhaar_card', 'front', 'date_of_birth'] },
            "Aadhaar Number": { value: getVal(ocrJson, ['aadhaar_card', 'front', 'aadhaar_number']), confidence: 0.98, verified: true, jsonPath: ['aadhaar_card', 'front', 'aadhaar_number'] },
            "Mobile Number": { value: getVal(ocrJson, ['aadhaar_card', 'front', 'mobile_number']), confidence: 0.85, verified: false, jsonPath: ['aadhaar_card', 'front', 'mobile_number'] }
          }
        });
      }

      // C. AADHAAR BACK
      if (aadhaarBackKey) {
        docs.push({
          id: docIdCounter++,
          name: "AADHAAR CARD (BACK)",
          type: "aadhaar_back",
          status: "uploaded",
          path: urls[aadhaarBackKey],
          isViewOnly: false,
          fields: {
            "Address": { value: getVal(ocrJson, ['aadhaar_card', 'back', 'address']), confidence: 0.85, verified: false, jsonPath: ['aadhaar_card', 'back', 'address'] }
          }
        });
      }

      // D. BANK STATEMENT
      if (bankKey) {
          docs.push({
            id: docIdCounter++,
            name: "BANK STATEMENT",
            type: "bank_statement",
            status: "uploaded",
            path: urls[bankKey],
            isViewOnly: true, 
            fields: {}
          });
      }

      // E. OTHER DOCS
      const handledKeys = [panKey, aadhaarFrontKey, aadhaarBackKey, bankKey].filter(Boolean);
      Object.entries(urls).forEach(([key, path]) => {
        if (!handledKeys.includes(key)) {
            docs.push({
                id: docIdCounter++,
                name: key.replace(/_/g, " ").toUpperCase(),
                type: key,
                status: "uploaded",
                path: String(path),
                isViewOnly: true,
                fields: {} 
            });
        }
      });

      setDocuments(docs);

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Trigger File Selection ---
  const triggerFileUpload = (docType: string) => {
    setSelectedDocType(docType);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
        fileInputRef.current.click();
    }
  };

  // --- NEW: Handle File Upload & Backend Trigger ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType || !appId) return;

    try {
        setProcessingUpdate(true);
        toast({ title: "Uploading...", description: "Uploading new document." });

        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${appId}/${selectedDocType}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('loan_documents')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Update Database URL in 'loans' table
        const { data: loanData } = await supabase.from('loans').select('document_urls').eq('application_id', appId).single();
        const currentUrls = loanData?.document_urls || {};
        
        // Update the specific document type key
        const updatedUrls = { ...currentUrls, [selectedDocType]: fileName };

        const { error: dbError } = await supabase
            .from('loans')
            .update({ document_urls: updatedUrls })
            .eq('application_id', appId);

        if (dbError) throw dbError;

        toast({ title: "Processing", description: "Analyzing updated document set..." });

        // 3. Trigger Backend to Re-run OCR on ALL files
        const response = await fetch(`${apiBaseUrl}/update-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loan_id: appId })
        });

        if (!response.ok) throw new Error("Backend processing failed");

        toast({ title: "Success", description: "Document processed. Refreshing data..." });

        // Wait a few seconds for backend background task, then reload
        setTimeout(() => {
            setProcessingUpdate(false);
            fetchData(); 
        }, 5000);

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
        setProcessingUpdate(false);
    }
  };

  const handleViewDocument = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('loan_documents').createSignedUrl(path, 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast({ title: "Error", description: "Could not open document", variant: "destructive" });
    }
  };

  const startEdit = (docId: number, key: string, value: string) => {
    setEditingField({ docId, key });
    setTempValue(value);
  };

  const saveEdit = (docId: number, key: string) => {
    const updatedDocs = documents.map(doc => {
        if (doc.id === docId) {
            return {
                ...doc,
                fields: {
                    ...doc.fields,
                    [key]: { ...doc.fields[key], value: tempValue, verified: true }
                }
            };
        }
        return doc;
    });
    setDocuments(updatedDocs);

    // Update the local JSON state
    const doc = documents.find(d => d.id === docId);
    if (doc) {
        const field = doc.fields[key];
        const path = field.jsonPath; 
        const newJson = JSON.parse(JSON.stringify(rawOcrJson));
        let current = newJson;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {}; 
            current = current[path[i]];
        }
        current[path[path.length - 1]] = tempValue;
        setRawOcrJson(newJson);
    }

    setEditingField(null);
    toast({ title: "Updated", description: "Value updated locally." });
  };

  const handleSubmitCorrections = async () => {
    if (reviewCount >= 2) {
        toast({ title: "Limit Reached", description: "Max review attempts reached.", variant: "destructive" });
        return;
    }

    try {
        setLoading(true);

        const { error: jsonError } = await supabase
            .from('xai_data')
            .update({ ocr_json: rawOcrJson })
            .eq('application_id', appId);
                                          
        if (jsonError) throw jsonError;

        // Update Loan Status
        const { error: statusError } = await supabase
            .from('loans')
            .update({ 
                loan_status: 'under_review', 
                review_count: reviewCount + 1,
                officer_decision: null
            })
            .eq('application_id', appId);
        if (statusError) throw statusError;

        toast({ title: "Submitted", description: "Sent for re-review." });
        navigate('/dashboard');

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Submission failed", variant: "destructive" });
        setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* --- HIDDEN FILE INPUT --- */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-5 h-5"/>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Verify Details</h1>
                    <p className="text-muted-foreground">Review and edit extracted information.</p>
                </div>
            </div>
            <div className="text-right">
                <Badge variant={reviewCount >= 2 ? "destructive" : "secondary"}>
                    Review Attempts: {reviewCount}/2
                </Badge>
            </div>
        </div>

        {/* --- GLOBAL PROCESSING INDICATOR --- */}
        {processingUpdate && (
             <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 mb-4 animate-pulse">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                <AlertTitle>Re-Processing Documents</AlertTitle>
                <AlertDescription>
                    We are analyzing your updated document set. This ensures all cross-verifications are accurate...
                </AlertDescription>
            </Alert>
        )}

        {/* --- CLARIFICATION MESSAGE ALERT --- */}
        {clarificationNote && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-700 dark:text-blue-400 font-bold mb-1">Officer's Note</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-300">
                    "{clarificationNote}"
                </AlertDescription>
            </Alert>
        )}

        {/* Warning if attempts getting low */}
        {reviewCount === 1 && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Last Attempt Remaining</AlertTitle>
                <AlertDescription>
                    You can only submit for re-review one more time. Please ensure all data is 100% correct.
                </AlertDescription>
            </Alert>
        )}

        {/* Documents List */}
        <div className="grid gap-6">
            {documents.map((doc) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={doc.id}>
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${doc.isViewOnly ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {doc.isViewOnly ? <FileImage className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                                </div>
                                <h3 className="font-bold">{doc.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.path)}>
                                    <Eye className="w-4 h-4 mr-2"/> View Document
                                </Button>
                                {/* --- RE-UPLOAD BUTTON --- */}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/5"
                                    onClick={() => triggerFileUpload(doc.type)}
                                    disabled={processingUpdate || reviewCount >= 2}
                                >
                                    <UploadCloud className="w-4 h-4 mr-2"/> Re-upload
                                </Button>
                            </div>
                        </div>

                        {!doc.isViewOnly ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                {Object.entries(doc.fields).map(([label, field]) => (
                                    <div key={label} className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">{label}</Label>
                                        
                                        {editingField?.docId === doc.id && editingField?.key === label ? (
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={tempValue} 
                                                    onChange={(e) => setTempValue(e.target.value)} 
                                                    className="h-9"
                                                />
                                                <Button size="sm" onClick={() => saveEdit(doc.id, label)}>
                                                    <Save className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
                                                <span className="font-mono text-sm truncate max-w-[200px]" title={field.value}>
                                                    {field.value || "Not Detected"}
                                                </span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => startEdit(doc.id, label, field.value)}
                                                >
                                                    <Edit3 className="w-3 h-3 text-muted-foreground hover:text-primary"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 border border-dashed rounded text-center text-sm text-muted-foreground">
                                No editable fields for this document type. View file for details.
                            </div>
                        )}
                    </Card>
                </motion.div>
            ))}
        </div>

        {/* Footer */}
        <div className="pt-8 flex justify-center pb-20">
            {reviewCount >= 2 ? (
                <Button size="lg" disabled className="bg-slate-400 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2"/> Verification Locked
                </Button>
            ) : (
                <Button 
                    size="lg" 
                    onClick={handleSubmitCorrections}
                    className="w-full md:w-auto min-w-[250px] shadow-xl hover-lift"
                    disabled={processingUpdate}
                >
                    <CheckCircle className="w-4 h-4 mr-2"/> Complete Verification
                </Button>
            )}
        </div>

      </div>
    </div>
  );
}