import React from "react";
import { motion } from "framer-motion";

export default function Card({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
    >
      {children}
    </motion.div>
  );
}
