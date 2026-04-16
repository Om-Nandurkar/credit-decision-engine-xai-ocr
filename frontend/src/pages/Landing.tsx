import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Scale,
  Shield,
  ArrowRight,
  CheckCircle,
  FileText,
  Brain,
  Award,
  Upload,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";
import { UploadIllustration } from "@/components/illustrations/UploadIllustration";
import { ExplainabilityIllustration } from "@/components/illustrations/ExplainabilityIllustration";

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);

  const features = [
    {
      icon: Eye,
      title: "Complete Explainability",
      description:
        "Understand exactly how your credit score is calculated with SHAP/LIME explanations.",
      illustration: ExplainabilityIllustration,
    },
    {
      icon: Scale,
      title: "Fairness First",
      description:
        "Our AI eliminates bias and ensures equal opportunities for all applicants.",
      illustration: () => <Scale className="h-16 w-16 text-primary" />,
    },
    {
      icon: Shield,
      title: "Secure & Trustworthy",
      description:
        "Your documents are encrypted and processed with enterprise-level security.",
      illustration: () => <Shield className="h-16 w-16 text-primary" />,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Documents",
      description:
        "Securely upload PDFs - Aadhaar, PAN, bank statements, income docs.",
      icon: Upload,
      illustration: UploadIllustration,
    },
    {
      number: "02",
      title: "AI Scoring",
      description:
        "Our transparent AI analyzes documents and calculates credit score.",
      icon: Brain,
      illustration: () => <Brain className="h-16 w-16 text-primary" />,
    },
    {
      number: "03",
      title: "Transparent Results",
      description:
        "Get clear explanations with SHAP/LIME and competitive loan offers.",
      icon: BarChart3,
      illustration: ExplainabilityIllustration,
    },
  ];

  const sdgStats = [
    { value: "500+", label: "Applicants Served", icon: Users },
    { value: "20%", label: "Faster Approvals", icon: Award },
    { value: "15%", label: "Bias Reduced", icon: Scale },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Parallax Background Elements */}
      <motion.div className="fixed inset-0 z-0" style={{ y, opacity }}>
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-60 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Explainable Credit Scoring and Lending with AI
              </motion.h1>

              <motion.p
                className="text-xl text-muted-foreground mb-8 max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Revolutionize lending decisions with our XAI framework that
                provides transparent, interpretable credit scoring while
                upholding fairness and ethical standards.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button size="lg" className="hover-lift group" asChild>
                  <Link to="/apply">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Apply Now
                    </motion.span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="hover-lift"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  How It Works
                </Button>
              </motion.div>

              <motion.div
                className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Explainable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Fair</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Illustration */}
            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HeroIllustration size={500} />
            </motion.div>
          </div>
        </div>

        {/* Floating scroll indicator */}
        <motion.div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-primary rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose FynXai?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience lending with AI that you can trust, understand, and
              rely on.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const IllustrationComponent = feature.illustration;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full hover-lift cursor-pointer group border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <IllustrationComponent size={80} />
                      </div>

                      <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get approved in three simple steps with complete transparency at
              every stage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const IllustrationComponent = step.illustration;
              return (
                <motion.div
                  key={step.number}
                  className="text-center relative"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-primary/30"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.3 + 0.5 }}
                      viewport={{ once: true }}
                    />
                  )}

                  <div className="relative mb-6">
                    <motion.div
                      className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center border border-primary/10"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                    >
                      <IllustrationComponent size={100} />
                    </motion.div>

                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>

                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="group">
                Learn More About Our Process
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Driving Inclusive Growth
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our commitment to fair lending creates positive impact across
              communities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sdgStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 border-0 shadow-lg hover-lift">
                    <CardContent className="p-0">
                      <IconComponent className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <motion.div
                        className="text-4xl lg:text-5xl font-bold text-primary mb-2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                        viewport={{ once: true }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-muted-foreground font-medium">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready for Transparent Lending?
            </h2>

            <p className="text-xl text-muted-foreground/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied customers who experienced fair,
              explainable lending decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover-lift group px-8 py-6"
                asChild
              >
                <Link to="/apply">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Apply Now - It's Free
                  </motion.span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-primary/20 text-foreground hover:bg-primary/10 hover:text-foreground hover-lift px-8 py-6"
                asChild
              >
                <Link to="/calculator">Try Calculator</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SDG Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Supporting UN Sustainable Development Goals
            </h2>
            <div className="flex justify-center items-center space-x-6">
              {[
                { number: 9, title: "Industry, Innovation and Infrastructure" },
                { number: 10, title: "Reduced Inequalities" },
                { number: 16, title: "Peace, Justice and Strong Institutions" },
              ].map((sdg) => (
                <motion.div
                  key={sdg.number}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl mb-2 shadow-glow group-hover:shadow-glow">
                    {sdg.number}
                  </div>
                  <p className="text-md text-muted-foreground max-w-80 text-center leading-tight">
                    {sdg.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
