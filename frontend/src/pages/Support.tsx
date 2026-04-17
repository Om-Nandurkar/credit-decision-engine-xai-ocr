import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageCircle,
  FileText,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Support() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@fynxai.com",
      availability: "24/7",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      contact: "+91 1800-123-456",
      availability: "Mon-Fri, 9 AM - 6 PM",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Instant help through live chat",
      contact: "Available in app",
      availability: "Mon-Fri, 10 AM - 8 PM",
    },
  ];

  const faqs = [
    {
      question: "How does FynXai's credit scoring work?",
      answer:
        "Our AI analyzes 100+ data points from your financial documents using advanced machine learning models. We then use SHAP and LIME algorithms to explain exactly how each factor influenced your credit score, ensuring complete transparency in the decision-making process.",
    },
    {
      question: "Is my personal and financial data secure?",
      answer:
        "Absolutely. We use bank-grade security with end-to-end encryption, secure cloud storage, and comply with all financial data protection regulations including GDPR and PCI DSS. Your data is never shared with third parties without your explicit consent.",
    },
    {
      question: "What documents do I need to upload?",
      answer:
        "You'll need to provide: 1) Identity documents (Aadhaar, PAN), 2) Income proof (salary slips, ITR), 3) Bank statements (last 6 months), and 4) Employment verification. Our OCR technology extracts data automatically with 98% accuracy.",
    },
    {
      question: "How long does the approval process take?",
      answer:
        "Most applications are processed within 24-48 hours. Simple cases with clear documentation can be approved in as little as 2-4 hours, while complex cases requiring human review may take up to 3-5 business days.",
    },
    {
      question: "Can I understand why my loan was approved or rejected?",
      answer:
        "Yes! This is what makes FynXai unique. Every decision comes with detailed explanations showing exactly which factors influenced your score, how much impact each had, and what you can do to improve your creditworthiness in the future.",
    },
    {
      question: "What if I disagree with the AI's decision?",
      answer:
        "You can request a human review from our experienced loan officers. They'll examine your case with fresh eyes, consider any additional context you provide, and may override the AI's decision if appropriate.",
    },
    {
      question: "How can I improve my credit score?",
      answer:
        "Based on your SHAP analysis, we provide personalized recommendations such as: maintaining consistent income, reducing debt-to-income ratio, building credit history, and improving savings patterns. Each suggestion is backed by data from your actual financial profile.",
    },
    {
      question: "Are there any hidden fees?",
      answer:
        "No, we believe in complete transparency. All fees are clearly mentioned upfront with no hidden charges. You pay only the application processing fee based on your chosen plan.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get support, find answers, and resolve disputes. We're here to
              ensure your lending experience is smooth and transparent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the best way to reach our support team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="p-8 text-center h-full hover-lift">
                  <method.icon className="w-12 h-12 text-primary mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-4">{method.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {method.description}
                  </p>
                  <p className="font-semibold mb-2">{method.contact}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{method.availability}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 glass">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Send us a Message
            </h2>
            <p className="text-xl text-muted-foreground">
              Have a specific question or need to dispute a decision? Contact us
              directly.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter your phone number" />
                  </div>
                  <div>
                    <Label htmlFor="application-id">
                      Application ID (if applicable)
                    </Label>
                    <Input
                      id="application-id"
                      placeholder="Enter your application ID"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this regarding?" />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue or question in detail..."
                    className="min-h-32"
                  />
                </div>

                <div>
                  <Label htmlFor="evidence">Attach Evidence (PDF only)</Label>
                  <Input id="evidence" type="file" accept=".pdf" />
                  <p className="text-sm text-muted-foreground mt-2">
                    For disputes, please attach relevant documents to support
                    your case.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full hover-lift">
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find quick answers to the most common questions about our XAI
              credit scoring platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-6 bg-background/50"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="font-semibold text-base">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
