import { motion } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { User, Phone, Mail, ShieldCheck, Star, Clock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface ProfileViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function ProfileView({ showNotification }: ProfileViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">My Profile</h2>
        <p className="text-slate-500 font-medium">Manage your personal information and documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 text-center"
          >
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">David Reynolds</h3>
            <p className="text-[#10B981] font-medium text-sm mb-4">Campus Walker</p>
            
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <div className="flex flex-col text-slate-800">
                <div className="flex items-center gap-1 justify-center"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.95</div>
                <span className="text-xs text-slate-500">Rating</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex flex-col text-slate-800">
                <div className="flex items-center gap-1 justify-center">1.2k</div>
                <span className="text-xs text-slate-500">Deliveries</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
             <h3 className="font-bold text-slate-900 mb-4 px-2">Contact Info</h3>
             <div className="space-y-4">
               <div className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-white/60">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                   <Phone className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                   <p className="text-sm font-semibold text-slate-800 truncate">+1 (555) 123-4567</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-white/60">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                   <Mail className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-xs text-slate-500 font-medium">Email Address</p>
                   <p className="text-sm font-semibold text-slate-800 truncate">david.r@example.com</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-white/60">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                   <User className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-xs text-slate-500 font-medium">Student ID</p>
                   <p className="text-sm font-semibold text-slate-800 truncate">STU-88231</p>
                 </div>
               </div>
             </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6 md:p-8"
          >
             <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Required Documents</h3>
                  <p className="text-sm text-slate-500 mt-1">Keep your verification documents up to date.</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/50 p-4 border border-white/60 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success shrink-0">
                         <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Background Check</p>
                        <p className="text-sm text-slate-500">Valid until Aug 2027</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 text-success font-medium text-sm">
                     <CheckCircle2 className="w-4 h-4" /> Verified
                   </div>
                </div>

                <div className="flex items-center justify-between bg-white/50 p-4 border border-white/60 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success shrink-0">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Student ID Upload</p>
                        <p className="text-sm text-slate-500">Valid until May 2028</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 text-success font-medium text-sm">
                     <CheckCircle2 className="w-4 h-4" /> Verified
                   </div>
                </div>

                <div className="flex items-center justify-between bg-white/50 p-4 border border-warning-100 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600 shrink-0">
                         <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Campus Delivery Training</p>
                        <p className="text-sm text-warning-600">Action Required: Expiring in 14 days</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*,.pdf';
                        input.onchange = () => {
                           if (input.files && input.files.length > 0) {
                              showNotification("Upload Started", `Uploading ${input.files[0].name}...`, "info");
                              setTimeout(() => {
                                 showNotification("Upload Complete", "Document submitted for review.", "success");
                              }, 2000);
                           }
                        };
                        input.click();
                     }}
                     className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                   >
                     Update
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
