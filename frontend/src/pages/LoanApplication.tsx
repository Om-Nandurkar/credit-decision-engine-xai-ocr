import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Upload, User, FileText, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
// UPDATED: Import apiBaseUrl alongside supabase
import { supabase, apiBaseUrl } from '@/supabaseClient';
import { toast } from 'sonner';

export default function LoanApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Files state (6 Fields, handling arrays for multiple)
  const [files, setFiles] = useState<{ [key: string]: File | File[] | null }>({
    aadhaar: [],
    pan_card: null,
    bank_statement: null,
    salary_slip_m1: null,
    salary_slip_m2: null,
    salary_slip_m3: null,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    panNumber: '',
    amount: 500000,
    tenure: 36,
    purpose: '',
    monthlyIncome: 50000,
  });

  // --- SECURITY CHECK ---
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please login to apply.");
          navigate('/login');
          return;
        }

        // Fetch Role
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
           console.error("Error fetching role", error);
        }

        if (userProfile) {
          const profile = userProfile as any;
          const role = profile.role; 
          
          if (role === 'Admin') {
            toast.error("Admins cannot apply for loans.");
            navigate('/admin');
            return;
          }
          if (role === 'Officer') {
            toast.error("Officers cannot apply for loans.");
            navigate('/officer');
            return;
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  const steps = [
    { id: 1, title: 'Basic Info', icon: User, description: 'Personal information' },
    { id: 2, title: 'Loan Details', icon: CreditCard, description: 'Loan requirements' },
    { id: 3, title: 'Documents', icon: FileText, description: 'Upload documents' },
    { id: 4, title: 'Review', icon: CheckCircle, description: 'Review & submit' }
  ];

  const loanPurposes = [
    'Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan',
    'Education Loan', 'Medical Emergency', 'Debt Consolidation', 'Other'
  ];

  // 6 Document Blocks (Aadhaar is grouped)
  const docTypes = [
    { id: 'aadhaar', title: 'Aadhaar Card', required: true, multiple: true },
    { id: 'pan_card', title: 'PAN Card', required: true, multiple: false },
    { id: 'bank_statement', title: 'Bank Statement (6 months)', required: true, multiple: false },
    { id: 'salary_slip_m1', title: 'Salary Slip (Month 1)', required: true, multiple: false },
    { id: 'salary_slip_m2', title: 'Salary Slip (Month 2)', required: true, multiple: false },
    { id: 'salary_slip_m3', title: 'Salary Slip (Month 3)', required: true, multiple: false }
  ];

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const emi = calculateEMI(formData.amount, 10.5, formData.tenure);
  const eligibilityScore = Math.min(95, Math.floor((formData.monthlyIncome / (emi * 3)) * 100));

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // --- UPDATED FILE HANDLER ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docId: string, isMultiple?: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isMultiple) {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length !== 2) {
          toast.error("Please select exactly 2 files for Aadhaar (Front and Back).");
          e.target.value = ''; // Reset input so they can retry easily
          return;
        }
        setFiles(prev => ({
          ...prev,
          [docId]: selectedFiles
        }));
        toast.success("Both Aadhaar files selected!");
      } else {
        setFiles(prev => ({
          ...prev,
          [docId]: e.target.files![0]
        }));
        toast.success("File selected");
      }
    }
  };

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to apply.");
        navigate('/login');
        return;
      }

      // 2. File Validation
      const missingFiles = docTypes.filter(doc => {
        if (doc.multiple) {
            const f = files[doc.id] as File[];
            return !f || f.length !== 2;
        }
        return !files[doc.id];
      });

      if (missingFiles.length > 0) {
        toast.error(`Please upload valid files for: ${missingFiles.map(d => d.title).join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      // 3. Upload to Storage
      const documentPaths: { [key: string]: string } = {};

      for (const doc of docTypes) {
        const fileData = files[doc.id];
        if (!fileData) continue;

        if (doc.multiple && Array.isArray(fileData)) {
            // Upload Front and Back separately using exact backend keys
            const frontFile = fileData[0];
            const backFile = fileData[1];

            // Upload Front
            const frontExt = frontFile.name.split('.').pop();
            const frontPath = `${user.id}/${Date.now()}_aadhaar_front.${frontExt}`;
            const { error: frontErr, data: frontData } = await supabase.storage.from('loan_documents').upload(frontPath, frontFile);
            if (frontErr) throw frontErr;
            documentPaths['aadhaar_front'] = frontData.path;

            // Upload Back
            const backExt = backFile.name.split('.').pop();
            const backPath = `${user.id}/${Date.now()}_aadhaar_back.${backExt}`;
            const { error: backErr, data: backData } = await supabase.storage.from('loan_documents').upload(backPath, backFile);
            if (backErr) throw backErr;
            documentPaths['aadhaar_back'] = backData.path;
            
        } else {
            const file = fileData as File;
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}_${doc.id}.${fileExt}`;

            const { error: uploadError, data } = await supabase.storage
              .from('loan_documents')
              .upload(filePath, file);

            if (uploadError) throw uploadError;
            documentPaths[doc.id] = data.path;
        }
      }

      // 4. Insert into Database
      const { data: rawData, error: insertError } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone,      
          date_of_birth: formData.dateOfBirth, 
          pan_number: formData.panNumber,
          loan_amount: formData.amount,      
          loan_tenure: formData.tenure,      
          loan_purpose: formData.purpose,
          monthly_income: formData.monthlyIncome,
          loan_status: 'pending',
          document_urls: documentPaths
        } as any)
        .select();

      if (insertError) throw insertError;

      const safeRawData = rawData as any;
      const loanData = Array.isArray(safeRawData) ? safeRawData[0] : safeRawData;
      
      if (!loanData || !loanData.application_id) {
        console.error("Supabase Response:", rawData);
        throw new Error("Failed to retrieve Application ID. Check DB column name.");
      }

      const loanId = loanData.application_id;
      console.log("✅ Loan Created with ID:", loanId);

      // 5. Trigger Python OCR Backend
      try {
        console.log("🚀 Sending request to OCR Backend...");
        
        // UPDATED: Used apiBaseUrl variable
        await fetch(`${apiBaseUrl}/trigger-ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ loan_id: loanId }), 
        });

        console.log("✅ OCR Backend Triggered Successfully");

      } catch (err) {
        console.error("❌ Failed to connect to OCR Backend:", err);
      }

      toast.success("Application Submitted Successfully!");
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Loan Application
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Complete your application in simple steps for transparent, AI-powered lending
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${currentStep >= step.id 
                      ? 'bg-primary border-primary text-white' 
                      : 'border-muted bg-background text-muted-foreground'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 transition-all duration-300
                    ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    Basic Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input
                          id="pan"
                          value={formData.panNumber}
                          onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Loan Details */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-primary" />
                    Loan Details
                  </h2>
                  
                  <div className="space-y-8">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Loan Amount: ₹{formData.amount.toLocaleString('en-IN')}
                      </Label>
                      <Slider
                        value={[formData.amount]}
                        onValueChange={(value) => setFormData({...formData, amount: value[0]})}
                        max={5000000}
                        min={100000}
                        step={50000}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>₹1L</span>
                        <span>₹50L</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Tenure: {formData.tenure} months ({Math.round(formData.tenure/12)} years)
                      </Label>
                      <Slider
                        value={[formData.tenure]}
                        onValueChange={(value) => setFormData({...formData, tenure: value[0]})}
                        max={240}
                        min={12}
                        step={6}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>1 year</span>
                        <span>20 years</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="purpose">Loan Purpose</Label>
                        <Select 
                          value={formData.purpose} 
                          onValueChange={(value) => setFormData({...formData, purpose: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            {loanPurposes.map((purpose) => (
                              <SelectItem key={purpose} value={purpose}>
                                {purpose}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="income">Monthly Income</Label>
                        <Input
                          id="income"
                          type="number"
                          value={formData.monthlyIncome}
                          onChange={(e) => setFormData({...formData, monthlyIncome: Number(e.target.value)})}
                          placeholder="Enter monthly income"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    Upload Documents
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {docTypes.map((doc) => (
                        <div key={doc.id} className="relative border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer group">
                          
                          <input 
                            type="file" 
                            accept=".pdf,image/*"
                            multiple={doc.multiple}
                            onChange={(e) => handleFileChange(e, doc.id, doc.multiple)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          
                          <Upload className={`w-8 h-8 mx-auto mb-4 ${
                              files[doc.id] && (!doc.multiple || (Array.isArray(files[doc.id]) && files[doc.id].length > 0)) 
                                ? 'text-green-500' 
                                : 'text-muted-foreground'
                           }`} />
                          <h3 className="font-semibold mb-2 text-xl">
                            {doc.title}
                            {doc.required && <span className="text-red-500 ml-1">*</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {files[doc.id] && (!doc.multiple || (Array.isArray(files[doc.id]) && files[doc.id].length > 0)) ? (
                              <span className="text-green-600 font-medium truncate block max-w-[200px] mx-auto">
                                {doc.multiple ? `${(files[doc.id] as File[]).length} files selected` : (files[doc.id] as File).name}
                              </span>
                            ) : (
                              doc.multiple ? "Select 2 Images/PDFs (Front & Back)" : "PDF or Image, max 10MB"
                            )}
                          </p>
                          <Button 
                             variant={files[doc.id] && (!doc.multiple || (Array.isArray(files[doc.id]) && files[doc.id].length > 0)) ? "default" : "outline"} 
                             size="sm" 
                             className="pointer-events-none"
                          >
                            {files[doc.id] && (!doc.multiple || (Array.isArray(files[doc.id]) && files[doc.id].length > 0)) ? "File Selected" : "Choose File"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                    Review & Submit
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Personal Information</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</p>
                          <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                          <p><span className="text-muted-foreground">PAN:</span> {formData.panNumber}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">Loan Information</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Amount:</span> ₹{formData.amount.toLocaleString('en-IN')}</p>
                          <p><span className="text-muted-foreground">Tenure:</span> {formData.tenure} months</p>
                          <p><span className="text-muted-foreground">Purpose:</span> {formData.purpose}</p>
                          <p><span className="text-muted-foreground">Monthly Income:</span> ₹{formData.monthlyIncome.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 glass rounded-lg">
                      <h3 className="font-semibold mb-4">Terms & Conditions</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• I confirm that all information provided is accurate and complete</p>
                        <p>• I authorize FynXai to verify my documents and credit information</p>
                        <p>• I understand that loan approval is subject to verification and AI evaluation</p>
                        <p>• All documents are stored encrypted and used only for loan evaluation</p>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full hover-lift" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {currentStep < 4 ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 hover-lift"
                    disabled={isSubmitting}
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <></>
                )}
              </div>
            </Card>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-6">Application Summary</h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 glass rounded-lg">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Loan Amount</h4>
                  <p className="text-2xl font-bold text-primary">₹{formData.amount.toLocaleString('en-IN')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 glass rounded-lg">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-1">Tenure</h5>
                    <p className="text-lg font-bold">{formData.tenure} months</p>
                  </div>
                  <div className="text-center p-3 glass rounded-lg">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-1">EMI</h5>
                    <p className="text-lg font-bold">₹{emi.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="p-4 border-2 border-primary rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-semibold">Eligibility Score</h5>
                    <Badge variant={eligibilityScore > 70 ? "default" : "secondary"}>
                      {eligibilityScore > 70 ? "Good" : "Fair"}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${eligibilityScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on income vs EMI ratio
                  </p>
                </div>

                <div className="text-center pt-4">
                  <p className="text-xs text-muted-foreground">
                    🔒 All data encrypted and secure
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}