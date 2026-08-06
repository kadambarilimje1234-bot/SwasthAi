import React, { useState, useEffect } from 'react';
import { 
  Clock, Heart, Brain, User, Pill, AlertTriangle, 
  CheckCircle, Calendar, ChevronDown, ChevronUp,
  Activity, FileText, Stethoscope, Filter, Eye
} from 'lucide-react';
import { timelineAPI } from "../../services/api";
import toast from 'react-hot-toast';

const PatientTimeline = ({ patientId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    isFlagged: false
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    skip: 0,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    if (patientId) {
      fetchTimeline();
      fetchStats();
    }
  }, [patientId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await timelineAPI.getByPatient(patientId);
      const data = response.data.data || [];
      
      // Convert to timeline format if needed
      const formattedEvents = Array.isArray(data) ? data : data.events || [];
      
      setEvents(formattedEvents);
      setPagination(prev => ({
        ...prev,
        total: formattedEvents.length,
        hasMore: formattedEvents.length >= pagination.limit
      }));
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Failed to load timeline');
      // Use mock data for demo
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from events
      const total = events.length;
      const flagged = events.filter(e => e.isFlagged).length;
      const critical = events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
      
      setStats({ total, flagged, critical });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Mock data for demo
  const getMockEvents = () => {
    return [
      {
        _id: '1',
        eventType: 'ADMISSION',
        title: 'Patient Admitted',
        description: 'Admitted to ICU A with diagnosis of Pneumonia',
        severity: 'MEDIUM',
        isFlagged: false,
        riskScore: 12,
        eventTime: new Date(Date.now() - 3600000 * 24).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        createdBy: { name: 'Dr. Priya Sharma' },
        metadata: { ward: 'ICU A', bed: 'A-101' }
      },
      {
        _id: '2',
        eventType: 'VITALS_RECORDED',
        title: 'Vitals Recorded',
        description: 'HR: 72 bpm, BP: 120/80 mmHg, Temp: 98.6°F',
        severity: 'LOW',
        isFlagged: false,
        riskScore: 8,
        eventTime: new Date(Date.now() - 3600000 * 12).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        createdBy: { name: 'Nurse Rajesh' },
        metadata: { heartRate: 72, systolicBP: 120, diastolicBP: 80, temperature: 98.6 }
      },
      {
        _id: '3',
        eventType: 'PREDICTION_GENERATED',
        title: 'Sepsis Risk Prediction',
        description: 'AI predicted low risk of sepsis (12%)',
        severity: 'LOW',
        isFlagged: false,
        riskScore: 12,
        eventTime: new Date(Date.now() - 3600000 * 6).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        createdBy: { name: 'AI System' },
        metadata: { confidence: 92, modelVersion: 'v2.0' }
      },
      {
        _id: '4',
        eventType: 'ALERT_TRIGGERED',
        title: 'Alert: Temperature Elevated',
        description: 'Temperature spiked to 100.4°F. Monitor closely.',
        severity: 'HIGH',
        isFlagged: true,
        riskScore: 45,
        eventTime: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdBy: { name: 'AI System' },
        metadata: { temperature: 100.4, threshold: 100.0 }
      },
      {
        _id: '5',
        eventType: 'DOCTOR_REVIEW',
        title: 'Doctor Review Completed',
        description: 'Dr. Priya Sharma reviewed patient vitals and ordered CBC test',
        severity: 'MEDIUM',
        isFlagged: false,
        riskScore: 42,
        eventTime: new Date(Date.now() - 3600000 * 1).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        createdBy: { name: 'Dr. Priya Sharma' },
        metadata: { action: 'Ordered CBC test' }
      }
    ];
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'ADMISSION': <User className="h-5 w-5" />,
      'VITALS_RECORDED': <Activity className="h-5 w-5" />,
      'VITALS': <Activity className="h-5 w-5" />,
      'SEPSIS_RISK_UPDATED': <Brain className="h-5 w-5" />,
      'PREDICTION_GENERATED': <Brain className="h-5 w-5" />,
      'PREDICTION': <Brain className="h-5 w-5" />,
      'ALERT_TRIGGERED': <AlertTriangle className="h-5 w-5" />,
      'ALERT': <AlertTriangle className="h-5 w-5" />,
      'DOCTOR_REVIEW': <Stethoscope className="h-5 w-5" />,
      'MEDICATION_STARTED': <Pill className="h-5 w-5" />,
      'MEDICATION': <Pill className="h-5 w-5" />,
      'TREATMENT_STARTED': <Pill className="h-5 w-5" />,
      'STATUS_CHANGED': <Clock className="h-5 w-5" />,
      'DISCHARGE': <CheckCircle className="h-5 w-5" />,
      'REMINDER_CREATED': <Clock className="h-5 w-5" />,
      'REMINDER_COMPLETED': <CheckCircle className="h-5 w-5" />,
      'LAB_RESULT': <FileText className="h-5 w-5" />,
      'LAB_REPORT': <FileText className="h-5 w-5" />
    };
    return icons[eventType] || <Clock className="h-5 w-5" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'LOW': 'border-green-500 bg-green-50',
      'MEDIUM': 'border-yellow-500 bg-yellow-50',
      'HIGH': 'border-orange-500 bg-orange-50',
      'CRITICAL': 'border-red-500 bg-red-50'
    };
    return colors[severity] || 'border-gray-300 bg-gray-50';
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'ADMISSION': 'Admission',
      'VITALS_RECORDED': 'Vitals',
      'VITALS': 'Vitals',
      'SEPSIS_RISK_UPDATED': 'Sepsis Risk',
      'PREDICTION_GENERATED': 'Prediction',
      'PREDICTION': 'Prediction',
      'ALERT_TRIGGERED': 'Alert',
      'ALERT': 'Alert',
      'DOCTOR_REVIEW': 'Doctor Review',
      'MEDICATION_STARTED': 'Medication',
      'MEDICATION': 'Medication',
      'TREATMENT_STARTED': 'Treatment',
      'STATUS_CHANGED': 'Status Change',
      'DISCHARGE': 'Discharge',
      'REMINDER_CREATED': 'Reminder',
      'REMINDER_COMPLETED': 'Reminder Done',
      'LAB_RESULT': 'Lab Report',
      'LAB_REPORT': 'Lab Report'
    };
    return labels[eventType] || eventType;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, skip: 0 }));
    setTimeout(fetchTimeline, 100);
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      skip: prev.skip + prev.limit
    }));
    setTimeout(fetchTimeline, 100);
  };

  // Update stats when events change
  useEffect(() => {
    if (events.length > 0) {
      const total = events.length;
      const flagged = events.filter(e => e.isFlagged).length;
      const critical = events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
      setStats({ total, flagged, critical });
    }
  }, [events]);

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter events based on filters
  const filteredEvents = events.filter(event => {
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    if (filters.severity && event.severity !== filters.severity) return false;
    if (filters.isFlagged && !event.isFlagged) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Clinical Timeline</h2>
          {stats && (
            <div className="flex items-center gap-2 ml-4 text-sm">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {stats.total} events
              </span>
              {stats.flagged > 0 && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                  ⚠️ {stats.flagged} flagged
                </span>
              )}
              {stats.critical > 0 && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                  🔴 {stats.critical} critical
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filters:</span>
              </div>
              
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Events</option>
                <option value="ADMISSION">Admission</option>
                <option value="VITALS_RECORDED">Vitals</option>
                <option value="SEPSIS_RISK_UPDATED">Sepsis Risk</option>
                <option value="PREDICTION_GENERATED">Prediction</option>
                <option value="ALERT_TRIGGERED">Alert</option>
                <option value="DOCTOR_REVIEW">Doctor Review</option>
                <option value="MEDICATION_STARTED">Medication</option>
                <option value="STATUS_CHANGED">Status Change</option>
                <option value="DISCHARGE">Discharge</option>
                <option value="LAB_RESULT">Lab Report</option>
              </select>

              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Severity</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={filters.isFlagged}
                  onChange={(e) => handleFilterChange('isFlagged', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Flagged Only
              </label>

              <button
                onClick={() => {
                  setFilters({ eventType: '', severity: '', isFlagged: false });
                  setPagination(prev => ({ ...prev, skip: 0 }));
                  setTimeout(fetchTimeline, 100);
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="p-6">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No timeline events found</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-4">
                  {filteredEvents.map((event, index) => (
                    <div
                      key={event._id || index}
                      className={`relative pl-12 ${index === filteredEvents.length - 1 ? '' : 'pb-4'}`}
                    >
                      <div className="absolute left-2 top-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          event.severity === 'CRITICAL' ? 'bg-red-500' :
                          event.severity === 'HIGH' ? 'bg-orange-500' :
                          event.severity === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></div>
                      </div>

                      <div 
                        className={`rounded-xl border-l-4 p-4 transition-all hover:shadow-md ${getSeverityColor(event.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg">
                                {getEventIcon(event.eventType)}
                              </span>
                              <h4 className="font-semibold text-gray-900">
                                {event.title || event.eventType}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(event.severity)}`}>
                                {event.severity || 'LOW'}
                              </span>
                              {event.isFlagged && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                  ⚠️ Flagged
                                </span>
                              )}
                              {event.riskScore !== null && event.riskScore !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  event.riskScore >= 80 ? 'bg-red-100 text-red-800' :
                                  event.riskScore >= 60 ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  Risk: {event.riskScore}%
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {event.description || event.details || 'No description available'}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTime(event.eventTime || event.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {getEventTypeLabel(event.eventType)}
                              </span>
                              {event.createdBy && (
                                <span>By: {event.createdBy.name || event.createdBy || 'System'}</span>
                              )}
                            </div>

                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                  View details
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination.hasMore && (
                  <div className="text-center mt-4">
                    <button
                      onClick={loadMore}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Load more events...
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientTimeline;