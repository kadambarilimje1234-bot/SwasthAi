import { motion } from 'framer-motion';

const colorMap = {
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
  red: 'text-red-600 bg-red-50 border-red-200',
  amber: 'text-amber-600 bg-amber-50 border-amber-200',
  green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-800 mt-1">
            {value}
          </p>
        </div>

        <div 
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorMap[color]}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}