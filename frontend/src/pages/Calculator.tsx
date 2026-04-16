import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator as CalculatorIcon, IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

export default function Calculator() {
  const [emiInputs, setEmiInputs] = useState({
    amount: 500000,
    rate: 10.5,
    tenure: 36
  });

  const [affordabilityInputs, setAffordabilityInputs] = useState({
    income: 50000,
    expenses: 25000,
    existingEmi: 5000
  });

  // EMI Calculation
  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const calculateTotalInterest = (emi: number, tenure: number, principal: number) => {
    return (emi * tenure) - principal;
  };

  const emi = calculateEMI(emiInputs.amount, emiInputs.rate, emiInputs.tenure);
  const totalInterest = calculateTotalInterest(emi, emiInputs.tenure, emiInputs.amount);
  const totalAmount = emi * emiInputs.tenure;

  // Affordability Calculation
  const availableIncome = affordabilityInputs.income - affordabilityInputs.expenses - affordabilityInputs.existingEmi;
  const maxEmi = Math.floor(availableIncome * 0.6); // 60% of available income
  const maxLoanAmount = Math.floor((maxEmi * Math.pow(1.1, -emiInputs.tenure/12) * (Math.pow(1.1, emiInputs.tenure/12) - 1)) / 0.00875);

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Loan Calculator
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plan your finances with our interactive calculators. Get instant EMI calculations and affordability estimates.
          </p>
        </motion.div>

        {/* Calculator Tabs */}
        <Tabs defaultValue="emi" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emi">EMI Calculator</TabsTrigger>
            <TabsTrigger value="affordability">Affordability Calculator</TabsTrigger>
          </TabsList>

          {/* EMI Calculator */}
          <TabsContent value="emi">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CalculatorIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">Calculate Your EMI</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Loan Amount */}
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Loan Amount: ₹{emiInputs.amount.toLocaleString('en-IN')}
                      </Label>
                      <Slider
                        value={[emiInputs.amount]}
                        onValueChange={(value) => setEmiInputs(prev => ({ ...prev, amount: value[0] }))}
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

                    {/* Interest Rate */}
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Interest Rate: {emiInputs.rate}% per annum
                      </Label>
                      <Slider
                        value={[emiInputs.rate]}
                        onValueChange={(value) => setEmiInputs(prev => ({ ...prev, rate: value[0] }))}
                        max={20}
                        min={8}
                        step={0.25}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>8%</span>
                        <span>20%</span>
                      </div>
                    </div>

                    {/* Tenure */}
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Tenure: {emiInputs.tenure} months ({Math.round(emiInputs.tenure/12)} years)
                      </Label>
                      <Slider
                        value={[emiInputs.tenure]}
                        onValueChange={(value) => setEmiInputs(prev => ({ ...prev, tenure: value[0] }))}
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
                  </div>
                </Card>
              </motion.div>

              {/* Results Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <IndianRupee className="w-6 h-6 text-primary" />
                    EMI Breakdown
                  </h2>

                  <div className="space-y-6">
                    {/* Monthly EMI */}
                    <div className="text-center p-6 glass rounded-lg">
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">Monthly EMI</h3>
                      <p className="text-4xl font-bold text-primary">₹{emi.toLocaleString('en-IN')}</p>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 glass rounded-lg">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Principal</h4>
                        <p className="text-xl font-bold">₹{emiInputs.amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-center p-4 glass rounded-lg">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Interest</h4>
                        <p className="text-xl font-bold">₹{totalInterest.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-center p-4 border-2 border-primary rounded-lg">
                      <h4 className="text-lg font-semibold mb-2">Total Amount Payable</h4>
                      <p className="text-2xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</p>
                    </div>

                    {/* Quick Tips */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Quick Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Lower interest rates save significant money</li>
                        <li>• Longer tenure = lower EMI but higher total interest</li>
                        <li>• Prepayments can reduce total interest burden</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Affordability Calculator */}
          <TabsContent value="affordability">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">Affordability Analysis</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="income">Monthly Income</Label>
                      <Input
                        id="income"
                        type="number"
                        value={affordabilityInputs.income}
                        onChange={(e) => setAffordabilityInputs(prev => ({...prev, income: Number(e.target.value)}))}
                        placeholder="Enter your monthly income"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expenses">Monthly Expenses</Label>
                      <Input
                        id="expenses"
                        type="number"
                        value={affordabilityInputs.expenses}
                        onChange={(e) => setAffordabilityInputs(prev => ({...prev, expenses: Number(e.target.value)}))}
                        placeholder="Enter your monthly expenses"
                      />
                    </div>

                    <div>
                      <Label htmlFor="existing-emi">Existing EMIs</Label>
                      <Input
                        id="existing-emi"
                        type="number"
                        value={affordabilityInputs.existingEmi}
                        onChange={(e) => setAffordabilityInputs(prev => ({...prev, existingEmi: Number(e.target.value)}))}
                        placeholder="Enter existing EMI commitments"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Results Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Eligibility Estimate</h2>

                  <div className="space-y-6">
                    {/* Available Income */}
                    <div className="text-center p-6 glass rounded-lg">
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">Available Income</h3>
                      <p className="text-3xl font-bold text-primary">₹{availableIncome.toLocaleString('en-IN')}</p>
                    </div>

                    {/* Max EMI */}
                    <div className="text-center p-4 glass rounded-lg">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Max Recommended EMI</h4>
                      <p className="text-xl font-bold">₹{maxEmi.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground mt-1">(60% of available income)</p>
                    </div>

                    {/* Max Loan Amount */}
                    <div className="text-center p-4 border-2 border-primary rounded-lg">
                      <h4 className="text-lg font-semibold mb-2">Maximum Loan Amount</h4>
                      <p className="text-2xl font-bold">₹{maxLoanAmount > 0 ? maxLoanAmount.toLocaleString('en-IN') : '0'}</p>
                      <p className="text-xs text-muted-foreground mt-1">At 10.5% for 3 years</p>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Recommendation</h4>
                      <p className="text-sm text-muted-foreground">
                        {maxEmi > 0 
                          ? `You can comfortably afford a loan with EMI up to ₹${maxEmi.toLocaleString('en-IN')}. Consider keeping some buffer for emergencies.`
                          : 'Your current expenses are too high. Consider reducing expenses or increasing income before applying for a loan.'
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Card className="p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Apply?</h3>
            <p className="text-muted-foreground mb-6">
              Get pre-approved based on your calculations with our transparent AI-powered lending process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-lift">
                <Link to="/apply">Apply for Loan</Link>
              </Button>
              <Button variant="outline" size="lg" className="hover-lift">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}