import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Github, Shield, Target, Users } from "lucide-react";

export default function AboutUs() {
  const teamMembers = [
    {
      name: "Ayush Nayak",
      role: "Computer Engineer",
      bio: "Final Year B.E. Computer Engineering Student, University of Mumbai",
      avatar: "AN",
      linkedin: "https://www.linkedin.com/in/nayak-ayush/",
      github: "https://github.com/Ayush-Nayak",
    },
    {
      name: "Hrishit Patil",
      role: "Computer Engineer",
      bio: "Final Year B.E. Computer Engineering Student, University of Mumbai",
      avatar: "HP",
      linkedin: "https://www.linkedin.com/in/hrishit-patil/",
      github: "https://github.com/Hrishit-Patil",
    },
    {
      name: "Sanket Nandurkar",
      role: "Computer Engineer",
      bio: "Final Year B.E. Computer Engineering Student, University of Mumbai",
      avatar: "SN",
      linkedin: "https://www.linkedin.com/in/sanket-nandurkar/",
      github: "https://github.com/Sankett111",
    },
    {
      name: "Om Nandurkar",
      role: "Computer Engineer",
      bio: "Final Year B.E. Computer Engineering Student, University of Mumbai",
      avatar: "ON",
      linkedin: "https://www.linkedin.com/in/om-nandurkar-327899353/",
      github: "https://github.com/Om-Nandurkar",
    },
  ];

  const principles = [
    {
      icon: Shield,
      title: "Fair",
      description:
        "Our algorithms are rigorously tested for bias and discrimination across all demographics",
    },
    {
      icon: Target,
      title: "Transparent",
      description:
        "Every decision comes with clear explanations so you understand exactly why",
    },
    {
      icon: Users,
      title: "Accountable",
      description:
        "Human reviewers oversee our AI and can override decisions when needed",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">FynXai</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're building the future of fair lending through transparent AI.
            Our mission is to make credit decisions more equitable, explainable,
            and accessible for everyone.
          </p>
        </motion.div>

        {/* Mission & Principles */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-semibold text-center mb-12">
            Our Principles
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {principles.map((principle, index) => {
              const IconComponent = principle.icon;
              return (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="text-center hover-lift h-full">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">
                        {principle.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {principle.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-semibold text-center mb-12">
            Meet Our Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <Card className="text-center hover-lift">
                  <CardContent className="p-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-semibold">
                      {member.avatar}
                    </div>

                    <h3 className="text-lg font-semibold mb-1">
                      {member.name}
                    </h3>
                    <Badge variant="secondary" className="mb-3">
                      {member.role}
                    </Badge>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex justify-center space-x-3">
                      <motion.a
                        href={member.linkedin}
                        className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Linkedin className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href={member.github}
                        className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Github className="h-4 w-4" />
                      </motion.a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SDG Section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="glass p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Supporting UN Sustainable Development Goals
            </h2>
            <div className="flex justify-center items-center space-x-8">
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
                  <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-2xl mb-4 shadow-glow group-hover:shadow-glow">
                    {sdg.number}
                  </div>
                  <p className="text-sm text-muted-foreground max-w-28 text-center leading-tight">
                    {sdg.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
