import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Download,
  Trash2,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
// UPDATED: Import apiBaseUrl alongside supabase
import { supabase, apiBaseUrl } from "@/supabaseClient";
import { toast } from "sonner";

// --- NEW IMPORTS FOR DATA EXPORT ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    role: "Applicant",
    memberSinceYear: "2025",
    memberSinceDate: "January 1",
    deletionRequested: false, 
  });

  const [stats, setStats] = useState({
    totalApplications: 0,
    approvalRate: 0,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    applicationUpdates: true,
    securityAlerts: true,
  });

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Visibility Toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Fetch Profile on Load
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch User Details
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const userData = data as any; 
        const createdDate = new Date(userData.created_at || new Date());
        const userRole = userData.role || "Applicant";
        
        setProfile({
          id: user.id,
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: user.email || "",
          phone: userData.phone_number || "", 
          avatar: "",
          role: userRole,
          memberSinceYear: createdDate.getFullYear().toString(),
          memberSinceDate: createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          deletionRequested: userData.deletion_requested || false,
        });

        // --- UPDATED DYNAMIC STATS LOGIC ---
        if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'officer') {
          // Fetch Overall Platform Stats for Admins & Officers
          try {
            // UPDATED: Used apiBaseUrl variable
            const response = await fetch(`${apiBaseUrl}/admin/stats`);
            if (response.ok) {
              const statsData = await response.json();
              setStats({
                totalApplications: statsData.totalApplications || 0,
                approvalRate: parseInt(statsData.approvalRate) || 0,
              });
            }
          } catch (err) {
            console.error("Failed to fetch admin stats for profile:", err);
          }
        } else {
          // Fetch Personal Loan Stats for the Applicant
          const { data: loanData, error: loanError } = await supabase
            .from('loans')
            .select('officer_decision, loan_status')
            .eq('user_id', user.id);

          if (!loanError && loanData) {
            const total = loanData.length;
            
            const formattedStatus = loanData.map((loan: any) => {
              const decision = loan.officer_decision?.toLowerCase();
              const processStatus = loan.loan_status?.toLowerCase();
              
              if (decision === 'approved' || decision === 'rejected') return decision;
              if (processStatus === 'under_review' || processStatus === 'submitted') return 'under_review';
              return 'pending';
            });

            const approved = formattedStatus.filter((s: string) => s === 'approved').length;
            const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

            setStats({
              totalApplications: total,
              approvalRate: rate,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // 2. Handle Input Changes
  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // 3. Save Changes to Database
  const saveChanges = async () => {
    if (!profile.id) return;
    
    setLoading(true);
    try {
      const updates = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone_number: profile.phone,
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Password Change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error("Incorrect previous password.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully!");
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // 5. Handle Data Export
  const handleExportData = async () => {
    if (!profile.id) return;
    
    toast.loading("Gathering your data securely...");
    
    try {
      const { data: userLoans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("FynXai Personal Data Export", 14, 22);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 28, pageWidth - 14, 28);

      doc.setFontSize(16);
      doc.text("Account Information", 14, 40);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Name: ${profile.firstName} ${profile.lastName}`, 14, 50);
      doc.text(`Email: ${profile.email}`, 14, 56);
      doc.text(`Phone: ${profile.phone || "N/A"}`, 14, 62);
      doc.text(`Role: ${profile.role.toUpperCase()}`, 14, 68);
      doc.text(`Account Created: ${profile.memberSinceDate}, ${profile.memberSinceYear}`, 14, 74);

      let currentY = 90;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Loan Applications", 14, currentY);

      if (userLoans && userLoans.length > 0) {
        const appTableData = userLoans.map(loan => [
          (loan.application_id || loan.id).slice(0, 8),
          `Rs. ${Number(loan.loan_amount || 0).toLocaleString('en-IN')}`,
          `${loan.loan_tenure} months`,
          loan.loan_purpose || 'N/A',
          (loan.officer_decision || loan.loan_status || 'Pending').toUpperCase(),
          new Date(loan.created_at).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['App ID', 'Amount', 'Tenure', 'Purpose', 'Status', 'Date applied']],
          body: appTableData,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { font: "helvetica", fontSize: 9 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.text("No applications found.", 14, currentY + 10);
        currentY += 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Uploaded Documents Registry", 14, currentY);

      let docsTableData: any[] = [];
      if (userLoans) {
        userLoans.forEach(loan => {
          if (loan.document_urls) {
            Object.keys(loan.document_urls).forEach(key => {
              docsTableData.push([
                (loan.application_id || loan.id).slice(0, 8),
                key.replace(/_/g, ' ').toUpperCase(),
                "Stored Securely"
              ]);
            });
          }
        });
      }

      if (docsTableData.length > 0) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Associated App ID', 'Document Type', 'Storage Status']],
          body: docsTableData,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { font: "helvetica", fontSize: 9 },
        });
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.text("No documents found.", 14, currentY + 10);
      }

      doc.save(`FynXai_Data_${profile.firstName || 'User'}.pdf`);
      toast.dismiss();
      toast.success("Your data export is ready and downloading!");
      
    } catch (error) {
      console.error("Export error:", error);
      toast.dismiss();
      toast.error("Failed to generate data export.");
    }
  };

  // 6. Handle Account Deletion Request
  const handleRequestDeletion = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ deletion_requested: true })
        .eq("id", profile.id);

      if (error) throw error;
      
      toast.success("Account deletion request submitted to Admin.");
      setProfile((prev) => ({ ...prev, deletionRequested: true }));
      setDeleteAccountOpen(false);
      setDeleteConfirmText("");
    } catch (error: any) {
      console.error("Error requesting deletion:", error);
      toast.error(error.message || "Failed to request deletion.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (field: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Profile & Settings
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your account preferences and security settings
          </p>
        </motion.div>

        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.firstName ? profile.firstName[0] : "U"}
                    {profile.lastName ? profile.lastName[0] : ""}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex gap-2 mt-1">
                    <p className="text-muted-foreground">{profile.phone}</p>
                    <Badge variant="secondary" className="capitalize ml-2">{profile.role}</Badge>
                </div>
              </div>
            </div>

            {/* DYNAMIC METRICS SECTION */}
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 glass rounded-lg">
                <h3 className="font-semibold">
                  {profile.role.toLowerCase() === 'applicant' ? 'Approval Rate' : 'Overall Approval Rate'}
                </h3>
                <p className="text-2xl font-bold text-green-600">{stats.approvalRate}%</p>
                <p className="text-sm text-muted-foreground">
                  {profile.role.toLowerCase() === 'applicant' ? 'Of your applications' : 'Platform average'}
                </p>
              </div>
              <div className="p-4 glass rounded-lg">
                <h3 className="font-semibold">
                  {profile.role.toLowerCase() === 'applicant' ? 'Applications' : 'Total Applications'}
                </h3>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.role.toLowerCase() === 'applicant' ? 'Total submitted' : 'Platform total'}
                </p>
              </div>
              <div className="p-4 glass rounded-lg">
                <h3 className="font-semibold">Member Since</h3>
                <p className="text-2xl font-bold">{profile.memberSinceYear}</p>
                <p className="text-sm text-muted-foreground">{profile.memberSinceDate}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled 
                        className="bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                        className="hover-lift" 
                        onClick={saveChanges}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Preferences
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationToggle("email")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={() => handleNotificationToggle("sms")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Application Updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified about loan application status changes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.applicationUpdates}
                      onCheckedChange={() =>
                        handleNotificationToggle("applicationUpdates")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Security Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Important security and account notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("securityAlerts")
                      }
                      disabled
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="hover-lift">Save Preferences</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  Security Settings
                </h3>

                <div className="space-y-6">
                  <div className="p-4 glass rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage your account password
                        </p>
                      </div>
                      
                      {/* Password Change Dialog */}
                      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="oldPassword">Current Password</Label>
                              <Input 
                                id="oldPassword"
                                type="password" 
                                value={oldPassword} 
                                onChange={(e) => setOldPassword(e.target.value)} 
                                placeholder="Enter current password"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Input 
                                  id="newPassword"
                                  type={showNewPassword ? "text" : "password"} 
                                  value={newPassword} 
                                  onChange={(e) => setNewPassword(e.target.value)} 
                                  placeholder="Enter new password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <div className="relative">
                                <Input 
                                  id="confirmPassword"
                                  type={showConfirmPassword ? "text" : "password"} 
                                  value={confirmPassword} 
                                  onChange={(e) => setConfirmPassword(e.target.value)} 
                                  placeholder="Confirm new password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsPasswordModalOpen(false)}
                                disabled={passwordLoading}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleChangePassword} 
                                disabled={passwordLoading}
                              >
                                {passwordLoading ? "Updating..." : "Update Password"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="p-4 glass rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Disabled</Badge>
                        <Button variant="outline" size="sm">
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Privacy & Data */}
            <TabsContent value="privacy">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  Data & Privacy
                </h3>

                <div className="space-y-6">
                  <div className="p-4 glass rounded-lg">
                    <h4 className="font-semibold mb-3">Data Export</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download a copy of all your data including applications,
                      documents, and account information.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>
                  </div>

                  <div className="p-4 glass rounded-lg">
                    <h4 className="font-semibold mb-3">Data Retention</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Application Data</span>
                        <span className="text-muted-foreground">
                          7 years (regulatory requirement)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Document Uploads</span>
                        <span className="text-muted-foreground">
                          7 years (encrypted storage)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Activity Logs</span>
                        <span className="text-muted-foreground">2 years</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-2 border-red-200 rounded-lg">
                    <h4 className="font-semibold mb-3 text-red-600">
                      Danger Zone
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>

                    {profile.deletionRequested ? (
                      <Button variant="secondary" size="sm" disabled className="opacity-70 cursor-not-allowed">
                        Deletion Request Pending...
                      </Button>
                    ) : (
                      <Dialog
                        open={deleteAccountOpen}
                        onOpenChange={setDeleteAccountOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Request Account Deletion
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Account</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              Are you sure you want to delete your account? This
                              will:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Permanently delete all your data</li>
                              <li>• Cancel any pending applications</li>
                              <li>• Remove access to all loan offers</li>
                              <li>• Cannot be undone after 30 days</li>
                            </ul>
                            <p className="text-sm font-semibold">
                              Type "DELETE" to confirm:
                            </p>
                            <Input 
                              placeholder="Type DELETE to confirm" 
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDeleteAccountOpen(false);
                                  setDeleteConfirmText("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={handleRequestDeletion}
                                disabled={deleteConfirmText !== "DELETE" || loading}
                              >
                                {loading ? "Requesting..." : "Delete Account"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      🔒 All personal data is encrypted and used only for loan
                      evaluation purposes.
                    </p>
                    <p>
                      We comply with RBI guidelines and data protection
                      regulations.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}