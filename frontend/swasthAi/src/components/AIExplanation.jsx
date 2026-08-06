import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Brain, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Activity,
  Heart, Thermometer, Droplet, Wind,
  ArrowUp, ArrowDown, Minus,
  Sparkles, Shield, Award, Clock
} from 'lucide-react';

const AIExplanation = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200', emoji: '🚨' };
    if (score >= 60) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', emoji: '⚠️' };
    if (score >= 40) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', emoji: '📊' };
    return { label: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', emoji: '✅' };
  };

  const getFactorIcon = (factor) => {
    if (factor.direction === 'positive' || factor.direction === 'up') {
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    }
    if (factor.direction === 'negative' || factor.direction === 'down') {
      return <ArrowDown className="h-4 w-4 text-blue-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getFactorColor = (factor) => {
    if (factor.direction === 'positive' || factor.direction === 'up') {
      return 'bg-red-50 border-red-200 text-red-700';
    }
    if (factor.direction === 'negative' || factor.direction === 'down') {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    }
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getImpactBarColor = (impact) => {
    if (impact >= 70) return 'bg-red-500';
    if (impact >= 40) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const riskLevel = getRiskLevel(data.riskScore);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Why AI Predicted This</h2>
                  <p className="text-sm text-gray-500">Detailed risk analysis for {data.patientName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Score Overview */}
              <div className={`rounded-2xl p-6 border ${riskLevel.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-5xl font-bold ${riskLevel.color}`}>
                        {data.riskScore}%
                      </span>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${riskLevel.bg}`}>
                        {riskLevel.emoji} {riskLevel.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-2xl font-bold text-emerald-600">{data.confidence}%</p>
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${data.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Version & Time */}
              <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Model: {data.modelVersion || 'v2.0'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {data.predictedAt ? new Date(data.predictedAt).toLocaleString() : 'Just now'}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Accuracy: {data.accuracy || '94.7%'}
                </span>
              </div>

              {/* Risk Factors */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">Risk Factors</h3>
                  <span className="text-xs text-gray-400">
                    ({data.factors?.length || 0} factors analyzed)
                  </span>
                </div>

                <div className="space-y-3">
                  {data.factors?.map((factor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-xl p-4 border ${getFactorColor(factor)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFactorIcon(factor)}
                          <div>
                            <p className="font-medium text-gray-900">{factor.feature}</p>
                            <p className="text-xs text-gray-500">
                              {factor.direction === 'positive' || factor.direction === 'up' 
                                ? '↑ Increased risk' 
                                : factor.direction === 'negative' || factor.direction === 'down'
                                ? '↓ Decreased risk'
                                : '→ Neutral'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{factor.impact}%</p>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getImpactBarColor(factor.impact)}`}
                              style={{ width: `${Math.min(factor.impact, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {factor.description && (
                        <p className="text-xs text-gray-500 mt-2">{factor.description}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Missing Data */}
              {data.missingData && data.missingData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Missing Data (Estimated)</h3>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <ul className="space-y-2">
                      {data.missingData.map((item, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="text-amber-600 text-xs font-medium">
                            Estimated: {item.estimated || 'N/A'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {data.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100"
                      >
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    This prediction is for clinical decision support only. 
                    Always consult with a qualified healthcare professional.
                    Model accuracy: {data.accuracy || '94.7%'} on validation data.
                  </span>
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                Close Explanation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIExplanation;