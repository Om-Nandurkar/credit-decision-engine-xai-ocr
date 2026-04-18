import { motion } from "framer-motion";

interface HeroIllustrationProps {
  className?: string;
  size?: number;
}

export const HeroIllustration = ({
  className = "",
  size = 400,
}: HeroIllustrationProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        className="text-primary"
      >
        <defs>
          <linearGradient
            id="hero-gradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.8"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary-variant))"
              stopOpacity="0.6"
            />
          </linearGradient>
          <linearGradient
            id="hero-gradient2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="hsl(var(--accent))"
              stopOpacity="0.7"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--success))"
              stopOpacity="0.5"
            />
          </linearGradient>
        </defs>

        {/* Background circles */}
        <motion.circle
          cx="200"
          cy="200"
          r="180"
          fill="url(#hero-gradient1)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        {/* Applicant figure */}
        <motion.g
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Head */}
          <circle cx="120" cy="120" r="25" fill="url(#hero-gradient2)" />
          {/* Body */}
          <rect
            x="105"
            y="145"
            width="30"
            height="50"
            rx="15"
            fill="url(#hero-gradient2)"
          />
        </motion.g>

        {/* Document */}
        <motion.g
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <rect
            x="160"
            y="160"
            width="80"
            height="100"
            rx="8"
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          <rect
            x="170"
            y="175"
            width="60"
            height="4"
            rx="2"
            fill="hsl(var(--muted-foreground))"
          />
          <rect
            x="170"
            y="190"
            width="45"
            height="4"
            rx="2"
            fill="hsl(var(--muted-foreground))"
          />
          <rect
            x="170"
            y="205"
            width="50"
            height="4"
            rx="2"
            fill="hsl(var(--muted-foreground))"
          />
        </motion.g>

        {/* Shield/Security icon */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <path
            d="M280 150 L300 140 L320 150 L320 155 C320 180 300 190 300 190 C300 190 280 180 280 155 Z"
            fill="url(#hero-gradient1)"
            stroke="white"
            strokeWidth="3"
          />
          <path
            d="M290 165 L297 172 L310 155"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Graph/Chart */}
        <motion.g
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <rect
            x="250"
            y="250"
            width="120"
            height="80"
            rx="8"
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          <motion.rect
            x="260"
            y="290"
            width="15"
            height="30"
            fill="url(#hero-gradient2)"
            initial={{ height: 0 }}
            animate={{ height: 30 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          />
          <motion.rect
            x="280"
            y="280"
            width="15"
            height="40"
            fill="url(#hero-gradient2)"
            initial={{ height: 0 }}
            animate={{ height: 40 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          />
          <motion.rect
            x="300"
            y="270"
            width="15"
            height="50"
            fill="url(#hero-gradient2)"
            initial={{ height: 0 }}
            animate={{ height: 50 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          />
          <motion.rect
            x="320"
            y="285"
            width="15"
            height="35"
            fill="url(#hero-gradient2)"
            initial={{ height: 0 }}
            animate={{ height: 35 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          />
          <motion.rect
            x="340"
            y="275"
            width="15"
            height="45"
            fill="url(#hero-gradient2)"
            initial={{ height: 0 }}
            animate={{ height: 45 }}
            transition={{ duration: 0.5, delay: 1.7 }}
          />
        </motion.g>

        {/* Connecting lines */}
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 1.8 }}
        >
          <path
            d="M150 150 Q200 130 200 180"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
          />
          <path
            d="M240 180 Q260 200 280 170"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};
